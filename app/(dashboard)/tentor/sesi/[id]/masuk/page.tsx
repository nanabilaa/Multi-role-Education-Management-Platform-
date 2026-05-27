import { createClient } from '@/lib/supabase/server'
import { formatTanggal } from '@/lib/utils'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export default async function MasukSesiPage({
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
        siswa:siswa(id, nama, kelas, sekolah)
      )
    `)
    .eq('id', params.id)
    .eq('tentor_id', user.id)
    .single()

  if (error || !sesi) {
    notFound()
  }

  async function updateStatusAction(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const status = String(formData.get('status') || '').trim()
    const allowed = ['terjadwal', 'berlangsung', 'dibatalkan']

    if (!allowed.includes(status)) {
      throw new Error('Status tidak valid')
    }

    const { error } = await supabase
      .from('sesi')
      .update({ status })
      .eq('id', params.id)
      .eq('tentor_id', user.id)

    if (error) {
      throw new Error(error.message)
    }

    revalidatePath('/tentor/sesi')
    revalidatePath(`/tentor/sesi/${params.id}`)
    revalidatePath(`/tentor/sesi/${params.id}/masuk`)

    redirect(`/tentor/sesi/${params.id}/masuk`)
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Masuk Sesi</h1>
          <p className="text-sm text-slate-500">
            {sesi.mapel} • {formatTanggal(sesi.tanggal)}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/tentor/sesi/${sesi.id}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Detail
          </Link>
          <Link
            href={`/tentor/sesi/${sesi.id}/jurnal`}
            className="rounded-xl bg-[#063D27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5738]"
          >
            Jurnal
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-900">Tanggal:</span>{' '}
            {formatTanggal(sesi.tanggal)}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Jam Mulai:</span>{' '}
            {sesi.jam_mulai?.slice(0, 5) || '-'}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Durasi:</span>{' '}
            {sesi.durasi} menit
          </p>
          <p>
            <span className="font-semibold text-slate-900">Status:</span>{' '}
            {sesi.status}
          </p>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-slate-900">Murid di sesi ini</p>
          <div className="flex flex-wrap gap-2">
            {sesi.sesi_siswa?.length ? (
              sesi.sesi_siswa.map((item: any, idx: number) => (
                <span
                  key={item.siswa?.id || idx}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-700"
                >
                  {item.siswa?.nama ?? '-'}
                </span>
              ))
            ) : (
              <span className="text-sm text-slate-500">Belum ada murid</span>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {sesi.status !== 'berlangsung' && sesi.status !== 'selesai' && sesi.status !== 'dibatalkan' ? (
            <form action={updateStatusAction}>
              <input type="hidden" name="status" value="berlangsung" />
              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Mulai Sesi
              </button>
            </form>
          ) : null}

          {sesi.status !== 'selesai' && sesi.status !== 'dibatalkan' ? (
            <form action={updateStatusAction}>
              <input type="hidden" name="status" value="dibatalkan" />
              <button
                type="submit"
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Batalkan
              </button>
            </form>
          ) : null}

          {sesi.status !== 'selesai' ? (
            <Link
              href={`/tentor/sesi/${params.id}/jurnal`}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Tutup via Jurnal
            </Link>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Sesi ditutup melalui halaman jurnal. Foto validasi wajib diupload saat menutup sesi.
        </div>
      </div>
    </div>
  )
}