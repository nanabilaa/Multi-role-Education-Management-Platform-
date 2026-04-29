// app/(dashboard)/tentor/sesi/[id]/page.tsx
import { createClient } from '@/lib/supabase/server'
import { useState } from 'react'
import { formatTanggal } from '@/lib/utils'
import { ArrowLeft, Save } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link' // Make sure this line is added
import { createClient } from '@/lib/supabase/server'


export default async function SesiDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  const { data: sesi, error } = await supabase
    .from('sesi')
    .select(`
      id,
      tanggal,
      jam_mulai,
      mapel,
      tentor_id,
      status,
      sesi_siswa(
        siswa_id,
        hadir
      )
    `)
    .eq('id', params.id)
    .single()

  if (error || !sesi) {
    return <div>Error: {error?.message || 'Data sesi tidak ditemukan'}</div>
  }

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const { data, error } = await supabase.from('jurnal').insert([
      {
        sesi_id: params.id,
        materi: formData.get('materi')?.toString(),
        catatan: formData.get('catatan')?.toString(),
        foto_url: formData.get('foto_url')?.toString(),
      },
    ])

    if (error) {
      alert('Gagal mengirim jurnal: ' + error.message)
    } else {
      alert('Jurnal berhasil disubmit')
      router.push('/tentor/sesi')
    }
  }

  return (
    <div className="space-y-4 p-6">
      <div>
        <Link
          href="/tentor/sesi"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#063D27]"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke daftar sesi
        </Link>
      </div>

      <div className="card">
        <h2 className="text-2xl font-bold text-slate-900">{sesi.mapel}</h2>
        <p className="mt-2 text-sm text-slate-500">Tanggal: {formatTanggal(sesi.tanggal)}</p>
        <p className="text-sm text-slate-500">Jam mulai: {sesi.jam_mulai.slice(0, 5)}</p>
        <p className="mt-2 text-sm text-slate-500">Status: {sesi.status}</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <label className="label-base">Materi</label>
            <input
              name="materi"
              type="text"
              required
              className="input-base"
              placeholder="Isi materi yang diajarkan"
            />
          </div>

          <div>
            <label className="label-base">Catatan</label>
            <textarea
              name="catatan"
              rows={4}
              required
              className="input-base resize-none"
              placeholder="Tuliskan catatan singkat mengenai sesi ini"
            />
          </div>

          <div>
            <label className="label-base">Upload Foto Dokumentasi</label>
            <input
              name="foto_url"
              type="text"
              className="input-base"
              placeholder="URL foto dokumentasi"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#063D27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5738]"
            >
              <Save className="h-4 w-4" />
              Simpan Jurnal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}