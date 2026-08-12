import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

type ResetMode =
  | 'jurnal'
  | 'spp'
  | 'transaksi'
  | 'operasional'

const ZERO_UUID =
  '00000000-0000-0000-0000-000000000000'

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
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError) {
    return {
      response: NextResponse.json(
        {
          error:
            'Gagal memeriksa role: ' +
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
            'Akses ditolak. Reset hanya dapat dijalankan superadmin.',
        },
        { status: 403 }
      ),
    }
  }

  return {
    admin,
    user,
  }
}

async function deleteAll(
  admin: ReturnType<typeof getAdminClient>,
  table: string
) {
  const { error } = await admin
    .from(table)
    .delete()
    .neq('id', ZERO_UUID)

  if (error) {
    throw new Error(
      `Gagal menghapus ${table}: ${error.message}`
    )
  }
}

async function resetJurnal(
  admin: ReturnType<typeof getAdminClient>
) {
  await deleteAll(admin, 'jurnal')
}

async function resetSpp(
  admin: ReturnType<typeof getAdminClient>
) {
  /*
   * URUTAN INI PENTING.
   *
   * Jangan hapus family_invoices lebih dulu.
   * spp.family_invoice_id memakai ON DELETE SET NULL.
   * Jika satu faktur keluarga dipakai beberapa row SPP dengan invoice_no
   * yang sama, SET NULL akan membuat row-row tersebut masuk ke partial
   * unique index spp_invoice_no_legacy_unique dan memicu duplicate key.
   *
   * Jadi:
   * 1. hapus transaksi pembayaran SPP
   * 2. hapus seluruh SPP
   * 3. baru hapus family_invoices
   *
   * Saat SPP dihapus, family_invoice_items.spp_id akan menjadi null
   * (ON DELETE SET NULL). Setelah itu header family invoice aman dihapus
   * dan item-nya ikut hilang lewat ON DELETE CASCADE.
   */

  const {
    error: transactionError,
  } = await admin
    .from('transaksi_dana')
    .delete()
    .eq('kategori', 'spp')

  if (transactionError) {
    throw new Error(
      'Gagal menghapus transaksi SPP: ' +
        transactionError.message
    )
  }

  await deleteAll(admin, 'spp')
  await deleteAll(admin, 'family_invoices')
}

async function resetTransaksi(
  admin: ReturnType<typeof getAdminClient>
) {
  await deleteAll(admin, 'transaksi_dana')
}

async function resetOperasional(
  admin: ReturnType<typeof getAdminClient>
) {
  /*
   * URUTAN INI JUGA PENTING.
   *
   * transaksi_dana dihapus lebih dulu supaya tidak ada referensi ke SPP.
   * SPP dihapus sebelum family_invoices untuk menghindari
   * spp_invoice_no_legacy_unique seperti dijelaskan di resetSpp().
   */
  await deleteAll(admin, 'transaksi_dana')
  await deleteAll(admin, 'honor')
  await deleteAll(admin, 'jurnal')
  await deleteAll(admin, 'sesi_siswa')
  await deleteAll(admin, 'sesi')
  await deleteAll(admin, 'spp')
  await deleteAll(admin, 'family_invoices')
}

export async function POST(
  request: Request
) {
  try {
    const auth = await requireSuperadmin()

    if ('response' in auth) {
      return auth.response
    }

    const body = await request
      .json()
      .catch(() => ({}))

    const resetMode = String(
      body?.reset_mode || ''
    )
      .trim()
      .toLowerCase() as ResetMode

    if (
      ![
        'jurnal',
        'spp',
        'transaksi',
        'operasional',
      ].includes(resetMode)
    ) {
      return NextResponse.json(
        {
          error:
            'Mode reset tidak valid.',
        },
        { status: 400 }
      )
    }

    switch (resetMode) {
      case 'jurnal':
        await resetJurnal(auth.admin)
        break

      case 'spp':
        await resetSpp(auth.admin)
        break

      case 'transaksi':
        await resetTransaksi(auth.admin)
        break

      case 'operasional':
        await resetOperasional(
          auth.admin
        )
        break
    }

    const labels: Record<
      ResetMode,
      string
    > = {
      jurnal:
        'Seluruh jurnal berhasil direset.',
      spp:
        'SPP, pembayaran SPP, dan faktur keluarga berhasil direset.',
      transaksi:
        'Seluruh transaksi dana berhasil direset.',
      operasional:
        'Data operasional berhasil direset. Akun dan data siswa tetap tersimpan.',
    }

    return NextResponse.json({
      ok: true,
      mode: resetMode,
      message: labels[resetMode],
    })
  } catch (error) {
    console.error(
      'SUPERADMIN RESET ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Reset gagal dijalankan.',
      },
      { status: 500 }
    )
  }
}
