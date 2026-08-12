'use client'

import { useMemo, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  DatabaseBackup,
  Download,
  FileJson,
  Loader2,
  ShieldCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type BackupSectionKey =
  | 'akun'
  | 'pembelajaran'
  | 'keuangan'
  | 'pengaturan'
  | 'audit'

type BackupTable =
  | 'profiles'
  | 'siswa'
  | 'tentor_members'
  | 'sesi'
  | 'sesi_siswa'
  | 'jurnal'
  | 'spp'
  | 'honor'
  | 'transaksi_dana'
  | 'payment_accounts'
  | 'app_settings'
  | 'cbs_audit_logs'

type BackupSection = {
  key: BackupSectionKey
  label: string
  description: string
  tables: BackupTable[]
  accent: string
  background: string
}

const backupSections: BackupSection[] = [
  {
    key: 'akun',
    label: 'Akun & Siswa',
    description: 'Profile pengguna, siswa, dan keanggotaan tentor.',
    tables: ['profiles', 'siswa', 'tentor_members'],
    accent: '#34A853',
    background: '#EAF6ED',
  },
  {
    key: 'pembelajaran',
    label: 'Pembelajaran',
    description: 'Sesi, peserta sesi, dan jurnal pembelajaran.',
    tables: ['sesi', 'sesi_siswa', 'jurnal'],
    accent: '#F9AB00',
    background: '#FEF7E0',
  },
  {
    key: 'keuangan',
    label: 'Keuangan',
    description: 'SPP, honor, transaksi dana, dan rekening pembayaran.',
    tables: [
      'spp',
      'honor',
      'transaksi_dana',
      'payment_accounts',
    ],
    accent: '#EA4335',
    background: '#FEF1F0',
  },
  {
    key: 'pengaturan',
    label: 'Pengaturan',
    description: 'Konfigurasi dan pengaturan aplikasi.',
    tables: ['app_settings'],
    accent: '#4285F4',
    background: '#E8F0FE',
  },
  {
    key: 'audit',
    label: 'Audit Log',
    description: 'Riwayat aktivitas yang tercatat pada sistem.',
    tables: ['cbs_audit_logs'],
    accent: '#5F6368',
    background: '#F1F3F4',
  },
]

const initialSelectedSections: Record<BackupSectionKey, boolean> = {
  akun: true,
  pembelajaran: true,
  keuangan: true,
  pengaturan: true,
  audit: true,
}

export default function ManualBackupExport() {
  const supabase = createClient()

  const [selectedSections, setSelectedSections] = useState(
    initialSelectedSections
  )

  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const selectedCount = useMemo(() => {
    return Object.values(selectedSections).filter(Boolean).length
  }, [selectedSections])

  const allSelected = selectedCount === backupSections.length

  function toggleSection(key: BackupSectionKey) {
    setSelectedSections((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }

  function selectAll() {
    setSelectedSections({
      akun: true,
      pembelajaran: true,
      keuangan: true,
      pengaturan: true,
      audit: true,
    })
  }

  function clearSelection() {
    setSelectedSections({
      akun: false,
      pembelajaran: false,
      keuangan: false,
      pengaturan: false,
      audit: false,
    })
  }

  async function loadTable(table: BackupTable) {
    switch (table) {
      case 'profiles':
        return supabase.from('profiles').select('*')

      case 'siswa':
        return supabase.from('siswa').select('*')

      case 'tentor_members':
        return supabase.from('tentor_members').select('*')

      case 'sesi':
        return supabase.from('sesi').select('*')

      case 'sesi_siswa':
        return supabase.from('sesi_siswa').select('*')

      case 'jurnal':
        return supabase.from('jurnal').select('*')

      case 'spp':
        return supabase.from('spp').select('*')

      case 'honor':
        return supabase.from('honor').select('*')

      case 'transaksi_dana':
        return supabase.from('transaksi_dana').select('*')

      case 'payment_accounts':
        return supabase.from('payment_accounts').select('*')

      case 'app_settings':
        return supabase.from('app_settings').select('*')

      case 'cbs_audit_logs':
        return supabase
          .from('cbs_audit_logs')
          .select('*')
          .order('created_at', {
            ascending: false,
          })

      default: {
        const exhaustiveCheck: never = table
        throw new Error(
          `Tabel backup tidak dikenali: ${exhaustiveCheck}`
        )
      }
    }
  }

  async function exportBackup() {
    setError('')
    setSuccess('')

    const selected = backupSections.filter(
      (section) => selectedSections[section.key]
    )

    if (selected.length === 0) {
      setError('Pilih minimal satu kategori data.')
      return
    }

    setExporting(true)

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error(
          authError?.message ||
            'Sesi login tidak ditemukan. Silakan login ulang.'
        )
      }

      const tables = Array.from(
        new Set(
          selected.flatMap((section) => section.tables)
        )
      )

      const backupData: Record<string, unknown[]> = {}
      const tableCounts: Record<string, number> = {}

      for (const table of tables) {
        const { data, error: tableError } =
          await loadTable(table)

        if (tableError) {
          throw new Error(
            `Gagal membaca tabel ${table}: ${tableError.message}`
          )
        }

        const rows = (data || []) as unknown[]

        backupData[table] = rows
        tableCounts[table] = rows.length
      }

      const exportedAt = new Date()
      const totalRows = Object.values(tableCounts).reduce(
        (total, count) => total + count,
        0
      )

      const backupPayload = {
        metadata: {
          application: 'CBS System',
          backup_version: 1,
          exported_at: exportedAt.toISOString(),
          exported_by: {
            id: user.id,
            email: user.email || null,
          },
          selected_sections: selected.map(
            (section) => section.key
          ),
          included_tables: tables,
          table_counts: tableCounts,
          total_rows: totalRows,
          note: 'File ini berisi data database. Password Supabase Auth dan file Supabase Storage tidak disertakan.',
        },
        data: backupData,
      }

      const jsonContent = JSON.stringify(
        backupPayload,
        null,
        2
      )

      const blob = new Blob([jsonContent], {
        type: 'application/json;charset=utf-8',
      })

      const fileTimestamp = exportedAt
        .toISOString()
        .replace(/[:.]/g, '-')

      const fileName = `cbs-backup-${fileTimestamp}.json`
      const downloadUrl = URL.createObjectURL(blob)

      const anchor = document.createElement('a')
      anchor.href = downloadUrl
      anchor.download = fileName
      document.body.appendChild(anchor)
      anchor.click()
      anchor.remove()

      window.setTimeout(() => {
        URL.revokeObjectURL(downloadUrl)
      }, 1000)

      const { error: auditError } = await supabase
        .from('cbs_audit_logs')
        .insert({
          actor_id: user.id,
          action: 'EXPORT_BACKUP',
          target_table: 'multiple_tables',
          detail: `Export backup manual: ${selected
            .map((section) => section.label)
            .join(', ')}. Total ${totalRows} data.`,
        })

      if (auditError) {
        console.error('BACKUP AUDIT ERROR:', auditError)
      }

      const sizeKb = (blob.size / 1024).toFixed(1)

      setSuccess(
        `Backup berhasil diunduh: ${fileName} · ${totalRows} data · ${sizeKb} KB.`
      )
    } catch (exportError) {
      console.error('EXPORT BACKUP ERROR:', exportError)

      setError(
        exportError instanceof Error
          ? exportError.message
          : 'Terjadi kesalahan saat membuat backup.'
      )
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6ED] text-[#34A853]">
            <DatabaseBackup className="h-5 w-5" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Manual backup
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
              Export data
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#80868B]">
              Pilih kategori yang ingin disimpan, kemudian
              unduh sebagai satu file JSON.
            </p>
          </div>
        </div>

        <span className="w-fit rounded-full bg-[#EAF6ED] px-3 py-1.5 text-xs font-semibold text-[#137333]">
          {selectedCount} kategori dipilih
        </span>
      </div>

      {error && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#FAD2CF] bg-[#FEF1F0] p-4 text-sm font-medium text-[#C5221F]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-[#CEEAD6] bg-[#EAF6ED] p-4 text-sm font-medium text-[#137333]">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#5F6368]">
          Kategori data
        </p>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={selectAll}
            disabled={allSelected || exporting}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-[#1A73E8] transition hover:bg-[#E8F0FE] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Pilih semua
          </button>

          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedCount === 0 || exporting}
            className="rounded-xl px-3 py-2 text-xs font-semibold text-[#5F6368] transition hover:bg-[#F1F3F4] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Kosongkan
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {backupSections.map((section) => {
          const selected = selectedSections[section.key]

          return (
            <button
              key={section.key}
              type="button"
              disabled={exporting}
              onClick={() => toggleSection(section.key)}
              className={[
                'relative rounded-[22px] border p-5 text-left transition',
                selected
                  ? 'border-[#34A853] bg-[#FBFFFC] shadow-[0_0_0_3px_rgba(52,168,83,0.08)]'
                  : 'border-[#E8EAED] bg-white hover:border-[#DADCE0] hover:bg-[#F8F9FA]',
                exporting
                  ? 'cursor-not-allowed opacity-60'
                  : '',
              ].join(' ')}
            >
              <div className="flex items-start gap-4">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
                  style={{
                    color: section.accent,
                    backgroundColor: section.background,
                  }}
                >
                  <FileJson className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[#202124]">
                    {section.label}
                  </p>

                  <p className="mt-1 text-sm leading-6 text-[#80868B]">
                    {section.description}
                  </p>

                  <p className="mt-3 text-xs text-[#9AA0A6]">
                    {section.tables.length} tabel
                  </p>
                </div>

                <span
                  className={[
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition',
                    selected
                      ? 'border-[#34A853] bg-[#34A853] text-white'
                      : 'border-[#DADCE0] bg-white text-transparent',
                  ].join(' ')}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
              </div>
            </button>
          )
        })}
      </div>

      <div className="mt-7 rounded-2xl bg-[#F8F9FA] p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#34A853]" />

          <div>
            <p className="text-sm font-semibold text-[#3C4043]">
              Simpan file dengan aman
            </p>

            <p className="mt-1 text-sm leading-6 text-[#80868B]">
              Backup dapat memuat nama, email, nomor telepon,
              rekening, dan data keuangan. Jangan membagikan file
              kepada pihak yang tidak berwenang.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-7 flex justify-end">
        <button
          type="button"
          onClick={exportBackup}
          disabled={exporting || selectedCount === 0}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#202124] px-6 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-40 sm:w-auto"
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Menyiapkan backup...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export backup JSON
            </>
          )}
        </button>
      </div>
    </div>
  )
}