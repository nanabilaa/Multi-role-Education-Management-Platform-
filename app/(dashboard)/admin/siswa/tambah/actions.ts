'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export async function tambahSiswa(formData: FormData) {
  const nama = formData.get('nama')?.toString().trim()
  const kelas = formData.get('kelas')?.toString().trim()
  const sekolah = formData.get('sekolah')?.toString().trim()
  const aktifValue = formData.get('aktif')?.toString()

  if (!nama) {
    throw new Error('Nama siswa wajib diisi.')
  }

  if (!kelas) {
    throw new Error('Kelas siswa wajib dipilih.')
  }

  const supabase = await createClient()

  const { error } = await supabase.from('siswa').insert({
    nama,
    kelas,
    sekolah: sekolah || null,
    aktif: aktifValue === 'true',
  })

  if (error) {
    throw new Error(error.message)
  }

  revalidatePath('/admin/siswa')
  redirect('/admin/siswa')
}