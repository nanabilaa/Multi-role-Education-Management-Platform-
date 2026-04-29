import { createClient } from '@/lib/supabase/server'
import Header from '@/components/admin/Header'
import { formatTanggal } from '@/lib/utils'

export default async function JurnalPage() {
  const supabase = await createClient()
  const { data: jurnalList } = await supabase
    .from('jurnal')
    .select('*, sesi:sesi(tanggal, mapel, tentor:profiles(full_name), sesi_siswa(hadir))')
    .order('submitted_at', { ascending: false })
    .limit(50)

  return (
    <>
      <Header title="Jurnal & Presensi" subtitle="Monitor laporan jurnal dari tentor" />
      <div className="px-6 pb-6 mt-4">
        <div className="card">
          <p className="text-sm text-gray-500">{jurnalList?.length ?? 0} jurnal ditemukan</p>
        </div>
      </div>
    </>
  )
}