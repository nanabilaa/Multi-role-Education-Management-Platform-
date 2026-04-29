'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function updateSiswa(id: string, formData: FormData) {
  const nama = formData.get('nama')?.toString().trim()
  const kelas = formData.get('kelas')?.toString().trim()
  const sekolah = formData.get('sekolah')?.toString().trim()
  const aktifValue = formData.get('aktif')?.toString()

  if (!id) {
    throw new Error('ID siswa tidak ditemukan.')
  }

  if (!nama) {
    throw new Error('Nama siswa wajib diisi.')
  }

  if (!kelas) {
    throw new Error('Kelas siswa wajib dipilih.')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('siswa')
    .update({
      nama,
      kelas,
      sekolah: sekolah || null,
      aktif: aktifValue === 'true',
    })
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/siswa')
  revalidatePath(`/admin/siswa/${id}`)
  redirect('/admin/siswa')
}