import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const TABLES = [
  'profiles',
  'siswa',
  'sesi',
  'sesi_siswa',
  'jurnal',
  'honor',
  'spp',
  'transaksi_dana',
  'family_invoices',
  'family_invoice_items',
] as const

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL belum tersedia.'
    )
  }

  if (!key) {
    throw new Error(
      'SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY belum tersedia.'
    )
  }

  return createAdminClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

async function requireSuperadmin() {
  const sessionClient = await createServerClient()

  const {
    data: { user },
    error: userError,
  } = await sessionClient.auth.getUser()

  if (userError || !user) {
    return {
      response: NextResponse.json(
        { error: 'Silakan login kembali.' },
        { status: 401 }
      ),
    }
  }

  const admin = getAdminClient()

  const {
    data: profile,
    error: profileError,
  } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return {
      response: NextResponse.json(
        {
          error:
            'Gagal memeriksa role superadmin: ' +
            profileError.message,
        },
        { status: 500 }
      ),
    }
  }

  if (
    String(profile?.role || '')
      .trim()
      .toLowerCase() !== 'superadmin'
  ) {
    return {
      response: NextResponse.json(
        {
          error:
            'Akses ditolak. Fitur ini hanya untuk superadmin.',
        },
        { status: 403 }
      ),
    }
  }

  return {
    admin,
    user,
    profile,
  }
}

export async function GET() {
  try {
    const auth = await requireSuperadmin()

    if ('response' in auth) {
      return auth.response
    }

    const backupData: Record<
      string,
      unknown[]
    > = {}

    const warnings: string[] = []

    for (const table of TABLES) {
      const { data, error } = await auth.admin
        .from(table)
        .select('*')

      if (error) {
        /*
         * Backup tetap dibuat apabila ada tabel opsional
         * yang belum tersedia. Error dicatat sebagai warning
         * di dalam file agar mudah diperiksa.
         */
        warnings.push(
          `${table}: ${error.message}`
        )
        backupData[table] = []
        continue
      }

      backupData[table] = data ?? []
    }

    const generatedAt =
      new Date().toISOString()

    const payload = {
      meta: {
        application: 'CHECKPOINT CBS SYSTEM',
        format_version: 1,
        generated_at: generatedAt,
        generated_by: {
          id: auth.user.id,
          full_name:
            auth.profile?.full_name || null,
          role: 'superadmin',
        },
        warnings,
      },
      data: backupData,
    }

    const datePart =
      generatedAt.slice(0, 10)

    const body = JSON.stringify(
      payload,
      null,
      2
    )

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':
          'application/json; charset=utf-8',
        'Content-Disposition':
          `attachment; filename="cbs-backup-${datePart}.json"`,
        'Cache-Control':
          'no-store, max-age=0',
      },
    })
  } catch (error) {
    console.error(
      'SUPERADMIN BACKUP ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Backup gagal dibuat.',
      },
      { status: 500 }
    )
  }
}
