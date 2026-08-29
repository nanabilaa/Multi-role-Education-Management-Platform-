import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const EMAIL_DOMAIN = 'cbs.id'
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
 */
function getDefaultParentPassword(): string {
  const password = process.env.PARENT_INITIAL_PASSWORD?.trim()

  if (!password) {
    throw new Error(
      'PARENT_INITIAL_PASSWORD belum dikonfigurasi di environment.'
    )
  }

  return password
}

/**
 * Slugify nama siswa sesuai aturan:
 * - lowercase
 * - trim
 * - spasi menjadi -
 * - karakter / juga menjadi -
 * - hapus karakter selain a-z, 0-9, dan -
 * - hapus duplicate hyphen (-- menjadi -)
 * - tidak boleh ada hyphen di awal/akhir
 */
function slugifyStudentName(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/\/+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Build login code (tanpa @domain):
 * Format: ortu-{slug}
 */
function buildLoginCode(student: StudentRow): string {
  const nameSlug = slugifyStudentName(student.nama) || 'anak'
  return `ortu-${nameSlug}`
}

/**
 * Build full email:
 * Format: ortu-{slug}@cbs.id
 */
function buildEmail(loginCode: string): string {
  return `${loginCode}@${EMAIL_DOMAIN}`
}

/**
 * Validasi format email sebelum dikirim ke Supabase.
 * Pastikan email tidak mengandung lebih dari satu @.
 */
function validateEmailFormat(email: string): void {
  const emailParts = email.split('@')
  
  if (
    emailParts.length !== 2 ||
    !emailParts[0] ||
    !emailParts[1]
  ) {
    throw new Error(`Format email akun orang tua tidak valid: ${email}`)
  }
}

/**
 * Cek apakah email sudah digunakan dan cari suffix yang tersedia.
 * Jika ortu-adi@bimbelcbs.my.id sudah ada, return ortu-adi-2@bimbelcbs.my.id
 */
async function findAvailableEmail(
  admin: ReturnType<typeof createAdminClient>,
  baseLoginCode: string
): Promise<string> {
  const baseEmail = buildEmail(baseLoginCode)
  
  // Cek apakah email base sudah ada
  const { data: existing } = await admin
    .from('profiles')
    .select('email')
    .eq('email', baseEmail)
    .maybeSingle()

  if (!existing) {
    return baseEmail
  }

  // Email sudah ada, cari suffix
  let counter = 2
  while (counter <= 999) {
    const candidateEmail = `${baseLoginCode}-${counter}@${EMAIL_DOMAIN}`
    const { data: candidate } = await admin
      .from('profiles')
      .select('email')
      .eq('email', candidateEmail)
      .maybeSingle()

    if (!candidate) {
      return candidateEmail
    }
    counter++
  }

  throw new Error('Gagal menemukan email yang tersedia')
}

async function findExistingProfileByLoginCode(
  admin: ReturnType<typeof createAdminClient>,
  loginCode: string
): Promise<ExistingProfile | null> {
  const { data, error } = await admin
    .from('profiles')
    .select('id, full_name, role, email, login_code')
    .eq('login_code', loginCode)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data as ExistingProfile | null
}

export async function POST() {
  try {
    const defaultParentPassword = getDefaultParentPassword()

    const sessionClient = await createClient()
    const admin = createAdminClient()

    const {
      data: { user },
      error: userError,
    } = await sessionClient.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        {
          error: 'Sesi login tidak ditemukan. Silakan login kembali.',
        },
        { status: 401 }
      )
    }

    const [activeCountResult, studentsResult] = await Promise.all([
      admin
        .from('siswa')
        .select('id', { count: 'exact', head: true })
        .eq('aktif', true),

      admin
        .from('siswa')
        .select('*')
        .eq('aktif', true)
        .is('ortu_id', null)
        .order('nama', { ascending: true }),
    ])

    if (activeCountResult.error) {
      throw new Error(
        `Gagal menghitung siswa aktif: ${activeCountResult.error.message}`
      )
    }

    if (studentsResult.error) {
      throw new Error(
        `Gagal mengambil siswa: ${studentsResult.error.message}`
      )
    }

    const students = (studentsResult.data ?? []) as StudentRow[]
    const totalActive = activeCountResult.count ?? 0
    const skippedExisting = Math.max(totalActive - students.length, 0)

    if (students.length === 0) {
      return NextResponse.json({
        message: 'Semua siswa aktif sudah memiliki akun orang tua.',
        summary: {
          total_active: totalActive,
          candidates: 0,
          created: 0,
          linked: 0,
          failed: 0,
          skipped_existing: skippedExisting,
        },
        results: [],
      })
    }

    const results: GenerationResult[] = []

    const processStudent = async (
      student: StudentRow
    ): Promise<GenerationResult> => {
      const baseLoginCode = buildLoginCode(student)
      const email = await findAvailableEmail(admin, baseLoginCode)
      
      // Validasi format email sebelum digunakan
      validateEmailFormat(email)
      
      // Extract login_code dari email (tanpa @domain)
      const loginCode = email.replace(`@${EMAIL_DOMAIN}`, '')

      const parentName =
        student.nama_ortu?.trim() || `Orang Tua ${student.nama}`

      try {
        // Cek apakah sudah ada profile dengan login_code ini
        const existingProfile = await findExistingProfileByLoginCode(
          admin,
          loginCode
        )

        if (existingProfile) {
          // Profile sudah ada - update dan tautkan
          if (existingProfile.role !== 'ortu') {
            throw new Error(
              'ID Login sudah dipakai oleh akun yang bukan role orang tua.'
            )
          }

          const { error: profileUpdateError } = await admin
            .from('profiles')
            .update({
              full_name: parentName,
              role: 'ortu',
              email,
              login_code: loginCode,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id)

          if (profileUpdateError) {
            throw new Error(profileUpdateError.message)
          }

          // Reset password ke default
          const { error: passwordError } = await admin.auth.admin.updateUserById(
            existingProfile.id,
            { password: defaultParentPassword }
          )

          if (passwordError) {
            throw new Error(
              `Gagal mengatur password: ${passwordError.message}`
            )
          }

          // Tautkan ke siswa
          const { error: linkError } = await admin
            .from('siswa')
            .update({ ortu_id: existingProfile.id })
            .eq('id', student.id)
            .is('ortu_id', null)

          if (linkError) {
            throw new Error(`Gagal menautkan akun: ${linkError.message}`)
          }

          return {
            siswa_id: student.id,
            nama_siswa: student.nama,
            kelas: student.kelas || '-',
            nama_ortu: parentName,
            login_code: loginCode,
            password: defaultParentPassword,
            status: 'ditautkan',
            error: null,
          }
        }

        // Final validation sebelum createUser
        const emailParts = email.split('@')
        if (emailParts.length !== 2 || !emailParts[0] || !emailParts[1]) {
          throw new Error(`Email tidak valid saat akan dibuat: ${email}`)
        }
        
        // Buat auth user baru
        const { data: authData, error: createUserError } =
          await admin.auth.admin.createUser({
            email,
            password: defaultParentPassword,
            email_confirm: true,
            user_metadata: {
              full_name: parentName,
              role: 'ortu',
            },
          })

        if (createUserError) {
          throw new Error(
            `Gagal membuat auth user: ${createUserError.message}`
          )
        }

        const authUserId = authData.user.id

        // Buat profile
        const { error: profileError } = await admin.from('profiles').insert({
          id: authUserId,
          full_name: parentName,
          role: 'ortu',
          email,
          login_code: loginCode,
        })

        if (profileError) {
          // Rollback: hapus auth user
          await admin.auth.admin.deleteUser(authUserId)
          throw new Error(`Gagal membuat profile: ${profileError.message}`)
        }

        // Tautkan ke siswa
        const { error: linkError } = await admin
          .from('siswa')
          .update({ ortu_id: authUserId })
          .eq('id', student.id)

        if (linkError) {
          // Rollback: hapus profile dan auth user
          await admin.from('profiles').delete().eq('id', authUserId)
          await admin.auth.admin.deleteUser(authUserId)
          throw new Error(`Gagal menautkan ke siswa: ${linkError.message}`)
        }

        return {
          siswa_id: student.id,
          nama_siswa: student.nama,
          kelas: student.kelas || '-',
          nama_ortu: parentName,
          login_code: loginCode,
          password: defaultParentPassword,
          status: 'berhasil',
          error: null,
        }
      } catch (err) {
        return {
          siswa_id: student.id,
          nama_siswa: student.nama,
          kelas: student.kelas || '-',
          nama_ortu: parentName,
          login_code: loginCode,
          password: defaultParentPassword,
          status: 'gagal',
          error: err instanceof Error ? err.message : 'Unknown error',
        }
      }
    }

    // Process in batches
    for (let i = 0; i < students.length; i += PROCESS_BATCH_SIZE) {
      const batch = students.slice(i, i + PROCESS_BATCH_SIZE)
      const batchResults = await Promise.all(batch.map(processStudent))
      results.push(...batchResults)
    }

    const summary = {
      total_active: totalActive,
      candidates: students.length,
      created: results.filter((r) => r.status === 'berhasil').length,
      linked: results.filter((r) => r.status === 'ditautkan').length,
      failed: results.filter((r) => r.status === 'gagal').length,
      skipped_existing: skippedExisting,
    }

    return NextResponse.json({
      message: `Berhasil membuat ${summary.created} akun dan menautkan ${summary.linked} akun yang sudah ada.`,
      summary,
      results,
    })
  } catch (err) {
    console.error('GENERATE PARENT ACCOUNTS ERROR:', err)
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat membuat akun orang tua.',
      },
      { status: 500 }
    )
  }
}
