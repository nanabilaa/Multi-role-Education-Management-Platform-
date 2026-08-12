'use client'

import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  AlertCircle,
  AlertTriangle,
  BookOpenCheck,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileJson,
  Loader2,
  ReceiptText,
  ShieldCheck,
  Trash2,
  WalletCards,
  X,
} from 'lucide-react'

type ResetMode =
  | 'jurnal'
  | 'spp'
  | 'transaksi'
  | 'operasional'

type ResetItem = {
  mode: ResetMode
  title: string
  description: string
  affected: string[]
  icon: LucideIcon
  accent: string
  background: string
  badgeClass: string
  danger?: boolean
}

const resetItems: ResetItem[] = [
  {
    mode: 'jurnal',
    title: 'Reset Jurnal',
    description:
      'Menghapus seluruh jurnal pembelajaran yang tersimpan di sistem.',
    affected: [
      'Catatan jurnal pembelajaran',
      'Materi dan evaluasi sesi',
      'Foto yang tercatat pada jurnal',
    ],
    icon: BookOpenCheck,
    accent: '#34A853',
    background: '#EAF6ED',
    badgeClass: 'bg-[#EAF6ED] text-[#137333]',
  },
  {
    mode: 'spp',
    title: 'Reset SPP',
    description:
      'Menghapus seluruh tagihan SPP beserta transaksi pembayaran terkait.',
    affected: [
      'Tagihan SPP siswa',
      'Riwayat pembayaran SPP',
      'Status lunas dan belum lunas',
    ],
    icon: ReceiptText,
    accent: '#F9AB00',
    background: '#FEF7E0',
    badgeClass: 'bg-[#FEF7E0] text-[#B06000]',
  },
  {
    mode: 'transaksi',
    title: 'Reset Transaksi',
    description:
      'Menghapus seluruh catatan pemasukan dan pengeluaran dana.',
    affected: [
      'Catatan pemasukan',
      'Catatan pengeluaran',
      'Riwayat transaksi dana',
    ],
    icon: WalletCards,
    accent: '#F9AB00',
    background: '#FEF7E0',
    badgeClass: 'bg-[#FEF7E0] text-[#B06000]',
  },
  {
    mode: 'operasional',
    title: 'Reset Operasional',
    description:
      'Menghapus data operasional utama tanpa menghapus akun dan data siswa.',
    affected: [
      'Sesi pembelajaran',
      'Jurnal pembelajaran',
      'Honor tentor',
      'Tagihan dan transaksi SPP',
      'Pemasukan dan pengeluaran',
    ],
    icon: AlertTriangle,
    accent: '#EA4335',
    background: '#FEF1F0',
    badgeClass: 'bg-[#FEF1F0] text-[#C5221F]',
    danger: true,
  },
]

export default function SuperadminBackupPage() {
  const [selectedReset, setSelectedReset] =
    useState<ResetItem | null>(null)

  const [confirmationText, setConfirmationText] =
    useState('')

  const [understood, setUnderstood] =
    useState(false)

  const [finalUnderstood, setFinalUnderstood] =
    useState(false)

  const [loadingMode, setLoadingMode] =
    useState<ResetMode | ''>('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const requiredConfirmation = selectedReset
    ? `RESET ${selectedReset.mode.toUpperCase()}`
    : ''

  const confirmationValid =
    selectedReset !== null &&
    confirmationText.trim().toUpperCase() ===
      requiredConfirmation &&
    understood &&
    (!selectedReset.danger || finalUnderstood)

  function openResetConfirmation(item: ResetItem) {
    setError('')
    setSuccess('')
    setConfirmationText('')
    setUnderstood(false)
    setFinalUnderstood(false)
    setSelectedReset(item)
  }

  function closeResetConfirmation() {
    if (loadingMode) return

    setSelectedReset(null)
    setConfirmationText('')
    setUnderstood(false)
    setFinalUnderstood(false)
  }

  async function runReset() {
    if (!selectedReset || !confirmationValid) {
      return
    }

    const item = selectedReset

    setError('')
    setSuccess('')
    setLoadingMode(item.mode)

    try {
      const response = await fetch('/api/superadmin/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reset_mode: item.mode,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(
          result?.error ||
            `Reset gagal dengan status ${response.status}.`
        )
      }

      setSelectedReset(null)
      setConfirmationText('')
      setUnderstood(false)
      setFinalUnderstood(false)

      setSuccess(
        result?.message ||
          `${item.title} berhasil dijalankan.`
      )
    } catch (resetError) {
      console.error('RESET ERROR:', resetError)

      setError(
        resetError instanceof Error
          ? resetError.message
          : 'Reset gagal dijalankan.'
      )
    } finally {
      setLoadingMode('')
    }
  }

  return (
    <>
      <section className="mx-auto max-w-6xl space-y-8">
        {/* Hero */}
        <div className="mx-auto max-w-4xl py-4 text-center sm:py-8">
          <div className="mb-6 flex justify-center gap-2">
            <span className="h-1.5 w-11 rounded-full bg-[#EA4335]" />
            <span className="h-1.5 w-11 rounded-full bg-[#FABB05]" />
            <span className="h-1.5 w-11 rounded-full bg-[#34A853]" />
          </div>

          <p className="text-sm font-medium text-[#80868B]">
            Pemeliharaan data
          </p>

          <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#202124] sm:text-5xl">
            Backup &amp; reset
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5F6368] sm:text-base">
            Export data sistem dan kelola penghapusan data
            operasional secara terkontrol. Akun serta data
            siswa tidak ikut terhapus saat reset operasional.
          </p>
        </div>

        {/* Alerts */}
        {error && (
          <AlertBox
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        )}

        {success && (
          <AlertBox
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        )}

        {/* Safety information */}
        <div className="grid gap-4 md:grid-cols-3">
          <SafetyCard
            icon={ShieldCheck}
            title="Akses terbatas"
            description="Fitur backup dan reset hanya dapat digunakan oleh superadmin."
            color="#34A853"
            background="#EAF6ED"
          />

          <SafetyCard
            icon={AlertTriangle}
            title="Reset permanen"
            description="Data yang sudah dihapus tidak dapat dipulihkan langsung dari halaman ini."
            color="#F9AB00"
            background="#FEF7E0"
          />

          <SafetyCard
            icon={DatabaseBackup}
            title="Export manual"
            description="Simpan data sistem sebagai file JSON sebelum melakukan reset."
            color="#EA4335"
            background="#FEF1F0"
          />
        </div>

        {/* Manual backup export */}
        <ManualBackupExport />

        {/* Reset section */}
        <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
                Reset data
              </p>

              <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
                Pilih kategori data
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#80868B]">
                Periksa cakupan data sebelum menjalankan reset.
                Setiap tindakan memerlukan konfirmasi manual.
              </p>
            </div>

            <span className="w-fit rounded-full bg-[#FEF7E0] px-3 py-1.5 text-xs font-semibold text-[#B06000]">
              Area sensitif
            </span>
          </div>

          <div className="mt-7 grid gap-4 lg:grid-cols-2">
            {resetItems.map((item) => (
              <ResetCard
                key={item.mode}
                item={item}
                loading={
                  loadingMode === item.mode
                }
                disabled={Boolean(loadingMode)}
                onReset={() =>
                  openResetConfirmation(item)
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* Confirmation modal */}
      {selectedReset && (
        <ResetConfirmationModal
          item={selectedReset}
          requiredConfirmation={
            requiredConfirmation
          }
          confirmationText={
            confirmationText
          }
          understood={understood}
          finalUnderstood={
            finalUnderstood
          }
          confirmationValid={
            confirmationValid
          }
          loading={
            loadingMode === selectedReset.mode
          }
          onConfirmationTextChange={
            setConfirmationText
          }
          onUnderstoodChange={
            setUnderstood
          }
          onFinalUnderstoodChange={
            setFinalUnderstood
          }
          onClose={
            closeResetConfirmation
          }
          onConfirm={runReset}
        />
      )}
    </>
  )
}

function ManualBackupExport() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleBackup() {
    if (loading) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/superadmin/backup', {
        method: 'GET',
        cache: 'no-store',
      })

      if (!response.ok) {
        const result = await response.json().catch(() => null)

        throw new Error(
          result?.error ||
            `Backup gagal dengan status ${response.status}.`
        )
      }

      const blob = await response.blob()

      const disposition =
        response.headers.get('content-disposition') || ''

      const fileNameMatch =
        disposition.match(/filename="?([^"]+)"?/i)

      const fileName =
        fileNameMatch?.[1] ||
        `cbs-backup-${new Date()
          .toISOString()
          .slice(0, 10)}.json`

      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')

      anchor.href = url
      anchor.download = fileName
      anchor.style.display = 'none'

      document.body.appendChild(anchor)
      anchor.click()
      document.body.removeChild(anchor)

      window.setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 60_000)

      setSuccess(
        'Backup JSON berhasil dibuat dan diunduh.'
      )
    } catch (backupError) {
      console.error('BACKUP ERROR:', backupError)

      setError(
        backupError instanceof Error
          ? backupError.message
          : 'Backup gagal dibuat.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6ED] text-[#137333]">
            <FileJson className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Backup manual
            </p>

            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[#202124]">
              Export data CBS ke JSON
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#80868B]">
              Backup berisi data utama sistem: akun profil, siswa,
              sesi, jurnal, honor, SPP, transaksi dana, serta faktur
              keluarga. File dibuat di server dan hanya dapat diakses
              oleh superadmin.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleBackup}
          disabled={loading}
          className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#137333] px-5 text-sm font-semibold text-white transition hover:bg-[#0F5F2B] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Membuat backup...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download backup
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="mt-5">
          <AlertBox
            type="error"
            message={error}
            onClose={() => setError('')}
          />
        </div>
      )}

      {success && (
        <div className="mt-5">
          <AlertBox
            type="success"
            message={success}
            onClose={() => setSuccess('')}
          />
        </div>
      )}
    </div>
  )
}

function ResetCard({
  item,
  loading,
  disabled,
  onReset,
}: {
  item: ResetItem
  loading: boolean
  disabled: boolean
  onReset: () => void
}) {
  const Icon = item.icon

  return (
    <article
      className={[
        'rounded-[24px] border bg-white p-5 transition sm:p-6',
        item.danger
          ? 'border-[#FAD2CF]'
          : 'border-[#E8EAED] hover:border-[#DADCE0]',
      ].join(' ')}
    >
      <div className="flex items-start gap-4">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
          style={{
            color: item.accent,
            backgroundColor:
              item.background,
          }}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-[#202124]">
              {item.title}
            </h3>

            <span
              className={[
                'rounded-full px-2.5 py-1 text-[10px] font-semibold',
                item.badgeClass,
              ].join(' ')}
            >
              {item.danger
                ? 'Risiko tinggi'
                : 'Reset terpilih'}
            </span>
          </div>

          <p className="mt-2 text-sm leading-6 text-[#80868B]">
            {item.description}
          </p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl bg-[#F8F9FA] p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
          Data terdampak
        </p>

        <ul className="mt-3 space-y-2">
          {item.affected.map(
            (affectedItem) => (
              <li
                key={affectedItem}
                className="flex items-start gap-2 text-sm text-[#5F6368]"
              >
                <span
                  className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    backgroundColor:
                      item.accent,
                  }}
                />

                <span>{affectedItem}</span>
              </li>
            )
          )}
        </ul>
      </div>

      <button
        type="button"
        onClick={onReset}
        disabled={disabled}
        className={[
          'mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50',
          item.danger
            ? 'bg-[#EA4335] text-white hover:bg-[#D93025]'
            : 'border border-[#DADCE0] bg-white text-[#3C4043] hover:bg-[#F8F9FA]',
        ].join(' ')}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            <Trash2 className="h-4 w-4" />
            {item.title}
          </>
        )}
      </button>
    </article>
  )
}

function SafetyCard({
  icon: Icon,
  title,
  description,
  color,
  background,
}: {
  icon: LucideIcon
  title: string
  description: string
  color: string
  background: string
}) {
  return (
    <div className="rounded-[22px] border border-[#E8EAED] bg-white p-5">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-2xl"
        style={{
          color,
          backgroundColor: background,
        }}
      >
        <Icon className="h-5 w-5" />
      </div>

      <h3 className="mt-5 font-semibold text-[#202124]">
        {title}
      </h3>

      <p className="mt-2 text-sm leading-6 text-[#80868B]">
        {description}
      </p>
    </div>
  )
}

function ResetConfirmationModal({
  item,
  requiredConfirmation,
  confirmationText,
  understood,
  finalUnderstood,
  confirmationValid,
  loading,
  onConfirmationTextChange,
  onUnderstoodChange,
  onFinalUnderstoodChange,
  onClose,
  onConfirm,
}: {
  item: ResetItem
  requiredConfirmation: string
  confirmationText: string
  understood: boolean
  finalUnderstood: boolean
  confirmationValid: boolean
  loading: boolean
  onConfirmationTextChange: (
    value: string
  ) => void
  onUnderstoodChange: (
    value: boolean
  ) => void
  onFinalUnderstoodChange: (
    value: boolean
  ) => void
  onClose: () => void
  onConfirm: () => void
}) {
  const Icon = item.icon

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-dialog-title"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-[#202124]/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-6"
    >
      <div className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] bg-white shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:max-w-xl sm:rounded-[30px]">
        <div className="flex items-start justify-between gap-4 border-b border-[#ECEFF1] p-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
              style={{
                color: item.accent,
                backgroundColor:
                  item.background,
              }}
            >
              <Icon className="h-5 w-5" />
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
                Konfirmasi reset
              </p>

              <h2
                id="reset-dialog-title"
                className="mt-1 text-xl font-semibold text-[#202124]"
              >
                {item.title}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup konfirmasi"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#80868B] transition hover:bg-[#F1F3F4] hover:text-[#202124] disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6 sm:p-7">
          <div
            className={[
              'rounded-2xl border p-4',
              item.danger
                ? 'border-[#FAD2CF] bg-[#FEF1F0]'
                : 'border-[#FCE8B2] bg-[#FEF7E0]',
            ].join(' ')}
          >
            <div className="flex items-start gap-3">
              <AlertTriangle
                className={[
                  'mt-0.5 h-5 w-5 shrink-0',
                  item.danger
                    ? 'text-[#EA4335]'
                    : 'text-[#F9AB00]',
                ].join(' ')}
              />

              <div>
                <p
                  className={[
                    'text-sm font-semibold',
                    item.danger
                      ? 'text-[#C5221F]'
                      : 'text-[#B06000]',
                  ].join(' ')}
                >
                  Tindakan ini tidak dapat dibatalkan
                </p>

                <p
                  className={[
                    'mt-1 text-sm leading-6',
                    item.danger
                      ? 'text-[#A50E0E]'
                      : 'text-[#8D5200]',
                  ].join(' ')}
                >
                  {item.description}
                </p>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
              Data yang akan dihapus
            </p>

            <div className="mt-3 rounded-2xl bg-[#F8F9FA] p-4">
              <ul className="space-y-2.5">
                {item.affected.map(
                  (affectedItem) => (
                    <li
                      key={affectedItem}
                      className="flex items-start gap-2 text-sm text-[#5F6368]"
                    >
                      <Trash2 className="mt-0.5 h-4 w-4 shrink-0 text-[#EA4335]" />

                      {affectedItem}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#E8EAED] p-4">
            <input
              type="checkbox"
              checked={understood}
              disabled={loading}
              onChange={(event) =>
                onUnderstoodChange(
                  event.target.checked
                )
              }
              className="mt-0.5 h-4 w-4 rounded border-[#DADCE0] accent-[#34A853]"
            />

            <span className="text-sm leading-6 text-[#5F6368]">
              Saya memahami bahwa data yang dipilih
              akan dihapus dan tidak dapat dipulihkan
              dari halaman ini.
            </span>
          </label>

          {item.danger && (
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[#FAD2CF] bg-[#FEF1F0] p-4">
              <input
                type="checkbox"
                checked={finalUnderstood}
                disabled={loading}
                onChange={(event) =>
                  onFinalUnderstoodChange(
                    event.target.checked
                  )
                }
                className="mt-0.5 h-4 w-4 rounded border-[#DADCE0] accent-[#EA4335]"
              />

              <span className="text-sm leading-6 text-[#A50E0E]">
                Saya memastikan reset operasional
                memang diperlukan. Akun dan data
                siswa tetap disimpan, tetapi seluruh
                data operasional akan dihapus.
              </span>
            </label>
          )}

          <label className="block">
            <span className="text-xs font-semibold text-[#5F6368]">
              Ketik{' '}
              <strong className="text-[#202124]">
                {requiredConfirmation}
              </strong>{' '}
              untuk melanjutkan
            </span>

            <input
              type="text"
              value={confirmationText}
              disabled={loading}
              autoComplete="off"
              onChange={(event) =>
                onConfirmationTextChange(
                  event.target.value
                )
              }
              placeholder={
                requiredConfirmation
              }
              className="mt-2 h-[52px] w-full rounded-2xl border border-[#DADCE0] bg-white px-4 text-sm font-semibold uppercase tracking-[0.04em] text-[#202124] outline-none transition placeholder:font-normal placeholder:tracking-normal placeholder:text-[#BDC1C6] focus:border-[#EA4335] focus:ring-4 focus:ring-[#EA4335]/10 disabled:bg-[#F1F3F4]"
            />
          </label>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-[#ECEFF1] p-6 sm:flex-row sm:justify-end sm:p-7">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[#DADCE0] bg-white px-5 text-sm font-semibold text-[#3C4043] transition hover:bg-[#F8F9FA] disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={
              !confirmationValid ||
              loading
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#EA4335] px-5 text-sm font-semibold text-white transition hover:bg-[#D93025] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses reset...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Hapus data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertBox({
  type,
  message,
  onClose,
}: {
  type: 'error' | 'success'
  message: string
  onClose: () => void
}) {
  const isSuccess = type === 'success'

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium',
        isSuccess
          ? 'border-[#CEEAD6] bg-[#EAF6ED] text-[#137333]'
          : 'border-[#FAD2CF] bg-[#FEF1F0] text-[#C5221F]',
      ].join(' ')}
    >
      {isSuccess ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      )}

      <p className="min-w-0 flex-1">
        {message}
      </p>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition hover:bg-black/5"
      >
        Tutup
      </button>
    </div>
  )
}
