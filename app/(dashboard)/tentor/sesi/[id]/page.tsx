import { createClient } from '@/lib/supabase/server'
import { formatTanggal } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import SesiDetailClient from './SesiDetailClient'
import DeleteSesiButton from './DeleteSesiButton'

export default async function SesiDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: sesi, error } = await supabase
    .from('sesi')
    .select(`
      id,
      tanggal,
      jam_mulai,
      mapel,
      durasi,
      status,
      sesi_siswa(
        id,
        siswa:siswa(id, nama, kelas, sekolah)
      ),
      jurnal(id, foto_validasi_url)
    `)
    .eq('id', params.id)
    .eq('tentor_id', user.id)
    .single()

  if (error || !sesi) {
    notFound()
  }

  const siswaList = sesi.sesi_siswa?.map((item: any) => item.siswa).filter(Boolean) ?? []
  const hasJurnal = (sesi.jurnal?.length ?? 0) > 0

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Link
          href="/tentor/sesi"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Link>

        <div className="flex gap-3">
          <Link
            href={`/tentor/sesi/${sesi.id}/edit`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Edit Sesi
          </Link>
          <Link
            href={`/tentor/sesi/${sesi.id}/masuk`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Masuk Sesi
          </Link>
          <Link
            href={`/tentor/sesi/${sesi.id}/jurnal`}
            className="rounded-xl bg-[#063D27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5738]"
          >
            Jurnal
          </Link>
          <DeleteSesiButton sesiId={sesi.id} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">{sesi.mapel}</h1>

        <div className="mt-4 grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-900">Tanggal:</span> {formatTanggal(sesi.tanggal)}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Jam Mulai:</span> {sesi.jam_mulai?.slice(0, 5) || '-'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Durasi:</span> {sesi.durasi} menit
          </p>
          <p>
            <span className="font-semibold text-slate-900">Status:</span> {sesi.status}
          </p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-900">Murid</p>
          <div className="flex flex-wrap gap-2">
            {siswaList.length > 0 ? (
              siswaList.map((siswa: any) => (
                <span
                  key={siswa.id}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                >
                  {siswa.nama} {siswa.kelas ? `• ${siswa.kelas}` : ''}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">Belum ada murid</span>
            )}
          </div>
        </div>
      </div>

      <SesiDetailClient sesiId={sesi.id} initialStatus={sesi.status} hasJurnal={hasJurnal} />
    </div>
  )
}