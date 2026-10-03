'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getLatihanByTentor(tentorId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('latihan_soals')
    .select('*')
    .eq('tentor_id', tentorId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function createLatihan(form: {
  tentor_id: string
  judul: string
  mapel: string
  kelas: string
  materi?: string
  deskripsi?: string
  deadline?: string
  status: 'draft' | 'dipublikasikan'
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('latihan_soals').insert(form).select().single()
  if (error) throw error
  revalidatePath('/tentor/latihan')
  return data
}

export async function updateLatihan(id: string, updates: Partial<any>) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('latihan_soals').update(updates).eq('id', id).select().single()
  if (error) throw error
  revalidatePath('/tentor/latihan')
  return data
}

export async function getSoalsByLatihan(latihanId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('soals').select('*').eq('latihan_id', latihanId).order('created_at')
  if (error) throw error
  return data || []
}

export async function createSoal(form: {
  latihan_id: string
  tipe_soal: 'pilihan_ganda' | 'essay'
  pertanyaan: string
  opsi_a?: string
  opsi_b?: string
  opsi_c?: string
  opsi_d?: string
  jawaban_benar?: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('soals').insert(form).select().single()
  if (error) throw error
  revalidatePath('/tentor/latihan')
  return data
}

export async function getPengerjaanBySiswa(siswaId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('pengerjaans')
    .select('*, latihan_soals(*), jawaban_siswas(*, soals(*))')
    .eq('siswa_id', siswaId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function submitPengerjaan(siswaId: string, latihanId: string, jawaban: { soal_id: string; jawaban: string }[]) {
  const supabase = await createClient()
  // Buat pengerjaan
  const { data: pengerjaan, error: err1 } = await supabase
    .from('pengerjaans')
    .insert({ siswa_id: siswaId, latihan_id: latihanId, status: 'selesai', tanggal_selesai: new Date().toISOString() })
    .select()
    .single()
  if (err1) throw err1

  // Ambil soal untuk hitung nilai pilihan ganda
  const { data: soals } = await supabase.from('soals').select('*').eq('latihan_id', latihanId)
  let benar = 0
  const total = soals?.length || 0

  for (const j of jawaban) {
    const soal = soals?.find((s: any) => s.id === j.soal_id)
    let nilai = 0
    if (soal && soal.tipe_soal === 'pilihan_ganda') {
      if (j.jawaban === soal.jawaban_benar) {
        nilai = 1
        benar++
      }
    } else if (soal && soal.tipe_soal === 'essay') {
      nilai = 0 // menunggu koreksi
    }
    await supabase.from('jawaban_siswas').insert({
      pengerjaan_id: pengerjaan.id,
      soal_id: j.soal_id,
      jawaban: j.jawaban,
      nilai,
    })
  }

  const nilaiAkhir = total > 0 ? Math.round((benar / total) * 100) : 0
  await supabase.from('pengerjaans').update({ nilai: nilaiAkhir, status: 'selesai' }).eq('id', pengerjaan.id)
  revalidatePath('/ortu/dashboard')
  return { pengerjaan, nilai: nilaiAkhir, benar, total }
}
