import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'

const ALLOWED_DURASI = [60, 70, 90]

export default async function EditSesiPage({
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

  const { data: sesi, error: sesiError } = await supabase
    .from('sesi')
    .select(`
      id,
      tanggal,
      jam_mulai,
      mapel,
      durasi,
      status,
      sesi_siswa(
        siswa_id
      )
    `)
    .eq('id', params.id)
    .eq('tentor_id', user.id)
    .single()

  if (sesiError || !sesi) {
    notFound()
  }

  const { data: siswaList, error: siswaError } = await supabase
    .from('siswa')
    .select('id, nama, kelas, sekolah')
    .eq('aktif', true)
    .order('nama', { ascending: true })

  if (siswaError) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">Gagal mengambil data siswa</h1>
        <p>{siswaError.message}</p>
      </div>
    )
  }

  const selectedIds = new Set(
    (sesi.sesi_siswa ?? []).map((item: any) => item.siswa_id)
  )

  async function updateSesiAction(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login')
    }

    const siswaIds = formData.getAll('siswa_ids').map(String).filter(Boolean)
    const mapel = String(formData.get('mapel') || '').trim()
    const tanggal = String(formData.get('tanggal') || '').trim()
    const jamMulai = String(formData.get('jam_mulai') || '').trim()
    const durasi = Number(formData.get('durasi') || 0)

    if (!mapel || !tanggal || siswaIds.length === 0) {
      throw new Error('Mapel, tanggal, dan minimal 1 murid wajib dipilih')
    }

    if (!ALLOWED_DURASI.includes(durasi)) {
      throw new Error('Durasi tidak valid')
    }

    const { error: updateError } = await supabase
      .from('sesi')
      .update({
        mapel,
        tanggal,
        jam_mulai: jamMulai || null,
        durasi,
      })
      .eq('id', params.id)
      .eq('tentor_id', user.id)

    if (updateError) {
      throw new Error(updateError.message)
    }

    const { error: deleteRelasiError } = await supabase
      .from('sesi_siswa')
      .delete()
      .eq('sesi_id', params.id)

    if (deleteRelasiError) {
      throw new Error(deleteRelasiError.message)
    }

    const relasiPayload = siswaIds.map((siswaId) => ({
      sesi_id: params.id,
      siswa_id: siswaId,
    }))

    const { error: insertRelasiError } = await supabase
      .from('sesi_siswa')
      .insert(relasiPayload)

    if (insertRelasiError) {
      throw new Error(insertRelasiError.message)
    }

    revalidatePath('/tentor/sesi')
    revalidatePath(`/tentor/sesi/${params.id}`)
    redirect(`/tentor/sesi/${params.id}`)
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Edit Sesi</h1>
        <Link
          href={`/tentor/sesi/${params.id}`}
          className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Kembali
        </Link>
      </div>

      <form action={updateSesiAction} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="label-base">Pilih Murid</label>
          <div className="mt-2 space-y-2 rounded-xl border border-slate-200 p-4">
            {siswaList?.map((siswa: any) => (
              <label
                key={siswa.id}
                className="flex items-start gap-3 rounded-lg border border-slate-100 p-3"
              >
                <input
                  type="checkbox"
                  name="siswa_ids"
                  value={siswa.id}
                  defaultChecked={selectedIds.has(siswa.id)}
                  className="mt-1"
                />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{siswa.nama}</p>
                  <p className="text-sm text-slate-500">
                    {siswa.kelas} • {siswa.sekolah}
                  </p>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="mapel" className="label-base">Mata Pelajaran</label>
          <input
            id="mapel"
            name="mapel"
            type="text"
            required
            defaultValue={sesi.mapel}
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="tanggal" className="label-base">Tanggal</label>
          <input
            id="tanggal"
            name="tanggal"
            type="date"
            required
            defaultValue={sesi.tanggal}
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="jam_mulai" className="label-base">Jam Mulai</label>
          <input
            id="jam_mulai"
            name="jam_mulai"
            type="time"
            defaultValue={sesi.jam_mulai || ''}
            className="input-base"
          />
        </div>

        <div>
          <label htmlFor="durasi" className="label-base">Durasi</label>
          <select
            id="durasi"
            name="durasi"
            required
            defaultValue={String(sesi.durasi)}
            className="input-base"
          >
            <option value="60">60 menit</option>
            <option value="70">70 menit</option>
            <option value="90">90 menit</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-xl bg-[#063D27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5738]"
          >
            Update Sesi
          </button>
        </div>
      </form>
    </div>
  )
}