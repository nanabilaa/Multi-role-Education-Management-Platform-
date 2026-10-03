'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BookOpen, Clock, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

export default function LatihanTersediaPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: siswa } = await supabase.from('siswa').select('id').eq('ortu_id', profile?.id).single()
      if (!siswa) { setLoading(false); return }
      const { data: siswaData } = await supabase.from('siswa').select('kelas').eq('id', siswa.id).single()
      const kelasSiswa = siswaData?.kelas || ''
      const { data } = await supabase.from('latihan_soals').select('*').eq('status', 'dipublikasikan').eq('kelas', kelasSiswa).order('created_at', { ascending: false })
      // Cek pengerjaan
      const { data: pengerjaans } = await supabase.from('pengerjaans').select('latihan_id').eq('siswa_id', siswa.id)
      const doneIds = new Set(pengerjaans?.map((p: any) => p.latihan_id) || [])
      setItems((data || []).map((l: any) => ({ ...l, done: doneIds.has(l.id) })))
      setLoading(false)
    }
    if (profile?.id) load()
  }, [profile])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-emerald-900 mb-2">Latihan Tersedia</h1>
      <p className="text-emerald-600 mb-8">Latihan yang diberikan tentor untuk anak Anda.</p>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? <p>Memuat...</p> : items.map((l) => (
          <div key={l.id} className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">{l.mapel}</span>
              {l.done ? <CheckCircle2 size={20} className="text-emerald-600" /> : <Clock size={20} className="text-amber-500" />}
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{l.judul}</h3>
            <p className="text-sm text-slate-500 mb-4">Kelas {l.kelas} • {l.materi}</p>
            <Link href={`/ortu/latihan/${l.id}/kerjakan`} className="block text-center bg-emerald-700 text-white py-2.5 rounded-xl hover:bg-emerald-800 transition">{l.done ? 'Lihat Hasil' : 'Kerjakan'}</Link>
          </div>
        ))}
      </div>
    </div>
  )
}
