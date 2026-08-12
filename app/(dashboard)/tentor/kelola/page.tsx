// Tambahkan 'use client' di bagian atas
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { formatTanggal } from '@/lib/utils'

// Isi komponen lainnya di sini...
export default async function KelolaGajiTentorPage() {
  const supabase = await createClient()
  const [gaji, setGaji] = useState<number>(0)
  const [tentorId, setTentorId] = useState<string>('')
  const [bulan, setBulan] = useState<string>('')
  const [tahun, setTahun] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const router = useRouter()

  // Ambil daftar tentor dari tabel profiles
  const { data: tentorList, error: tentorError } = await supabase
    .from('profiles')
    .select('id, full_name')

  if (tentorError) {
    return <div>Error loading Tentor data: {tentorError.message}</div>
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    // Masukkan data honor ke tabel 'honor'
    const { data, error } = await supabase.from('honor').insert([
      {
        tentor_id: tentorId,
        jumlah_honor: gaji,
        bulan: bulan,
        tahun: tahun,
        tanggal_bayar: new Date().toISOString(),
      },
    ])

    if (error) {
      alert('Gagal memberikan gaji: ' + error.message)
    } else {
      alert('Gaji berhasil diberikan')
    }

    setLoading(false)
    router.push('/admin/tentor') // Kembali ke halaman list tentor
  }

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold text-slate-900">Kelola Gaji Tentor</h2>
      <form onSubmit={handleSubmit}>
        <div className="space-y-3">
          <div>
            <label className="label-base">Tentor</label>
            <select
              className="input-base"
              required
              value={tentorId}
              onChange={(e) => setTentorId(e.target.value)}
            >
              {tentorList?.map((tentor) => (
                <option key={tentor.id} value={tentor.id}>
                  {tentor.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-base">Jumlah Gaji (Rp)</label>
            <input
              type="number"
              value={gaji}
              onChange={(e) => setGaji(Number(e.target.value))}
              required
              className="input-base"
              placeholder="Masukkan jumlah gaji"
            />
          </div>

          <div>
            <label className="label-base">Bulan</label>
            <input
              type="text"
              value={bulan}
              onChange={(e) => setBulan(e.target.value)}
              required
              className="input-base"
              placeholder="Bulan"
            />
          </div>

          <div>
            <label className="label-base">Tahun</label>
            <input
              type="text"
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              required
              className="input-base"
              placeholder="Tahun"
            />
          </div>

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#063D27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5738]"
              disabled={loading}
            >
              {loading ? 'Sedang mengirim...' : 'Berikan Gaji'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}