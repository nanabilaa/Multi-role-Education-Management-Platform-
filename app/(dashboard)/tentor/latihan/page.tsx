'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, BookOpen, Clock, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function LatihanListPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('semua')
  const [kelasFilter, setKelasFilter] = useState('semua')

  useEffect(() => {
    async function load() {
      if (!profile?.id) return
      const supabase = createClient()
      const { data } = await supabase.from('latihan_soals').select('*').eq('tentor_id', profile.id).order('created_at', { ascending: false })
      setItems(data || [])
      setLoading(false)
    }
    load()
  }, [profile])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">LatSol</h1>
          <p className="text-emerald-600 mt-1">Kelola latihan soal untuk siswa</p>
        </div>
        <Link href="/tentor/latihan/buat" className="inline-flex items-center gap-2 bg-emerald-700 text-white px-5 py-2.5 rounded-xl shadow hover:bg-emerald-800 transition">
          <Plus size={18} /> Buat Latihan
        </Link>
      </div>

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        {['semua','draft','dipublikasikan'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-bold ${filter === f ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}>{f === 'semua' ? 'Semua' : f === 'draft' ? 'Draft' : 'Dipublikasikan'}</button>
        ))}
        <select className="rounded-xl border border-emerald-200 px-3 py-1 text-xs" value={kelasFilter} onChange={e => setKelasFilter(e.target.value)}>
          <option value="semua">Semua Kelas</option>
          <option value="5 SD">5 SD</option>
          <option value="6 SD">6 SD</option>
        </select>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Memuat...</p> : items.filter((l: any) => (filter === 'semua' || l.status === filter) && (kelasFilter === 'semua' || l.kelas === kelasFilter)).map((l) => (
          <div key={l.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 hover:shadow-md transition relative">
            <button onClick={async () => { const supabase = createClient(); await supabase.from('latihan_soals').delete().eq('id', l.id); window.location.reload() }} className="absolute top-4 right-4 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={18}/></button>
            <div className="flex items-center gap-2 text-emerald-700 font-semibold mb-2">
              <BookOpen size={18} /> {l.mapel}
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">{l.judul}</h3>
            <p className="text-sm text-slate-500 mb-4">Kelas {l.kelas} • {l.materi}</p>
            <div className="flex items-center gap-4 text-xs text-slate-400 mb-4">
              <span className="flex items-center gap-1"><Clock size={14}/> {l.deadline ? new Date(l.deadline).toLocaleDateString('id-ID') : '-'}</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${l.status === 'dipublikasikan' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{l.status}</span>
              <button onClick={async () => { const supabase = createClient(); await supabase.from('latihan_soals').update({ status: l.status === 'draft' ? 'dipublikasikan' : 'draft' }).eq('id', l.id); window.location.reload() }} className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full hover:bg-emerald-700">{l.status === 'draft' ? 'Publish' : 'Draft'}</button>
            </div>
            <div className="flex gap-2">
              <Link href={`/tentor/latihan/${l.id}/bank-soal`} className="flex-1 text-center text-sm bg-emerald-50 text-emerald-700 py-2 rounded-lg hover:bg-emerald-100">Bank Soal</Link>
              <Link href={`/tentor/latihan/${l.id}/hasil`} className="flex-1 text-center text-sm bg-emerald-50 text-emerald-700 py-2 rounded-lg hover:bg-emerald-100">Hasil Siswa</Link>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <div className="col-span-full text-center py-12 text-slate-400">Belum ada latihan. Buat latihan pertama Anda.</div>
        )}
      </div>
    </div>
  )
}
