import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Home,
  School,
  ToggleLeft,
  UserRound,
  UsersRound,
} from 'lucide-react'

import SubmitButton from './SubmitButton'

const kelasOptions = [
  'Kelas 7',
  'Kelas 8',
  'Kelas 9',
  'Kelas 10',
  'Kelas 11',
  'Kelas 12',
]

type PageProps = {
  params: Promise<{
    id: string
  }>
}

type OrtuProfile = {
  id: string
  full_name: string | null
  phone: string | null
}

type SiswaDetail = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
  tanggal_lahir: string | null
  alamat: string | null
  aktif: boolean | null
  ortu_id: string | null
  ortu: OrtuProfile | OrtuProfile[] | null
}

function normalizeOrtu(ortu: OrtuProfile | OrtuProfile[] | null) {
  if (Array.isArray(ortu)) {
    return ortu[0] ?? null
  }

  return ortu
}

export default async function EditSiswaPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const [siswaRes, ortuRes] = await Promise.all([
    supabase
      .from('siswa')
      .select(
        `
        id,
        nama,
        kelas,
        sekolah,
        tanggal_lahir,
        alamat,
        aktif,
        ortu_id,
        ortu:profiles(
          id,
          full_name,
          phone
        )
      `
      )
      .eq('id', id)
      .single(),

    supabase
      .from('profiles')
      .select('id, full_name, phone')
      .eq('role', 'ortu')
      .order('full_name', { ascending: true }),
  ])

  if (siswaRes.error || !siswaRes.data) {
    notFound()
  }

  const siswa = siswaRes.data as unknown as SiswaDetail
  const ortuList = (ortuRes.data ?? []) as OrtuProfile[]
  const currentOrtu = normalizeOrtu(siswa.ortu)

  async function handleUpdate(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const nama = String(formData.get('nama') || '').trim()
    const kelas = String(formData.get('kelas') || '').trim()
    const sekolah = String(formData.get('sekolah') || '').trim()
    const tanggalLahir = String(formData.get('tanggal_lahir') || '').trim()
    const alamat = String(formData.get('alamat') || '').trim()
    const ortuId = String(formData.get('ortu_id') || '').trim()
    const aktif = String(formData.get('aktif') || '') === 'true'

    if (!nama || !kelas || !sekolah) {
      throw new Error('Nama, kelas, dan sekolah wajib diisi.')
    }

    const { error } = await supabase
      .from('siswa')
      .update({
        nama,
        kelas,
        sekolah,
        tanggal_lahir: tanggalLahir || null,
        alamat: alamat || null,
        ortu_id: ortuId || null,
        aktif,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      throw new Error('Gagal memperbarui siswa: ' + error.message)
    }

    revalidatePath('/admin/siswa')
    revalidatePath(`/admin/siswa/${id}`)
    revalidatePath('/ortu/dashboard')
    revalidatePath('/ortu/jadwal')
    revalidatePath('/ortu/jurnal')
    revalidatePath('/ortu/tagihan')
    revalidatePath('/ortu/profil')

    redirect('/admin/siswa')
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="overflow-hidden rounded-[32px] border border-[#E7EFE6] bg-white">
          <div className="p-6 sm:p-7">
            <Link
              href="/admin/siswa"
              className="mb-5 inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-4 text-xs font-black text-[#063D27] transition hover:bg-[#EAF3E8]"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke Data Siswa
            </Link>

            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
                  <GraduationCap className="h-4 w-4" />
                  Admin · Edit Siswa
                </div>

                <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                  Edit Data Siswa
                </h1>

                <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                  Perbarui data siswa dan hubungkan ke akun orang tua supaya portal ortu bisa menampilkan jadwal, jurnal, dan tagihan anak.
                </p>
              </div>

              <div className="rounded-[24px] border border-[#E7EFE6] bg-[#FAFCF9] p-4">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  Siswa
                </p>

                <p className="mt-1 text-sm font-black text-[#063D27]">
                  {siswa.nama}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1fr_330px]">
          <form
            action={handleUpdate}
            className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6"
          >
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
                <UserRound className="h-5 w-5" />
              </div>

              <div>
                <h2 className="text-lg font-black text-[#063D27]">
                  Data Utama
                </h2>

                <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
                  Pastikan nama, kelas, sekolah, dan akun orang tua sudah sesuai.
                </p>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label
                  htmlFor="nama"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                >
                  Nama Siswa <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="nama"
                    name="nama"
                    type="text"
                    required
                    defaultValue={siswa.nama ?? ''}
                    className="h-13 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="kelas"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Kelas <span className="text-red-500">*</span>
                  </label>

                  <div className="relative">
                    <GraduationCap className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <select
                      id="kelas"
                      name="kelas"
                      required
                      defaultValue={siswa.kelas ?? ''}
                      className="h-13 w-full appearance-none rounded-full border border-[#DDE9DB] bg-[#FAFCF9] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                    >
                      <option value="" disabled>
                        Pilih kelas
                      </option>

                      {kelasOptions.map((kelas) => (
                        <option key={kelas} value={kelas}>
                          {kelas}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="tanggal_lahir"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Tanggal Lahir
                  </label>

                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="tanggal_lahir"
                      name="tanggal_lahir"
                      type="date"
                      defaultValue={siswa.tanggal_lahir ?? ''}
                      className="h-13 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="sekolah"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                >
                  Sekolah <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <School className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    id="sekolah"
                    name="sekolah"
                    type="text"
                    required
                    defaultValue={siswa.sekolah ?? ''}
                    className="h-13 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="ortu_id"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                >
                  Akun Orang Tua
                </label>

                <div className="relative">
                  <UsersRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    id="ortu_id"
                    name="ortu_id"
                    defaultValue={siswa.ortu_id ?? ''}
                    className="h-13 w-full appearance-none rounded-full border border-[#DDE9DB] bg-[#FAFCF9] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  >
                    <option value="">Belum dihubungkan</option>

                    {ortuList.map((ortu) => (
                      <option key={ortu.id} value={ortu.id}>
                        {ortu.full_name ?? 'Tanpa nama'}
                        {ortu.phone ? ` · ${ortu.phone}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                  Pilih akun orang tua supaya data anak muncul di dashboard ortu.
                </p>
              </div>

              <div>
                <label
                  htmlFor="aktif"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                >
                  Status Siswa
                </label>

                <div className="relative">
                  <ToggleLeft className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <select
                    id="aktif"
                    name="aktif"
                    defaultValue={siswa.aktif ? 'true' : 'false'}
                    className="h-13 w-full appearance-none rounded-full border border-[#DDE9DB] bg-[#FAFCF9] py-3 pl-11 pr-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  >
                    <option value="true">Aktif</option>
                    <option value="false">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="alamat"
                  className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                >
                  Alamat
                </label>

                <div className="relative">
                  <Home className="pointer-events-none absolute left-4 top-5 h-4 w-4 text-slate-400" />

                  <textarea
                    id="alamat"
                    name="alamat"
                    rows={4}
                    defaultValue={siswa.alamat ?? ''}
                    placeholder="Masukkan alamat siswa"
                    className="w-full resize-none rounded-[24px] border border-[#DDE9DB] bg-[#FAFCF9] py-4 pl-11 pr-4 text-sm font-bold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-[#EEF3EC] pt-5 sm:flex-row sm:justify-end">
                <Link
                  href="/admin/siswa"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-5 text-sm font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
                >
                  Batal
                </Link>

                <SubmitButton />
              </div>
            </div>
          </form>

          <aside className="space-y-4">
            <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
              <div className="flex h-12 w-12 items-center justify-center rounded-[20px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
                <UsersRound className="h-6 w-6" />
              </div>

              <h2 className="mt-4 text-lg font-black text-[#063D27]">
                Hubungkan ke Ortu
              </h2>

              <p className="mt-2 text-sm font-medium leading-7 text-slate-500">
                Setelah memilih akun orang tua, siswa ini akan muncul di portal ortu pada menu dashboard, jadwal, jurnal, tagihan, dan profil.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Orang tua saat ini
              </p>

              {currentOrtu ? (
                <div className="mt-4 rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4">
                  <p className="font-black text-[#063D27]">
                    {currentOrtu.full_name ?? 'Tanpa nama'}
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-500">
                    {currentOrtu.phone ?? 'Nomor HP belum diisi'}
                  </p>
                </div>
              ) : (
                <div className="mt-4 rounded-[22px] border border-[#EFE6BF] bg-[#FFFBEA] p-4">
                  <p className="text-sm font-semibold leading-7 text-[#7A5C00]">
                    Siswa ini belum dihubungkan ke akun orang tua.
                  </p>
                </div>
              )}
            </section>

            <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                Akun ortu tersedia
              </p>

              <p className="mt-3 text-3xl font-black tracking-tight text-[#063D27]">
                {ortuList.length}
              </p>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Diambil dari tabel profiles dengan role ortu.
              </p>
            </section>

            <section className="rounded-[28px] border border-[#EFE6BF] bg-[#FFFBEA] p-5">
              <div className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#7A5C00]" />

                <p className="text-sm font-semibold leading-7 text-[#7A5C00]">
                  Kalau dropdown kosong, berarti belum ada akun di tabel profiles dengan role{' '}
                  <span className="font-black">ortu</span>.
                </p>
              </div>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}