'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function BankSoalPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [soals, setSoals] = useState<any[]>([])
  const [latihan, setLatihan] = useState<any>(null)
  const [filter, setFilter] = useState('semua')
  const [form, setForm] = useState({ tipe_soal: 'pilihan_ganda' as const, pertanyaan: '', opsi_a: '', opsi_b: '', opsi_c: '', opsi_d: '', jawaban_benar: '' })

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: l } = await supabase.from('latihan_soals').select('*').eq('id', id).single()
      setLatihan(l)
      const { data: s } = await supabase.from('soals').select('*').eq('latihan_id', id).order('created_at')
      setSoals(s || [])
    }
    load()
  }, [id])

  async function handleAdd() {
    const supabase = createClient()
    await supabase.from('soals').insert({ latihan_id: id, ...form })
    window.location.reload()
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-emerald-700 mb-6 hover:underline"><ArrowLeft size={18}/> Kembali</button>
      <h1 className="text-3xl font-bold text-emerald-900 mb-2">Bank Soal</h1>
      <p className="text-emerald-600 mb-6">{latihan?.judul} — {latihan?.mapel}</p>

      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 mb-8">
        <h3 className="font-bold text-slate-800 mb-4">Tambah Soal</h3>
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <select className="rounded-xl border border-emerald-200 px-3 py-2" value={form.tipe_soal} onChange={e => setForm({ ...form, tipe_soal: e.target.value as any })}>
            <option value="pilihan_ganda">Pilihan Ganda</option>
            <option value="essay">Essay</option>
          </select>
          <input className="rounded-xl border border-emerald-200 px-3 py-2" placeholder="Pertanyaan" value={form.pertanyaan} onChange={e => setForm({ ...form, pertanyaan: e.target.value })} />
        </div>
        {form.tipe_soal === 'pilihan_ganda' && (
          <div className="grid md:grid-cols-4 gap-3 mb-3">
            {['a','b','c','d'].map(o => (
              <input key={o} className="rounded-xl border border-emerald-200 px-3 py-2 text-sm" placeholder={`Pilihan ${o.toUpperCase()}`} value={form[`opsi_${o}` as keyof typeof form] as string} onChange={e => setForm({ ...form, [`opsi_${o}`]: e.target.value } as any)} />
            ))}
          </div>
        )}
        {form.tipe_soal === 'pilihan_ganda' && (
          <input className="w-full rounded-xl border border-emerald-200 px-3 py-2 mb-3" placeholder="Jawaban benar (A/B/C/D)" value={form.jawaban_benar} onChange={e => setForm({ ...form, jawaban_benar: e.target.value })} />
        )}
        <button onClick={handleAdd} className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-xl hover:bg-emerald-800"><Plus size={16}/> Tambah Soal</button>
      </div>

      <div className="flex gap-2 mb-4">
        {['semua','pilihan_ganda','essay'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-xs font-bold ${filter === f ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-700'}`}>{f === 'semua' ? 'Semua' : f === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}</button>
        ))}
      </div>
      <div className="space-y-4">
        {soals.filter((s: any) => filter === 'semua' || s.tipe_soal === filter).map((s: any) => (
          <div key={s.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 relative">
            <button onClick={async () => { const supabase = createClient(); await supabase.from('soals').delete().eq('id', s.id); window.location.reload() }} className="absolute top-4 right-4 text-red-500 hover:text-red-700" title="Hapus"><Trash2 size={18}/></button>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{s.tipe_soal === 'pilihan_ganda' ? 'Pilihan Ganda' : 'Essay'}</span>
            </div>
            <h4 className="font-bold text-slate-800 mb-2">{s.pertanyaan}</h4>
            {s.tipe_soal === 'pilihan_ganda' && (
              <div className="grid md:grid-cols-4 gap-2 text-sm text-slate-600 mb-2">
                <div>A. {s.opsi_a}</div><div>B. {s.opsi_b}</div><div>C. {s.opsi_c}</div><div>D. {s.opsi_d}</div>
              </div>
            )}
            <div className="text-xs text-emerald-600 font-medium">Jawaban benar: {s.jawaban_benar}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
