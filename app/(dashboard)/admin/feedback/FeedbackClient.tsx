'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  MessageSquare,
  RefreshCcw,
  Tag,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type FeedbackRow = {
  id: string
  kategori: string
  judul: string
  isi: string
  status: 'baru' | 'dibaca' | 'diproses' | 'selesai' | 'ditutup'
  admin_response: string | null
  admin_id: string | null
  created_at: string
  responded_at: string | null
  ortu?: {
    full_name: string | null
    phone: string | null
  } | null
}

const KATEGORI_OPTIONS = [
  { value: '', label: 'Semua Kategori' },
  { value: 'umum', label: 'Umum' },
  { value: 'jadwal', label: 'Jadwal' },
  { value: 'pembayaran', label: 'Pembayaran' },
  { value: 'fasilitas', label: 'Fasilitas' },
  { value: 'lainnya', label: 'Lainnya' },
]

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'baru', label: 'Baru' },
  { value: 'dibaca', label: 'Dibaca' },
  { value: 'diproses', label: 'Diproses' },
  { value: 'selesai', label: 'Selesai' },
  { value: 'ditutup', label: 'Ditutup' },
]

const STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  baru: {
    label: 'Baru',
    className: 'bg-blue-50 text-blue-700',
  },
  dibaca: {
    label: 'Dibaca',
    className: 'bg-amber-50 text-amber-700',
  },
  diproses: {
    label: 'Diproses',
    className: 'bg-violet-50 text-violet-700',
  },
  selesai: {
    label: 'Selesai',
    className: 'bg-emerald-50 text-emerald-700',
  },
  ditutup: {
    label: 'Ditutup',
    className: 'bg-slate-100 text-slate-500',
  },
}

function formatTanggal(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default function AdminFeedbackClient() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([])
  const [filterKategori, setFilterKategori] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [responseMap, setResponseMap] = useState<Record<string, string>>({})
  const [statusMap, setStatusMap] = useState<
    Record<string, string>
  >({})
  const [successMap, setSuccessMap] = useState<
    Record<string, boolean>
  >({})
  const [errorMsg, setErrorMsg] = useState('')

  async function loadFeedbacks() {
    setLoading(true)
    setErrorMsg('')

    let query = supabase
      .from('feedback_saran')
      .select(
        `
        id, kategori, judul, isi, status, admin_response, admin_id, created_at, responded_at,
        ortu:profiles!feedback_saran_ortu_id_fkey (full_name, phone)
      `
      )
      .order('created_at', { ascending: false })

    if (filterKategori) {
      query = query.eq('kategori', filterKategori)
    }

    if (filterStatus) {
      query = query.eq('status', filterStatus)
    }

    const { data, error } = await query

    if (error) {
      setErrorMsg(error.message)
    } else {
      const rows = (data || []) as FeedbackRow[]
      setFeedbacks(rows)

      // Inisialisasi responseMap & statusMap dari data
      const rm: Record<string, string> = {}
      const sm: Record<string, string> = {}
      rows.forEach((row) => {
        rm[row.id] = row.admin_response || ''
        sm[row.id] = row.status
      })
      setResponseMap(rm)
      setStatusMap(sm)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadFeedbacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterKategori, filterStatus])

  const handleSave = async (id: string) => {
    setSaving(id)
    setSuccessMap((prev) => ({ ...prev, [id]: false }))

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const newStatus = statusMap[id] || 'dibaca'
    const newResponse = responseMap[id]?.trim() || null

    const { error } = await supabase
      .from('feedback_saran')
      .update({
        status: newStatus,
        admin_response: newResponse,
        admin_id: user?.id || null,
        responded_at: newResponse ? new Date().toISOString() : null,
      })
      .eq('id', id)

    if (!error) {
      setSuccessMap((prev) => ({ ...prev, [id]: true }))
      setFeedbacks((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: newStatus as FeedbackRow['status'],
                admin_response: newResponse,
                responded_at: newResponse
                  ? new Date().toISOString()
                  : item.responded_at,
              }
            : item
        )
      )
    }

    setSaving(null)
  }

  const totalBaru = feedbacks.filter(
    (f) => f.status === 'baru'
  ).length

  return (
    <main className="min-h-screen bg-[#FAFBF7] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Header */}
        <section className="rounded-[32px] border border-[#E7EFE6] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
                <MessageSquare className="h-4 w-4" />
                Admin · Feedback
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Kritik & Saran Orang Tua
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                Lihat, tanggapi, dan ubah status masukan dari orang tua
                siswa.
              </p>
            </div>

            {totalBaru > 0 && (
              <div className="rounded-[24px] border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold text-blue-500">
                  Belum dibaca
                </p>
                <p className="mt-1 text-2xl font-black text-blue-700">
                  {totalBaru}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Filter */}
        <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[160px]">
              <Tag className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />
              <select
                value={filterKategori}
                onChange={(e) => setFilterKategori(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] py-2.5 pl-10 pr-9 text-sm font-semibold text-[#063D27] outline-none focus:border-[#063D27]"
              >
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />
            </div>

            <div className="relative flex-1 min-w-[160px]">
              <Clock3 className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] py-2.5 pl-10 pr-9 text-sm font-semibold text-[#063D27] outline-none focus:border-[#063D27]"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />
            </div>

            <button
              type="button"
              onClick={() => loadFeedbacks()}
              className="inline-flex h-10 items-center gap-2 rounded-2xl border border-[#DDE9DB] bg-white px-4 text-sm font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
            >
              <RefreshCcw className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </section>

        {/* Error */}
        {errorMsg && (
          <div className="rounded-[20px] border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-700">
            {errorMsg}
          </div>
        )}

        {/* List */}
        <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
          {loading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#F8FAF7] py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[#063D27]" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-10 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">
                Belum ada masukan dari orang tua.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedbacks.map((item) => {
                const statusInfo =
                  STATUS_MAP[item.status] ?? STATUS_MAP['baru']
                const kategoriLabel =
                  KATEGORI_OPTIONS.find(
                    (k) => k.value === item.kategori
                  )?.label ?? item.kategori
                const isSaving = saving === item.id
                const isSaved = successMap[item.id]

                return (
                  <details
                    key={item.id}
                    className="group rounded-[24px] border border-[#EEF3EC] bg-[#FAFBF7]"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 p-4 [&::-webkit-details-marker]:hidden">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                        <MessageSquare className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#063D27]">
                            {item.judul}
                          </p>

                          <span
                            className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${statusInfo.className}`}
                          >
                            {statusInfo.label}
                          </span>

                          <span className="shrink-0 rounded-lg border border-[#E7EFE6] bg-white px-2.5 py-1 text-xs font-bold text-slate-500">
                            {kategoriLabel}
                          </span>
                        </div>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {item.ortu?.full_name || 'Orang Tua'} ·{' '}
                          {formatTanggal(item.created_at)}
                        </p>
                      </div>

                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                    </summary>

                    <div className="border-t border-[#EEF3EC] px-4 pb-4 pt-3">
                      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
                        {/* Kiri: isi + form balasan */}
                        <div className="space-y-3">
                          <div className="rounded-[20px] border border-[#EEF3EC] bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                              Isi Masukan
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-700">
                              {item.isi}
                            </p>
                          </div>

                          {/* Form balas */}
                          <div className="rounded-[20px] border border-[#EEF3EC] bg-white p-4">
                            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                              Balasan Admin
                            </label>

                            <textarea
                              value={responseMap[item.id] || ''}
                              onChange={(e) =>
                                setResponseMap((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.value,
                                }))
                              }
                              placeholder="Tulis balasan untuk orang tua..."
                              rows={4}
                              className="mt-2 w-full resize-none rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm text-[#063D27] outline-none placeholder:text-slate-400 focus:border-[#063D27]"
                            />
                          </div>
                        </div>

                        {/* Kanan: status + simpan */}
                        <div className="space-y-3">
                          {item.ortu?.phone && (
                            <div className="rounded-[20px] border border-[#EEF3EC] bg-white p-4">
                              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                                No. HP Orang Tua
                              </p>
                              <p className="mt-1 text-sm font-bold text-[#063D27]">
                                {item.ortu.phone}
                              </p>
                            </div>
                          )}

                          <div className="rounded-[20px] border border-[#EEF3EC] bg-white p-4">
                            <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                              Ubah Status
                            </label>

                            <div className="relative mt-2">
                              <select
                                value={statusMap[item.id] || item.status}
                                onChange={(e) =>
                                  setStatusMap((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                                className="w-full appearance-none rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] py-2.5 pl-4 pr-9 text-sm font-semibold text-[#063D27] outline-none focus:border-[#063D27]"
                              >
                                {STATUS_OPTIONS.filter(
                                  (o) => o.value !== ''
                                ).map((opt) => (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleSave(item.id)}
                            disabled={isSaving}
                            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#063D27] text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-[#B8C9B8]"
                          >
                            {isSaving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Menyimpan...
                              </>
                            ) : isSaved ? (
                              <>
                                <CheckCircle2 className="h-4 w-4" />
                                Tersimpan
                              </>
                            ) : (
                              'Simpan'
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
