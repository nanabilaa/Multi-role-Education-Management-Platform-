import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

function formatRupiah(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value)
}

function getMonthRange(month: string) {
  const [year, monthIndex] = month.split('-').map(Number)

  if (!year || !monthIndex || monthIndex < 1 || monthIndex > 12) {
    throw new Error('Format bulan tidak valid')
  }

  const start = new Date(Date.UTC(year, monthIndex - 1, 1))
  const end = new Date(Date.UTC(year, monthIndex, 1))

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  }
}

export async function GET(req: NextRequest) {
  try {
    const month = req.nextUrl.searchParams.get('month') || ''
    const { startDate, endDate } = getMonthRange(month)

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

    const today = new Date().toISOString().slice(0, 10)

    const { data: monthlyData, error: monthlyError } = await supabase
      .from('transaksi_dana')
      .select(`
        id,
        jenis,
        kategori,
        nominal,
        tanggal,
        deskripsi,
        created_at,
        siswa:siswa!transaksi_dana_siswa_id_fkey(
          nama,
          kelas,
          sekolah
        ),
        tentor:profiles!transaksi_dana_tentor_id_fkey(
          full_name
        )
      `)
      .gte('tanggal', startDate)
      .lt('tanggal', endDate)
      .order('tanggal', { ascending: true })
      .order('created_at', { ascending: true })

    if (monthlyError) {
      return NextResponse.json({ error: monthlyError.message }, { status: 400 })
    }

    const { data: allData, error: allError } = await supabase
      .from('transaksi_dana')
      .select('jenis, nominal, tanggal')
      .lte('tanggal', today)

    if (allError) {
      return NextResponse.json({ error: allError.message }, { status: 400 })
    }

    const transaksiList = monthlyData ?? []
    const semuaTransaksi = allData ?? []

    const totalPemasukanBulan = transaksiList
      .filter((item: any) => item.jenis === 'pemasukan')
      .reduce((sum: number, item: any) => sum + Number(item.nominal || 0), 0)

    const totalPengeluaranBulan = transaksiList
      .filter((item: any) => item.jenis === 'pengeluaran')
      .reduce((sum: number, item: any) => sum + Number(item.nominal || 0), 0)

    const saldoBulan = totalPemasukanBulan - totalPengeluaranBulan

    const totalPemasukanSaatIni = semuaTransaksi
      .filter((item: any) => item.jenis === 'pemasukan')
      .reduce((sum: number, item: any) => sum + Number(item.nominal || 0), 0)

    const totalPengeluaranSaatIni = semuaTransaksi
      .filter((item: any) => item.jenis === 'pengeluaran')
      .reduce((sum: number, item: any) => sum + Number(item.nominal || 0), 0)

    const saldoSaatIni = totalPemasukanSaatIni - totalPengeluaranSaatIni

    const rows = transaksiList.map((item: any, index: number) => ({
      No: index + 1,
      Tanggal: item.tanggal,
      Jenis: item.jenis,
      Kategori: item.kategori,
      Relasi:
        item.kategori === 'spp'
          ? item.siswa?.nama || '-'
          : item.kategori === 'honor'
          ? item.tentor?.full_name || '-'
          : '-',
      Kelas: item.siswa?.kelas || '-',
      Sekolah: item.siswa?.sekolah || '-',
      Deskripsi: item.deskripsi || '-',
      Nominal: Number(item.nominal || 0),
      Format_Rupiah: formatRupiah(Number(item.nominal || 0)),
    }))

    const wb = XLSX.utils.book_new()

    const wsTransaksi = XLSX.utils.json_to_sheet(rows)
    XLSX.utils.book_append_sheet(wb, wsTransaksi, 'Transaksi')

    const wsRingkasan = XLSX.utils.aoa_to_sheet([
      ['Laporan Dana Bulanan'],
      ['Bulan', month],
      ['Tanggal Export', today],
      [],
      ['Ringkasan Bulan Dipilih'],
      ['Total Pemasukan Bulan', totalPemasukanBulan],
      ['Total Pengeluaran Bulan', totalPengeluaranBulan],
      ['Saldo Bulan', saldoBulan],
      [],
      ['Format Pemasukan Bulan', formatRupiah(totalPemasukanBulan)],
      ['Format Pengeluaran Bulan', formatRupiah(totalPengeluaranBulan)],
      ['Format Saldo Bulan', formatRupiah(saldoBulan)],
      [],
      ['Saldo Saat Ini'],
      ['Total Pemasukan Saat Ini', totalPemasukanSaatIni],
      ['Total Pengeluaran Saat Ini', totalPengeluaranSaatIni],
      ['Sisa Saldo Saat Ini', saldoSaatIni],
      [],
      ['Format Pemasukan Saat Ini', formatRupiah(totalPemasukanSaatIni)],
      ['Format Pengeluaran Saat Ini', formatRupiah(totalPengeluaranSaatIni)],
      ['Format Sisa Saldo Saat Ini', formatRupiah(saldoSaatIni)],
    ])
    XLSX.utils.book_append_sheet(wb, wsRingkasan, 'Ringkasan')

    const buffer = XLSX.write(wb, {
      bookType: 'xlsx',
      type: 'buffer',
    })

    const filename = `laporan-dana-${month}.xlsx`

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Gagal export Excel' },
      { status: 500 }
    )
  }
}