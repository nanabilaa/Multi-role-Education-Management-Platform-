'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { submitPengerjaan } from '@/lib/actions/latihan'

export default function KerjakanPage() {
  const { id } = useParams()
  const router = useRouter()
  const { profile } = useAuth()
  const [latihan, setLatihan] = useState<any>(null)
  const [soals, setSoals] = useState<any[]>([])
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: l } = await supabase.from('latihan_soals').select('*').eq('id', id).single()
      setLatihan(l)
      const { data: s } = await supabase.from('soals').select('*').eq('latihan_id', id).order('created_at')
      setSoals(s || [])
      const { data: siswa } = await supabase.from('siswa').select('id').eq('ortu_id', profile?.id).single()
      if (siswa) {
        const { data: p } = await supabase.from('pengerjaans').select('*, jawaban_siswas(*, soals(*))').eq('siswa_id', siswa.id).eq('latihan_id', id).single()
        if (p) {
          setDone(true)
          const ans: Record<string, string> = {}
          p.jawaban_siswas?.forEach((j: any) => { ans[j.soal_id] = j.jawaban })
          setAnswers(ans)
        }
      }
    }
    load()
  }, [id, profile])

  async function handleSubmit() {
    const supabase = createClient()
    const { data: siswa } = await supabase.from('siswa').select('id').eq('ortu_id', profile?.id).single()
    if (!siswa) return
    const jawaban = Object.entries(answers).map(([soal_id, jawaban]) => ({ soal_id, jawaban }))
    await submitPengerjaan(siswa.id, id as string, jawaban)
    setDone(true)
  }

  if (done) return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-emerald-700 mb-6 hover:underline"><ArrowLeft size={18}/> Kembali</button>
      <h2 className="text-3xl font-bold text-emerald-900 mb-2">Latihan Selesai</h2>
      <p className="text-emerald-600 mb-6">Jawaban Anda:</p>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-6 space-y-3">
        {Object.entries(answers).map(([soal_id, jawaban]) => (
          <div key={soal_id} className="flex justify-between border-b border-emerald-50 pb-2">
            <span className="text-sm text-slate-600">Soal {soal_id}</span>
            <span className="font-bold text-emerald-700">{jawaban}</span>
          </div>
        ))}
      </div>
      <button onClick={() => router.push('/ortu/dashboard')} className="mt-6 bg-emerald-700 text-white px-6 py-3 rounded-xl">Kembali ke Dashboard</button>
    </div>
  )

  const current = soals[step]
  if (!latihan || !current) return <div className="max-w-3xl mx-auto px-6 py-12">Memuat...</div>

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-emerald-700 mb-6 hover:underline"><ArrowLeft size={18}/> Kembali</button>
      <div className="bg-emerald-900 text-white rounded-2xl p-6 mb-6 shadow-lg">
        <h1 className="text-2xl font-bold">{latihan.mapel}</h1>
        <p className="text-emerald-200">{latihan.judul}</p>
      </div>
      <div className="bg-white rounded-2xl border border-emerald-100 shadow-sm p-8">
        <div className="flex items-center justify-between mb-6">
          <span className="text-sm font-medium text-emerald-700">Soal {step + 1} dari {soals.length}</span>
          <div className="w-48 h-2 bg-emerald-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600 rounded-full" style={{ width: `${((step + 1) / soals.length) * 100}%` }} /></div>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-6">{current.pertanyaan}</h2>
        {current.tipe_soal === 'pilihan_ganda' ? (
          <div className="space-y-3">
            {['A','B','C','D'].map(opt => (
              <button key={opt} onClick={() => setAnswers({ ...answers, [current.id]: opt })} className={`w-full text-left px-5 py-3 rounded-xl border transition ${answers[current.id] === opt ? 'border-emerald-600 bg-emerald-50 text-emerald-800' : 'border-emerald-100 hover:border-emerald-300'}`}>
                <span className="font-bold mr-2">{opt}.</span> {current[`opsi_${opt.toLowerCase()}`]}
              </button>
            ))}
          </div>
        ) : (
          <textarea rows={4} className="w-full rounded-xl border border-emerald-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200" value={answers[current.id] || ''} onChange={e => setAnswers({ ...answers, [current.id]: e.target.value })} placeholder="Tulis jawaban essay..." />
        )}
        <div className="flex justify-between mt-8">
          <button disabled={step === 0} onClick={() => setStep(step - 1)} className="px-5 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 hover:bg-emerald-50">Sebelumnya</button>
          {step < soals.length - 1 ? (
            <button onClick={() => setStep(step + 1)} className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">Selanjutnya</button>
          ) : (
            <button onClick={handleSubmit} className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white hover:bg-emerald-800">Kirim Latihan</button>
          )}
        </div>
      </div>
    </div>
  )
}
