import JadwalClient from './JadwalClient'
import Header from '@/components/admin/Header'
import { createClient } from '@/lib/supabase/server'

export default async function JadwalPage() {
  const supabase = await createClient()
  const { data: tentorList } = await supabase
    .from('profiles').select('id, full_name').eq('role', 'tentor').order('full_name')
  const { data: siswaList } = await supabase
    .from('siswa').select('id, nama, kelas').eq('aktif', true).order('nama')

  return (
    <>
      <Header title="Kelola Jadwal" subtitle="Semua jadwal sesi bimbel" />
      <JadwalClient tentorList={tentorList ?? []} siswaList={siswaList ?? []} />
    </>
  )
}