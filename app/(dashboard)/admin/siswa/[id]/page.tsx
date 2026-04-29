import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Save } from 'lucide-react'
import Header from '@/components/admin/Header'
import { createClient } from '@/lib/supabase/server'
import { updateSiswa } from './actions'

export default async function EditSiswaPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const { data: siswa, error } = await supabase
    .from('siswa')
    .select('id, nama, kelas, sekolah, aktif')
    .eq('id', params.id)
    .single()

  if (error || !siswa) {
    notFound()
  }

  const updateSiswaWithId = updateSiswa.bind(null, params.id)

  return (
    <>
      <Header
        title="Edit Siswa"
        subtitle="Perbarui data siswa agar tetap sesuai dengan kondisi terbaru"
      />

      <div className="px-4 pb-6 pt-4 sm:px-6">
        <div className="mb-4">
          <Link
            href="/admin/siswa"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#063D27]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke data siswa
          </Link>
        </div>

        <div className="card max-w-3xl">
          <form action={updateSiswaWithId} className="space-y-5">
            <div>
              <label className="label-base">Nama Siswa</label>
              <input
                name="nama"
                type="text"
                required
                defaultValue={siswa.nama ?? ''}
                placeholder="Contoh: Aisyah Putri"
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">Kelas</label>
              <select
                name="kelas"
                required
                defaultValue={siswa.kelas ?? ''}
                className="input-base"
              >
                <option value="" disabled>
                  Pilih kelas
                </option>
                <option value="Kelas 7">Kelas 7</option>
                <option value="Kelas 8">Kelas 8</option>
                <option value="Kelas 9">Kelas 9</option>
                <option value="Kelas 10">Kelas 10</option>
                <option value="Kelas 11">Kelas 11</option>
                <option value="Kelas 12">Kelas 12</option>
              </select>
            </div>

            <div>
              <label className="label-base">Sekolah</label>
              <input
                name="sekolah"
                type="text"
                defaultValue={siswa.sekolah ?? ''}
                placeholder="Contoh: SMP Negeri 1"
                className="input-base"
              />
            </div>

            <div>
              <label className="label-base">Status</label>
              <select
                name="aktif"
                defaultValue={siswa.aktif ? 'true' : 'false'}
                className="input-base"
              >
                <option value="true">Aktif</option>
                <option value="false">Nonaktif</option>
              </select>
            </div>

            <div className="flex flex-col-reverse gap-3 pt-3 sm:flex-row sm:justify-end">
              <Link
                href="/admin/siswa"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Batal
              </Link>

              <button
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#063D27] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0B5738]"
              >
                <Save className="h-4 w-4" />
                Simpan Perubahan
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}