import { createClient } from '@/lib/supabase/server'
import Header from '@/components/admin/Header'
import JadwalClient from './JadwalClient'

export default async function JadwalPage() {
  const supabase = await createClient()

  const { data: sesiList, error: sesiError } = await supabase
    .from('sesi')
    .select(`
      id,
      tanggal,
      jam_mulai,
      mapel,
      durasi,
      status,
      tentor:profiles(full_name),
      sesi_siswa(
        siswa:siswa(nama)
      ),
      jurnal(id)
    `)
    .order('tanggal', { ascending: false })
    .order('jam_mulai', { ascending: true })
    .limit(100)

  const { data: tentorList, error: tentorError } = await supabase
    .from('profiles')
    .select('id, full_name')
    .eq('role', 'tentor')
    .order('full_name', { ascending: true })

  if (sesiError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">Gagal mengambil jadwal</h1>
        <p>{sesiError.message}</p>
      </div>
    )
  }

  if (tentorError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">Gagal mengambil data tentor</h1>
        <p>{tentorError.message}</p>
      </div>
    )
  }

  return (
    <>
      <Header
        title="Jadwal Sesi"
        subtitle="Pantau semua jadwal sesi bimbel"
      />
      <JadwalClient sesiList={sesiList ?? []} tentorList={tentorList ?? []} />
    </>
  )
}