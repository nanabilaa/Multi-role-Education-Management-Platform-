// app/(dashboard)/tentor/honor/page.tsx
import { createClient } from '@/lib/supabase/server'
import { formatTanggal } from '@/lib/utils'

export default async function HistoryHonor() {
  const supabase = await createClient()

  // Ambil user id dari Supabase auth
  const { data: { user } } = await supabase.auth.getUser()

  // Query untuk mengambil data honor dengan menggunakan user.id
  const { data: honorList, error } = await supabase
    .from('honor')
    .select(`
      id,
      sesi_id,
      jumlah_honor,
      tanggal_bayar,
      sesi: sesi(mapel, tanggal)
    `)
    .eq('tentor_id', user?.id)  // Ganti auth.uid() dengan user.id
    .order('tanggal_bayar', { ascending: false })

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">Gagal mengambil history honor</h1>
        <p>{error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 px-6 py-10">
      <h1 className="text-2xl font-bold text-slate-900">History Penerimaan Honor</h1>
      <p className="text-sm text-slate-500">Riwayat honor yang telah diberikan oleh admin.</p>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold">Tanggal Bayar</th>
                <th className="px-4 py-3 text-xs font-semibold">Sesi</th>
                <th className="px-4 py-3 text-xs font-semibold">Honor</th>
              </tr>
            </thead>
            <tbody>
              {(honorList ?? []).map((honor: any) => (
                <tr key={honor.id} className="border-b border-slate-200">
                  <td className="px-4 py-3">{formatTanggal(honor.tanggal_bayar)}</td>
                  <td className="px-4 py-3">{honor.sesi?.mapel}</td>
                  <td className="px-4 py-3">Rp {honor.jumlah_honor.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}