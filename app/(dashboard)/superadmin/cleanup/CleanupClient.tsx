'use client'

import { useState } from 'react'
import {
  Trash2,
  Image as ImageIcon,
  FileImage,
  CalendarX2,
  MessageSquareOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  HardDrive
} from 'lucide-react'
import {
  deleteFotoValidasi,
  deleteFotoTugasSiswa,
  deleteSesiDibatalkan,
  deleteFeedbackDitutup
} from './actions'

export default function CleanupClient() {
  const [loading, setLoading] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleAction = async (action: string, actionFn: () => Promise<{ count: number }>, successMsg: string) => {
    setLoading(action)
    setMessage(null)
    try {
      const res = await actionFn()
      setMessage({ type: 'success', text: `${successMsg} (${res.count} item dihapus)` })
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Terjadi kesalahan' })
    } finally {
      setLoading(null)
    }
  }

  const sections = [
    {
      id: 'foto-validasi',
      title: 'Hapus Semua Foto Validasi Kelas',
      desc: 'Menghapus semua foto dokumentasi kelas dari Supabase Storage. Teks jurnal tetap aman.',
      icon: <ImageIcon className="h-5 w-5" />,
      actionFn: deleteFotoValidasi,
      successMsg: 'Foto validasi berhasil dihapus dari storage',
      btnLabel: 'Hapus Foto Validasi',
      color: 'blue'
    },
    {
      id: 'foto-tugas',
      title: 'Hapus Semua Foto Tugas Siswa',
      desc: 'Menghapus foto hasil pekerjaan siswa dari Supabase Storage. Catatan tetap aman.',
      icon: <FileImage className="h-5 w-5" />,
      actionFn: deleteFotoTugasSiswa,
      successMsg: 'Foto tugas siswa berhasil dihapus dari storage',
      btnLabel: 'Hapus Foto Tugas',
      color: 'violet'
    },
    {
      id: 'sesi-batal',
      title: 'Hapus Sesi Dibatalkan',
      desc: 'Menghapus permanen semua riwayat jadwal sesi yang statusnya "Dibatalkan" di database.',
      icon: <CalendarX2 className="h-5 w-5" />,
      actionFn: deleteSesiDibatalkan,
      successMsg: 'Sesi dibatalkan berhasil dihapus permanen',
      btnLabel: 'Hapus Sesi Batal',
      color: 'amber'
    },
    {
      id: 'feedback',
      title: 'Hapus Feedback Ditutup',
      desc: 'Menghapus permanen kritik dan saran dari orang tua yang statusnya sudah "Ditutup".',
      icon: <MessageSquareOff className="h-5 w-5" />,
      actionFn: deleteFeedbackDitutup,
      successMsg: 'Feedback ditutup berhasil dihapus permanen',
      btnLabel: 'Hapus Feedback',
      color: 'red'
    }
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {message && (
        <div className={`flex items-start gap-3 rounded-[24px] border p-4 text-sm ${
          message.type === 'error' 
            ? 'border-red-100 bg-red-50 text-red-700' 
            : 'border-emerald-100 bg-emerald-50 text-emerald-700'
        }`}>
          {message.type === 'error' ? (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <p className="font-semibold">{message.text}</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((sec) => (
          <div key={sec.id} className="flex flex-col justify-between rounded-[24px] border border-slate-200 bg-white p-5">
            <div>
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-${sec.color}-50 text-${sec.color}-600`}>
                {sec.icon}
              </div>
              <h2 className="text-base font-bold text-slate-900">{sec.title}</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-500">{sec.desc}</p>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => {
                  if (confirm(`Anda yakin ingin menjalankan: ${sec.title}? Tindakan ini tidak dapat dibatalkan.`)) {
                    handleAction(sec.id, sec.actionFn, sec.successMsg)
                  }
                }}
                disabled={loading !== null}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold transition hover:bg-slate-50 hover:text-${sec.color}-700 disabled:cursor-not-allowed disabled:opacity-50`}
              >
                {loading === sec.id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                {loading === sec.id ? 'Menghapus...' : sec.btnLabel}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
