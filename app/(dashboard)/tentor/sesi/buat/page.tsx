import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Save,
  UsersRound,
} from 'lucide-react'

type SiswaRow = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
  aktif: boolean | null
}

async function getSiswaAktif() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('siswa')
    .select('id, nama, kelas, sekolah, aktif')
    .eq('aktif', true)
    .order('nama', { ascending: true })

  if (error) {
    console.log('GET SISWA AKTIF ERROR:', error)
    return []
  }

  return (data ?? []) as SiswaRow[]
}

export default async function BuatSesiTentorPage() {
  const siswaList = await getSiswaAktif()

  async function handleCreateSesi(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    const tanggal = String(formData.get('tanggal') || '').trim()
    const jamMulai = String(formData.get('jam_mulai') || '').trim()
    const durasi = Number(formData.get('durasi') || 60)
    const mapel = String(formData.get('mapel') || '').trim()
    const siswaIds = formData
      .getAll('siswa_ids')
      .map((item) => String(item))
      .filter(Boolean)

    if (!tanggal || !jamMulai || !mapel) {
      throw new Error('Tanggal, jam mulai, dan mapel wajib diisi.')
    }

    if (siswaIds.length === 0) {
      throw new Error('Pilih minimal satu siswa.')
    }

    const { data: sesiBaru, error: sesiError } = await supabase
      .from('sesi')
      .insert({
        tentor_id: user.id,
        tanggal,
        jam_mulai: jamMulai,
        durasi,
        mapel,
        status: 'terjadwal',
      })
      .select('id')
      .single()

    if (sesiError || !sesiBaru) {
      throw new Error(
        'Gagal menambahkan sesi: ' + (sesiError?.message || 'Sesi gagal dibuat')
      )
    }

    const relasiPayload = siswaIds.map((siswaId) => ({
      sesi_id: sesiBaru.id,
      siswa_id: siswaId,
      hadir: null,
      materi: null,
      deskripsi: null,
    }))

    const { error: relasiError } = await supabase
      .from('sesi_siswa')
      .insert(relasiPayload)

    if (relasiError) {
      await supabase.from('sesi').delete().eq('id', sesiBaru.id)

      throw new Error(
        'Sesi dibuat, tapi gagal menambahkan siswa: ' + relasiError.message
      )
    }

    revalidatePath('/tentor')
    revalidatePath('/tentor/sesi')
    revalidatePath('/tentor/jurnal')
    revalidatePath('/admin')
    revalidatePath('/admin/jadwal')
    revalidatePath('/ortu/dashboard')
    revalidatePath('/ortu/jadwal')

    redirect('/tentor/sesi')
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="rounded-[32px] border border-[#DDE9DB] bg-white p-6 sm:p-7">
          <Link
            href="/tentor/sesi"
            className="mb-5 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-4 text-xs font-black text-[#063D27] transition hover:bg-[#EAF3E8]"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali
          </Link>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-bold text-[#063D27]">
                <CalendarDays className="h-4 w-4" />
                Buat Jadwal
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Buat Sesi Baru
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Isi jadwal mengajar dengan sederhana. Pilih siswa lewat daftar checkbox di bawah.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#DDE9DB] bg-[#FAFCF9] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Siswa Aktif
              </p>
              <p className="mt-1 text-3xl font-black text-[#063D27]">
                {siswaList.length}
              </p>
            </div>
          </div>
        </section>

        <form
          action={handleCreateSesi}
          className="grid gap-5 lg:grid-cols-[1fr_340px]"
        >
          <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5 sm:p-6">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                <Clock3 className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#063D27]">
                  Detail Sesi
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                  Tentukan tanggal, jam, durasi, dan mata pelajaran.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="tanggal"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Tanggal <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="tanggal"
                    name="tanggal"
                    type="date"
                    required
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>

                <div>
                  <label
                    htmlFor="jam_mulai"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Jam Mulai <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="jam_mulai"
                    name="jam_mulai"
                    type="time"
                    required
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="durasi"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Durasi
                  </label>

                  <select
                    id="durasi"
                    name="durasi"
                    defaultValue="60"
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  >
                    <option value="60">60 menit</option>
                    <option value="70">70 menit</option>
                    <option value="90">90 menit</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="mapel"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Mapel <span className="text-red-500">*</span>
                  </label>

                  <input
                    id="mapel"
                    name="mapel"
                    type="text"
                    required
                    placeholder="Contoh: Matematika"
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                <UsersRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#063D27]">
                  Pilih Siswa
                </h2>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                  Minimal pilih satu siswa.
                </p>
              </div>
            </div>

            {siswaList.length === 0 ? (
              <div className="rounded-[22px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-8 text-center">
                <p className="text-sm font-bold text-slate-400">
                  Belum ada siswa aktif.
                </p>
              </div>
            ) : (
              <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
                {siswaList.map((siswa) => (
                  <label
                    key={siswa.id}
                    className="flex cursor-pointer items-start gap-3 rounded-[20px] border border-[#EEF3EC] bg-[#FAFCF9] p-3 transition hover:border-[#DDE9DB] hover:bg-white"
                  >
                    <input
                      type="checkbox"
                      name="siswa_ids"
                      value={siswa.id}
                      className="mt-1 h-4 w-4 rounded border-slate-300 accent-[#063D27]"
                    />

                    <div className="min-w-0">
                      <p className="text-sm font-black text-[#063D27]">
                        {siswa.nama}
                      </p>

                      <p className="mt-0.5 text-xs font-semibold leading-5 text-slate-400">
                        {siswa.kelas ?? '-'} · {siswa.sekolah ?? '-'}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            <div className="mt-5 border-t border-[#EEF3EC] pt-5">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738]"
              >
                <Save className="h-4 w-4" />
                Simpan Sesi
              </button>

              <p className="mt-3 flex items-start gap-2 text-xs font-semibold leading-5 text-slate-400">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#063D27]" />
                Setelah disimpan, sesi akan muncul di dashboard tentor, admin, dan orang tua siswa terkait.
              </p>
            </div>
          </section>
        </form>
      </div>
    </main>
  )
}