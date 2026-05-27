'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Banknote,
  CheckCircle2,
  ChevronDown,
  Clock,
  Coins,
  Download,
  FileSpreadsheet,
  Plus,
  ReceiptText,
  RefreshCcw,
  Search,
  Sparkles,
  Trash2,
  Undo2,
  UserRound,
  Wallet,
} from 'lucide-react'

type SppStatus = 'lunas' | 'belum'

type SiswaRow = {
  id: string
  nama: string
  kelas: string
  sekolah: string | null
}

type ProfileRow = {
  id: string
  full_name: string
  role: string
}

type SppRow = {
  id: string
  siswa_id: string | null
  bulan: number
  tahun: number
  nominal: number
  dibayar: number
  status: SppStatus
  tanggal_bayar: string | null
  tanggal_jatuh_tempo: string | null
  keterangan: string | null
  invoice_no: string | null
  created_at: string
  siswa?: SiswaRow | null
}

type TransaksiRow = {
  id: string
  jenis: 'pemasukan' | 'pengeluaran'
  kategori: 'custom' | 'spp' | 'honor'
  sub_kategori: string | null
  nominal: number
  tanggal: string
  deskripsi: string | null
  created_at: string
}

const monthNames = [
  '',
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const expenseCategories = [
  'Biaya FC dan Print',
  'Biaya Air, Listrik, wifi',
  'Biaya Perlengkapan',
  'Honor Tentor',
  'Honor Admin',
  'Bonus Admin',
  'Konsumsi Briefing',
  'Biaya Lain-lain',
  'Honor Pimpinan',
  'Bonus Pimpinan',
  'Biaya Pengembalian Modal',
  'Tabungan Pengembangan',
]

const incomeCategories = [
  'Pembayaran SPP',
  'Pendaftaran Siswa',
  'Paket UTBK',
  'Paket Reguler',
  'Pemasukan Lain-lain',
]

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

function formatDate(date?: string | null) {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function generateInvoiceNo() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const random = Math.floor(Math.random() * 9000) + 1000
  return `INV-${date}-${random}`
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replaceAll(' ', '-')
    .replace(/[^a-z0-9-]/g, '')
}

export default function AdminDanaPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [sppList, setSppList] = useState<SppRow[]>([])
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [tentorList, setTentorList] = useState<ProfileRow[]>([])
  const [transaksiList, setTransaksiList] = useState<TransaksiRow[]>([])

  const [search, setSearch] = useState('')
  const [filterSiswaId, setFilterSiswaId] = useState('')
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({})

  const [selectedSiswaId, setSelectedSiswaId] = useState('')
  const [bulan, setBulan] = useState(String(new Date().getMonth() + 1))
  const [tahun, setTahun] = useState(String(new Date().getFullYear()))
  const [nominal, setNominal] = useState('500000')
  const [keterangan, setKeterangan] = useState('')

  const [incomeCategory, setIncomeCategory] = useState('')
  const [incomeNominal, setIncomeNominal] = useState('')
  const [incomeDesc, setIncomeDesc] = useState('')

  const [expenseCategory, setExpenseCategory] = useState('')
  const [expenseNominal, setExpenseNominal] = useState('')
  const [expenseDesc, setExpenseDesc] = useState('')

  const [selectedTentorId, setSelectedTentorId] = useState('')
  const [honorNominal, setHonorNominal] = useState('')
  const [honorDesc, setHonorDesc] = useState('')

  async function getCurrentUserId() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user?.id ?? null
  }

  async function loadData() {
    setLoading(true)
    setMessage('')

    const [sppRes, siswaRes, tentorRes, transaksiRes] = await Promise.all([
      supabase
        .from('spp')
        .select(
          `
          id,
          siswa_id,
          bulan,
          tahun,
          nominal,
          dibayar,
          status,
          tanggal_bayar,
          tanggal_jatuh_tempo,
          keterangan,
          invoice_no,
          created_at,
          siswa:siswa_id (
            id,
            nama,
            kelas,
            sekolah
          )
        `
        )
        .order('created_at', { ascending: false }),

      supabase
        .from('siswa')
        .select('id, nama, kelas, sekolah')
        .eq('aktif', true)
        .order('nama', { ascending: true }),

      supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('role', 'tentor')
        .order('full_name', { ascending: true }),

      supabase
        .from('transaksi_dana')
        .select('id, jenis, kategori, sub_kategori, nominal, tanggal, deskripsi, created_at')
        .order('tanggal', { ascending: false }),
    ])

    if (sppRes.error) setMessage(sppRes.error.message)
    if (siswaRes.error) setMessage(siswaRes.error.message)
    if (tentorRes.error) setMessage(tentorRes.error.message)
    if (transaksiRes.error) setMessage(transaksiRes.error.message)

    setSppList((sppRes.data || []) as unknown as SppRow[])
    setSiswaList((siswaRes.data || []) as SiswaRow[])
    setTentorList((tentorRes.data || []) as ProfileRow[])
    setTransaksiList((transaksiRes.data || []) as TransaksiRow[])

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredSpp = useMemo(() => {
    const keyword = search.toLowerCase()

    if (!filterSiswaId) return []

    return sppList.filter((item) => {
      const matchSiswa = item.siswa_id === filterSiswaId
      const matchSearch =
        !keyword ||
        item.invoice_no?.toLowerCase().includes(keyword) ||
        item.siswa?.nama?.toLowerCase().includes(keyword) ||
        item.siswa?.kelas?.toLowerCase().includes(keyword) ||
        String(item.tahun).includes(keyword) ||
        monthNames[item.bulan]?.toLowerCase().includes(keyword)

      return matchSiswa && matchSearch
    })
  }, [sppList, search, filterSiswaId])

  const selectedStudent = siswaList.find((siswa) => siswa.id === filterSiswaId)

  const totalTagihan = sppList.reduce((total, item) => total + Number(item.nominal || 0), 0)

  const totalPemasukan = transaksiList
    .filter((item) => item.jenis === 'pemasukan')
    .reduce((total, item) => total + Number(item.nominal || 0), 0)

  const totalPengeluaran = transaksiList
    .filter((item) => item.jenis === 'pengeluaran')
    .reduce((total, item) => total + Number(item.nominal || 0), 0)

  const totalTunggakan = sppList
    .filter((item) => item.status === 'belum')
    .reduce((total, item) => {
      const sisa = Number(item.nominal || 0) - Number(item.dibayar || 0)
      return total + Math.max(sisa, 0)
    }, 0)

  const totalGajiTutor = transaksiList
    .filter((item) => item.kategori === 'honor' && item.jenis === 'pengeluaran')
    .reduce((total, item) => total + Number(item.nominal || 0), 0)

  const totalLunas = sppList.filter((item) => item.status === 'lunas').length
  const totalBelumLunas = sppList.filter((item) => item.status === 'belum').length
  const saldoBersih = totalPemasukan - totalPengeluaran

  async function handleGenerateInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const userId = await getCurrentUserId()

    if (!selectedSiswaId || !bulan || !tahun || !nominal) {
      setMessage('Lengkapi data invoice terlebih dahulu.')
      setSaving(false)
      return
    }

    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + 21)

    const { error } = await supabase.from('spp').insert({
      siswa_id: selectedSiswaId,
      bulan: Number(bulan),
      tahun: Number(tahun),
      nominal: Number(nominal),
      dibayar: 0,
      status: 'belum',
      tanggal_bayar: null,
      tanggal_jatuh_tempo: dueDate.toISOString().slice(0, 10),
      keterangan: keterangan || 'Tagihan dibuat oleh admin',
      invoice_no: generateInvoiceNo(),
      updated_by: userId,
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setFilterSiswaId(selectedSiswaId)
    setSelectedSiswaId('')
    setNominal('500000')
    setKeterangan('')
    setMessage('Invoice berhasil dibuat.')
    setSaving(false)
    loadData()
  }

  async function handleAddSppPayment(spp: SppRow) {
    setSaving(true)
    setMessage('')

    const amount = Number(paymentInputs[spp.id] || 0)
    const currentPaid = Number(spp.dibayar || 0)
    const billAmount = Number(spp.nominal || 0)
    const remaining = Math.max(billAmount - currentPaid, 0)

    if (!amount || amount <= 0) {
      setMessage('Isi nominal pembayaran terlebih dahulu.')
      setSaving(false)
      return
    }

    if (amount > remaining) {
      setMessage(`Nominal pembayaran melebihi sisa tagihan: ${formatCurrency(remaining)}.`)
      setSaving(false)
      return
    }

    const userId = await getCurrentUserId()
    const today = new Date().toISOString().slice(0, 10)
    const newPaid = currentPaid + amount
    const isPaidOff = newPaid >= billAmount

    const { error: updateError } = await supabase
      .from('spp')
      .update({
        dibayar: newPaid,
        status: isPaidOff ? 'lunas' : 'belum',
        tanggal_bayar: today,
        updated_by: userId,
      })
      .eq('id', spp.id)

    if (updateError) {
      setMessage(updateError.message)
      setSaving(false)
      return
    }

    const { error: trxError } = await supabase.from('transaksi_dana').insert({
      jenis: 'pemasukan',
      kategori: 'spp',
      sub_kategori: isPaidOff ? 'Pelunasan SPP' : 'Cicilan SPP',
      nominal: amount,
      tanggal: today,
      deskripsi: `${isPaidOff ? 'Pelunasan' : 'Cicilan'} cash SPP ${
        spp.siswa?.nama ?? ''
      } - ${monthNames[spp.bulan]} ${spp.tahun}`,
      siswa_id: spp.siswa_id,
      spp_id: spp.id,
      created_by: userId,
    })

    if (trxError) {
      setMessage(trxError.message)
      setSaving(false)
      return
    }

    setPaymentInputs((prev) => ({ ...prev, [spp.id]: '' }))
    setMessage(
      isPaidOff
        ? 'Pembayaran berhasil. Tagihan sekarang lunas.'
        : `Cicilan berhasil disimpan. Sisa tagihan: ${formatCurrency(billAmount - newPaid)}.`
    )
    setSaving(false)
    loadData()
  }

  async function handleResetSppPayment(spp: SppRow) {
    const confirmReset = window.confirm(
      `Reset semua pembayaran/cicilan untuk ${spp.siswa?.nama ?? 'siswa ini'}?`
    )

    if (!confirmReset) return

    const confirmAgain = window.confirm('Yakin? Tindakan ini tidak bisa dibatalkan.')
    if (!confirmAgain) return

    setSaving(true)
    setMessage('')

    const userId = await getCurrentUserId()

    const { error: updateError } = await supabase
      .from('spp')
      .update({
        status: 'belum',
        dibayar: 0,
        tanggal_bayar: null,
        updated_by: userId,
        keterangan: 'Pembayaran/cicilan direset oleh admin',
      })
      .eq('id', spp.id)

    if (updateError) {
      setMessage(updateError.message)
      setSaving(false)
      return
    }

    const { error: deleteError } = await supabase
      .from('transaksi_dana')
      .delete()
      .eq('spp_id', spp.id)
      .eq('kategori', 'spp')
      .eq('jenis', 'pemasukan')

    if (deleteError) {
      setMessage(deleteError.message)
      setSaving(false)
      return
    }

    setPaymentInputs((prev) => ({ ...prev, [spp.id]: '' }))
    setMessage('Semua pembayaran invoice ini berhasil direset.')
    setSaving(false)
    loadData()
  }

  async function handleResetAllSpp() {
    const firstConfirm = window.confirm(
      'PERINGATAN! Semua data tagihan SPP, invoice, status lunas/belum lunas, dan cicilan pembayaran akan dihapus. Lanjutkan?'
    )

    if (!firstConfirm) return

    const secondConfirm = window.confirm(
      'Yakin sekali? Semua tagihan SPP siswa akan kosong dan tidak bisa dikembalikan.'
    )

    if (!secondConfirm) return

    setSaving(true)
    setMessage('')

    const { error: deleteTrxError } = await supabase
      .from('transaksi_dana')
      .delete()
      .eq('kategori', 'spp')

    if (deleteTrxError) {
      setMessage(`Gagal hapus transaksi pembayaran SPP: ${deleteTrxError.message}`)
      setSaving(false)
      return
    }

    const { error: deleteSppError } = await supabase
      .from('spp')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteSppError) {
      setMessage(`Gagal hapus tagihan SPP: ${deleteSppError.message}`)
      setSaving(false)
      return
    }

    setPaymentInputs({})
    setFilterSiswaId('')
    setSearch('')
    setMessage('Semua data tagihan SPP dan pembayaran SPP berhasil direset.')
    setSaving(false)
    loadData()
  }

  async function handleAddIncome(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const userId = await getCurrentUserId()

    if (!incomeCategory || !incomeNominal) {
      setMessage('Pilih kategori dan isi nominal pemasukan.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('transaksi_dana').insert({
      jenis: 'pemasukan',
      kategori: 'custom',
      sub_kategori: incomeCategory,
      nominal: Number(incomeNominal),
      tanggal: new Date().toISOString().slice(0, 10),
      deskripsi: incomeDesc || incomeCategory,
      created_by: userId,
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setIncomeCategory('')
    setIncomeNominal('')
    setIncomeDesc('')
    setMessage('Pemasukan berhasil disimpan.')
    setSaving(false)
    loadData()
  }

  async function handleAddExpense(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const userId = await getCurrentUserId()

    if (!expenseCategory || !expenseNominal) {
      setMessage('Pilih kategori dan isi nominal pengeluaran.')
      setSaving(false)
      return
    }

    const { error } = await supabase.from('transaksi_dana').insert({
      jenis: 'pengeluaran',
      kategori: 'custom',
      sub_kategori: expenseCategory,
      nominal: Number(expenseNominal),
      tanggal: new Date().toISOString().slice(0, 10),
      deskripsi: expenseDesc || expenseCategory,
      created_by: userId,
    })

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setExpenseCategory('')
    setExpenseNominal('')
    setExpenseDesc('')
    setMessage('Pengeluaran berhasil disimpan.')
    setSaving(false)
    loadData()
  }

  async function handlePayTutor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    const userId = await getCurrentUserId()

    if (!selectedTentorId || !honorNominal) {
      setMessage('Lengkapi data gaji tutor.')
      setSaving(false)
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const tentorName =
      tentorList.find((tentor) => tentor.id === selectedTentorId)?.full_name ?? 'Tutor'

    const { error: honorError } = await supabase.from('honor').insert({
      tentor_id: selectedTentorId,
      jumlah_honor: Number(honorNominal),
      tanggal_bayar: new Date().toISOString(),
    })

    if (honorError) {
      setMessage(honorError.message)
      setSaving(false)
      return
    }

    const { error: trxError } = await supabase.from('transaksi_dana').insert({
      jenis: 'pengeluaran',
      kategori: 'honor',
      sub_kategori: 'Honor Tentor',
      nominal: Number(honorNominal),
      tanggal: today,
      deskripsi: honorDesc || `Gaji tutor ${tentorName}`,
      tentor_id: selectedTentorId,
      created_by: userId,
    })

    if (trxError) {
      setMessage(`Honor tersimpan, tapi gagal masuk laporan: ${trxError.message}`)
      setSaving(false)
      loadData()
      return
    }

    setSelectedTentorId('')
    setHonorNominal('')
    setHonorDesc('')
    setMessage('Gaji tutor berhasil dicatat dan masuk ke laporan pengeluaran.')
    setSaving(false)
    loadData()
  }

  async function handleDownloadInvoice(spp: SppRow) {
    setSaving(true)
    setMessage('Sedang membuat invoice...')

    try {
      const jsPdfModule = await import('jspdf')
      const { jsPDF } = jsPdfModule
      const pdf = new jsPDF('p', 'mm', 'a4')

      const sisa = Math.max(Number(spp.nominal) - Number(spp.dibayar || 0), 0)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(22)
      pdf.text('Bimbingan Belajar CBS Salaman', 16, 22)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text('Jl. Diponegoro No. 28 Gadean Salaman, Magelang', 16, 30)
      pdf.text('0813-9219-2401 | bimbinganbelajarbcssalaman@gmail.com', 16, 36)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(28)
      pdf.text('FAKTUR', 160, 22)

      pdf.setFontSize(10)
      pdf.text(`#${spp.invoice_no || '-'}`, 160, 30)

      pdf.setFont('helvetica', 'normal')
      pdf.text(`Tanggal: ${formatDate(spp.created_at)}`, 150, 42)
      pdf.text(`Jatuh Tempo: ${formatDate(spp.tanggal_jatuh_tempo)}`, 150, 48)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(12)
      pdf.text(`Tagih Kepada: ${spp.siswa?.nama || '-'}`, 16, 62)

      pdf.setFillColor(6, 61, 39)
      pdf.rect(16, 78, 178, 10, 'F')

      pdf.setTextColor(255, 255, 255)
      pdf.setFontSize(10)
      pdf.text('#', 20, 85)
      pdf.text('Item', 32, 85)
      pdf.text('Qty', 116, 85)
      pdf.text('Biaya', 136, 85)
      pdf.text('Total', 170, 85)

      pdf.setTextColor(51, 65, 85)
      pdf.setFont('helvetica', 'normal')
      pdf.text('1', 20, 100)
      pdf.text(`SPP Bimbel ${monthNames[spp.bulan]} ${spp.tahun}`, 32, 100)
      pdf.text('1', 118, 100)
      pdf.text(formatCurrency(spp.nominal), 136, 100)
      pdf.text(formatCurrency(spp.nominal), 170, 100)

      pdf.setDrawColor(226, 232, 240)
      pdf.line(16, 108, 194, 108)

      pdf.setFont('helvetica', 'bold')
      pdf.text('Info Pembayaran', 16, 126)

      pdf.setFont('helvetica', 'normal')
      pdf.text('Bayar cash ke admin atau transfer ke:', 16, 134)
      pdf.text('DWI RIYANA NURSANTI', 16, 140)
      pdf.text('BRI 308301063510534', 16, 146)
      pdf.text('BRI 676701016062537', 16, 152)
      pdf.text('Bank Jateng 2162047852', 16, 158)
      pdf.text('Bank Mandiri 1850004717119', 16, 164)

      pdf.setFont('helvetica', 'bold')
      pdf.text('Subtotal', 130, 126)
      pdf.text(formatCurrency(spp.nominal), 162, 126)

      pdf.text('Total', 130, 136)
      pdf.text(formatCurrency(spp.nominal), 162, 136)

      pdf.setFont('helvetica', 'normal')
      pdf.text('Dibayar', 130, 146)
      pdf.text(formatCurrency(spp.dibayar || 0), 162, 146)

      pdf.setFont('helvetica', 'bold')
      pdf.text('Saldo Terutang', 130, 158)
      pdf.text(formatCurrency(sisa), 162, 158)

      pdf.setFont('helvetica', 'normal')
      pdf.text('Bimbingan Belajar CBS Salaman', 125, 230)
      pdf.line(125, 224, 190, 224)

      pdf.save(`invoice-${spp.invoice_no || safeFileName(spp.siswa?.nama || 'siswa')}.pdf`)

      setMessage('Invoice berhasil didownload.')
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? `Gagal download invoice: ${error.message}` : 'Gagal download invoice.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadExcelReport() {
    setSaving(true)
    setMessage('Sedang membuat laporan Excel...')

    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Laporan Dana', {
        views: [{ state: 'frozen', ySplit: 8 }],
      })

      sheet.columns = [
        { header: 'Tanggal', key: 'tanggal', width: 16 },
        { header: 'Jenis', key: 'jenis', width: 18 },
        { header: 'Kategori', key: 'kategori', width: 28 },
        { header: 'Deskripsi', key: 'deskripsi', width: 46 },
        { header: 'Pemasukan', key: 'pemasukan', width: 18 },
        { header: 'Pengeluaran', key: 'pengeluaran', width: 18 },
        { header: 'Saldo Berjalan', key: 'saldo', width: 20 },
        { header: 'Status', key: 'status', width: 14 },
      ]

      sheet.mergeCells('A1:H1')
      sheet.getCell('A1').value = 'BIMBINGAN BELAJAR CBS SALAMAN'
      sheet.getCell('A1').font = { bold: true, size: 17, color: { argb: 'FFFFFFFF' } }
      sheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF063D27' } }
      sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }

      sheet.mergeCells('A2:H2')
      sheet.getCell('A2').value = `Laporan Pemasukan & Pengeluaran - ${formatDate(new Date().toISOString())}`
      sheet.getCell('A2').font = { bold: true, color: { argb: 'FF334155' } }
      sheet.getCell('A2').alignment = { horizontal: 'center' }

      const summary = [
        ['A4', 'B4', 'TOTAL PEMASUKAN', totalPemasukan, 'FFEAF6FA', 'FF047857'],
        ['C4', 'D4', 'TOTAL PENGELUARAN', totalPengeluaran, 'FFFFE4E6', 'FFDC2626'],
        ['E4', 'F4', 'SALDO SAAT INI', saldoBersih, 'FFFFF2CC', saldoBersih >= 0 ? 'FF063D27' : 'FFDC2626'],
        ['G4', 'H4', 'TOTAL TUNGGAKAN', totalTunggakan, 'FFFFFFE8', 'FFC2410C'],
      ] as const

      summary.forEach(([labelCellKey, valueCellKey, label, value, bg, color]) => {
        const labelCell = sheet.getCell(labelCellKey)
        const valueCell = sheet.getCell(valueCellKey)

        labelCell.value = label
        valueCell.value = Number(value || 0)
        valueCell.numFmt = '"Rp"#,##0;-"Rp"#,##0'

        ;[labelCell, valueCell].forEach((cell) => {
          cell.font = { bold: true, color: { argb: color } }
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }
        })
      })

      const headerRow = sheet.getRow(8)
      headerRow.values = [
        'Tanggal',
        'Jenis',
        'Kategori',
        'Deskripsi',
        'Pemasukan',
        'Pengeluaran',
        'Saldo Berjalan',
        'Status',
      ]

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF063D27' } }
        cell.alignment = { horizontal: 'center', vertical: 'middle' }
      })

      const sorted = [...transaksiList].sort((a, b) => a.tanggal.localeCompare(b.tanggal))
      let runningBalance = 0

      sorted.forEach((trx, index) => {
        const rowNumber = 9 + index
        const pemasukan = trx.jenis === 'pemasukan' ? Number(trx.nominal || 0) : 0
        const pengeluaran = trx.jenis === 'pengeluaran' ? Number(trx.nominal || 0) : 0

        runningBalance += pemasukan - pengeluaran

        const row = sheet.getRow(rowNumber)

        row.values = [
          trx.tanggal,
          trx.jenis.toUpperCase(),
          trx.sub_kategori || trx.kategori,
          trx.deskripsi || '-',
          pemasukan,
          pengeluaran,
          runningBalance,
          runningBalance >= 0 ? 'AMAN' : 'MINUS',
        ]

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }
        })

        row.getCell(5).numFmt = '"Rp"#,##0'
        row.getCell(6).numFmt = '"Rp"#,##0'
        row.getCell(7).numFmt = '"Rp"#,##0;-"Rp"#,##0'
        row.getCell(7).font = { bold: true, color: { argb: runningBalance >= 0 ? 'FF047857' : 'FFDC2626' } }
      })

      const finalRowNumber = Math.max(10, sorted.length + 11)
      const finalRow = sheet.getRow(finalRowNumber)

      finalRow.values = ['', '', '', 'SALDO SAAT INI', '', '', saldoBersih, saldoBersih >= 0 ? 'AMAN' : 'MINUS']
      finalRow.getCell(7).numFmt = '"Rp"#,##0;-"Rp"#,##0'

      finalRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12, color: { argb: 'FF063D27' } }
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF2CC' } }
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = url
      link.download = `laporan-dana-cbs-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setMessage('Laporan Excel berhasil didownload.')
    } catch (error) {
      console.error(error)
      setMessage(error instanceof Error ? `Gagal download Excel: ${error.message}` : 'Gagal download Excel.')
    } finally {
      setSaving(false)
    }
  }

  async function handleResetReport() {
    const firstConfirm = window.confirm(
      'PERINGATAN! Semua data laporan pemasukan dan pengeluaran akan dihapus. Tagihan SPP tidak ikut dihapus. Lanjutkan?'
    )

    if (!firstConfirm) return

    const secondConfirm = window.confirm('Yakin sekali? Tindakan ini tidak bisa dibatalkan.')
    if (!secondConfirm) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('transaksi_dana')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Semua laporan pemasukan dan pengeluaran berhasil direset.')
    setSaving(false)
    loadData()
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7]">
      <section className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1440px] space-y-5">
          <section className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6 lg:p-7">
            <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[26px] bg-[#F3F8F1] p-6 sm:p-7">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-4 py-2 text-xs font-black text-[#063D27]">
                  <Sparkles className="h-4 w-4" />
                  Admin CBS System
                </div>

                <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl lg:text-5xl">
                  Dana & Keuangan
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                  Kelola invoice, cicilan SPP cash, pemasukan, pengeluaran, gaji tutor,
                  tunggakan, dan laporan Excel dengan tampilan yang lebih tenang.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={loadData}
                    disabled={loading}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:bg-slate-300"
                  >
                    <RefreshCcw className="h-4 w-4" />
                    Refresh Data
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExcelReport}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-5 text-sm font-black text-white transition hover:bg-[#7C3AED] disabled:bg-slate-300"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Download Excel
                  </button>
                </div>
              </div>

              <div className="rounded-[26px] border border-[#E7EFE6] bg-[#FFFDE8] p-6 sm:p-7">
                <p className="text-sm font-bold text-slate-500">Saldo Saat Ini</p>

                <h2 className="mt-3 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                  {formatCurrency(saldoBersih)}
                </h2>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  <MiniHeroStat label="Pemasukan" value={formatCurrency(totalPemasukan)} />
                  <MiniHeroStat label="Pengeluaran" value={formatCurrency(totalPengeluaran)} />
                  <MiniHeroStat label="Tunggakan" value={formatCurrency(totalTunggakan)} />
                  <MiniHeroStat label="Gaji Tutor" value={formatCurrency(totalGajiTutor)} />
                </div>
              </div>
            </div>
          </section>

          {message && (
            <div className="rounded-[22px] border border-[#F3E8A6] bg-[#FFFDE8] px-5 py-4 text-sm font-bold text-[#063D27]">
              {message}
            </div>
          )}

          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <SummaryCard title="Total Tagihan" value={formatCurrency(totalTagihan)} icon={<ReceiptText />} color="blue" />
            <SummaryCard title="Pemasukan" value={formatCurrency(totalPemasukan)} icon={<Banknote />} color="green" />
            <SummaryCard title="Tunggakan" value={formatCurrency(totalTunggakan)} icon={<Clock />} color="yellow" />
            <SummaryCard title="Pengeluaran" value={formatCurrency(totalPengeluaran)} icon={<Wallet />} color="red" />
            <SummaryCard title="Gaji Tutor" value={formatCurrency(totalGajiTutor)} icon={<UserRound />} color="cream" />
            <SummaryCard title="Saldo Saat Ini" value={formatCurrency(saldoBersih)} icon={<Coins />} color="highlight" />
          </section>

          <section className="grid gap-3 md:grid-cols-2">
            <StatusPillCard title="Status Lunas" value={`${totalLunas} Tagihan`} type="success" />
            <StatusPillCard title="Belum Lunas / Cicilan" value={`${totalBelumLunas} Tagihan`} type="danger" />
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="panel-card overflow-hidden">
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
                  <div className="section-kicker">Tagihan Siswa</div>
                  <h2 className="section-title">Pembayaran & Cicilan Cash</h2>
                  <p className="section-desc">
                    Pilih murid terlebih dahulu. Tagihan disembunyikan secara default agar halaman tetap rapi.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetAllSpp}
                  disabled={saving || sppList.length === 0}
                  className="danger-button"
                >
                  <Trash2 className="h-4 w-4" />
                  Reset Semua SPP
                </button>
              </div>

              <div className="mb-4 grid gap-3 lg:grid-cols-[1fr_1fr_auto]">
                <div className="select-shell">
                  <select
                    value={filterSiswaId}
                    onChange={(e) => {
                      setFilterSiswaId(e.target.value)
                      setSearch('')
                    }}
                    className="clean-select"
                  >
                    <option value="">Pilih murid untuk melihat tagihan</option>
                    {siswaList.map((siswa) => (
                      <option key={siswa.id} value={siswa.id}>
                        {siswa.nama} - {siswa.kelas}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#063D27]" />
                </div>

                <div className="search-shell">
                  <Search className="h-4 w-4 text-slate-400" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari invoice/periode..."
                    disabled={!filterSiswaId}
                    className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFilterSiswaId('')
                    setSearch('')
                  }}
                  className="soft-button"
                >
                  Reset
                </button>
              </div>

              {selectedStudent && (
                <div className="mb-4 rounded-[22px] border border-[#E7EFE6] bg-[#F8FAF7] px-5 py-4">
                  <p className="text-sm font-black text-[#063D27]">
                    Murid terpilih: {selectedStudent.nama}
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Kelas: {selectedStudent.kelas} · Sekolah: {selectedStudent.sekolah || '-'}
                  </p>
                </div>
              )}

              <div className="overflow-x-auto rounded-[24px] border border-[#E7EFE6]">
                <table className="w-full min-w-[1180px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#F3F8F1] text-xs uppercase tracking-wide text-[#063D27]">
                      <th className="px-4 py-4">Invoice</th>
                      <th className="px-4 py-4">Siswa</th>
                      <th className="px-4 py-4">Periode</th>
                      <th className="px-4 py-4">Tagihan</th>
                      <th className="px-4 py-4">Dibayar</th>
                      <th className="px-4 py-4">Sisa</th>
                      <th className="px-4 py-4">Status</th>
                      <th className="px-4 py-4">Bayar/Cicil</th>
                      <th className="px-4 py-4">Aksi</th>
                    </tr>
                  </thead>

                  <tbody className="bg-white">
                    {loading ? (
                      <EmptyRow colSpan={9} title="Loading data..." />
                    ) : !filterSiswaId ? (
                      <EmptyRow colSpan={9} title="Pilih murid terlebih dahulu" desc="Tagihan siswa disembunyikan secara default." />
                    ) : filteredSpp.length === 0 ? (
                      <EmptyRow colSpan={9} title="Tagihan murid ini belum ada." />
                    ) : (
                      filteredSpp.map((spp) => {
                        const sisa = Math.max(Number(spp.nominal) - Number(spp.dibayar || 0), 0)

                        return (
                          <tr key={spp.id} className="border-b border-[#EEF3EC] hover:bg-[#FAFCF9]">
                            <td className="px-4 py-4 font-black text-[#063D27]">{spp.invoice_no || '-'}</td>

                            <td className="px-4 py-4">
                              <p className="font-black text-slate-800">{spp.siswa?.nama || '-'}</p>
                              <p className="text-xs font-semibold text-slate-400">{spp.siswa?.kelas || '-'}</p>
                            </td>

                            <td className="px-4 py-4 font-semibold text-slate-500">
                              {monthNames[spp.bulan]} {spp.tahun}
                            </td>

                            <td className="px-4 py-4 font-black text-slate-800">{formatCurrency(spp.nominal)}</td>
                            <td className="px-4 py-4 font-black text-emerald-700">{formatCurrency(spp.dibayar || 0)}</td>
                            <td className="px-4 py-4 font-black text-red-600">{formatCurrency(sisa)}</td>

                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-black ring-1 ${
                                  spp.status === 'lunas'
                                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                                    : 'bg-red-50 text-red-700 ring-red-200'
                                }`}
                              >
                                {spp.status === 'lunas' ? 'Lunas' : 'Belum Lunas'}
                              </span>
                            </td>

                            <td className="px-4 py-4">
                              {spp.status === 'belum' ? (
                                <div className="flex gap-2">
                                  <input
                                    type="number"
                                    min={1}
                                    max={sisa}
                                    value={paymentInputs[spp.id] || ''}
                                    onChange={(e) =>
                                      setPaymentInputs((prev) => ({
                                        ...prev,
                                        [spp.id]: e.target.value,
                                      }))
                                    }
                                    placeholder={`Sisa ${formatCurrency(sisa)}`}
                                    className="h-10 w-40 rounded-full border border-[#DDE9DB] bg-white px-4 text-xs font-bold outline-none focus:border-[#063D27] focus:ring-4 focus:ring-[#063D27]/10"
                                  />

                                  <button
                                    type="button"
                                    onClick={() => handleAddSppPayment(spp)}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1 rounded-full bg-[#063D27] px-4 py-2 text-xs font-black text-white hover:bg-[#0B5738] disabled:bg-slate-300"
                                  >
                                    <CheckCircle2 className="h-4 w-4" />
                                    Simpan
                                  </button>
                                </div>
                              ) : (
                                <span className="text-xs font-black text-emerald-700">Sudah lunas</span>
                              )}
                            </td>

                            <td className="px-4 py-4">
                              <div className="flex flex-wrap gap-2">
                                {Number(spp.dibayar || 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleResetSppPayment(spp)}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1 rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 hover:bg-red-100 disabled:bg-slate-100 disabled:text-slate-400"
                                  >
                                    <Undo2 className="h-4 w-4" />
                                    Reset
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDownloadInvoice(spp)}
                                  disabled={saving}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#8B5CF6] px-4 py-2 text-xs font-black text-white hover:bg-[#7C3AED] disabled:bg-slate-300"
                                >
                                  <Download className="h-4 w-4" />
                                  Invoice
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-5">
              <FormCard title="Generate Invoice" desc="Membuat tagihan baru di table SPP." icon={<Plus className="h-5 w-5" />} onSubmit={handleGenerateInvoice} buttonText="Generate Invoice" buttonClass="primary-submit">
                <Field label="Siswa">
                  <select value={selectedSiswaId} onChange={(e) => setSelectedSiswaId(e.target.value)} className="input-style">
                    <option value="">Pilih siswa</option>
                    {siswaList.map((siswa) => (
                      <option key={siswa.id} value={siswa.id}>
                        {siswa.nama} - {siswa.kelas}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bulan">
                    <select value={bulan} onChange={(e) => setBulan(e.target.value)} className="input-style">
                      {monthNames.slice(1).map((name, index) => (
                        <option key={name} value={index + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tahun">
                    <input value={tahun} onChange={(e) => setTahun(e.target.value)} className="input-style" />
                  </Field>
                </div>

                <Field label="Nominal">
                  <input type="number" value={nominal} onChange={(e) => setNominal(e.target.value)} className="input-style" />
                </Field>

                <Field label="Keterangan">
                  <input value={keterangan} onChange={(e) => setKeterangan(e.target.value)} placeholder="Opsional, contoh: Paket UTBK" className="input-style" />
                </Field>
              </FormCard>

              <FormCard title="Pemasukan" desc="Tambah pemasukan manual selain pembayaran SPP." icon={<Banknote className="h-5 w-5" />} onSubmit={handleAddIncome} buttonText="Simpan Pemasukan" buttonClass="income-submit">
                <Field label="Kategori Pemasukan">
                  <select value={incomeCategory} onChange={(e) => setIncomeCategory(e.target.value)} className="input-style">
                    <option value="">Pilih kategori</option>
                    {incomeCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nominal">
                  <input type="number" value={incomeNominal} onChange={(e) => setIncomeNominal(e.target.value)} className="input-style" />
                </Field>

                <Field label="Deskripsi">
                  <input value={incomeDesc} onChange={(e) => setIncomeDesc(e.target.value)} placeholder="Opsional" className="input-style" />
                </Field>
              </FormCard>

              <FormCard title="Pengeluaran" desc="Pilih kategori pengeluaran sesuai kebutuhan laporan." icon={<Wallet className="h-5 w-5" />} onSubmit={handleAddExpense} buttonText="Simpan Pengeluaran" buttonClass="expense-submit">
                <Field label="Kategori Pengeluaran">
                  <select value={expenseCategory} onChange={(e) => setExpenseCategory(e.target.value)} className="input-style">
                    <option value="">Pilih kategori</option>
                    {expenseCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nominal">
                  <input type="number" value={expenseNominal} onChange={(e) => setExpenseNominal(e.target.value)} className="input-style" />
                </Field>

                <Field label="Deskripsi">
                  <input value={expenseDesc} onChange={(e) => setExpenseDesc(e.target.value)} placeholder="Opsional" className="input-style" />
                </Field>
              </FormCard>

              <FormCard title="Gaji Tutor" desc="Dicatat ke table honor dan masuk laporan pengeluaran." icon={<UserRound className="h-5 w-5" />} onSubmit={handlePayTutor} buttonText="Bayar Gaji Tutor" buttonClass="primary-submit">
                <Field label="Tutor">
                  <select value={selectedTentorId} onChange={(e) => setSelectedTentorId(e.target.value)} className="input-style">
                    <option value="">Pilih tutor</option>
                    {tentorList.map((tentor) => (
                      <option key={tentor.id} value={tentor.id}>
                        {tentor.full_name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Nominal Gaji">
                  <input type="number" value={honorNominal} onChange={(e) => setHonorNominal(e.target.value)} className="input-style" />
                </Field>

                <Field label="Catatan">
                  <input value={honorDesc} onChange={(e) => setHonorDesc(e.target.value)} placeholder="Opsional" className="input-style" />
                </Field>
              </FormCard>
            </div>
          </section>

          <section className="panel-card">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="section-kicker">Laporan</div>
                <h2 className="section-title">Pemasukan & Pengeluaran</h2>
                <p className="section-desc">
                  Saldo saat ini:{' '}
                  <b className={saldoBersih >= 0 ? 'text-[#063D27]' : 'text-red-600'}>
                    {formatCurrency(saldoBersih)}
                  </b>
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleDownloadExcelReport} disabled={saving} className="excel-button">
                  <FileSpreadsheet className="h-4 w-4" />
                  Download Excel
                </button>

                <button type="button" onClick={handleResetReport} disabled={saving || transaksiList.length === 0} className="danger-button">
                  <Trash2 className="h-4 w-4" />
                  Reset Laporan
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-[24px] border border-[#E7EFE6]">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr className="bg-[#F3F8F1] text-xs uppercase tracking-wide text-[#063D27]">
                    <th className="px-4 py-4">Tanggal</th>
                    <th className="px-4 py-4">Jenis</th>
                    <th className="px-4 py-4">Kategori</th>
                    <th className="px-4 py-4">Nominal</th>
                    <th className="px-4 py-4">Deskripsi</th>
                  </tr>
                </thead>

                <tbody className="bg-white">
                  {transaksiList.length === 0 ? (
                    <EmptyRow colSpan={5} title="Belum ada transaksi." />
                  ) : (
                    transaksiList.map((trx) => (
                      <tr key={trx.id} className="border-b border-[#EEF3EC] hover:bg-[#FAFCF9]">
                        <td className="px-4 py-4 font-semibold text-slate-500">{trx.tanggal}</td>

                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-black ${
                              trx.jenis === 'pemasukan'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {trx.jenis}
                          </span>
                        </td>

                        <td className="px-4 py-4 font-semibold text-slate-500">
                          {trx.sub_kategori || trx.kategori}
                        </td>

                        <td className={`px-4 py-4 font-black ${trx.jenis === 'pemasukan' ? 'text-[#063D27]' : 'text-red-600'}`}>
                          {trx.jenis === 'pemasukan' ? '+' : '-'}
                          {formatCurrency(trx.nominal)}
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-500">{trx.deskripsi || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </section>

      <style jsx global>{`
        .panel-card {
          border-radius: 28px;
          border: 1px solid #e7efe6;
          background: #ffffff;
          padding: 1.25rem;
        }

        @media (min-width: 640px) {
          .panel-card {
            padding: 1.5rem;
          }
        }

        .section-kicker {
          display: inline-flex;
          border-radius: 999px;
          background: #f3f8f1;
          border: 1px solid #e7efe6;
          padding: 0.4rem 0.8rem;
          font-size: 0.72rem;
          font-weight: 900;
          color: #063d27;
          margin-bottom: 0.75rem;
        }

        .section-title {
          color: #063d27;
          font-size: 1.25rem;
          line-height: 1.2;
          font-weight: 950;
        }

        .section-desc {
          margin-top: 0.45rem;
          color: #64748b;
          font-size: 0.875rem;
          line-height: 1.65;
          font-weight: 500;
        }

        .input-style {
          height: 2.85rem;
          width: 100%;
          border-radius: 999px;
          border: 1px solid #dde9db;
          background: #ffffff;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 650;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .input-style:focus {
          border-color: #063d27;
          box-shadow: 0 0 0 4px rgba(6, 61, 39, 0.08);
        }

        .select-shell {
          position: relative;
          height: 2.85rem;
        }

        .clean-select {
          height: 2.85rem;
          width: 100%;
          appearance: none;
          border-radius: 999px;
          border: 1px solid #dde9db;
          background: white;
          padding: 0 2.5rem 0 1rem;
          color: #334155;
          font-size: 0.875rem;
          font-weight: 800;
          outline: none;
        }

        .clean-select:focus {
          border-color: #063d27;
          box-shadow: 0 0 0 4px rgba(6, 61, 39, 0.08);
        }

        .search-shell {
          display: flex;
          height: 2.85rem;
          align-items: center;
          gap: 0.65rem;
          border-radius: 999px;
          border: 1px solid #dde9db;
          background: white;
          padding: 0 1rem;
        }

        .soft-button {
          height: 2.85rem;
          border-radius: 999px;
          background: #f3f8f1;
          border: 1px solid #e7efe6;
          padding: 0 1.25rem;
          color: #063d27;
          font-size: 0.875rem;
          font-weight: 900;
          transition: 0.2s ease;
        }

        .soft-button:hover {
          background: #eaf3e8;
        }

        .danger-button {
          display: inline-flex;
          height: 2.7rem;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 999px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          padding: 0 1.1rem;
          color: #b91c1c;
          font-size: 0.825rem;
          font-weight: 900;
          transition: 0.2s ease;
        }

        .danger-button:hover {
          background: #fee2e2;
        }

        .danger-button:disabled {
          background: #f1f5f9;
          border-color: #e2e8f0;
          color: #94a3b8;
        }

        .excel-button {
          display: inline-flex;
          height: 2.7rem;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          border-radius: 999px;
          background: #8b5cf6;
          padding: 0 1.1rem;
          color: white;
          font-size: 0.825rem;
          font-weight: 950;
          transition: 0.2s ease;
        }

        .excel-button:hover {
          background: #7c3aed;
        }

        .excel-button:disabled {
          background: #cbd5e1;
        }

        .primary-submit,
        .income-submit,
        .expense-submit {
          margin-top: 1.15rem;
          height: 2.9rem;
          width: 100%;
          border-radius: 999px;
          font-size: 0.875rem;
          font-weight: 950;
          transition: 0.2s ease;
        }

        .primary-submit {
          background: #063d27;
          color: white;
        }

        .primary-submit:hover {
          background: #0b5738;
        }

        .income-submit {
          background: #f3f8f1;
          border: 1px solid #dbe9d8;
          color: #063d27;
        }

        .income-submit:hover {
          background: #eaf3e8;
        }

        .expense-submit {
          background: #fffde8;
          border: 1px solid #f3e8a6;
          color: #063d27;
        }

        .expense-submit:hover {
          background: #fff8c7;
        }

        .primary-submit:disabled,
        .income-submit:disabled,
        .expense-submit:disabled {
          background: #cbd5e1;
          color: white;
        }
      `}</style>
    </main>
  )
}

function SummaryCard({
  title,
  value,
  icon,
  color,
}: {
  title: string
  value: string
  icon: ReactNode
  color: 'blue' | 'green' | 'yellow' | 'red' | 'cream' | 'highlight'
}) {
  const styleMap = {
    blue: 'bg-[#F0FAFD] text-[#063D27] border-[#D8EEF5]',
    green: 'bg-[#F3F8F1] text-[#063D27] border-[#DDE9DB]',
    yellow: 'bg-[#FFFDE8] text-[#063D27] border-[#F3E8A6]',
    red: 'bg-[#FFF7F7] text-red-700 border-red-100',
    cream: 'bg-white text-[#063D27] border-[#E7EFE6]',
    highlight: 'bg-[#FAF5FF] text-[#5B21B6] border-[#E9D5FF]',
  }

  return (
    <div className={`rounded-[24px] border p-4 ${styleMap[color]}`}>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white/80 text-current">
        <div className="h-5 w-5">{icon}</div>
      </div>

      <p className="text-xs font-black uppercase tracking-wide opacity-65">{title}</p>
      <h3 className="mt-2 text-lg font-black tracking-tight">{value}</h3>
    </div>
  )
}

function MiniHeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#E7EFE6] bg-white p-4">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-black text-[#063D27]">{value}</p>
    </div>
  )
}

function StatusPillCard({
  title,
  value,
  type,
}: {
  title: string
  value: string
  type: 'success' | 'danger'
}) {
  return (
    <div className="rounded-[24px] border border-[#E7EFE6] bg-white p-5">
      <p className="text-sm font-black text-slate-500">{title}</p>
      <h3
        className={`mt-2 text-2xl font-black ${
          type === 'success' ? 'text-[#063D27]' : 'text-red-700'
        }`}
      >
        {value}
      </h3>
    </div>
  )
}

function EmptyRow({
  colSpan,
  title,
  desc,
}: {
  colSpan: number
  title: string
  desc?: string
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-10 text-center">
        <div className="mx-auto max-w-md rounded-[24px] border border-[#E7EFE6] bg-[#F8FAF7] p-6">
          <p className="text-base font-black text-[#063D27]">{title}</p>
          {desc && <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{desc}</p>}
        </div>
      </td>
    </tr>
  )
}

function FormCard({
  title,
  desc,
  icon,
  onSubmit,
  buttonText,
  buttonClass,
  children,
}: {
  title: string
  desc: string
  icon: ReactNode
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  buttonText: string
  buttonClass: string
  children: ReactNode
}) {
  return (
    <form onSubmit={onSubmit} className="panel-card">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-black text-[#063D27]">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{desc}</p>
        </div>
      </div>

      {children}

      <button type="submit" className={buttonClass}>
        {buttonText}
      </button>
    </form>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="mt-3">
      <label className="mb-1.5 block text-sm font-black text-[#063D27]">{label}</label>
      {children}
    </div>
  )
}