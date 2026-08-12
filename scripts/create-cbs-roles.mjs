import { createClient } from '@supabase/supabase-js'

/**
 * =========================================================
 * CBS SYSTEM - CREATE DEFAULT ROLE ACCOUNTS
 * =========================================================
 *
 * Jalankan dengan:
 *
 * node --env-file=.env.local scripts/create-cbs-roles.mjs
 *
 * Password dan credential Supabase TIDAK ditulis di file ini.
 * Semuanya diambil dari environment variable.
 */

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL

const serviceRoleKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY

function requireEnv(name) {
  const value = process.env[name]

  if (!value || !String(value).trim()) {
    throw new Error(
      `${name} belum tersedia di environment.`
    )
  }

  return String(value).trim()
}

if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL belum tersedia di environment.'
  )
}

if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SECRET_KEY atau SUPABASE_SERVICE_ROLE_KEY belum tersedia di environment.'
  )
}

const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

/**
 * Akun awal CBS.
 *
 * Email dan password semuanya berasal dari .env.local.
 * Jadi source code ini aman untuk masuk GitHub.
 */
const accounts = [
  {
    role: 'superadmin',
    fullName: 'Super Admin',
    email: requireEnv(
      'CBS_SUPERADMIN_EMAIL'
    ),
    password: requireEnv(
      'CBS_SUPERADMIN_PASSWORD'
    ),
  },
  {
    role: 'admin',
    fullName: 'Admin CBS',
    email: requireEnv(
      'CBS_ADMIN_EMAIL'
    ),
    password: requireEnv(
      'CBS_ADMIN_PASSWORD'
    ),
  },
  {
    role: 'tentor',
    fullName: 'Tentor CBS',
    email: requireEnv(
      'CBS_TENTOR_EMAIL'
    ),
    password: requireEnv(
      'CBS_TENTOR_PASSWORD'
    ),
  },
  {
    role: 'ortu',
    fullName: 'Orang Tua CBS',
    email: requireEnv(
      'CBS_ORTU_EMAIL'
    ),
    password: requireEnv(
      'CBS_ORTU_PASSWORD'
    ),
  },
]

async function getExistingUsers() {
  const users = []

  let page = 1
  const perPage = 1000

  while (true) {
    const {
      data,
      error,
    } = await supabase.auth.admin.listUsers({
      page,
      perPage,
    })

    if (error) {
      throw new Error(
        `Gagal membaca daftar Auth user: ${error.message}`
      )
    }

    const currentUsers =
      data?.users ?? []

    users.push(...currentUsers)

    if (
      currentUsers.length < perPage
    ) {
      break
    }

    page += 1
  }

  return users
}

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
}

async function ensureProfile({
  userId,
  fullName,
  role,
}) {
  const {
    error,
  } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        full_name: fullName,
        role,
      },
      {
        onConflict: 'id',
      }
    )

  if (error) {
    throw new Error(
      `Gagal menyimpan profile ${role}: ${error.message}`
    )
  }
}

async function createAccount(
  account,
  existingUsers
) {
  const existingUser =
    existingUsers.find(
      (user) =>
        normalizeEmail(user.email) ===
        normalizeEmail(account.email)
    )

  /**
   * Kalau Auth user sudah ada, jangan buat ulang dan
   * jangan otomatis mengubah password.
   *
   * Kita hanya memastikan profile/role-nya benar.
   */
  if (existingUser) {
    await ensureProfile({
      userId: existingUser.id,
      fullName: account.fullName,
      role: account.role,
    })

    return {
      role: account.role,
      email: account.email,
      userId: existingUser.id,
      status: 'existing',
    }
  }

  const {
    data,
    error,
  } =
    await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,

      /**
       * Karena ini akun internal CBS yang dibuat
       * oleh administrator, email langsung dianggap
       * terkonfirmasi.
       */
      email_confirm: true,

      user_metadata: {
        full_name: account.fullName,
        role: account.role,
      },
    })

  if (error) {
    throw new Error(
      `Gagal membuat akun ${account.role}: ${error.message}`
    )
  }

  const user = data.user

  if (!user) {
    throw new Error(
      `Auth user ${account.role} tidak dikembalikan Supabase.`
    )
  }

  await ensureProfile({
    userId: user.id,
    fullName: account.fullName,
    role: account.role,
  })

  return {
    role: account.role,
    email: account.email,
    userId: user.id,
    status: 'created',
  }
}

async function main() {
  console.log('')
  console.log(
    '=============================================='
  )
  console.log(
    ' CBS SYSTEM - CREATE ROLE ACCOUNTS'
  )
  console.log(
    '=============================================='
  )
  console.log('')

  console.log(
    'Memeriksa akun yang sudah tersedia...'
  )

  const existingUsers =
    await getExistingUsers()

  const results = []

  for (const account of accounts) {
    console.log(
      `Memproses ${account.role}...`
    )

    try {
      const result =
        await createAccount(
          account,
          existingUsers
        )

      results.push(result)

      if (
        result.status === 'created'
      ) {
        console.log(
          `✓ ${account.role} berhasil dibuat`
        )
      } else {
        console.log(
          `✓ ${account.role} sudah tersedia`
        )
      }
    } catch (error) {
      console.error(
        `✗ ${account.role} gagal`
      )

      console.error(
        error instanceof Error
          ? error.message
          : error
      )

      process.exitCode = 1
    }

    console.log('')
  }

  console.log(
    '=============================================='
  )
  console.log(' HASIL')
  console.log(
    '=============================================='
  )

  for (const result of results) {
    console.log('')
    console.log(
      `Role      : ${result.role}`
    )
    console.log(
      `Email     : ${result.email}`
    )
    console.log(
      `User ID   : ${result.userId}`
    )
    console.log(
      `Status    : ${
        result.status === 'created'
          ? 'Dibuat'
          : 'Sudah tersedia'
      }`
    )

    /**
     * PASSWORD SENGAJA TIDAK DICETAK.
     *
     * Hindari:
     *
     * console.log(account.password)
     *
     * karena terminal/log CI juga dapat tersimpan.
     */
    console.log(
      'Password  : tersimpan di environment'
    )
  }

  console.log('')
  console.log(
    '=============================================='
  )

  if (process.exitCode === 1) {
    console.log(
      'Sebagian akun gagal diproses.'
    )
  } else {
    console.log(
      'Semua akun berhasil diproses.'
    )
  }

  console.log(
    '=============================================='
  )
  console.log('')
}

main().catch((error) => {
  console.error('')
  console.error(
    'SCRIPT GAGAL DIJALANKAN'
  )

  console.error(
    error instanceof Error
      ? error.message
      : error
  )

  console.error('')

  process.exit(1)
})