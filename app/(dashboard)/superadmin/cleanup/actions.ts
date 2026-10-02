'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function deleteFotoValidasi() {
  const supabase = createAdminClient()
  
  // Ambil semua jurnal yang punya foto
  const { data: jurnalList, error: fetchError } = await supabase
    .from('jurnal')
    .select('id, foto_validasi_path')
    .not('foto_validasi_path', 'is', null)

  if (fetchError) throw new Error('Gagal mengambil data jurnal')
  if (!jurnalList || jurnalList.length === 0) return { count: 0 }

  const paths = jurnalList.map(j => j.foto_validasi_path as string)
  
  // Hapus file di storage
  // Supabase remove limitnya 100 per request, tapi coba dulu jika tidak terlalu banyak
  // Untuk produksi besar sebaiknya di-batch
  const BATCH_SIZE = 100
  let deletedCount = 0

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE)
    const { error: storageError } = await supabase.storage
      .from('validasi-sesi')
      .remove(batch)
    
    if (storageError) console.error('Gagal hapus batch foto validasi:', storageError)
    else deletedCount += batch.length
  }

  // Update tabel jurnal
  const { error: updateError } = await supabase
    .from('jurnal')
    .update({ 
      foto_validasi_path: null, 
      foto_validasi_url: null,
      foto_url: null // reset old column too if needed
    })
    .not('foto_validasi_path', 'is', null)

  if (updateError) throw new Error('Gagal update data jurnal di database')

  revalidatePath('/superadmin/cleanup')
  return { count: deletedCount }
}

export async function deleteFotoTugasSiswa() {
  const supabase = createAdminClient()
  
  const { data: list, error: fetchError } = await supabase
    .from('jurnal_siswa')
    .select('id, soal_tugas_path')
    .not('soal_tugas_path', 'is', null)

  if (fetchError) throw new Error('Gagal mengambil data tugas siswa')
  if (!list || list.length === 0) return { count: 0 }

  const paths = list.map(j => j.soal_tugas_path as string)
  
  const BATCH_SIZE = 100
  let deletedCount = 0

  for (let i = 0; i < paths.length; i += BATCH_SIZE) {
    const batch = paths.slice(i, i + BATCH_SIZE)
    const { error: storageError } = await supabase.storage
      .from('soal-tugas-siswa')
      .remove(batch)
    
    if (storageError) console.error('Gagal hapus batch tugas siswa:', storageError)
    else deletedCount += batch.length
  }

  const { error: updateError } = await supabase
    .from('jurnal_siswa')
    .update({ 
      soal_tugas_path: null, 
      soal_tugas_url: null 
    })
    .not('soal_tugas_path', 'is', null)

  if (updateError) throw new Error('Gagal update data tugas siswa di database')

  revalidatePath('/superadmin/cleanup')
  return { count: deletedCount }
}

export async function deleteSesiBelumSelesai() {
  const supabase = createAdminClient()
  
  const { data, error, count } = await supabase
    .from('sesi')
    .delete({ count: 'exact' })
    .neq('status', 'selesai')

  if (error) throw new Error('Gagal menghapus sesi belum selesai')

  revalidatePath('/superadmin/cleanup')
  return { count: count || 0 }
}

export async function deleteFeedbackDitutup() {
  const supabase = createAdminClient()
  
  const { data, error, count } = await supabase
    .from('feedback_saran')
    .delete({ count: 'exact' })
    .eq('status', 'ditutup')

  if (error) throw new Error('Gagal menghapus feedback')

  revalidatePath('/superadmin/cleanup')
  return { count: count || 0 }
}
