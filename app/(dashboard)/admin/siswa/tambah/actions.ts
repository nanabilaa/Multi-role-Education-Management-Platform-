'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const paketOptions = [
  { value: 'reguler', label: 'Reguler' },
  { value: 'intensif', label: 'Intensif' },
  { value: 'utbk', label: 'UTBK' },
] as const

type PaketSiswa = (typeof paketOptions)[number]['value']

export async function handleSubmit(formData: FormData) {
  const supabase = await createClient()

  const nama = String(formData.get('nama') || '').trim()
  const kelas = String(formData.get('kelas') || '').trim()
  const sekolah = String(formData.get('sekolah') || '').trim()
  const paket = String(formData.get('paket') || '')
    .trim()
    .toLowerCase()
  const tanggalLahir = String(
    formData.get('tanggal_lahir') || '',
  ).trim()
  const alamat = String(formData.get('alamat') || '').trim()
  const namaOrtu = String(
    formData.get('nama_ortu') || '',
  ).trim()
  const pekerjaanOrtu = String(
    formData.get('pekerjaan_ortu') || '',
  ).trim()

  if (!nama || !kelas || !sekolah || !paket || !namaOrtu) {
    throw new Error(
      'Nama siswa, kelas, sekolah, paket, dan nama orang tua wajib diisi.',
    )
  }

  const paketValid = paketOptions.some(
    (item) => item.value === paket,
  )

  if (!paketValid) {
    throw new Error('Paket yang dipilih tidak valid.')
  }

  const payload: {
    nama: string
    kelas: string
    sekolah: string
    paket: PaketSiswa
    nama_ortu: string
    pekerjaan_ortu: string | null
    alamat: string | null
    aktif: boolean
    tanggal_lahir: string | null
  } = {
    nama,
    kelas,
    sekolah,
    paket: paket as PaketSiswa,
    nama_ortu: namaOrtu,
    pekerjaan_ortu: pekerjaanOrtu || null,
    alamat: alamat || null,
    aktif: true,
    tanggal_lahir: tanggalLahir || null,
  }

  const { error } = await supabase
    .from('siswa')
    .insert(payload)

  if (error) {
    throw new Error(
      `Gagal menambahkan siswa: ${error.message}`,
    )
  }

  revalidatePath('/admin/siswa')
  revalidatePath('/admin/dana')
  revalidatePath('/tentor/sesi/tambah')

  redirect('/admin/siswa')
}
