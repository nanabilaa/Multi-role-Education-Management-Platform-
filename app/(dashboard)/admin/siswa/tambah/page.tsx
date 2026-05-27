import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export default async function TambahSiswaPage() {
  async function handleSubmit(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const nama = String(formData.get('nama') || '').trim()
    const kelas = String(formData.get('kelas') || '').trim()
    const sekolah = String(formData.get('sekolah') || '').trim()
    const tanggalLahir = String(formData.get('tanggal_lahir') || '').trim()
    const alamat = String(formData.get('alamat') || '').trim()

    if (!nama || !kelas || !sekolah) {
      throw new Error('Nama, kelas, dan sekolah wajib diisi')
    }

    const payload: {
      nama: string
      kelas: string
      sekolah: string
      alamat: string | null
      aktif: boolean
      tanggal_lahir?: string | null
    } = {
      nama,
      kelas,
      sekolah,
      alamat: alamat || null,
      aktif: true,
    }

    if (tanggalLahir) {
      payload.tanggal_lahir = tanggalLahir
    }

    const { error } = await supabase.from('siswa').insert([payload])

    if (error) {
      throw new Error('Gagal menambahkan siswa: ' + error.message)
    }

    revalidatePath('/admin/siswa')
    revalidatePath('/tentor/sesi/tambah')

    redirect('/admin/siswa')
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold text-slate-900">Tambah Siswa</h1>

      <form action={handleSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="nama" className="label-base">
            Nama Siswa
          </label>
          <input
            id="nama"
            name="nama"
            type="text"
            required
            className="input-base"
            placeholder="Masukkan nama siswa"
          />
        </div>

        <div>
          <label htmlFor="kelas" className="label-base">
            Kelas
          </label>
          <input
            id="kelas"
            name="kelas"
            type="text"
            required
            className="input-base"
            placeholder="Masukkan kelas"
          />
        </div>

        <div>
          <label htmlFor="sekolah" className="label-base">
            Sekolah
          </label>
          <input
            id="sekolah"
            name="sekolah"
            type="text"
            required
            className="input-base"
            placeholder="Masukkan sekolah"
          />
        </div>

        <div>
          <label htmlFor="tanggal_lahir" className="label-base">
            Tanggal Lahir
          </label>
          <input
            id="tanggal_lahir"
            name="tanggal_lahir"
            type="date"
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="alamat" className="label-base">
            Alamat
          </label>
          <textarea
            id="alamat"
            name="alamat"
            className="input-base min-h-[100px]"
            placeholder="Masukkan alamat siswa"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-[#063D27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5738]"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  )
}