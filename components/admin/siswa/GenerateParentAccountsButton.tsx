'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  UsersRound,
} from 'lucide-react'

type GenerationResult = {
  siswa_id: string
  nama_siswa: string
  kelas: string
  nama_ortu: string
  login_code: string
  password: string
  status:
    | 'berhasil'
    | 'ditautkan'
    | 'gagal'
  error: string | null
}

type GenerateResponse = {
  message?: string
  error?: string
  summary?: {
    total_active: number
    candidates: number
    created: number
    linked: number
    failed: number
    skipped_existing: number
  }
  results?: GenerationResult[]
}

function escapeCsvCell(
  value:
    | string
    | number
    | null
    | undefined,
) {
  const text = String(value ?? '')

  if (
    text.includes(';') ||
    text.includes('"') ||
    text.includes('\n')
  ) {
    return `"${text.replaceAll(
      '"',
      '""',
    )}"`
  }

  return text
}

function downloadCredentialCsv(
  results: GenerationResult[],
) {
  if (results.length === 0) {
    return
  }

  const header = [
    'No',
    'Nama Siswa',
    'Kelas',
    'Nama Orang Tua',
    'ID Login',
    'Password',
    'Status',
    'Keterangan',
  ]

  const rows = results.map(
    (item, index) => [
      index + 1,
      item.nama_siswa,
      item.kelas,
      item.nama_ortu,
      item.login_code,
      item.password,
      item.status === 'berhasil'
        ? 'Akun baru'
        : item.status === 'ditautkan'
          ? 'Akun lama ditautkan'
          : 'Gagal',
      item.error || '',
    ],
  )

  const csv = [
    header
      .map(escapeCsvCell)
      .join(';'),

    ...rows.map((row) =>
      row
        .map(escapeCsvCell)
        .join(';'),
    ),
  ].join('\n')

  const blob = new Blob(
    [`\uFEFF${csv}`],
    {
      type: 'text/csv;charset=utf-8',
    },
  )

  const url =
    URL.createObjectURL(blob)

  const link =
    document.createElement('a')

  link.href = url

  link.download =
    `akun-orang-tua-cbs-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`

  document.body.appendChild(link)

  link.click()
  link.remove()

  URL.revokeObjectURL(url)
}

export default function GenerateParentAccountsButton({
  candidateCount,
}: {
  candidateCount: number
}) {
  const router = useRouter()

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [error, setError] =
    useState('')

  const [
    lastResults,
    setLastResults,
  ] = useState<GenerationResult[]>([])

  async function handleGenerate() {
    if (candidateCount <= 0) {
      setMessage(
        'Semua siswa aktif sudah memiliki akun orang tua.',
      )

      return
    }

    const confirmed =
      window.confirm(
        `Buat akun orang tua untuk ${candidateCount} siswa aktif yang belum memiliki akun?\n\nPassword awal seluruh akun: \n\nAkun yang sudah terhubung tidak akan diubah.`,
      )

    if (!confirmed) {
      return
    }

    setLoading(true)
    setMessage('')
    setError('')
    setLastResults([])

    try {
      const response = await fetch(
        '/api/admin/siswa/generate-parent-accounts',
        {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
        },
      )

      const payload =
        (await response.json()) as GenerateResponse

      if (!response.ok) {
        throw new Error(
          payload.error ||
            'Gagal membuat akun orang tua.',
        )
      }

      const results =
        payload.results ?? []

      setLastResults(results)

      setMessage(
        payload.message ||
          'Proses pembuatan akun selesai.',
      )

      if (results.length > 0) {
        downloadCredentialCsv(results)
      }

      router.refresh()
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'Gagal membuat akun orang tua.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleGenerate}
        disabled={
          loading ||
          candidateCount <= 0
        }
        className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#FFF8E6] px-5 text-sm font-black text-[#063D27] transition hover:bg-[#FFF1C2] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UsersRound className="h-4 w-4" />
        )}

        {loading
          ? 'Membuat akun...'
          : `Generate Akun Ortu (${candidateCount})`}
      </button>

      {lastResults.length > 0 && (
        <button
          type="button"
          onClick={() =>
            downloadCredentialCsv(
              lastResults,
            )
          }
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-4 text-xs font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
        >
          <Download className="h-3.5 w-3.5" />
          Unduh Ulang Daftar Akun
        </button>
      )}

      {message && (
        <div className="flex max-w-sm items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="flex max-w-sm items-start gap-2 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

          <span>{error}</span>
        </div>
      )}
    </div>
  )
}