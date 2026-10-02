'use client'

import { FormEvent, useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Loader2,
  MessageSquare,
  Send,
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
  created_at: string
  responded_at: string | null
}

const KATEGORI_OPTIONS = [
  { value: 'umum', label: 'Umum' },
  { value: 'jadwal', label: 'Jadwal' },
  { value: 'pembayaran', label: 'Pembayaran' },
  { value: 'fasilitas', label: 'Fasilitas' },
  { value: 'lainnya', label: 'Lainnya' },
]

const STATUS_MAP: Record<
  string,
  { label: string; className: string }
> = {
  baru: {
    label: 'Baru',
    className:
      'bg-blue-50 text-blue-700',
  },
  dibaca: {
    label: 'Dibaca',
    className:
      'bg-amber-50 text-amber-700',
  },
  diproses: {
    label: 'Diproses',
    className:
      'bg-violet-50 text-violet-700',
  },
  selesai: {
    label: 'Selesai',
    className:
      'bg-emerald-50 text-emerald-700',
  },
  ditutup: {
    label: 'Ditutup',
    className:
      'bg-slate-100 text-slate-500',
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

export default function OrtuSaranPage() {
  const supabase = createClient()

  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    kategori: 'umum',
    judul: '',
    isi: '',
  })

  const [feedbacks, setFeedbacks] = useState<FeedbackRow[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadFeedbacks() {
    setLoading(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoading(false)
      return
    }

    const { data } = await supabase
      .from('feedback_saran')
      .select(
        'id, kategori, judul, isi, status, admin_response, created_at, responded_at'
      )
      .eq('ortu_id', user.id)
      .order('created_at', { ascending: false })

    setFeedbacks((data || []) as FeedbackRow[])
    setLoading(false)
  }

  useEffect(() => {
    loadFeedbacks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!form.judul.trim()) {
      setError('Judul wajib diisi.')
      return
    }

    if (!form.isi.trim()) {
      setError('Isi kritik/saran wajib diisi.')
      return
    }

    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError('Sesi login tidak ditemukan. Silakan login ulang.')
      setSubmitting(false)
      return
    }

    const { error: insertError } = await supabase
      .from('feedback_saran')
      .insert({
        ortu_id: user.id,
        kategori: form.kategori,
        judul: form.judul.trim(),
        isi: form.isi.trim(),
      })

    if (insertError) {
      setError(insertError.message)
      setSubmitting(false)
      return
    }

    setForm({ kategori: 'umum', judul: '', isi: '' })
    setSuccess('Kritik & saran berhasil dikirim. Terima kasih!')
    setSubmitting(false)

    await loadFeedbacks()
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        {/* Header */}
        <section className="rounded-[32px] border border-[#E7EFE6] bg-white p-6 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
            <MessageSquare className="h-4 w-4" />
            Portal Orang Tua
          </div>

          <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
            Kritik & Saran
          </h1>

          <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
            Sampaikan masukan, kritik, atau saran Anda untuk membantu
            kami meningkatkan kualitas layanan bimbel.
          </p>
        </section>

        {/* Alert */}
        {error && (
          <div className="flex items-start gap-3 rounded-[24px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-[24px] border border-[#DDE9DB] bg-[#F3F8F1] p-4 text-sm text-[#063D27]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {/* Form Kirim */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[28px] border border-[#DDE9DB] bg-white p-5"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#0B5738]">
              <Send className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-black text-[#063D27]">
                Kirim Masukan
              </h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                Isi form berikut untuk mengirim kritik atau saran.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Kategori */}
            <div>
              <label className="text-sm font-black text-[#063D27]">
                Kategori
              </label>

              <div className="relative mt-2">
                <Tag className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />

                <select
                  value={form.kategori}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      kategori: e.target.value,
                    }))
                  }
                  className="w-full appearance-none rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] py-3 pl-11 pr-10 text-sm font-semibold text-[#063D27] outline-none focus:border-[#063D27]"
                >
                  {KATEGORI_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />
              </div>
            </div>

            {/* Judul */}
            <div>
              <label className="text-sm font-black text-[#063D27]">
                Judul
              </label>

              <input
                type="text"
                value={form.judul}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    judul: e.target.value,
                  }))
                }
                placeholder="Contoh: Jadwal sering berubah mendadak"
                maxLength={255}
                className="mt-2 w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm text-[#063D27] outline-none placeholder:text-slate-400 focus:border-[#063D27]"
              />
            </div>

            {/* Isi */}
            <div>
              <label className="text-sm font-black text-[#063D27]">
                Isi Kritik / Saran
              </label>

              <textarea
                value={form.isi}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    isi: e.target.value,
                  }))
                }
                placeholder="Tuliskan kritik atau saran Anda secara detail..."
                rows={5}
                className="mt-2 w-full resize-none rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm text-[#063D27] outline-none placeholder:text-slate-400 focus:border-[#063D27]"
              />
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-[#B8C9B8]"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Kirim
                </>
              )}
            </button>
          </div>
        </form>

        {/* Riwayat */}
        <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#0B5738]">
              <Clock3 className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-black text-[#063D27]">
                Riwayat Masukan
              </h2>
              <p className="mt-0.5 text-sm font-medium text-slate-500">
                Lihat status dan balasan dari masukan yang sudah dikirim.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#F8FAF7] py-10">
              <Loader2 className="h-5 w-5 animate-spin text-[#063D27]" />
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-10 text-center">
              <MessageSquare className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-bold text-slate-500">
                Belum ada masukan yang dikirim.
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

                return (
                  <details
                    key={item.id}
                    className="group rounded-[24px] border border-[#EEF3EC] bg-[#FAFCF9]"
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
                        </div>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {kategoriLabel} ·{' '}
                          {formatTanggal(item.created_at)}
                        </p>
                      </div>

                      <ChevronDown className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition group-open:rotate-180" />
                    </summary>

                    <div className="border-t border-[#EEF3EC] px-4 pb-4 pt-3">
                      <div className="space-y-3">
                        <div className="rounded-[20px] border border-[#EEF3EC] bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                            Isi Masukan
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-700">
                            {item.isi}
                          </p>
                        </div>

                        {item.admin_response && (
                          <div className="rounded-[20px] border border-[#DDE9DB] bg-[#F3F8F1] p-4">
                            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0B5738]">
                              Balasan Admin
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-[#063D27]">
                              {item.admin_response}
                            </p>
                            {item.responded_at && (
                              <p className="mt-2 text-xs font-semibold text-slate-400">
                                {formatTanggal(item.responded_at)}
                              </p>
                            )}
                          </div>
                        )}
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
