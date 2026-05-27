import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const jenis = String(body?.jenis || '').trim()
    const kategori = String(body?.kategori || '').trim()
    const nominal = Number(body?.nominal || 0)
    const tanggal = String(body?.tanggal || '').trim()
    const deskripsi = String(body?.deskripsi || '').trim()
    const siswa_id = body?.siswa_id ? String(body.siswa_id).trim() : null
    const tentor_id = body?.tentor_id ? String(body.tentor_id).trim() : null

    if (!['pemasukan', 'pengeluaran'].includes(jenis)) {
      return NextResponse.json({ error: 'Jenis tidak valid' }, { status: 400 })
    }

    if (
      (jenis === 'pemasukan' && !['custom', 'spp'].includes(kategori)) ||
      (jenis === 'pengeluaran' && !['custom', 'honor'].includes(kategori))
    ) {
      return NextResponse.json({ error: 'Kategori tidak valid' }, { status: 400 })
    }

    if (!nominal || nominal <= 0) {
      return NextResponse.json({ error: 'Nominal tidak valid' }, { status: 400 })
    }

    if (!tanggal) {
      return NextResponse.json({ error: 'Tanggal wajib diisi' }, { status: 400 })
    }

    if (kategori === 'spp' && !siswa_id) {
      return NextResponse.json({ error: 'Murid wajib dipilih' }, { status: 400 })
    }

    if (kategori === 'honor' && !tentor_id) {
      return NextResponse.json({ error: 'Tentor wajib dipilih' }, { status: 400 })
    }

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const finalDeskripsi =
      deskripsi ||
      (kategori === 'spp'
        ? 'Pembayaran SPP'
        : kategori === 'honor'
        ? 'Honor tentor'
        : jenis === 'pemasukan'
        ? 'Pemasukan custom'
        : 'Pengeluaran custom')

    const { data, error } = await supabase
      .from('transaksi_dana')
      .insert([
        {
          jenis,
          kategori,
          nominal,
          tanggal,
          deskripsi: finalDeskripsi,
          siswa_id: kategori === 'spp' ? siswa_id : null,
          tentor_id: kategori === 'honor' ? tentor_id : null,
          created_by: user.id,
        },
      ])
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}