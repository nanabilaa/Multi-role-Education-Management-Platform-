'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { TrendingUp, BookOpen, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function PerkembanganPage() {
  const { profile } = useAuth()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: siswa } = await supabase.from('siswa').select('id').eq('ortu_id', profile?.id).single()
      if (!siswa) { setLoading(false); return }
      const { data: pengerjaans } = await supabase.from('pengerjaans').select('*, latihan_soals(*), jawaban_siswas(*, soals(*))').eq('siswa_id', siswa.id).order('created_at', { ascending: false })
      setData(pengerjaans || [])
      setLoading(false)
    }
    if (profile?.id) load()
  }, [profile])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-emerald-900 mb-2">Perkembangan Belajar</h1>
      <p className="text-emerald-600 mb-8">Pantau hasil latihan anak secara berkala.</p>
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-emerald-900 text-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-lg mb-1">Matematika</h3>
          <p className="text-3xl font-extrabold">85</p>
          <p className="text-emerald-200 text-sm">Latihan Pecahan Dasar</p>
        </div>
        <div className="bg-emerald-800 text-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-lg mb-1">IPA</h3>
          <p className="text-3xl font-extrabold">90</p>
          <p className="text-emerald-200 text-sm">Latihan Ekosistem</p>
        </div>
        <div className="bg-emerald-700 text-white rounded-2xl p-6 shadow-lg">
          <h3 className="font-bold text-lg mb-1">Bahasa Inggris</h3>
          <p className="text-3xl font-extrabold">78</p>
          <p className="text-emerald-200 text-sm">Latihan Vocabulary</p>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Riwayat Latihan</h2>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-emerald-100">
            <tr><th className="py-2">Latihan</th><th className="py-2">Mapel</th><th className="py-2">Nilai</th><th className="py-2">Status</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={4} className="py-4">Memuat...</td></tr> : data.map((p: any) => (
              <tr key={p.id} className="border-b border-emerald-50">
                <td className="py-3 font-medium text-slate-800">{p.latihan_soals?.judul}</td>
                <td className="py-3 text-slate-500">{p.latihan_soals?.mapel}</td>
                <td className="py-3 font-bold text-emerald-700">{p.nilai ?? '-'}</td>
                <td className="py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${p.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{p.status === 'selesai' ? 'Selesai' : 'Menunggu Koreksi'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
