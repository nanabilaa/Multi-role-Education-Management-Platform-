'use client'

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle,
  Download,
  FileSpreadsheet,
  Loader2,
  Search,
  Upload,
  WalletCards,
  X,
  XCircle,
} from 'lucide-react'

import Header from '@/components/admin/Header'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah, formatTanggal, NAMA_BULAN } from '@/lib/utils'

type DatabaseSppStatus = 'lunas' | 'belum'
type DisplaySppStatus = 'lunas' | 'cicil' | 'belum'
type FilterStatus = 'semua' | DisplaySppStatus

type SiswaRelation = {
  id: string
  nama: string
  kelas: string
}

type SppWithSiswa = {
  id: string
  siswa_id: string
  bulan: number
  tahun: number
  nominal: number
  jumlah_bayar: number | null
  status: DatabaseSppStatus
  tanggal_bayar: string | null
  catatan: string | null
  siswa: SiswaRelation | null
}

type ActiveStudent = {
  id: string
  nama: string
  kelas: string
  aktif: boolean
}

type ImportPreviewRow = {
  rowNumber: number
  siswaId: string
  nama: string
  kelas: string
  nominal: number
  jumlahBayar: number
  tanggalBayar: string | null
  catatan: string | null
  errors: string[]
}

type Notice = {
  type: 'success' | 'error'
  text: string
}

const DEFAULT_NOMINAL = 500_000

function getDisplayStatus(spp: SppWithSiswa): DisplaySppStatus {
  const nominal = Number(spp.nominal) || 0
  const jumlahBayar = Number(spp.jumlah_bayar) || 0

  if (jumlahBayar <= 0) {
    return 'belum'
  }

  if (jumlahBayar < nominal) {
    return 'cicil'
  }

  return 'lunas'
}

function getStatusLabel(status: DisplaySppStatus) {
  if (status === 'lunas') return 'Lunas'
  if (status === 'cicil') return 'Cicilan'
  return 'Belum Bayar'
}

function getStatusClass(status: DisplaySppStatus) {
  if (status === 'lunas') {
    return 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]'
  }

  if (status === 'cicil') {
    return 'border-[#FEEFC3] bg-[#FEF7E0] text-[#B06000]'
  }

  return 'border-[#FAD2CF] bg-[#FCE8E6] text-[#C5221F]'
}

function normalizeHeader(value: string) {
  return value
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
}

function escapeCsv(value: string | number | null | undefined) {
  const text = String(value ?? '')

  if (
    text.includes(',') ||
    text.includes(';') ||
    text.includes('"') ||
    text.includes('\n')
  ) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function detectDelimiter(text: string) {
  const firstLine =
    text
      .split(/\r?\n/)
      .find((line) => line.trim().length > 0) ?? ''

  const commaCount = (firstLine.match(/,/g) ?? []).length
  const semicolonCount = (firstLine.match(/;/g) ?? []).length

  return semicolonCount > commaCount ? ';' : ','
}

function parseCsv(text: string): string[][] {
  const delimiter = detectDelimiter(text)
  const rows: string[][] = []

  let currentRow: string[] = []
  let currentCell = ''
  let insideQuotes = false

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]
    const nextCharacter = text[index + 1]

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentCell += '"'
        index += 1
      } else {
        insideQuotes = !insideQuotes
      }

      continue
    }

    if (character === delimiter && !insideQuotes) {
      currentRow.push(currentCell.trim())
      currentCell = ''
      continue
    }

    if (
      (character === '\n' || character === '\r') &&
      !insideQuotes
    ) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1
      }

      currentRow.push(currentCell.trim())

      const hasContent = currentRow.some(
        (cell) => cell.trim().length > 0,
      )

      if (hasContent) {
        rows.push(currentRow)
      }

      currentRow = []
      currentCell = ''
      continue
    }

    currentCell += character
  }

  currentRow.push(currentCell.trim())

  if (currentRow.some((cell) => cell.trim().length > 0)) {
    rows.push(currentRow)
  }

  return rows
}

function parseRupiahCell(value: string) {
  const normalized = value
    .replace(/rp/gi, '')
    .replace(/\s/g, '')
    .replace(/[^\d-]/g, '')

  if (!normalized) {
    return Number.NaN
  }

  return Number(normalized)
}

function isValidDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }

  const date = new Date(`${value}T00:00:00`)

  return !Number.isNaN(date.getTime())
}

function getTodayDate() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function SppClient() {
  const [supabase] = useState(() => createClient())

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const now = new Date()

  const [data, setData] = useState<SppWithSiswa[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] =
    useState(false)

  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [filterStatus, setFilterStatus] =
    useState<FilterStatus>('semua')
  const [search, setSearch] = useState('')

  const [notice, setNotice] = useState<Notice | null>(null)

  const [importOpen, setImportOpen] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importFileName, setImportFileName] = useState('')
  const [importRows, setImportRows] = useState<
    ImportPreviewRow[]
  >([])
  const [importGlobalError, setImportGlobalError] =
    useState<string | null>(null)

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear()

    return Array.from(
      { length: 7 },
      (_, index) => currentYear - 3 + index,
    )
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)

    const { data: result, error } = await supabase
      .from('spp')
      .select(
        `
          id,
          siswa_id,
          bulan,
          tahun,
          nominal,
          jumlah_bayar,
          status,
          tanggal_bayar,
          catatan,
          siswa:siswa (
            id,
            nama,
            kelas
          )
        `,
      )
      .eq('bulan', bulan)
      .eq('tahun', tahun)
      .order('created_at', { ascending: false })

    if (error) {
      setData([])
      setNotice({
        type: 'error',
        text: `Gagal memuat data SPP: ${error.message}`,
      })
      setLoading(false)
      return
    }

    setData((result as unknown as SppWithSiswa[]) ?? [])
    setLoading(false)
  }, [bulan, supabase, tahun])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const filteredData = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return data.filter((spp) => {
      const status = getDisplayStatus(spp)
      const nama = spp.siswa?.nama?.toLowerCase() ?? ''
      const kelas = spp.siswa?.kelas?.toLowerCase() ?? ''

      const matchesStatus =
        filterStatus === 'semua' || filterStatus === status

      const matchesSearch =
        !normalizedSearch ||
        nama.includes(normalizedSearch) ||
        kelas.includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [data, filterStatus, search])

  const summary = useMemo(() => {
    return data.reduce(
      (result, spp) => {
        const nominal = Number(spp.nominal) || 0
        const jumlahBayar = Number(spp.jumlah_bayar) || 0
        const sisa = Math.max(nominal - jumlahBayar, 0)
        const status = getDisplayStatus(spp)

        result.totalTagihan += nominal
        result.totalTerkumpul += jumlahBayar
        result.totalSisa += sisa
        result[status] += 1

        return result
      },
      {
        totalTagihan: 0,
        totalTerkumpul: 0,
        totalSisa: 0,
        lunas: 0,
        cicil: 0,
        belum: 0,
      },
    )
  }, [data])

  const validImportRows = useMemo(
    () => importRows.filter((row) => row.errors.length === 0),
    [importRows],
  )

  const invalidImportRows = useMemo(
    () => importRows.filter((row) => row.errors.length > 0),
    [importRows],
  )

  function closeImportModal() {
    if (importing) return

    setImportOpen(false)
    setImportFileName('')
    setImportRows([])
    setImportGlobalError(null)
  }

  async function toggleStatus(spp: SppWithSiswa) {
    setUpdating(spp.id)
    setNotice(null)

    const currentStatus = getDisplayStatus(spp)
    const shouldCancel = currentStatus === 'lunas'

    const payload = shouldCancel
      ? {
          status: 'belum' as DatabaseSppStatus,
          jumlah_bayar: 0,
          tanggal_bayar: null,
        }
      : {
          status: 'lunas' as DatabaseSppStatus,
          jumlah_bayar: Number(spp.nominal),
          tanggal_bayar: getTodayDate(),
        }

    const { error } = await supabase
      .from('spp')
      .update(payload)
      .eq('id', spp.id)

    if (error) {
      setNotice({
        type: 'error',
        text: `Gagal memperbarui pembayaran: ${error.message}`,
      })
      setUpdating(null)
      return
    }

    await fetchData()

    setNotice({
      type: 'success',
      text: shouldCancel
        ? 'Status pembayaran berhasil dibatalkan.'
        : 'Pembayaran berhasil ditandai lunas.',
    })

    setUpdating(null)
  }

  async function generateSpp() {
    const confirmed = window.confirm(
      `Generate SPP ${NAMA_BULAN[bulan]} ${tahun} untuk semua siswa aktif dengan nominal ${formatRupiah(DEFAULT_NOMINAL)}?`,
    )

    if (!confirmed) return

    setGenerating(true)
    setNotice(null)

    const { data: siswaList, error: siswaError } =
      await supabase
        .from('siswa')
        .select('id')
        .eq('aktif', true)

    if (siswaError) {
      setNotice({
        type: 'error',
        text: `Gagal mengambil siswa aktif: ${siswaError.message}`,
      })
      setGenerating(false)
      return
    }

    if (!siswaList || siswaList.length === 0) {
      setNotice({
        type: 'error',
        text: 'Tidak ada siswa aktif yang dapat dibuatkan SPP.',
      })
      setGenerating(false)
      return
    }

    const inserts = siswaList.map((siswa) => ({
      siswa_id: siswa.id,
      bulan,
      tahun,
      nominal: DEFAULT_NOMINAL,
      jumlah_bayar: 0,
      status: 'belum' as DatabaseSppStatus,
      tanggal_bayar: null,
      catatan: null,
    }))

    const { error } = await supabase
      .from('spp')
      .upsert(inserts, {
        onConflict: 'siswa_id,bulan,tahun',
        ignoreDuplicates: true,
      })

    if (error) {
      setNotice({
        type: 'error',
        text: `Gagal membuat data SPP: ${error.message}`,
      })
      setGenerating(false)
      return
    }

    await fetchData()

    setNotice({
      type: 'success',
      text: `SPP ${NAMA_BULAN[bulan]} ${tahun} berhasil dibuat.`,
    })

    setGenerating(false)
  }

  async function downloadTemplate() {
    setDownloadingTemplate(true)
    setNotice(null)

    const { data: siswaList, error } = await supabase
      .from('siswa')
      .select('id, nama, kelas, aktif')
      .eq('aktif', true)
      .order('nama', { ascending: true })

    if (error) {
      setNotice({
        type: 'error',
        text: `Gagal membuat template: ${error.message}`,
      })
      setDownloadingTemplate(false)
      return
    }

    if (!siswaList || siswaList.length === 0) {
      setNotice({
        type: 'error',
        text: 'Tidak ada siswa aktif untuk dimasukkan ke template.',
      })
      setDownloadingTemplate(false)
      return
    }

    const header = [
      'siswa_id',
      'nama',
      'kelas',
      'nominal',
      'jumlah_bayar',
      'tanggal_bayar',
      'catatan',
    ]

    const rows = siswaList.map((siswa) => [
      siswa.id,
      siswa.nama,
      siswa.kelas,
      DEFAULT_NOMINAL,
      0,
      '',
      '',
    ])

    const csv = [
      header.map(escapeCsv).join(','),
      ...rows.map((row) => row.map(escapeCsv).join(',')),
    ].join('\n')

    const blob = new Blob([`\uFEFF${csv}`], {
      type: 'text/csv;charset=utf-8',
    })

    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')

    anchor.href = url
    anchor.download = `template-spp-${tahun}-${String(bulan).padStart(
      2,
      '0',
    )}.csv`

    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)

    setDownloadingTemplate(false)

    setNotice({
      type: 'success',
      text: 'Template CSV berhasil diunduh.',
    })
  }

  async function handleImportFile(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    setImportOpen(true)
    setImportFileName(file.name)
    setImportRows([])
    setImportGlobalError(null)

    try {
      const text = await file.text()
      const parsedRows = parseCsv(text)

      if (parsedRows.length < 2) {
        throw new Error(
          'File CSV tidak memiliki data yang bisa diimpor.',
        )
      }

      const headers = parsedRows[0].map(normalizeHeader)

      const requiredHeaders = [
        'siswa_id',
        'nominal',
        'jumlah_bayar',
      ]

      const missingHeaders = requiredHeaders.filter(
        (header) => !headers.includes(header),
      )

      if (missingHeaders.length > 0) {
        throw new Error(
          `Kolom wajib tidak ditemukan: ${missingHeaders.join(', ')}.`,
        )
      }

      const headerIndex = new Map<string, number>()

      headers.forEach((header, index) => {
        headerIndex.set(header, index)
      })

      const getCell = (row: string[], header: string) => {
        const index = headerIndex.get(header)

        if (index === undefined) return ''

        return row[index]?.trim() ?? ''
      }

      const rawRows = parsedRows.slice(1).map((row, index) => ({
        rowNumber: index + 2,
        siswaId: getCell(row, 'siswa_id'),
        sourceNama: getCell(row, 'nama'),
        sourceKelas: getCell(row, 'kelas'),
        nominalText: getCell(row, 'nominal'),
        jumlahBayarText: getCell(row, 'jumlah_bayar'),
        tanggalBayarText: getCell(row, 'tanggal_bayar'),
        catatanText: getCell(row, 'catatan'),
      }))

      const siswaIds = Array.from(
        new Set(
          rawRows
            .map((row) => row.siswaId)
            .filter((id) => id.length > 0),
        ),
      )

      const studentMap = new Map<string, ActiveStudent>()

      if (siswaIds.length > 0) {
        const { data: students, error: studentError } =
          await supabase
            .from('siswa')
            .select('id, nama, kelas, aktif')
            .in('id', siswaIds)

        if (studentError) {
          throw new Error(
            `Gagal memvalidasi siswa: ${studentError.message}`,
          )
        }

        for (const student of (students ??
          []) as ActiveStudent[]) {
          studentMap.set(student.id, student)
        }
      }

      const duplicateCount = rawRows.reduce(
        (result, row) => {
          if (!row.siswaId) return result

          result.set(
            row.siswaId,
            (result.get(row.siswaId) ?? 0) + 1,
          )

          return result
        },
        new Map<string, number>(),
      )

      const previews: ImportPreviewRow[] = rawRows.map(
        (row) => {
          const errors: string[] = []

          const student = studentMap.get(row.siswaId)
          const nominal = parseRupiahCell(row.nominalText)
          const jumlahBayar = parseRupiahCell(
            row.jumlahBayarText || '0',
          )

          if (!row.siswaId) {
            errors.push('siswa_id kosong')
          } else if (!student) {
            errors.push('Siswa tidak ditemukan')
          } else if (!student.aktif) {
            errors.push('Siswa sudah tidak aktif')
          }

          if (
            row.siswaId &&
            (duplicateCount.get(row.siswaId) ?? 0) > 1
          ) {
            errors.push('siswa_id duplikat')
          }

          if (
            !Number.isFinite(nominal) ||
            nominal <= 0
          ) {
            errors.push('Nominal tidak valid')
          }

          if (
            !Number.isFinite(jumlahBayar) ||
            jumlahBayar < 0
          ) {
            errors.push('Jumlah bayar tidak valid')
          }

          if (
            Number.isFinite(nominal) &&
            Number.isFinite(jumlahBayar) &&
            jumlahBayar > nominal
          ) {
            errors.push('Pembayaran melebihi tagihan')
          }

          if (
            row.tanggalBayarText &&
            !isValidDateString(row.tanggalBayarText)
          ) {
            errors.push('Tanggal harus YYYY-MM-DD')
          }

          return {
            rowNumber: row.rowNumber,
            siswaId: row.siswaId,
            nama:
              student?.nama ||
              row.sourceNama ||
              'Siswa tidak dikenal',
            kelas:
              student?.kelas || row.sourceKelas || '-',
            nominal: Number.isFinite(nominal) ? nominal : 0,
            jumlahBayar: Number.isFinite(jumlahBayar)
              ? jumlahBayar
              : 0,
            tanggalBayar:
              row.tanggalBayarText || null,
            catatan: row.catatanText || null,
            errors,
          }
        },
      )

      setImportRows(previews)
    } catch (error) {
      setImportGlobalError(
        error instanceof Error
          ? error.message
          : 'File CSV gagal dibaca.',
      )
    }
  }

  async function importMonthlySpp() {
    if (
      importRows.length === 0 ||
      invalidImportRows.length > 0 ||
      validImportRows.length === 0
    ) {
      return
    }

    const confirmed = window.confirm(
      `Import ${validImportRows.length} data SPP untuk ${NAMA_BULAN[bulan]} ${tahun}? Data lama pada periode yang sama akan diperbarui.`,
    )

    if (!confirmed) return

    setImporting(true)
    setImportGlobalError(null)
    setNotice(null)

    const payload = validImportRows.map((row) => ({
      siswa_id: row.siswaId,
      nominal: row.nominal,
      jumlah_bayar: row.jumlahBayar,
      tanggal_bayar: row.tanggalBayar,
      catatan: row.catatan,
    }))

    const { error } = await supabase.rpc(
      'admin_import_monthly_spp',
      {
        p_bulan: bulan,
        p_tahun: tahun,
        p_rows: payload,
      },
    )

    if (error) {
      setImportGlobalError(error.message)
      setImporting(false)
      return
    }

    await fetchData()

    setImporting(false)
    setImportOpen(false)
    setImportFileName('')
    setImportRows([])

    setNotice({
      type: 'success',
      text: `${validImportRows.length} data SPP ${NAMA_BULAN[bulan]} ${tahun} berhasil diimpor.`,
    })
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleImportFile}
      />

      <Header
        title="Monitoring SPP"
        subtitle="Pantau tagihan, cicilan, dan pembayaran SPP siswa"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={downloadTemplate}
              disabled={downloadingTemplate}
              className="inline-flex items-center gap-2 rounded-full border border-[#DADCE0] bg-white px-4 py-2 text-sm font-medium text-[#3C4043] transition hover:bg-[#F8F9FA] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloadingTemplate ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Unduh Template
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full border border-[#DADCE0] bg-white px-4 py-2 text-sm font-medium text-[#3C4043] transition hover:bg-[#F8F9FA]"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </button>

            <button
              type="button"
              onClick={generateSpp}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-full bg-[#202124] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#303134] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              Generate SPP
            </button>
          </div>
        }
      />

      <main className="mt-4 space-y-5 px-6 pb-8">
        {notice && (
          <div
            className={`flex items-start justify-between gap-4 rounded-2xl border px-4 py-3 ${
              notice.type === 'success'
                ? 'border-[#CEEAD6] bg-[#E6F4EA] text-[#137333]'
                : 'border-[#FAD2CF] bg-[#FCE8E6] text-[#C5221F]'
            }`}
          >
            <div className="flex items-start gap-3">
              {notice.type === 'success' ? (
                <CheckCircle className="mt-0.5 h-5 w-5 shrink-0" />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              )}

              <p className="text-sm font-medium">{notice.text}</p>
            </div>

            <button
              type="button"
              onClick={() => setNotice(null)}
              className="rounded-full p-1 transition hover:bg-black/5"
              aria-label="Tutup notifikasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <SummaryCard
            title="Total Tagihan"
            value={formatRupiah(summary.totalTagihan)}
            description={`${data.length} siswa`}
          />

          <SummaryCard
            title="Terkumpul"
            value={formatRupiah(summary.totalTerkumpul)}
            description="Pembayaran masuk"
            valueClassName="text-[#137333]"
          />

          <SummaryCard
            title="Sisa Tagihan"
            value={formatRupiah(summary.totalSisa)}
            description="Belum tertagih"
            valueClassName="text-[#C5221F]"
          />

          <SummaryCard
            title="Lunas"
            value={String(summary.lunas)}
            description="siswa"
            valueClassName="text-[#137333]"
          />

          <SummaryCard
            title="Cicilan"
            value={String(summary.cicil)}
            description="siswa"
            valueClassName="text-[#B06000]"
          />

          <SummaryCard
            title="Belum Bayar"
            value={String(summary.belum)}
            description="siswa"
            valueClassName="text-[#C5221F]"
          />
        </section>

        <section className="rounded-3xl border border-[#E8EAED] bg-white p-5 shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <div className="flex-1">
              <label
                htmlFor="search-spp"
                className="mb-2 block text-xs font-medium text-[#5F6368]"
              >
                Cari siswa
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#80868B]" />

                <input
                  id="search-spp"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Cari nama atau kelas..."
                  className="h-11 w-full rounded-full border border-[#DADCE0] bg-white pl-11 pr-4 text-sm text-[#202124] outline-none transition placeholder:text-[#9AA0A6] focus:border-[#202124]"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="bulan"
                  className="mb-2 block text-xs font-medium text-[#5F6368]"
                >
                  Bulan
                </label>

                <select
                  id="bulan"
                  value={bulan}
                  onChange={(event) =>
                    setBulan(Number(event.target.value))
                  }
                  className="h-11 min-w-40 rounded-full border border-[#DADCE0] bg-white px-4 text-sm text-[#202124] outline-none focus:border-[#202124]"
                >
                  {NAMA_BULAN.slice(1).map(
                    (namaBulan, index) => (
                      <option
                        key={index + 1}
                        value={index + 1}
                      >
                        {namaBulan}
                      </option>
                    ),
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="tahun"
                  className="mb-2 block text-xs font-medium text-[#5F6368]"
                >
                  Tahun
                </label>

                <select
                  id="tahun"
                  value={tahun}
                  onChange={(event) =>
                    setTahun(Number(event.target.value))
                  }
                  className="h-11 min-w-32 rounded-full border border-[#DADCE0] bg-white px-4 text-sm text-[#202124] outline-none focus:border-[#202124]"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="status"
                  className="mb-2 block text-xs font-medium text-[#5F6368]"
                >
                  Status
                </label>

                <select
                  id="status"
                  value={filterStatus}
                  onChange={(event) =>
                    setFilterStatus(
                      event.target.value as FilterStatus,
                    )
                  }
                  className="h-11 min-w-40 rounded-full border border-[#DADCE0] bg-white px-4 text-sm text-[#202124] outline-none focus:border-[#202124]"
                >
                  <option value="semua">Semua status</option>
                  <option value="lunas">Lunas</option>
                  <option value="cicil">Cicilan</option>
                  <option value="belum">Belum bayar</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#E8EAED] bg-white shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
          <div className="flex items-center justify-between border-b border-[#E8EAED] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[#202124]">
                Rekap {NAMA_BULAN[bulan]} {tahun}
              </h2>

              <p className="mt-1 text-xs text-[#80868B]">
                Menampilkan {filteredData.length} dari {data.length}{' '}
                data SPP.
              </p>
            </div>

            <WalletCards className="h-5 w-5 text-[#5F6368]" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#5F6368]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1050px] text-sm">
                <thead className="bg-[#F8F9FA]">
                  <tr>
                    <TableHead>Nama Siswa</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Tagihan</TableHead>
                    <TableHead>Sudah Dibayar</TableHead>
                    <TableHead>Sisa</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tanggal Bayar</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead align="right">Aksi</TableHead>
                  </tr>
                </thead>

                <tbody>
                  {filteredData.map((spp) => {
                    const status = getDisplayStatus(spp)
                    const nominal = Number(spp.nominal) || 0
                    const jumlahBayar =
                      Number(spp.jumlah_bayar) || 0
                    const sisa = Math.max(
                      nominal - jumlahBayar,
                      0,
                    )

                    return (
                      <tr
                        key={spp.id}
                        className="border-t border-[#E8EAED] transition hover:bg-[#F8F9FA]"
                      >
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#202124]">
                            {spp.siswa?.nama ?? '-'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-[#5F6368]">
                          {spp.siswa?.kelas ?? '-'}
                        </td>

                        <td className="px-5 py-4 font-medium text-[#202124]">
                          {formatRupiah(nominal)}
                        </td>

                        <td className="px-5 py-4 font-medium text-[#137333]">
                          {formatRupiah(jumlahBayar)}
                        </td>

                        <td className="px-5 py-4 font-medium text-[#C5221F]">
                          {formatRupiah(sisa)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(
                              status,
                            )}`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-[#5F6368]">
                          {spp.tanggal_bayar
                            ? formatTanggal(spp.tanggal_bayar)
                            : '-'}
                        </td>

                        <td className="max-w-56 px-5 py-4 text-[#5F6368]">
                          <p className="truncate">
                            {spp.catatan || '-'}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() => toggleStatus(spp)}
                            disabled={updating === spp.id}
                            className={`ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
                              status === 'lunas'
                                ? 'border-[#FAD2CF] bg-white text-[#C5221F] hover:bg-[#FCE8E6]'
                                : 'border-[#CEEAD6] bg-white text-[#137333] hover:bg-[#E6F4EA]'
                            }`}
                          >
                            {updating === spp.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : status === 'lunas' ? (
                              <XCircle className="h-3.5 w-3.5" />
                            ) : (
                              <CheckCircle className="h-3.5 w-3.5" />
                            )}

                            {status === 'lunas'
                              ? 'Batalkan'
                              : status === 'cicil'
                                ? 'Lunasi'
                                : 'Tandai Lunas'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}

                  {filteredData.length === 0 && (
                    <tr>
                      <td colSpan={9}>
                        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F1F3F4]">
                            <FileSpreadsheet className="h-5 w-5 text-[#5F6368]" />
                          </div>

                          <h3 className="font-medium text-[#202124]">
                            Data SPP tidak ditemukan
                          </h3>

                          <p className="mt-1 max-w-md text-sm text-[#80868B]">
                            Generate data SPP atau impor template CSV
                            untuk periode {NAMA_BULAN[bulan]}{' '}
                            {tahun}.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/40 p-4 backdrop-blur-[2px]">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-[#E8EAED] bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-[#E8EAED] px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-[#202124]">
                  Import SPP Bulanan
                </h2>

                <p className="mt-1 text-sm text-[#5F6368]">
                  Periode {NAMA_BULAN[bulan]} {tahun}
                  {importFileName
                    ? ` • ${importFileName}`
                    : ''}
                </p>
              </div>

              <button
                type="button"
                onClick={closeImportModal}
                disabled={importing}
                className="rounded-full border border-[#E8EAED] p-2 text-[#5F6368] transition hover:bg-[#F8F9FA] disabled:opacity-50"
                aria-label="Tutup modal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
              {importGlobalError && (
                <div className="flex items-start gap-3 rounded-2xl border border-[#FAD2CF] bg-[#FCE8E6] px-4 py-3 text-[#C5221F]">
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

                  <p className="text-sm font-medium">
                    {importGlobalError}
                  </p>
                </div>
              )}

              {importRows.length > 0 && (
                <>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <ImportSummary
                      label="Total Baris"
                      value={importRows.length}
                    />

                    <ImportSummary
                      label="Data Valid"
                      value={validImportRows.length}
                      className="text-[#137333]"
                    />

                    <ImportSummary
                      label="Perlu Diperbaiki"
                      value={invalidImportRows.length}
                      className="text-[#C5221F]"
                    />
                  </div>

                  <div className="rounded-2xl border border-[#FEEFC3] bg-[#FEF7E0] px-4 py-3 text-sm text-[#B06000]">
                    File import menggunakan nilai pembayaran
                    kumulatif. Contoh: cicilan pertama Rp100.000
                    dan cicilan kedua Rp150.000 ditulis sebagai
                    jumlah bayar Rp250.000.
                  </div>

                  <div className="overflow-x-auto rounded-2xl border border-[#E8EAED]">
                    <table className="w-full min-w-[1000px] text-sm">
                      <thead className="bg-[#F8F9FA]">
                        <tr>
                          <TableHead>Baris</TableHead>
                          <TableHead>Siswa</TableHead>
                          <TableHead>Kelas</TableHead>
                          <TableHead>Tagihan</TableHead>
                          <TableHead>Dibayar</TableHead>
                          <TableHead>Sisa</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Validasi</TableHead>
                        </tr>
                      </thead>

                      <tbody>
                        {importRows.map((row) => {
                          const sisa = Math.max(
                            row.nominal - row.jumlahBayar,
                            0,
                          )

                          const status: DisplaySppStatus =
                            row.jumlahBayar <= 0
                              ? 'belum'
                              : row.jumlahBayar < row.nominal
                                ? 'cicil'
                                : 'lunas'

                          return (
                            <tr
                              key={`${row.rowNumber}-${row.siswaId}`}
                              className="border-t border-[#E8EAED]"
                            >
                              <td className="px-4 py-3 text-[#80868B]">
                                {row.rowNumber}
                              </td>

                              <td className="px-4 py-3">
                                <p className="font-medium text-[#202124]">
                                  {row.nama}
                                </p>

                                <p className="mt-0.5 max-w-48 truncate text-[11px] text-[#9AA0A6]">
                                  {row.siswaId || '-'}
                                </p>
                              </td>

                              <td className="px-4 py-3 text-[#5F6368]">
                                {row.kelas}
                              </td>

                              <td className="px-4 py-3 text-[#202124]">
                                {formatRupiah(row.nominal)}
                              </td>

                              <td className="px-4 py-3 text-[#137333]">
                                {formatRupiah(row.jumlahBayar)}
                              </td>

                              <td className="px-4 py-3 text-[#C5221F]">
                                {formatRupiah(sisa)}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClass(
                                    status,
                                  )}`}
                                >
                                  {getStatusLabel(status)}
                                </span>
                              </td>

                              <td className="px-4 py-3">
                                {row.errors.length === 0 ? (
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#137333]">
                                    <Check className="h-4 w-4" />
                                    Valid
                                  </span>
                                ) : (
                                  <div className="space-y-1">
                                    {row.errors.map((error) => (
                                      <p
                                        key={error}
                                        className="text-xs font-medium text-[#C5221F]"
                                      >
                                        {error}
                                      </p>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {!importGlobalError &&
                importRows.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Loader2 className="mb-4 h-7 w-7 animate-spin text-[#5F6368]" />

                    <p className="text-sm text-[#5F6368]">
                      Membaca dan memvalidasi file CSV...
                    </p>
                  </div>
                )}
            </div>

            <div className="flex flex-col-reverse gap-3 border-t border-[#E8EAED] px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-[#80868B]">
                Import hanya dapat dilakukan jika seluruh baris
                sudah valid.
              </p>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeImportModal}
                  disabled={importing}
                  className="rounded-full border border-[#DADCE0] bg-white px-4 py-2 text-sm font-medium text-[#3C4043] transition hover:bg-[#F8F9FA] disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={importMonthlySpp}
                  disabled={
                    importing ||
                    validImportRows.length === 0 ||
                    invalidImportRows.length > 0
                  }
                  className="inline-flex items-center gap-2 rounded-full bg-[#202124] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#303134] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {importing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}

                  Import {validImportRows.length} Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function SummaryCard({
  title,
  value,
  description,
  valueClassName = 'text-[#202124]',
}: {
  title: string
  value: string
  description: string
  valueClassName?: string
}) {
  return (
    <article className="rounded-3xl border border-[#E8EAED] bg-white p-5 shadow-[0_1px_2px_rgba(60,64,67,0.08)]">
      <p className="text-xs font-medium text-[#80868B]">
        {title}
      </p>

      <p
        className={`mt-3 truncate text-xl font-semibold ${valueClassName}`}
      >
        {value}
      </p>

      <p className="mt-1 text-xs text-[#9AA0A6]">
        {description}
      </p>
    </article>
  )
}

function ImportSummary({
  label,
  value,
  className = 'text-[#202124]',
}: {
  label: string
  value: number
  className?: string
}) {
  return (
    <div className="rounded-2xl border border-[#E8EAED] bg-white px-4 py-3">
      <p className="text-xs text-[#80868B]">{label}</p>

      <p className={`mt-1 text-2xl font-semibold ${className}`}>
        {value}
      </p>
    </div>
  )
}

function TableHead({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`whitespace-nowrap px-5 py-3 text-xs font-semibold uppercase tracking-[0.04em] text-[#80868B] ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      {children}
    </th>
  )
}