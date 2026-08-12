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
type SppReportFilter = 'semua' | 'lunas' | 'cicilan' | 'belum' | 'menunggak'
type SppReportPaymentStatus = 'lunas' | 'cicilan' | 'belum'
type JenisKelas = 'Reguler' | 'UTBK' | 'Intensif'
type JenisKelasFilter = 'semua' | JenisKelas

type FamilyInvoiceItemForm = {
  clientId: string
  siswa_id: string
  nama_item: string
  bulan: string
  tahun: string
  qty: string
  harga_satuan: string
}

type FamilyInvoiceSppRef = {
  id: string
  dibayar: number
  status: SppStatus
  tanggal_bayar: string | null
}

type FamilyInvoiceItemRow = {
  id: string
  siswa_id: string
  spp_id: string | null
  nama_item: string
  periode: string | null
  qty: number
  harga_satuan: number
  gross_total: number
  discount_allocated: number
  net_total: number
  urutan: number
  siswa?: SiswaRow | null
  spp?: FamilyInvoiceSppRef | null
}

type FamilyInvoiceRow = {
  id: string
  invoice_no: string
  ortu_id: string | null
  tagih_kepada: string
  tanggal_invoice: string
  tanggal_jatuh_tempo: string | null
  subtotal: number
  diskon: number
  total: number
  catatan: string | null
  created_at: string
  items?: FamilyInvoiceItemRow[] | null
}

type SppReportRow = {
  siswaId: string
  nama: string
  kelas: string
  jenisKelas: JenisKelas
  sekolah: string | null
  jumlahInvoice: number
  invoiceNumbers: string[]
  nominal: number
  dibayar: number
  sisa: number
  status: SppReportPaymentStatus
  tanggalBayarTerakhir: string | null
  keterangan: string[]
}

type SiswaRow = {
  id: string
  nama: string
  kelas: string
  jenis_kelas: JenisKelas | null
  sekolah: string | null
  ortu_id: string | null
  nama_ortu: string | null
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
  family_invoice_id: string | null
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

const jenisKelasOptions: JenisKelas[] = ['Reguler', 'UTBK', 'Intensif']

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
  'Paket Intensif',
  'Pemasukan Lain-lain',
]


function normalizeJenisKelas(value?: string | null): JenisKelas {
  if (value === 'UTBK' || value === 'Intensif') return value
  return 'Reguler'
}

function getJenisKelasFilterLabel(value: JenisKelasFilter) {
  return value === 'semua' ? 'Semua Jenis Kelas' : value
}

function formatCurrency(value: number) {
  const numberValue = Number(value || 0)
  const isNegative = numberValue < 0
  const absoluteValue = Math.abs(numberValue)

  const formattedNumber = String(Math.round(absoluteValue)).replace(
    /\B(?=(\d{3})+(?!\d))/g,
    '.'
  )

  return `${isNegative ? '-' : ''}Rp${formattedNumber}`
}

function formatDate(date?: string | null) {
  if (!date) return '-'

  return new Date(date).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function generateInvoiceNo(index?: number) {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  const random = Math.floor(Math.random() * 9000) + 1000
  const suffix = typeof index === 'number' ? `-${String(index + 1).padStart(3, '0')}` : ''

  return `INV-${date}-${random}${suffix}`
}

function safeFileName(value: string) {
  return value
    .toLowerCase()
    .replaceAll(' ', '-')
    .replace(/[^a-z0-9-]/g, '')
}

function getSppReportStatus(nominal: number, dibayar: number): SppReportPaymentStatus {
  if (dibayar <= 0) return 'belum'
  if (dibayar < nominal) return 'cicilan'
  return 'lunas'
}

function getSppReportStatusLabel(status: SppReportPaymentStatus) {
  if (status === 'lunas') return 'Lunas'
  if (status === 'cicilan') return 'Cicilan'
  return 'Belum Bayar'
}

function getSppReportFilterLabel(filter: SppReportFilter) {
  if (filter === 'lunas') return 'Lunas'
  if (filter === 'cicilan') return 'Cicilan'
  if (filter === 'belum') return 'Belum Bayar'
  if (filter === 'menunggak') return 'Menunggak'
  return 'Semua Status'
}


function getLocalDateInputValue(date = new Date()) {
  const offset = date.getTimezoneOffset()
  const localDate = new Date(date.getTime() - offset * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function getDefaultDueDateInputValue(days = 30) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return getLocalDateInputValue(date)
}

function createEmptyFamilyInvoiceItem(): FamilyInvoiceItemForm {
  return {
    clientId: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    siswa_id: '',
    nama_item: '',
    bulan: String(new Date().getMonth() + 1),
    tahun: String(new Date().getFullYear()),
    qty: '1',
    harga_satuan: '',
  }
}

function formatInvoiceCurrency(value: number) {
  const numericValue = Number(value || 0)
  const negative = numericValue < 0
  const [whole, decimals] = Math.abs(numericValue).toFixed(2).split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')

  return `${negative ? '-' : ''}Rp${grouped}.${decimals}`
}

async function loadPublicImageAsDataUrl(path: string) {
  const response = await fetch(path)

  if (!response.ok) {
    throw new Error(`Gambar ${path} tidak ditemukan.`)
  }

  const blob = await response.blob()

  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error(`Gagal membaca gambar ${path}.`))
    reader.readAsDataURL(blob)
  })
}

export default function AdminDanaPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [familyMessage, setFamilyMessage] = useState('')

  const [sppList, setSppList] = useState<SppRow[]>([])
  const [siswaList, setSiswaList] = useState<SiswaRow[]>([])
  const [tentorList, setTentorList] = useState<ProfileRow[]>([])
  const [transaksiList, setTransaksiList] = useState<TransaksiRow[]>([])

  const [search, setSearch] = useState('')
  const [filterJenisKelas, setFilterJenisKelas] = useState<JenisKelasFilter>('semua')
  const [filterSiswaId, setFilterSiswaId] = useState('')
  const [paymentInputs, setPaymentInputs] = useState<Record<string, string>>({})

  // Faktur keluarga: satu faktur dapat berisi banyak anak dan banyak item.
  const [familyTagihKepada, setFamilyTagihKepada] = useState('')
  const [familyTanggalInvoice, setFamilyTanggalInvoice] = useState(getLocalDateInputValue())
  const [familyJatuhTempo, setFamilyJatuhTempo] = useState(getDefaultDueDateInputValue())
  const [familyDiskon, setFamilyDiskon] = useState('0')
  const [familyCatatan, setFamilyCatatan] = useState('')
  const [familyItems, setFamilyItems] = useState<FamilyInvoiceItemForm[]>([
    createEmptyFamilyInvoiceItem(),
  ])

  // State lama tetap dipakai untuk generate tagihan massal.
  const [invoiceJenisKelas, setInvoiceJenisKelas] = useState<JenisKelasFilter>('semua')
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

  const [reportBulan, setReportBulan] = useState(String(new Date().getMonth() + 1))
  const [reportTahun, setReportTahun] = useState(String(new Date().getFullYear()))
  const [reportStatus, setReportStatus] = useState<SppReportFilter>('semua')
  const [reportJenisKelas, setReportJenisKelas] = useState<JenisKelasFilter>('semua')

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
          family_invoice_id,
          created_at,
          siswa:siswa_id (
            id,
            nama,
            kelas,
            jenis_kelas,
            sekolah
          )
        `
        )
        .order('created_at', { ascending: false }),

      supabase
        .from('siswa')
        .select('id, nama, kelas, jenis_kelas, sekolah, ortu_id, nama_ortu')
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

  const siswaByPaymentType = useMemo(
    () =>
      siswaList.filter(
        (siswa) =>
          filterJenisKelas === 'semua' || normalizeJenisKelas(siswa.jenis_kelas) === filterJenisKelas
      ),
    [filterJenisKelas, siswaList]
  )

  const siswaByInvoiceType = useMemo(
    () =>
      siswaList.filter(
        (siswa) =>
          invoiceJenisKelas === 'semua' || normalizeJenisKelas(siswa.jenis_kelas) === invoiceJenisKelas
      ),
    [invoiceJenisKelas, siswaList]
  )

  const jenisKelasCounts = useMemo(
    () =>
      siswaList.reduce(
        (counts, siswa) => {
          counts[normalizeJenisKelas(siswa.jenis_kelas)] += 1
          return counts
        },
        { Reguler: 0, UTBK: 0, Intensif: 0 } as Record<JenisKelas, number>
      ),
    [siswaList]
  )

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
        normalizeJenisKelas(item.siswa?.jenis_kelas).toLowerCase().includes(keyword) ||
        item.keterangan?.toLowerCase().includes(keyword) ||
        String(item.tahun).includes(keyword) ||
        monthNames[item.bulan]?.toLowerCase().includes(keyword)

      return matchSiswa && matchSearch
    })
  }, [sppList, search, filterSiswaId])

  const selectedStudent = siswaList.find((siswa) => siswa.id === filterSiswaId)

  const monthlySppRows = useMemo(() => {
    const selectedMonth = Number(reportBulan)
    const selectedYear = Number(reportTahun)
    const studentMap = new Map(siswaList.map((siswa) => [siswa.id, siswa]))
    const grouped = new Map<string, Omit<SppReportRow, 'status' | 'sisa'>>()

    sppList
      .filter((item) => item.bulan === selectedMonth && item.tahun === selectedYear)
      .forEach((item) => {
        if (!item.siswa_id) return

        const student = item.siswa ?? studentMap.get(item.siswa_id) ?? null
        const current = grouped.get(item.siswa_id) ?? {
          siswaId: item.siswa_id,
          nama: student?.nama ?? 'Siswa tidak ditemukan',
          kelas: student?.kelas ?? '-',
          jenisKelas: normalizeJenisKelas(student?.jenis_kelas),
          sekolah: student?.sekolah ?? null,
          jumlahInvoice: 0,
          invoiceNumbers: [],
          nominal: 0,
          dibayar: 0,
          tanggalBayarTerakhir: null,
          keterangan: [],
        }

        current.jumlahInvoice += 1
        current.nominal += Number(item.nominal || 0)
        current.dibayar += Number(item.dibayar || 0)

        if (item.invoice_no) {
          current.invoiceNumbers.push(item.invoice_no)
        }

        if (item.keterangan) {
          current.keterangan.push(item.keterangan)
        }

        if (
          item.tanggal_bayar &&
          (!current.tanggalBayarTerakhir || item.tanggal_bayar > current.tanggalBayarTerakhir)
        ) {
          current.tanggalBayarTerakhir = item.tanggal_bayar
        }

        grouped.set(item.siswa_id, current)
      })

    return Array.from(grouped.values())
      .map((row): SppReportRow => {
        const sisa = Math.max(row.nominal - row.dibayar, 0)

        return {
          ...row,
          invoiceNumbers: Array.from(new Set(row.invoiceNumbers)),
          keterangan: Array.from(new Set(row.keterangan)),
          sisa,
          status: getSppReportStatus(row.nominal, row.dibayar),
        }
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, 'id-ID'))
  }, [reportBulan, reportTahun, siswaList, sppList])

  const monthlySppRowsByClass = useMemo(
    () =>
      monthlySppRows.filter(
        (row) => reportJenisKelas === 'semua' || row.jenisKelas === reportJenisKelas
      ),
    [monthlySppRows, reportJenisKelas]
  )

  const filteredMonthlySppRows = useMemo(() => {
    if (reportStatus === 'semua') return monthlySppRowsByClass
    if (reportStatus === 'menunggak') return monthlySppRowsByClass.filter((row) => row.sisa > 0)

    return monthlySppRowsByClass.filter((row) => row.status === reportStatus)
  }, [monthlySppRowsByClass, reportStatus])

  const monthlySppSummary = useMemo(
    () =>
      monthlySppRowsByClass.reduce(
        (summary, row) => {
          summary.totalTagihan += row.nominal
          summary.totalDibayar += row.dibayar
          summary.totalTunggakan += row.sisa
          summary[row.status] += 1
          return summary
        },
        {
          totalTagihan: 0,
          totalDibayar: 0,
          totalTunggakan: 0,
          lunas: 0,
          cicilan: 0,
          belum: 0,
        }
      ),
    [monthlySppRowsByClass]
  )

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

  async function handleUpdateStudentJenisKelas(studentId: string, jenisKelas: JenisKelas) {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('siswa')
      .update({ jenis_kelas: jenisKelas })
      .eq('id', studentId)

    if (error) {
      setMessage(`Gagal memperbarui jenis kelas: ${error.message}`)
      setSaving(false)
      return
    }

    setMessage(`Jenis kelas siswa berhasil diubah menjadi ${jenisKelas}.`)
    setSaving(false)
    loadData()
  }

  const familySubtotal = familyItems.reduce((total, item) => {
    const qty = Number(item.qty || 0)
    const harga = Number(item.harga_satuan || 0)
    return total + qty * harga
  }, 0)

  const familyDiscountNumber = Math.max(Number(familyDiskon || 0), 0)
  const familyTotal = Math.max(familySubtotal - familyDiscountNumber, 0)

  function updateFamilyItem(
    clientId: string,
    field: keyof Omit<FamilyInvoiceItemForm, 'clientId'>,
    value: string
  ) {
    setFamilyItems((current) =>
      current.map((item) => (item.clientId === clientId ? { ...item, [field]: value } : item))
    )
  }

  function handleFamilyStudentChange(clientId: string, studentId: string) {
    updateFamilyItem(clientId, 'siswa_id', studentId)

    const student = siswaList.find((item) => item.id === studentId)

    if (!familyTagihKepada.trim() && student) {
      setFamilyTagihKepada(student.nama_ortu?.trim() || `Orang Tua ${student.nama}`)
    }
  }

  function addFamilyItem() {
    setFamilyItems((current) => [...current, createEmptyFamilyInvoiceItem()])
  }

  function removeFamilyItem(clientId: string) {
    setFamilyItems((current) => {
      if (current.length <= 1) return current
      return current.filter((item) => item.clientId !== clientId)
    })
  }

  function resetFamilyInvoiceForm() {
    setFamilyTagihKepada('')
    setFamilyTanggalInvoice(getLocalDateInputValue())
    setFamilyJatuhTempo(getDefaultDueDateInputValue())
    setFamilyDiskon('0')
    setFamilyCatatan('')
    setFamilyItems([createEmptyFamilyInvoiceItem()])
  }

  async function handleCreateFamilyInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    console.log('CREATE FAMILY INVOICE CLICKED')

    setSaving(true)
    setMessage('')
    setFamilyMessage('')

    const fail = (text: string) => {
      console.error('FAMILY INVOICE:', text)
      setMessage(text)
      setFamilyMessage(text)
    }

    try {
      if (!familyTanggalInvoice) {
        fail('Tanggal faktur belum diisi.')
        return
      }

      if (!familyJatuhTempo) {
        fail('Tanggal jatuh tempo belum diisi.')
        return
      }

      if (familyJatuhTempo < familyTanggalInvoice) {
        fail('Tanggal jatuh tempo tidak boleh sebelum tanggal faktur.')
        return
      }

      if (familyItems.length === 0) {
        fail('Tambahkan minimal satu item faktur.')
        return
      }

      for (let index = 0; index < familyItems.length; index++) {
        const item = familyItems[index]

        if (!item.siswa_id) {
          fail(`Item ${index + 1}: pilih anak terlebih dahulu.`)
          return
        }

        if (!item.nama_item.trim()) {
          fail(`Item ${index + 1}: nama item belum diisi.`)
          return
        }

        if (!item.bulan) {
          fail(`Item ${index + 1}: bulan belum dipilih.`)
          return
        }

        if (!item.tahun) {
          fail(`Item ${index + 1}: tahun belum diisi.`)
          return
        }

        if (Number(item.qty || 0) <= 0) {
          fail(`Item ${index + 1}: kuantitas harus lebih dari 0.`)
          return
        }

        if (Number(item.harga_satuan || 0) <= 0) {
          fail(`Item ${index + 1}: biaya satuan harus lebih dari 0.`)
          return
        }
      }

      if (familySubtotal <= 0) {
        fail('Subtotal faktur harus lebih dari 0.')
        return
      }

      if (familyDiscountNumber > familySubtotal) {
        fail('Diskon tidak boleh lebih besar dari subtotal.')
        return
      }

      const selectedStudents = familyItems
        .map((item) => siswaList.find((student) => student.id === item.siswa_id))
        .filter((student): student is SiswaRow => Boolean(student))

      if (selectedStudents.length !== familyItems.length) {
        fail('Ada data siswa yang tidak ditemukan.')
        return
      }

      const parentIds = Array.from(
        new Set(
          selectedStudents
            .map((student) => student.ortu_id)
            .filter((id): id is string => Boolean(id))
        )
      )

      /*
       * Fitur generate akun ortu lama membuat satu akun ortu per siswa,
       * sehingga kakak-adik bisa memiliki ortu_id yang berbeda walaupun
       * sebenarnya berasal dari satu keluarga.
       *
       * Karena itu faktur keluarga TIDAK diblokir ketika ortu_id berbeda.
       *
       * Jika semua anak memakai satu ortu_id yang sama, faktur otomatis
       * dihubungkan ke akun tersebut.
       *
       * Jika ortu_id berbeda, header faktur tetap dibuat tetapi ortu_id
       * family_invoices disimpan null. Data tagihan per anak tetap aman
       * karena masing-masing item tetap memiliki siswa_id dan spp_id.
       */
      const invoiceParentId =
        parentIds.length === 1
          ? parentIds[0]
          : null

      if (parentIds.length > 1) {
        console.warn(
          'FAMILY INVOICE: anak yang dipilih memiliki ortu_id berbeda. Faktur tetap dibuat dan family_invoices.ortu_id disimpan null.'
        )
      }

      const childNames = Array.from(new Set(selectedStudents.map((student) => student.nama)))

      const tagihKepada =
        familyTagihKepada.trim() ||
        (childNames.length > 0
          ? `Orang Tua ${childNames.join(' dan ')}`
          : 'Orang Tua / Wali')

      const rpcItems = familyItems.map((item) => ({
        siswa_id: item.siswa_id,
        nama_item: item.nama_item.trim(),
        periode: monthNames[Number(item.bulan)] || `${item.bulan}/${item.tahun}`,
        qty: Number(item.qty),
        harga_satuan: Number(item.harga_satuan),
        bulan: Number(item.bulan),
        tahun: Number(item.tahun),
      }))

      /*
       * Buka tab langsung dari klik user.
       * Ini penting untuk Safari karena popup/download bisa diblokir
       * jika baru dibuka setelah RPC/network await selesai.
       */
      const downloadWindow = window.open('', '_blank')

      if (!downloadWindow) {
        fail(
          'Browser memblokir tab download. Izinkan pop-up untuk localhost, lalu coba lagi.'
        )
        return
      }

      downloadWindow.document.open()
      downloadWindow.document.write(`
        <!doctype html>
        <html lang="id">
          <head>
            <meta charset="utf-8" />
            <meta
              name="viewport"
              content="width=device-width,initial-scale=1"
            />
            <title>Membuat Faktur...</title>
          </head>
          <body
            style="
              font-family: Arial, sans-serif;
              padding: 40px;
              background: #F8FAF7;
              color: #063D27;
            "
          >
            <h2>Sedang membuat faktur CBS...</h2>
            <p>Mohon tunggu sebentar.</p>
          </body>
        </html>
      `)
      downloadWindow.document.close()

      console.log('RPC ITEMS:', rpcItems)

      const { data: invoiceId, error } = await supabase.rpc('create_family_invoice', {
        p_ortu_id: invoiceParentId,
        p_tagih_kepada: tagihKepada,
        p_tanggal_invoice: familyTanggalInvoice,
        p_tanggal_jatuh_tempo: familyJatuhTempo,
        p_diskon: familyDiscountNumber,
        p_catatan: familyCatatan.trim() || null,
        p_items: rpcItems,
      })

      console.log('CREATE FAMILY INVOICE RESULT:', {
        invoiceId,
        error,
      })

      if (error) {
        if (!downloadWindow.closed) {
          downloadWindow.close()
        }

        fail(`Gagal membuat faktur: ${error.message}`)
        return
      }

      if (!invoiceId) {
        if (!downloadWindow.closed) {
          downloadWindow.close()
        }

        fail('Faktur berhasil diproses tetapi ID faktur tidak dikembalikan.')
        return
      }

      setFamilyMessage('Faktur berhasil dibuat. Sedang menyiapkan PDF...')

      console.log('FAMILY INVOICE ID:', invoiceId)

      await handleDownloadFamilyInvoice(String(invoiceId), downloadWindow)

      const firstStudentId = familyItems[0]?.siswa_id || ''

      resetFamilyInvoiceForm()

      if (firstStudentId) {
        setFilterSiswaId(firstStudentId)
      }

      await loadData()
    } catch (error) {
      console.error('CREATE FAMILY INVOICE EXCEPTION:', error)

      fail(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat membuat faktur.'
      )
    } finally {
      setSaving(false)
    }
  }


  async function handleGenerateMonthlyBills() {
    const selectedMonth = Number(bulan)
    const selectedYear = Number(tahun)

    const confirmGenerate = window.confirm(
      `Generate tagihan baru ${monthNames[selectedMonth]} ${selectedYear} untuk ${getJenisKelasFilterLabel(invoiceJenisKelas).toUpperCase()}? Tagihan lama di bulan yang sama tidak akan dihapus.`
    )

    if (!confirmGenerate) return

    setSaving(true)
    setMessage('')

    const userId = await getCurrentUserId()

    if (!selectedMonth || !selectedYear || !nominal) {
      setMessage('Isi bulan, tahun, dan nominal terlebih dahulu.')
      setSaving(false)
      return
    }

    if (siswaByInvoiceType.length === 0) {
      setMessage(`Belum ada siswa aktif pada ${getJenisKelasFilterLabel(invoiceJenisKelas)}.`)
      setSaving(false)
      return
    }

    const billNominal = Number(nominal)

    if (!billNominal || billNominal <= 0) {
      setMessage('Nominal tagihan harus lebih dari 0.')
      setSaving(false)
      return
    }

    const today = new Date()
    const dueDate = new Date(today)
    dueDate.setDate(today.getDate() + 21)

    const payload = siswaByInvoiceType.map((siswa, index) => ({
      siswa_id: siswa.id,
      bulan: selectedMonth,
      tahun: selectedYear,
      nominal: billNominal,
      dibayar: 0,
      status: 'belum' as SppStatus,
      tanggal_bayar: null,
      tanggal_jatuh_tempo: dueDate.toISOString().slice(0, 10),
      keterangan:
        keterangan ||
        `Tagihan ${normalizeJenisKelas(siswa.jenis_kelas)} ${monthNames[selectedMonth]} ${selectedYear} dibuat otomatis`,
      invoice_no: generateInvoiceNo(index),
      updated_by: userId,
    }))

    const { error } = await supabase.from('spp').insert(payload)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setFilterSiswaId('')
    setSearch('')
    setMessage(
      `Berhasil generate ${payload.length} tagihan ${getJenisKelasFilterLabel(invoiceJenisKelas)} untuk ${monthNames[selectedMonth]} ${selectedYear}. Tagihan lama tetap aman.`
    )
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
      deskripsi: `${isPaidOff ? 'Pelunasan' : 'Cicilan'} cash ${spp.keterangan || 'tagihan'} ${
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
        keterangan: spp.keterangan || 'Pembayaran/cicilan direset oleh admin',
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

    const { error: deleteFamilyInvoiceError } = await supabase
      .from('family_invoices')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')

    if (deleteFamilyInvoiceError) {
      setMessage(`Gagal hapus faktur keluarga: ${deleteFamilyInvoiceError.message}`)
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

  async function handleDownloadFamilyInvoice(
    familyInvoiceId: string,
    downloadWindow?: Window | null
  ) {
    setSaving(true)
    setMessage('Sedang membuat faktur keluarga...')

    try {
      const { data, error } = await supabase
        .from('family_invoices')
        .select(
          `
          id,
          invoice_no,
          ortu_id,
          tagih_kepada,
          tanggal_invoice,
          tanggal_jatuh_tempo,
          subtotal,
          diskon,
          total,
          catatan,
          created_at,
          items:family_invoice_items (
            id,
            siswa_id,
            spp_id,
            nama_item,
            periode,
            qty,
            harga_satuan,
            gross_total,
            discount_allocated,
            net_total,
            urutan,
            siswa:siswa_id (
              id,
              nama,
              kelas,
              jenis_kelas,
              sekolah,
              ortu_id,
              nama_ortu
            ),
            spp:spp_id (
              id,
              dibayar,
              status,
              tanggal_bayar
            )
          )
        `
        )
        .eq('id', familyInvoiceId)
        .single()

      if (error) {
        throw error
      }

      const invoice = data as unknown as FamilyInvoiceRow
      const items = [...(invoice.items || [])].sort((a, b) => a.urutan - b.urutan)

      if (items.length === 0) {
        throw new Error('Item faktur tidak ditemukan.')
      }

      const totalDibayar = items.reduce(
        (total, item) => total + Number(item.spp?.dibayar || 0),
        0
      )
      const saldoTerutang = Math.max(Number(invoice.total || 0) - totalDibayar, 0)

      const jsPdfModule = await import('jspdf')
      const { jsPDF } = jsPdfModule
      const pdf = new jsPDF('p', 'mm', 'a4')

      // Logo CBS:
      // File fisik:
      // public/images/logo bimbel.jpg
      //
      // URL dari browser:
      // /images/logo%20bimbel.jpg
      let logoData: string | null = null
      let signatureData: string | null = null

      try {
        logoData = await loadPublicImageAsDataUrl(
          '/images/logo%20bimbel.jpg'
        )
      } catch (logoError) {
        console.error('Gagal memuat logo invoice:', logoError)
        logoData = null
      }

      try {
        signatureData = await loadPublicImageAsDataUrl('/cbs-signature.png')
      } catch {
        signatureData = null
      }

      const pageWidth = pdf.internal.pageSize.getWidth()
      const left = 15
      const right = pageWidth - 15

      const drawCompanyHeader = () => {
        if (logoData) {
          pdf.addImage(
            logoData,
            'JPEG',
            left,
            10,
            30,
            30
          )
        }

        const companyX = logoData ? 50 : left

        pdf.setTextColor(30, 30, 30)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(17)
        pdf.text('Bimbingan Belajar CBS', companyX, 17)
        pdf.text('Salaman', companyX, 24)

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(8.5)
        pdf.text('Jl. Diponegoro No. 28 Gadean Salaman', companyX, 31)
        pdf.text('Magelang', companyX, 36)
        pdf.text('0813-9219-2401', companyX, 41)
        pdf.text('bimbinganbelajarbcssalaman@gmail.com', companyX, 46)

        pdf.setTextColor(18, 103, 43)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(25)
        pdf.text('FAKTUR', right, 18, { align: 'right' })

        pdf.setTextColor(50, 50, 50)
        pdf.setFontSize(10)
        pdf.text(`#${invoice.invoice_no}`, right, 27, { align: 'right' })

        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.text(`Tanggal: ${formatDate(invoice.tanggal_invoice)}`, right, 35, { align: 'right' })
        pdf.text(
          `Tanggal Jatuh Tempo ${formatDate(invoice.tanggal_jatuh_tempo)}`,
          right,
          41,
          { align: 'right' }
        )
      }

      const drawTableHeader = (y: number) => {
        pdf.setFillColor(22, 101, 37)
        pdf.rect(left, y, right - left, 10, 'F')

        pdf.setTextColor(255, 255, 255)
        pdf.setFont('helvetica', 'bold')
        pdf.setFontSize(9)
        pdf.text('#', 18, y + 6.5)
        pdf.text('Item', 30, y + 6.5)
        pdf.text('Kuantitas', 105, y + 6.5)
        pdf.text('Biaya satuan', 145, y + 6.5, { align: 'right' })
        pdf.text('Total', right, y + 6.5, { align: 'right' })
      }

      drawCompanyHeader()

      pdf.setTextColor(40, 40, 40)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.text(`Tagih Kepada: ${invoice.tagih_kepada}`, left, 58)

      let tableY = 66
      drawTableHeader(tableY)
      let rowY = tableY + 16

      items.forEach((item, index) => {
        if (rowY > 190) {
          pdf.addPage()
          tableY = 18
          drawTableHeader(tableY)
          rowY = tableY + 16
        }

        const studentName = item.siswa?.nama || '-'
        const periodLabel = item.periode || '-'
        const detailLabel = `${studentName} • ${periodLabel}`

        pdf.setTextColor(45, 45, 45)
        pdf.setFont('helvetica', 'normal')
        pdf.setFontSize(9)
        pdf.text(String(index + 1), 18, rowY)
        pdf.setFont('helvetica', 'bold')
        pdf.text(item.nama_item.slice(0, 45), 30, rowY)

        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(105, 105, 105)
        pdf.setFontSize(8)
        pdf.text(detailLabel.slice(0, 52), 30, rowY + 5)

        pdf.setTextColor(45, 45, 45)
        pdf.setFontSize(9)
        pdf.text(String(Number(item.qty || 0)), 112, rowY, { align: 'center' })
        pdf.text(formatInvoiceCurrency(Number(item.harga_satuan || 0)), 145, rowY, {
          align: 'right',
        })
        pdf.text(formatInvoiceCurrency(Number(item.gross_total || 0)), right, rowY, {
          align: 'right',
        })

        pdf.setDrawColor(228, 228, 228)
        pdf.line(left, rowY + 9, right, rowY + 9)

        rowY += 15
      })

      // Jika daftar item sangat panjang, sisakan halaman baru untuk ringkasan.
      if (rowY > 205) {
        pdf.addPage()
        rowY = 25
      } else {
        rowY += 8
      }

      const summaryY = Math.max(rowY, 130)

      // Info pembayaran kiri.
      pdf.setTextColor(45, 45, 45)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Info Pembayaran', left, summaryY)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.text('Bayar cash ke admin atau transfer ke', left, summaryY + 9)
      pdf.text('DWI RIYANA NURSANTI', left, summaryY + 16)
      pdf.text('BRI  308301063510534', left, summaryY + 23)
      pdf.text('BRI  676701016062537', left, summaryY + 30)
      pdf.text('Bank Jateng  2162047852', left, summaryY + 37)
      pdf.text('Bank Mandiri  1850004717119', left, summaryY + 44)

      // Ringkasan kanan.
      const labelX = 120
      const amountX = right

      pdf.setFont('helvetica', 'bold')
      pdf.text('Subtotal', labelX, summaryY)
      pdf.text(formatInvoiceCurrency(Number(invoice.subtotal || 0)), amountX, summaryY, {
        align: 'right',
      })

      pdf.setFont('helvetica', 'normal')
      pdf.text('Diskon', labelX, summaryY + 10)
      pdf.text(
        `-${formatInvoiceCurrency(Number(invoice.diskon || 0))}`,
        amountX,
        summaryY + 10,
        { align: 'right' }
      )

      pdf.setDrawColor(170, 170, 170)
      pdf.line(labelX, summaryY + 15, amountX, summaryY + 15)

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.text('Total', labelX, summaryY + 25)
      pdf.text(formatInvoiceCurrency(Number(invoice.total || 0)), amountX, summaryY + 25, {
        align: 'right',
      })

      pdf.setFont('helvetica', 'normal')
      pdf.text('Dibayar', labelX, summaryY + 35)
      pdf.text(formatInvoiceCurrency(totalDibayar), amountX, summaryY + 35, {
        align: 'right',
      })

      pdf.setFont('helvetica', 'bold')
      pdf.text('Saldo Terutang', labelX, summaryY + 45)
      pdf.setTextColor(18, 103, 43)
      pdf.text(formatInvoiceCurrency(saldoTerutang), amountX, summaryY + 45, {
        align: 'right',
      })

      // Tanda tangan.
      const signatureY = Math.min(summaryY + 76, 250)

      if (signatureData) {
        pdf.addImage(signatureData, 'PNG', 153, signatureY - 17, 22, 17)
      } else {
        pdf.setDrawColor(100, 100, 100)
        pdf.line(154, signatureY, 176, signatureY - 14)
        pdf.line(161, signatureY - 2, 173, signatureY - 17)
      }

      pdf.setTextColor(45, 45, 45)
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(9)
      pdf.text('Bimbingan Belajar CBS Salaman', right, signatureY + 9, {
        align: 'right',
      })

      pdf.setFont('helvetica', 'normal')
      pdf.text(formatDate(getLocalDateInputValue()), right, signatureY + 16, {
        align: 'right',
      })

      const fileName = `invoice-${safeFileName(invoice.invoice_no)}.pdf`
      const pdfBlob = pdf.output('blob')
      const pdfUrl = window.URL.createObjectURL(pdfBlob)

      if (downloadWindow && !downloadWindow.closed) {
        /*
         * Safari dapat memblokir download yang baru dimulai setelah banyak await.
         * Karena tab ini sudah dibuka langsung saat user menekan tombol,
         * kita taruh link download di sana dan mencoba klik otomatis.
         * Kalau Safari tetap menahan auto-download, user tinggal klik link
         * "Download Faktur" yang tetap terlihat di tab tersebut.
         */
        downloadWindow.document.open()
        downloadWindow.document.write(`
          <!doctype html>
          <html lang="id">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <title>${invoice.invoice_no}</title>
              <style>
                body {
                  margin: 0;
                  min-height: 100vh;
                  display: grid;
                  place-items: center;
                  font-family: Arial, sans-serif;
                  background: #F8FAF7;
                  color: #063D27;
                }
                .card {
                  width: min(520px, calc(100vw - 40px));
                  background: white;
                  border: 1px solid #DDE9DB;
                  border-radius: 28px;
                  padding: 28px;
                  box-sizing: border-box;
                  text-align: center;
                }
                h1 { margin: 0 0 8px; font-size: 22px; }
                p { color: #52645A; line-height: 1.6; }
                a {
                  display: inline-block;
                  margin-top: 14px;
                  padding: 13px 22px;
                  border-radius: 999px;
                  background: #063D27;
                  color: white;
                  font-weight: 800;
                  text-decoration: none;
                }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Faktur ${invoice.invoice_no} siap</h1>
                <p>Jika unduhan tidak mulai otomatis, tekan tombol di bawah.</p>
                <a id="download-faktur" href="${pdfUrl}" download="${fileName}">
                  Download Faktur
                </a>
              </div>
              <script>
                setTimeout(function () {
                  var link = document.getElementById('download-faktur');
                  if (link) link.click();
                }, 150);
              </script>
            </body>
          </html>
        `)
        downloadWindow.document.close()
      } else {
        const link = document.createElement('a')
        link.href = pdfUrl
        link.download = fileName
        link.style.display = 'none'

        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }

      // Jangan revoke terlalu cepat karena Safari mungkin masih memakai Blob URL.
      window.setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl)
      }, 120_000)

      setMessage(
        `Faktur ${invoice.invoice_no} berhasil dibuat. Jika download tidak otomatis, klik "Download Faktur" pada tab yang terbuka.`
      )
    } catch (error) {
      console.error(error)
      setMessage(
        error instanceof Error
          ? `Gagal download faktur keluarga: ${error.message}`
          : 'Gagal download faktur keluarga.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDownloadInvoice(spp: SppRow) {
    if (spp.family_invoice_id) {
      const downloadWindow = window.open('', '_blank')

      if (downloadWindow) {
        downloadWindow.document.write(`
          <!doctype html>
          <html lang="id">
            <head>
              <meta charset="utf-8" />
              <meta name="viewport" content="width=device-width,initial-scale=1" />
              <title>Membuat Faktur...</title>
            </head>
            <body style="font-family:Arial,sans-serif;padding:32px;color:#063D27">
              <strong>Sedang membuat faktur CBS...</strong>
              <p style="color:#52645A">Mohon tunggu sebentar.</p>
            </body>
          </html>
        `)
        downloadWindow.document.close()
      }

      await handleDownloadFamilyInvoice(
        spp.family_invoice_id,
        downloadWindow
      )
      return
    }

    setSaving(true)
    setMessage('Sedang membuat invoice...')

    try {
      const jsPdfModule = await import('jspdf')
      const { jsPDF } = jsPdfModule
      const pdf = new jsPDF('p', 'mm', 'a4')

      let logoData: string | null = null

      try {
        logoData = await loadPublicImageAsDataUrl(
          '/images/logo%20bimbel.jpg'
        )
      } catch (logoError) {
        console.error('Gagal memuat logo invoice:', logoError)
        logoData = null
      }

      const sisa = Math.max(Number(spp.nominal) - Number(spp.dibayar || 0), 0)
      const itemName = spp.keterangan || `SPP Bimbel ${monthNames[spp.bulan]} ${spp.tahun}`

      if (logoData) {
        pdf.addImage(
          logoData,
          'JPEG',
          16,
          10,
          30,
          30
        )
      }

      const companyX = logoData ? 51 : 16

      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(17)
      pdf.text('Bimbingan Belajar CBS', companyX, 18)
      pdf.text('Salaman', companyX, 25)

      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(8.5)
      pdf.text(
        'Jl. Diponegoro No. 28 Gadean Salaman',
        companyX,
        31
      )
      pdf.text('Magelang', companyX, 36)
      pdf.text('0813-9219-2401', companyX, 41)
      pdf.text(
        'bimbinganbelajarbcssalaman@gmail.com',
        companyX,
        46
      )

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
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10)
      pdf.text(`Kelas: ${spp.siswa?.kelas || '-'} | Jenis: ${normalizeJenisKelas(spp.siswa?.jenis_kelas)}`, 16, 69)

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
      pdf.text(itemName.slice(0, 48), 32, 100)
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


  async function handleDownloadSppReport() {
    const selectedMonth = Number(reportBulan)
    const selectedYear = Number(reportTahun)

    if (!selectedMonth || selectedMonth < 1 || selectedMonth > 12) {
      setMessage('Pilih bulan laporan SPP yang valid.')
      return
    }

    if (!selectedYear || selectedYear < 2000 || selectedYear > 2100) {
      setMessage('Isi tahun laporan SPP yang valid.')
      return
    }

    if (filteredMonthlySppRows.length === 0) {
      setMessage(
        `Tidak ada data SPP ${getSppReportFilterLabel(reportStatus).toLowerCase()} untuk ${
          monthNames[selectedMonth]
        } ${selectedYear}.`
      )
      return
    }

    setSaving(true)
    setMessage('Sedang membuat rekap SPP Excel...')

    try {
      const ExcelJS = await import('exceljs')
      const workbook = new ExcelJS.Workbook()
      const sheet = workbook.addWorksheet('Rekap SPP', {
        views: [{ state: 'frozen', ySplit: 7 }],
        pageSetup: {
          orientation: 'landscape',
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          paperSize: 9,
        },
      })

      sheet.properties.defaultRowHeight = 21
      sheet.columns = [
        { key: 'nomor', width: 7 },
        { key: 'nama', width: 27 },
        { key: 'kelas', width: 12 },
        { key: 'jenis_kelas', width: 15 },
        { key: 'sekolah', width: 28 },
        { key: 'jumlah_invoice', width: 15 },
        { key: 'invoice', width: 32 },
        { key: 'tagihan', width: 18 },
        { key: 'dibayar', width: 18 },
        { key: 'sisa', width: 18 },
        { key: 'status', width: 17 },
        { key: 'tanggal_bayar', width: 22 },
        { key: 'keterangan', width: 42 },
      ]

      sheet.mergeCells('A1:M1')
      const titleCell = sheet.getCell('A1')
      titleCell.value = 'BIMBINGAN BELAJAR CBS SALAMAN'
      titleCell.font = { bold: true, size: 17, color: { argb: 'FFFFFFFF' } }
      titleCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF063D27' },
      }
      titleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getRow(1).height = 28

      sheet.mergeCells('A2:M2')
      const subtitleCell = sheet.getCell('A2')
      subtitleCell.value = `Rekap Status SPP ${monthNames[selectedMonth]} ${selectedYear} • ${getJenisKelasFilterLabel(reportJenisKelas)} • ${getSppReportFilterLabel(
        reportStatus
      )}`
      subtitleCell.font = { bold: true, size: 12, color: { argb: 'FF334155' } }
      subtitleCell.alignment = { horizontal: 'center', vertical: 'middle' }
      sheet.getRow(2).height = 24

      const filteredSummary = filteredMonthlySppRows.reduce(
        (summary, row) => {
          summary.tagihan += row.nominal
          summary.dibayar += row.dibayar
          summary.tunggakan += row.sisa
          return summary
        },
        { tagihan: 0, dibayar: 0, tunggakan: 0 }
      )

      const summaryItems = [
        ['A4', 'B4', 'TOTAL SISWA', filteredMonthlySppRows.length, 'FFF3F8F1', 'FF063D27', false],
        ['C4', 'D4', 'LUNAS', monthlySppSummary.lunas, 'FFE6F4EA', 'FF137333', false],
        ['E4', 'F4', 'CICILAN', monthlySppSummary.cicilan, 'FFFFF4D6', 'FFB06000', false],
        ['G4', 'H4', 'BELUM BAYAR', monthlySppSummary.belum, 'FFFCE8E6', 'FFC5221F', false],
        ['I4', 'J4', 'SUDAH DIBAYAR', filteredSummary.dibayar, 'FFE6F4EA', 'FF137333', true],
        ['K4', 'L4', 'SISA TUNGGAKAN', filteredSummary.tunggakan, 'FFFCE8E6', 'FFC5221F', true],
      ] as const

      summaryItems.forEach(([labelKey, valueKey, label, value, background, color, currency]) => {
        const labelCell = sheet.getCell(labelKey)
        const valueCell = sheet.getCell(valueKey)

        labelCell.value = label
        valueCell.value = Number(value || 0)

        if (currency) {
          valueCell.numFmt = '"Rp"#,##0'
        }

        ;[labelCell, valueCell].forEach((cell) => {
          cell.font = { bold: true, color: { argb: color } }
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: background },
          }
          cell.alignment = { horizontal: 'center', vertical: 'middle' }
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }
        })
      })

      const headerRow = sheet.getRow(7)
      headerRow.values = [
        'No.',
        'Nama Siswa',
        'Kelas',
        'Jenis Kelas',
        'Sekolah',
        'Jumlah Invoice',
        'Nomor Invoice',
        'Total Tagihan',
        'Sudah Dibayar',
        'Sisa Tunggakan',
        'Status',
        'Bayar Terakhir',
        'Keterangan',
      ]
      headerRow.height = 28

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF063D27' },
        }
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCAD5CC' } },
          bottom: { style: 'thin', color: { argb: 'FFCAD5CC' } },
          left: { style: 'thin', color: { argb: 'FFCAD5CC' } },
          right: { style: 'thin', color: { argb: 'FFCAD5CC' } },
        }
      })

      filteredMonthlySppRows.forEach((item, index) => {
        const row = sheet.getRow(8 + index)
        const statusLabel = getSppReportStatusLabel(item.status)

        row.values = [
          index + 1,
          item.nama,
          item.kelas,
          item.jenisKelas,
          item.sekolah || '-',
          item.jumlahInvoice,
          item.invoiceNumbers.join(', ') || '-',
          item.nominal,
          item.dibayar,
          item.sisa,
          statusLabel,
          item.tanggalBayarTerakhir || '-',
          item.keterangan.join(' | ') || '-',
        ]

        row.alignment = { vertical: 'top', wrapText: true }

        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          }
        })

        row.getCell(1).alignment = { horizontal: 'center', vertical: 'top' }
        row.getCell(3).alignment = { horizontal: 'center', vertical: 'top' }
        row.getCell(4).alignment = { horizontal: 'center', vertical: 'top' }
        row.getCell(6).alignment = { horizontal: 'center', vertical: 'top' }

        row.getCell(8).numFmt = '"Rp"#,##0'
        row.getCell(9).numFmt = '"Rp"#,##0'
        row.getCell(10).numFmt = '"Rp"#,##0'

        const statusCell = row.getCell(11)
        statusCell.font = {
          bold: true,
          color: {
            argb:
              item.status === 'lunas'
                ? 'FF137333'
                : item.status === 'cicilan'
                  ? 'FFB06000'
                  : 'FFC5221F',
          },
        }
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: {
            argb:
              item.status === 'lunas'
                ? 'FFE6F4EA'
                : item.status === 'cicilan'
                  ? 'FFFFF4D6'
                  : 'FFFCE8E6',
          },
        }
        statusCell.alignment = { horizontal: 'center', vertical: 'top' }
      })

      const totalRowNumber = 8 + filteredMonthlySppRows.length
      const totalRow = sheet.getRow(totalRowNumber)

      totalRow.values = [
        '',
        'TOTAL',
        '',
        '',
        '',
        '',
        '',
        filteredSummary.tagihan,
        filteredSummary.dibayar,
        filteredSummary.tunggakan,
        '',
        '',
        '',
      ]

      totalRow.getCell(8).numFmt = '"Rp"#,##0'
      totalRow.getCell(9).numFmt = '"Rp"#,##0'
      totalRow.getCell(10).numFmt = '"Rp"#,##0'

      totalRow.eachCell((cell) => {
        cell.font = { bold: true, color: { argb: 'FF063D27' } }
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' },
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFCAD5CC' } },
          bottom: { style: 'thin', color: { argb: 'FFCAD5CC' } },
          left: { style: 'thin', color: { argb: 'FFCAD5CC' } },
          right: { style: 'thin', color: { argb: 'FFCAD5CC' } },
        }
      })

      sheet.autoFilter = {
        from: 'A7',
        to: `M${Math.max(totalRowNumber - 1, 7)}`,
      }

      sheet.getColumn(8).numFmt = '"Rp"#,##0'
      sheet.getColumn(9).numFmt = '"Rp"#,##0'
      sheet.getColumn(10).numFmt = '"Rp"#,##0'

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      const statusSuffix = safeFileName(getSppReportFilterLabel(reportStatus))
      const classSuffix = safeFileName(getJenisKelasFilterLabel(reportJenisKelas))

      link.href = url
      link.download = `rekap-spp-${String(selectedYear)}-${String(selectedMonth).padStart(
        2,
        '0'
      )}-${classSuffix}-${statusSuffix}.xlsx`

      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setMessage(
        `Rekap SPP ${monthNames[selectedMonth]} ${selectedYear} berhasil didownload (${filteredMonthlySppRows.length} siswa).`
      )
    } catch (error) {
      console.error(error)
      setMessage(
        error instanceof Error
          ? `Gagal membuat rekap SPP: ${error.message}`
          : 'Gagal membuat rekap SPP.'
      )
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
                <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl lg:text-5xl">
                  Dana & Keuangan
                </h1>

                <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                  Kelola invoice, cicilan SPP cash, jenis kelas Reguler/UTBK/Intensif,
                  pemasukan, pengeluaran, gaji tutor, tunggakan, dan laporan Excel.
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
                    onClick={handleDownloadSppReport}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:bg-slate-300"
                  >
                    <Download className="h-4 w-4" />
                    Export Rekap SPP
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadExcelReport}
                    disabled={saving}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#8B5CF6] px-5 text-sm font-black text-white transition hover:bg-[#7C3AED] disabled:bg-slate-300"
                  >
                    <FileSpreadsheet className="h-4 w-4" />
                    Laporan Dana
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

          <section className="grid gap-3 sm:grid-cols-3">
            <ClassTypeCard title="Reguler" value={jenisKelasCounts.Reguler} />
            <ClassTypeCard title="UTBK" value={jenisKelasCounts.UTBK} />
            <ClassTypeCard title="Intensif" value={jenisKelasCounts.Intensif} />
          </section>

          <section className="panel-card">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <div className="section-kicker">Export SPP</div>
                <h2 className="section-title">Rekap Pembayaran SPP Bulanan</h2>
                <p className="section-desc">
                  Pilih periode dan status. Sistem menggabungkan semua invoice pada bulan yang sama
                  per siswa, lalu menghitung total tagihan, pembayaran, dan sisa tunggakan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDownloadSppReport}
                disabled={saving || filteredMonthlySppRows.length === 0}
                className="excel-button"
              >
                <Download className="h-4 w-4" />
                Export Rekap SPP
              </button>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
              <Field label="Bulan Laporan">
                <select
                  value={reportBulan}
                  onChange={(e) => setReportBulan(e.target.value)}
                  className="input-style"
                >
                  {monthNames.slice(1).map((name, index) => (
                    <option key={name} value={index + 1}>
                      {name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Tahun Laporan">
                <input
                  type="number"
                  min={2000}
                  max={2100}
                  value={reportTahun}
                  onChange={(e) => setReportTahun(e.target.value)}
                  className="input-style"
                />
              </Field>

              <Field label="Jenis Kelas">
                <select
                  value={reportJenisKelas}
                  onChange={(e) => setReportJenisKelas(e.target.value as JenisKelasFilter)}
                  className="input-style"
                >
                  <option value="semua">Semua Jenis Kelas</option>
                  {jenisKelasOptions.map((jenis) => (
                    <option key={jenis} value={jenis}>
                      {jenis}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status Pembayaran">
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value as SppReportFilter)}
                  className="input-style"
                >
                  <option value="semua">Semua Status</option>
                  <option value="lunas">Lunas</option>
                  <option value="cicilan">Cicilan</option>
                  <option value="belum">Belum Bayar</option>
                  <option value="menunggak">Semua Menunggak</option>
                </select>
              </Field>

              <div className="mt-3 rounded-[22px] border border-[#DDE9DB] bg-[#F3F8F1] px-5 py-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Data yang diexport
                </p>
                <p className="mt-2 text-2xl font-black text-[#063D27]">
                  {filteredMonthlySppRows.length} siswa
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {getJenisKelasFilterLabel(reportJenisKelas)} · {getSppReportFilterLabel(reportStatus)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
              <MiniReportStat label="Total Siswa" value={`${monthlySppRowsByClass.length}`} />
              <MiniReportStat label="Lunas" value={`${monthlySppSummary.lunas}`} tone="success" />
              <MiniReportStat label="Cicilan" value={`${monthlySppSummary.cicilan}`} tone="warning" />
              <MiniReportStat label="Belum Bayar" value={`${monthlySppSummary.belum}`} tone="danger" />
              <MiniReportStat
                label="Sudah Dibayar"
                value={formatCurrency(monthlySppSummary.totalDibayar)}
                tone="success"
              />
              <MiniReportStat
                label="Sisa Tunggakan"
                value={formatCurrency(monthlySppSummary.totalTunggakan)}
                tone="danger"
              />
            </div>

            {monthlySppRowsByClass.length === 0 && (
              <div className="mt-4 rounded-[22px] border border-[#F3E8A6] bg-[#FFFDE8] px-5 py-4 text-sm font-bold text-[#7C5A00]">
                Belum ada tagihan SPP {getJenisKelasFilterLabel(reportJenisKelas).toLowerCase()} untuk {monthNames[Number(reportBulan)]} {reportTahun}.
                Generate invoice terlebih dahulu agar siswa dapat masuk ke rekap.
              </div>
            )}
          </section>

          <section className="grid items-start gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="panel-card overflow-hidden">
              <div className="mb-5 flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div>
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

              <div className="mb-4 grid gap-3 lg:grid-cols-[0.65fr_1fr_1fr_auto]">
                <div className="select-shell">
                  <select
                    value={filterJenisKelas}
                    onChange={(e) => {
                      setFilterJenisKelas(e.target.value as JenisKelasFilter)
                      setFilterSiswaId('')
                      setSearch('')
                    }}
                    className="clean-select"
                  >
                    <option value="semua">Semua jenis kelas</option>
                    {jenisKelasOptions.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#063D27]" />
                </div>

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
                    {siswaByPaymentType.map((siswa) => (
                      <option key={siswa.id} value={siswa.id}>
                        {siswa.nama} - {siswa.kelas} · {normalizeJenisKelas(siswa.jenis_kelas)}
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
                    placeholder="Cari invoice/periode/keterangan..."
                    disabled={!filterSiswaId}
                    className="w-full bg-transparent text-sm font-semibold text-slate-700 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFilterJenisKelas('semua')
                    setFilterSiswaId('')
                    setSearch('')
                  }}
                  className="soft-button"
                >
                  Reset
                </button>
              </div>

              {selectedStudent && (
                <div className="mb-4 flex flex-col gap-4 rounded-[22px] border border-[#E7EFE6] bg-[#F8FAF7] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-black text-[#063D27]">
                      Murid terpilih: {selectedStudent.nama}
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-500">
                      Kelas: {selectedStudent.kelas} · Sekolah: {selectedStudent.sekolah || '-'}
                    </p>
                  </div>

                  <div className="min-w-[190px]">
                    <label className="mb-1 block text-xs font-black uppercase tracking-wide text-slate-500">
                      Jenis Kelas
                    </label>
                    <select
                      value={normalizeJenisKelas(selectedStudent.jenis_kelas)}
                      onChange={(e) =>
                        handleUpdateStudentJenisKelas(
                          selectedStudent.id,
                          e.target.value as JenisKelas
                        )
                      }
                      disabled={saving}
                      className="input-style"
                    >
                      {jenisKelasOptions.map((jenis) => (
                        <option key={jenis} value={jenis}>
                          {jenis}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto rounded-[24px] border border-[#E7EFE6]">
                <table className="w-full min-w-[1220px] text-left text-sm">
                  <thead>
                    <tr className="bg-[#F3F8F1] text-xs uppercase tracking-wide text-[#063D27]">
                      <th className="px-4 py-4">Invoice</th>
                      <th className="px-4 py-4">Siswa</th>
                      <th className="px-4 py-4">Periode</th>
                      <th className="px-4 py-4">Keterangan</th>
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
                      <EmptyRow colSpan={10} title="Loading data..." />
                    ) : !filterSiswaId ? (
                      <EmptyRow colSpan={10} title="Pilih murid terlebih dahulu" desc="Tagihan siswa disembunyikan secara default." />
                    ) : filteredSpp.length === 0 ? (
                      <EmptyRow colSpan={10} title="Tagihan murid ini belum ada." />
                    ) : (
                      filteredSpp.map((spp) => {
                        const sisa = Math.max(Number(spp.nominal) - Number(spp.dibayar || 0), 0)

                        return (
                          <tr key={spp.id} className="border-b border-[#EEF3EC] hover:bg-[#FAFCF9]">
                            <td className="px-4 py-4 font-black text-[#063D27]">{spp.invoice_no || '-'}</td>

                            <td className="px-4 py-4">
                              <p className="font-black text-slate-800">{spp.siswa?.nama || '-'}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <p className="text-xs font-semibold text-slate-400">{spp.siswa?.kelas || '-'}</p>
                                <JenisKelasBadge value={normalizeJenisKelas(spp.siswa?.jenis_kelas)} />
                              </div>
                            </td>

                            <td className="px-4 py-4 font-semibold text-slate-500">
                              {monthNames[spp.bulan]} {spp.tahun}
                            </td>

                            <td className="px-4 py-4 font-semibold text-slate-500">
                              {spp.keterangan || '-'}
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
              <FormCard
                title="Faktur Keluarga"
                desc="Satu faktur dapat berisi beberapa anak dan beberapa item. Setiap item tetap dibuat sebagai tagihan SPP milik anak masing-masing."
                icon={<ReceiptText className="h-5 w-5" />}
                onSubmit={handleCreateFamilyInvoice}
                buttonText={saving ? 'Memproses Faktur...' : 'Buat & Download Faktur'}
                buttonClass="primary-submit"
              >
                <Field label="Tagih Kepada">
                  <input
                    value={familyTagihKepada}
                    onChange={(e) => setFamilyTagihKepada(e.target.value)}
                    placeholder="Contoh: Ayang dan Ayuun / Nama orang tua"
                    className="input-style"
                  />
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Tanggal Faktur">
                    <input
                      type="date"
                      value={familyTanggalInvoice}
                      onChange={(e) => setFamilyTanggalInvoice(e.target.value)}
                      className="input-style"
                    />
                  </Field>

                  <Field label="Jatuh Tempo">
                    <input
                      type="date"
                      value={familyJatuhTempo}
                      onChange={(e) => setFamilyJatuhTempo(e.target.value)}
                      className="input-style"
                    />
                  </Field>
                </div>

                <div className="mt-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-[#063D27]">Item Faktur</p>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Pilih anak pada setiap item. Anak yang berbeda boleh dimasukkan selama masih satu keluarga.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={addFamilyItem}
                    className="inline-flex shrink-0 items-center gap-2 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-black text-[#063D27] transition hover:bg-[#EAF3E8]"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Item
                  </button>
                </div>

                <div className="mt-3 space-y-3">
                  {familyItems.map((item, index) => {
                    const itemTotal = Number(item.qty || 0) * Number(item.harga_satuan || 0)

                    return (
                      <div
                        key={item.clientId}
                        className="rounded-[22px] border border-[#DDE9DB] bg-[#F8FAF7] p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-black uppercase tracking-wide text-[#0B5738]">
                              Item {index + 1}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-slate-500">
                              Total item: {formatCurrency(itemTotal)}
                            </p>
                          </div>

                          {familyItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFamilyItem(item.clientId)}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 transition hover:bg-red-100"
                              aria-label={`Hapus item ${index + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        <Field label="Anak / Siswa">
                          <select
                            value={item.siswa_id}
                            onChange={(e) => handleFamilyStudentChange(item.clientId, e.target.value)}
                            className="input-style"
                          >
                            <option value="">Pilih anak</option>
                            {siswaList.map((siswa) => (
                              <option key={siswa.id} value={siswa.id}>
                                {siswa.nama} - {siswa.kelas} · {normalizeJenisKelas(siswa.jenis_kelas)}
                              </option>
                            ))}
                          </select>
                        </Field>

                        <Field label="Nama Item">
                          <input
                            value={item.nama_item}
                            onChange={(e) =>
                              updateFamilyItem(item.clientId, 'nama_item', e.target.value)
                            }
                            placeholder="Contoh: Paket SD Reguler / Kelebihan SD"
                            className="input-style"
                          />
                        </Field>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Bulan / Periode">
                            <select
                              value={item.bulan}
                              onChange={(e) =>
                                updateFamilyItem(item.clientId, 'bulan', e.target.value)
                              }
                              className="input-style"
                            >
                              {monthNames.slice(1).map((name, monthIndex) => (
                                <option key={name} value={monthIndex + 1}>
                                  {name}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field label="Tahun">
                            <input
                              type="number"
                              min={2000}
                              max={2100}
                              value={item.tahun}
                              onChange={(e) =>
                                updateFamilyItem(item.clientId, 'tahun', e.target.value)
                              }
                              className="input-style"
                            />
                          </Field>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Field label="Kuantitas">
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={item.qty}
                              onChange={(e) =>
                                updateFamilyItem(item.clientId, 'qty', e.target.value)
                              }
                              className="input-style"
                            />
                          </Field>

                          <Field label="Biaya Satuan">
                            <input
                              type="number"
                              min="0"
                              value={item.harga_satuan}
                              onChange={(e) =>
                                updateFamilyItem(item.clientId, 'harga_satuan', e.target.value)
                              }
                              placeholder="200000"
                              className="input-style"
                            />
                          </Field>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <Field label="Diskon Faktur">
                  <input
                    type="number"
                    min="0"
                    value={familyDiskon}
                    onChange={(e) => setFamilyDiskon(e.target.value)}
                    className="input-style"
                  />
                </Field>

                <Field label="Catatan">
                  <input
                    value={familyCatatan}
                    onChange={(e) => setFamilyCatatan(e.target.value)}
                    placeholder="Opsional"
                    className="input-style"
                  />
                </Field>

                <div className="mt-4 rounded-[22px] border border-[#DDE9DB] bg-[#F3F8F1] p-4">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatCurrency(familySubtotal)}</span>
                  </div>

                  <div className="mt-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                    <span>Diskon</span>
                    <span>-{formatCurrency(familyDiscountNumber)}</span>
                  </div>

                  <div className="mt-3 border-t border-[#DDE9DB] pt-3">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#063D27]">Total Faktur</span>
                      <span className="text-lg font-black text-[#063D27]">
                        {formatCurrency(familyTotal)}
                      </span>
                    </div>
                  </div>
                </div>

                {familyMessage && (
                  <div className="mt-4 rounded-[18px] border border-[#F3E8A6] bg-[#FFFDE8] px-4 py-3 text-sm font-bold text-[#7C5A00]">
                    {familyMessage}
                  </div>
                )}
              </FormCard>

              <FormCard
                title="Generate Tagihan Massal"
                desc="Fitur lama tetap tersedia untuk membuat tagihan nominal yang sama ke banyak siswa sekaligus."
                icon={<Sparkles className="h-5 w-5" />}
                onSubmit={(e) => {
                  e.preventDefault()
                  void handleGenerateMonthlyBills()
                }}
                buttonText={`Generate ${getJenisKelasFilterLabel(invoiceJenisKelas)} (${siswaByInvoiceType.length} Siswa)`}
                buttonClass="primary-submit"
              >
                <Field label="Jenis Kelas">
                  <select
                    value={invoiceJenisKelas}
                    onChange={(e) => setInvoiceJenisKelas(e.target.value as JenisKelasFilter)}
                    className="input-style"
                  >
                    <option value="semua">Semua Jenis Kelas</option>
                    {jenisKelasOptions.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Bulan">
                    <select
                      value={bulan}
                      onChange={(e) => setBulan(e.target.value)}
                      className="input-style"
                    >
                      {monthNames.slice(1).map((name, index) => (
                        <option key={name} value={index + 1}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Tahun">
                    <input
                      type="number"
                      min={2000}
                      max={2100}
                      value={tahun}
                      onChange={(e) => setTahun(e.target.value)}
                      className="input-style"
                    />
                  </Field>
                </div>

                <Field label="Nominal per Siswa">
                  <input
                    type="number"
                    min="0"
                    value={nominal}
                    onChange={(e) => setNominal(e.target.value)}
                    className="input-style"
                  />
                </Field>

                <Field label="Keterangan / Nama Tagihan">
                  <input
                    value={keterangan}
                    onChange={(e) => setKeterangan(e.target.value)}
                    placeholder="Contoh: SPP Reguler"
                    className="input-style"
                  />
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
                  Download Laporan Dana
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

function MiniReportStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'success' | 'warning' | 'danger'
}) {
  const toneClass = {
    default: 'border-[#E7EFE6] bg-white text-[#063D27]',
    success: 'border-emerald-100 bg-emerald-50 text-emerald-700',
    warning: 'border-amber-100 bg-amber-50 text-amber-700',
    danger: 'border-red-100 bg-red-50 text-red-700',
  }[tone]

  return (
    <div className={`rounded-[22px] border px-4 py-4 ${toneClass}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-65">{label}</p>
      <p className="mt-2 truncate text-lg font-black">{value}</p>
    </div>
  )
}

function JenisKelasBadge({ value }: { value: JenisKelas }) {
  const className = {
    Reguler: 'bg-sky-50 text-sky-700 ring-sky-200',
    UTBK: 'bg-violet-50 text-violet-700 ring-violet-200',
    Intensif: 'bg-amber-50 text-amber-700 ring-amber-200',
  }[value]

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black ring-1 ${className}`}>
      {value}
    </span>
  )
}

function ClassTypeCard({ title, value }: { title: JenisKelas; value: number }) {
  return (
    <div className="rounded-[24px] border border-[#E7EFE6] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-black text-slate-500">Jenis Kelas</p>
          <h3 className="mt-2 text-2xl font-black text-[#063D27]">{title}</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-black text-[#063D27]">{value}</p>
          <p className="text-xs font-bold text-slate-400">siswa aktif</p>
        </div>
      </div>
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
