// app/(dashboard)/admin/honor/tambah/page.tsx
import { createClient } from '@/lib/supabase/server'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default async function TambahHonorPage({ params }: { params: { sesiId: string } }) {
  const supabase = await createClient()
  const [jumlahHonor, setJumlahHonor] = useState<number>(0)
  const [loading, setLoading] = useState<boolean>(false)

  // Ambil sesi terkait untuk memastikan data valid
  const { data: sesiData, error } = await supabase
    .from('sesi')
    .select('id, tentor_id, mapel, tanggal')
    .eq('id', params.sesiId)
    .single()

  if (error || !sesiData) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">Sesi tidak ditemukan</h1>
        <p>{error?.message || 'Sesi tidak ditemukan'}</p>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    // Masukkan data honor ke tabel 'honor'
    const { data, error } = await supabase.from('honor').insert([
      {
        sesi_id: sesiData.id,
        tentor_id: sesiData.tentor_id,
        jumlah_honor: jumlahHonor,
        tanggal_bayar: new Date().toISOString(),
      },
    ])

    if (error) {
      alert('Gagal memberikan honor: ' + error.message)
    } else {
      alert('Honor berhasil diberikan')
    }

    setLoading(false)
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-slate-900">Berikan Honor ke Tentor</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label className="label-base">Jumlah Honor (Rp)</label>
            <input
              type="number"
              value={jumlahHonor}
              onChange={(e) => setJumlahHonor(Number(e.target.value))}
              required
              className="input-base"
              placeholder="Masukkan jumlah honor"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#063D27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5738]"
              disabled={loading}
            >
              {loading ? 'Sedang mengirim...' : 'Berikan Honor'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}