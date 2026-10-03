'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import { createLatihan } from '@/lib/actions/latihan'
import { useAuth } from '@/hooks/useAuth'

export default function BuatLatihanPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [form, setForm] = useState({ judul: '', mapel: '', kelas: '', materi: '', deskripsi: '', deadline: '', status: 'draft' as const })
  const [saving, setSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!profile?.id) { setErrorMsg('Profil belum dimuat'); return }
    setSaving(true); setErrorMsg('')
    try {
      await createLatihan({ ...form, tentor_id: profile.id })
      router.push('/tentor/latihan')
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-emerald-700 mb-6 hover:underline"><ArrowLeft size={18}/> Kembali</button>
      <h1 className="text-3xl font-bold text-emerald-900 mb-2">Buat Latihan</h1>
      <p className="text-emerald-600 mb-8">Isi form untuk membuat latihan soal baru.</p>
      {errorMsg && <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">{errorMsg}</div>}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-8 space-y-5">
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Judul Latihan</label>
            <input required className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={form.judul} onChange={e => setForm({ ...form, judul: e.target.value })} placeholder="Contoh: Latihan Pecahan Dasar" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran</label>
            <input required className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={form.mapel} onChange={e => setForm({ ...form, mapel: e.target.value })} placeholder="Matematika" />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Kelas</label>
            <input required className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={form.kelas} onChange={e => setForm({ ...form, kelas: e.target.value })} placeholder="5 SD" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Materi</label>
            <input className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={form.materi} onChange={e => setForm({ ...form, materi: e.target.value })} placeholder="Operasi Pecahan" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
          <textarea rows={3} className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={form.deskripsi} onChange={e => setForm({ ...form, deskripsi: e.target.value })} placeholder="Penjelasan singkat latihan..." />
        </div>
        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deadline</label>
            <input type="date" className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select className="w-full rounded-xl border border-emerald-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}>
              <option value="draft">Draft</option>
              <option value="dipublikasikan">Dipublikasikan</option>
            </select>
          </div>
        </div>
        <div className="pt-2">
          <button type="submit" disabled={saving} className="inline-flex items-center gap-2 bg-emerald-700 text-white px-6 py-3 rounded-xl shadow hover:bg-emerald-800 transition disabled:opacity-60">
            <Save size={18}/> {saving ? 'Menyimpan...' : 'Simpan Latihan'}
          </button>
        </div>
      </form>
    </div>
  )
}
