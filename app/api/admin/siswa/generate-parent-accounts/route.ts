import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const PROCESS_BATCH_SIZE = 5

type StudentRow = {
  id: string
  nama: string
  kelas: string | null
  aktif: boolean | null
  ortu_id: string | null
  nama_ortu?: string | null
}

type ExistingProfile = {
  id: string
  full_name: string | null
  role: string | null
  email: string | null
  login_code: string | null
}

type GenerationResult = {
  siswa_id: string
  nama_siswa: string
  kelas: string
  nama_ortu: string
  login_code: string
  password: string
  status: 'berhasil' | 'ditautkan' | 'gagal'
  error: string | null
}

/**
 * Mengambil password awal akun orang tua dari environment.
 *
 * Password tidak disimpan langsung di source code.
 * Jika environment variable belum tersedia,
 * proses dihentikan dengan error yang jelas.
 */
function getDefaultParentPassword(): string {
  const password =
    process.env.PARENT_INITIAL_PASSWORD?.trim()

  if (!password) {
    throw new Error(
      'PARENT_INITIAL_PASSWORD belum dikonfigurasi di environment.',
    )
  }

  return password
}

function cleanNameForLogin(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 40)
}

function buildLoginCode(student: StudentRow) {
  const namePart = cleanNameForLogin(student.nama) || 'anak'
  return `ortu${namePart}@cbs.id`
}

function buildInternalEmail(
  loginCode: string,
) {
  return `${loginCode}@example.com`
}

async function findExistingProfile(
  admin: ReturnType<
    typeof createAdminClient
  >,
  loginCode: string,
  email: string,
): Promise<ExistingProfile | null> {
  const byLoginCode = await admin
    .from('profiles')
    .select(
      'id, full_name, role, email, login_code',
    )
    .eq('login_code', loginCode)
    .maybeSingle()

  if (byLoginCode.error) {
    throw new Error(
      byLoginCode.error.message,
    )
  }

  if (byLoginCode.data) {
    return byLoginCode.data as ExistingProfile
  }

  const byEmail = await admin
    .from('profiles')
    .select(
      'id, full_name, role, email, login_code',
    )
    .eq('email', email)
    .maybeSingle()

  if (byEmail.error) {
    throw new Error(
      byEmail.error.message,
    )
  }

  return (
    (byEmail.data as ExistingProfile | null) ??
    null
  )
}

export async function POST() {
  try {
    /*
     * Ambil password saat endpoint dijalankan.
     *
     * Karena fungsi getDefaultParentPassword()
     * memiliki return type string, TypeScript
     * mengetahui bahwa nilai ini tidak mungkin
     * undefined setelah baris ini berhasil.
     */
    const defaultParentPassword =
      getDefaultParentPassword()

    const sessionClient =
      await createClient()

    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            'Sesi login tidak ditemukan. Silakan login kembali.',
        },
        {
          status: 401,
        },
      )
    }

    const {
      data: currentRole,
      error: roleError,
    } = await sessionClient.rpc(
      'current_user_role',
    )

    if (roleError) {
      return NextResponse.json(
        {
          error:
            `Gagal memeriksa role akun: ${roleError.message}`,
        },
        {
          status: 500,
        },
      )
    }

    if (
      !['admin', 'superadmin'].includes(
        String(currentRole),
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Hanya admin atau superadmin yang boleh menjalankan proses ini.',
        },
        {
          status: 403,
        },
      )
    }

    const admin = createAdminClient()

    const [
      activeCountResult,
      studentsResult,
    ] = await Promise.all([
      admin
        .from('siswa')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('aktif', true),

      admin
        .from('siswa')
        .select('*')
        .eq('aktif', true)
        .is('ortu_id', null)
        .order('nama', {
          ascending: true,
        }),
    ])

    if (activeCountResult.error) {
      throw new Error(
        `Gagal menghitung siswa aktif: ${activeCountResult.error.message}`,
      )
    }

    if (studentsResult.error) {
      throw new Error(
        `Gagal mengambil siswa: ${studentsResult.error.message}`,
      )
    }

    const students =
      (studentsResult.data ??
        []) as StudentRow[]

    const totalActive =
      activeCountResult.count ?? 0

    const skippedExisting = Math.max(
      totalActive - students.length,
      0,
    )

    if (students.length === 0) {
      return NextResponse.json({
        message:
          'Semua siswa aktif sudah memiliki akun orang tua.',

        summary: {
          total_active: totalActive,
          candidates: 0,
          created: 0,
          linked: 0,
          failed: 0,
          skipped_existing:
            skippedExisting,
        },

        results: [],
      })
    }

    const results: GenerationResult[] =
      []

    const processStudent = async (
      student: StudentRow,
    ): Promise<GenerationResult> => {
      const loginCode =
        buildLoginCode(student)

      const email =
        buildInternalEmail(loginCode)

      const parentName =
        student.nama_ortu?.trim() ||
        `Orang Tua ${student.nama}`

      try {
        const existingProfile =
          await findExistingProfile(
            admin,
            loginCode,
            email,
          )

        /*
         * Jika akun dengan login_code atau email
         * yang sama sudah pernah dibuat,
         * akun tersebut tidak dibuat ulang.
         *
         * Profile diperbarui lalu akun
         * ditautkan kembali ke siswa.
         *
         * Password awal akun ditentukan
         * melalui konfigurasi server.
         */
        if (existingProfile) {
          if (
            existingProfile.role !== 'ortu'
          ) {
            throw new Error(
              'ID Login atau email sudah dipakai oleh akun yang bukan role orang tua.',
            )
          }

          const {
            error:
              profileUpdateError,
          } = await admin
            .from('profiles')
            .update({
              full_name: parentName,
              role: 'ortu',
              email,
              login_code: loginCode,
              updated_at:
                new Date().toISOString(),
            })
            .eq(
              'id',
              existingProfile.id,
            )

          if (profileUpdateError) {
            throw new Error(
              profileUpdateError.message,
            )
          }

          const {
            error: passwordError,
          } =
            await admin.auth.admin.updateUserById(
              existingProfile.id,
              {
                password:
                  defaultParentPassword,
              },
            )

          if (passwordError) {
            throw new Error(
              `Gagal mengatur password akun lama: ${passwordError.message}`,
            )
          }

          const {
            error: linkError,
          } = await admin
            .from('siswa')
            .update({
              ortu_id:
                existingProfile.id,
            })
            .eq('id', student.id)
            .is('ortu_id', null)

          if (linkError) {
            throw new Error(
              `Gagal menautkan akun ke siswa: ${linkError.message}`,
            )
          }

          return {
            siswa_id: student.id,
            nama_siswa:
              student.nama,
            kelas:
              student.kelas || '-',
            nama_ortu:
              parentName,
            login_code:
              loginCode,
            password:
              defaultParentPassword,
            status:
              'ditautkan',
            error: null,
          }
        }

        /*
         * Coba menggunakan RPC CBS
         * yang sudah tersedia.
         */
        const rpcResult =
          await sessionClient.rpc(
            'create_cbs_auth_user',
            {
              user_email:
                email,

              user_password:
                defaultParentPassword,

              user_full_name:
                parentName,

              user_role:
                'ortu',
            },
          )

        let profileId = String(
          rpcResult.data || '',
        )

        /*
         * Fallback ke Supabase Admin API
         * apabila RPC gagal.
         *
         * Tetap berjalan server-side
         * menggunakan admin client.
         */
        if (
          rpcResult.error ||
          !profileId
        ) {
          const adminCreateResult =
            await admin.auth.admin.createUser(
              {
                email,

                password:
                  defaultParentPassword,

                email_confirm: true,

                user_metadata: {
                  full_name:
                    parentName,

                  role:
                    'ortu',

                  login_code:
                    loginCode,
                },
              },
            )

          if (
            adminCreateResult.error ||
            !adminCreateResult.data
              .user
          ) {
            const rpcMessage =
              rpcResult.error
                ?.message
                ? `RPC: ${rpcResult.error.message}. `
                : ''

            throw new Error(
              `${rpcMessage}${
                adminCreateResult
                  .error?.message ||
                'Admin API tidak mengembalikan akun baru.'
              }`,
            )
          }

          profileId =
            adminCreateResult
              .data.user.id
        }

        /*
         * Pastikan profile akun orang tua
         * tersedia dan memiliki login_code.
         */
        const {
          error: profileError,
        } = await admin
          .from('profiles')
          .upsert(
            {
              id: profileId,
              full_name:
                parentName,
              role: 'ortu',
              email,
              login_code:
                loginCode,
              updated_at:
                new Date().toISOString(),
            },
            {
              onConflict: 'id',
            },
          )

        if (profileError) {
          await admin.auth.admin.deleteUser(
            profileId,
          )

          throw new Error(
            `Gagal menyimpan profile orang tua: ${profileError.message}`,
          )
        }

        /*
         * Hubungkan siswa dengan
         * profile orang tua.
         */
        const {
          error: linkError,
        } = await admin
          .from('siswa')
          .update({
            ortu_id: profileId,
          })
          .eq('id', student.id)
          .is('ortu_id', null)

        if (linkError) {
          await admin.auth.admin.deleteUser(
            profileId,
          )

          throw new Error(
            `Gagal menghubungkan siswa dengan akun orang tua: ${linkError.message}`,
          )
        }

        return {
          siswa_id:
            student.id,

          nama_siswa:
            student.nama,

          kelas:
            student.kelas || '-',

          nama_ortu:
            parentName,

          login_code:
            loginCode,

          password:
            defaultParentPassword,

          status:
            'berhasil',

          error: null,
        }
      } catch (processError) {
        return {
          siswa_id:
            student.id,

          nama_siswa:
            student.nama,

          kelas:
            student.kelas || '-',

          nama_ortu:
            parentName,

          login_code:
            loginCode,

          password:
            defaultParentPassword,

          status:
            'gagal',

          error:
            processError instanceof Error
              ? processError.message
              : 'Terjadi kesalahan yang tidak diketahui.',
        }
      }
    }

    /*
     * Proses per batch agar tidak
     * mengirim seluruh request
     * secara bersamaan.
     */
    for (
      let index = 0;
      index < students.length;
      index += PROCESS_BATCH_SIZE
    ) {
      const batch =
        students.slice(
          index,
          index +
            PROCESS_BATCH_SIZE,
        )

      const batchResults =
        await Promise.all(
          batch.map(
            processStudent,
          ),
        )

      results.push(
        ...batchResults,
      )
    }

    const created =
      results.filter(
        (item) =>
          item.status ===
          'berhasil',
      ).length

    const linked =
      results.filter(
        (item) =>
          item.status ===
          'ditautkan',
      ).length

    const failed =
      results.filter(
        (item) =>
          item.status ===
          'gagal',
      ).length

    return NextResponse.json({
      message:
        failed > 0
          ? `${created + linked} akun selesai diproses dan ${failed} akun gagal.`
          : `${created + linked} akun orang tua berhasil diproses.`,

      summary: {
        total_active:
          totalActive,

        candidates:
          students.length,

        created,

        linked,

        failed,

        skipped_existing:
          skippedExisting,
      },

      results,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Gagal membuat akun orang tua.',
      },
      {
        status: 500,
      },
    )
  }
}