'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function HasilSiswaPage() {
  const { id } = useParams()
  const router = useRouter()
  const [results, setResults] = useState<any[]>([])
  const [latihan, setLatihan] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: l } = await supabase.from('latihan_soals').select('*').eq('id', id).single()
      setLatihan(l)
      const { data: p } = await supabase.from('pengerjaans').select('*, siswa(*), jawaban_siswas(*, soals(*))').eq('latihan_id', id).order('created_at', { ascending: false })
      setResults(p || [])
    }
    load()
  }, [id])

  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-emerald-700 mb-6 hover:underline"><ArrowLeft size={18}/> Kembali</button>
      <h1 className="text-3xl font-bold text-emerald-900 mb-2">Hasil Siswa</h1>
      <p className="text-emerald-600 mb-6">{latihan?.judul} — {latihan?.mapel}</p>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-emerald-50 text-emerald-800">
            <tr><th className="text-left px-6 py-3 font-bold">Siswa</th><th className="text-left px-6 py-3 font-bold">Kelas</th><th className="text-left px-6 py-3 font-bold">Nilai</th><th className="text-left px-6 py-3 font-bold">Status</th><th className="text-left px-6 py-3 font-bold">Tanggal</th></tr>
          </thead>
          <tbody>
            {results.map((r: any) => (
              <tr key={r.id} className="border-b border-emerald-50 hover:bg-emerald-50/50">
                <td className="px-6 py-3 font-medium text-slate-800">{r.siswa?.nama}</td>
                <td className="px-6 py-3 text-slate-500">{r.siswa?.kelas}</td>
                <td className="px-6 py-3 font-bold text-emerald-700">{r.nilai ?? '-'}</td>
                <td className="px-6 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.status === 'selesai' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{r.status === 'selesai' ? 'Selesai' : 'Menunggu Koreksi'}</span></td>
                <td className="px-6 py-3 text-slate-400">{r.tanggal_selesai ? new Date(r.tanggal_selesai).toLocaleDateString('id-ID') : '-'}</td>
              </tr>
            ))}
            {results.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada siswa yang mengerjakan.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
