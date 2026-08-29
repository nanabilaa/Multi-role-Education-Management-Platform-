import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const EMAIL_DOMAIN = 'bimbelcbs.my.id'
const PROCESS_BATCH_SIZE = 3

type StudentRow = {
  id: string
  nama: string
  kelas: string | null
  aktif: boolean | null
  ortu_id: string | null
  nama_ortu?: string | null
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

function getDefaultParentPassword(): string {
  const password = process.env.PARENT_INITIAL_PASSWORD?.trim()
  if (!password) {
    throw new Error('PARENT_INITIAL_PASSWORD belum dikonfigurasi di environment.')
  }
  return password
}

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

function buildBaseLoginCode(student: StudentRow): string {
  const nameSlug = slugifyStudentName(student.nama) || 'anak'
  return `ortu-${nameSlug}`
}

function buildEmail(loginCode: string): string {
  return `${loginCode}@${EMAIL_DOMAIN}`
}

/**
 * Get all existing login codes from profiles table
 * to avoid collisions with already-existing accounts
 */
async function getExistingLoginCodes(
  admin: ReturnType<typeof createAdminClient>
): Promise<Set<string>> {
  const { data, error } = await admin
    .from('profiles')
    .select('login_code')
    .eq('role', 'ortu')
    .not('login_code', 'is', null)

  if (error) {
    console.warn('Warning: Could not fetch existing login codes:', error.message)
    return new Set()
  }

  const loginCodes = new Set<string>()
  for (const row of data ?? []) {
    if (row.login_code) {
      loginCodes.add(row.login_code)
    }
  }
  return loginCodes
}

/**
 * Find next available login code with incrementing suffix
 */
function findAvailableLoginCode(
  baseLoginCode: string,
  existingLogins: Set<string>
): string {
  // Check base login code first
  if (!existingLogins.has(baseLoginCode)) {
    return baseLoginCode
  }

  // Try incrementing suffixes: -2, -3, -4, ...
  let counter = 2
  while (counter <= 999) {
    const candidate = `${baseLoginCode}-${counter}`
    if (!existingLogins.has(candidate)) {
      return candidate
    }
    counter++
  }

  throw new Error(`Tidak dapat menemukan login code yang tersedia untuk: ${baseLoginCode}`)
}

/**
 * Pre-compute unique login codes for entire batch BEFORE creating any accounts.
 * This prevents race conditions by resolving all collisions upfront.
 */
function preComputeLoginCodes(
  students: StudentRow[],
  existingLogins: Set<string>
): Map<string, string> {
  // Count occurrences of each base login code
  const baseLoginCounts = new Map<string, number>()

  for (const student of students) {
    const baseCode = buildBaseLoginCode(student)
    baseLoginCounts.set(baseCode, (baseLoginCounts.get(baseCode) || 0) + 1)
  }

  // Generate unique login codes for each student
  const studentToLogin = new Map<string, string>()
  const usedLogins = new Set(existingLogins) // Start with existing logins

  for (const student of students) {
    const baseCode = buildBaseLoginCode(student)

    // Check if this base code has duplicates in the batch
    const countInBatch = baseLoginCounts.get(baseCode) || 0

    if (countInBatch > 1) {
      // Multiple students with same name - need to assign -2, -3, etc.
      // Find the first available slot
      let counter = existingLogins.has(baseCode) ? 2 : 1
      let found = false

      while (counter <= 999) {
        const candidate = counter === 1 ? baseCode : `${baseCode}-${counter}`
        if (!usedLogins.has(candidate)) {
          studentToLogin.set(student.id, candidate)
          usedLogins.add(candidate)
          found = true
          break
        }
        counter++
      }

      if (!found) {
        throw new Error(`Tidak dapat menemukan login code untuk: ${student.nama}`)
      }
    } else {
      // Unique name in this batch - just find next available
      const loginCode = findAvailableLoginCode(baseCode, usedLogins)
      studentToLogin.set(student.id, loginCode)
      usedLogins.add(loginCode)
    }
  }

  return studentToLogin
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
        { error: 'Sesi login tidak ditemukan. Silakan login kembali.' },
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
      throw new Error(`Gagal menghitung siswa aktif: ${activeCountResult.error.message}`)
    }

    if (studentsResult.error) {
      throw new Error(`Gagal mengambil siswa: ${studentsResult.error.message}`)
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

    // =====================================================
    // STEP 1: Get ALL existing login codes from database
    // =====================================================
    const existingLogins = await getExistingLoginCodes(admin)

    // =====================================================
    // STEP 2: Pre-compute unique login codes for entire batch
    // This prevents race conditions
    // =====================================================
    const studentLoginMap = preComputeLoginCodes(students, existingLogins)

    const results: GenerationResult[] = []

    // =====================================================
    // STEP 3: Process SEQUENTIALLY to avoid race conditions
    // =====================================================
    for (let i = 0; i < students.length; i++) {
      const student = students[i]
      const loginCode = studentLoginMap.get(student.id)!

      if (!loginCode) {
        results.push({
          siswa_id: student.id,
          nama_siswa: student.nama,
          kelas: student.kelas || '-',
          nama_ortu: student.nama_ortu || `Orang Tua ${student.nama}`,
          login_code: '',
          password: defaultParentPassword,
          status: 'gagal',
          error: 'Login code tidak ditemukan',
        })
        continue
      }

      const email = buildEmail(loginCode)
      const parentName = student.nama_ortu?.trim() || `Orang Tua ${student.nama}`

      try {
        // Check if profile already exists with this login code
        const { data: existingProfile } = await admin
          .from('profiles')
          .select('id, role')
          .eq('login_code', loginCode)
          .maybeSingle()

        if (existingProfile) {
          // Profile exists - update and link
          if (existingProfile.role !== 'ortu') {
            throw new Error('Login sudah dipakai oleh akun non-ortu.')
          }

          const { error: updateError } = await admin
            .from('profiles')
            .update({
              full_name: parentName,
              email,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingProfile.id)

          if (updateError) {
            throw new Error(`Gagal update profile: ${updateError.message}`)
          }

          // Reset password
          const { error: pwdError } = await admin.auth.admin.updateUserById(
            existingProfile.id,
            { password: defaultParentPassword }
          )

          if (pwdError) {
            throw new Error(`Gagal reset password: ${pwdError.message}`)
          }

          // Link to student
          const { error: linkError } = await admin
            .from('siswa')
            .update({ ortu_id: existingProfile.id })
            .eq('id', student.id)
            .is('ortu_id', null)

          if (linkError) {
            throw new Error(`Gagal menautkan: ${linkError.message}`)
          }

          results.push({
            siswa_id: student.id,
            nama_siswa: student.nama,
            kelas: student.kelas || '-',
            nama_ortu: parentName,
            login_code: loginCode,
            password: defaultParentPassword,
            status: 'ditautkan',
            error: null,
          })
        } else {
          // =====================================================
          // Create NEW account using RPC
          // =====================================================
          const { data: rpcResult, error: rpcError } = await admin.rpc(
            'create_cbs_auth_user',
            {
              user_email: email,
              user_password: defaultParentPassword,
              user_full_name: parentName,
              user_role: 'ortu',
              user_phone: null,
            }
          )

          if (rpcError) {
            throw new Error(`RPC error: ${rpcError.message}`)
          }

          if (!rpcResult) {
            throw new Error('RPC tidak mengembalikan user ID')
          }

          const parentUserId = rpcResult as string

          // Link to student
          const { error: linkError } = await admin
            .from('siswa')
            .update({ ortu_id: parentUserId })
            .eq('id', student.id)

          if (linkError) {
            throw new Error(`Gagal menautkan ke siswa: ${linkError.message}`)
          }

          results.push({
            siswa_id: student.id,
            nama_siswa: student.nama,
            kelas: student.kelas || '-',
            nama_ortu: parentName,
            login_code: loginCode,
            password: defaultParentPassword,
            status: 'berhasil',
            error: null,
          })
        }
      } catch (err) {
        results.push({
          siswa_id: student.id,
          nama_siswa: student.nama,
          kelas: student.kelas || '-',
          nama_ortu: parentName,
          login_code: loginCode,
          password: defaultParentPassword,
          status: 'gagal',
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
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
      message: `Berhasil membuat ${summary.created} akun dan menautkan ${summary.linked} akun.`,
      summary,
      results,
    })
  } catch (err) {
    console.error('GENERATE PARENT ACCOUNTS ERROR:', err)
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : 'Terjadi kesalahan saat membuat akun orang tua.',
      },
      { status: 500 }
    )
  }
}
