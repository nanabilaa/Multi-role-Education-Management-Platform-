// app/(dashboard)/admin/siswa/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import {
  CalendarDays,
  CheckCircle2,
  Filter,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  School,
  Search,
  UserRound,
  UsersRound,
  XCircle,
} from 'lucide-react'
import { formatTanggal } from '@/lib/utils'
import DeleteButton from '@/components/admin/siswa/DeleteButton'

interface SearchParams {
  search?: string
  kelas?: string
  status?: string
}

type SiswaRow = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
  tanggal_lahir: string | null
  alamat: string | null
  aktif: boolean | null
  created_at: string | null
  ortu: {
    full_name: string | null
    phone: string | null
  } | null
}

const kelasOptions = [
  'Kelas 7',
  'Kelas 8',
  'Kelas 9',
  'Kelas 10',
  'Kelas 11',
  'Kelas 12',
]

export default async function SiswaPage({
  searchParams,
}: {
  searchParams?: SearchParams | Promise<SearchParams>
}) {
  const params = (await searchParams) ?? {}
  const supabase = await createClient()

  let query = supabase
    .from('siswa')
    .select('*, ortu:profiles(full_name, phone)')
    .order('nama', { ascending: true })

  if (params.search) {
    query = query.ilike('nama', `%${params.search}%`)
  }

  if (params.kelas) {
    query = query.eq('kelas', params.kelas)
  }

  if (params.status === 'aktif') {
    query = query.eq('aktif', true)
  }

  if (params.status === 'nonaktif') {
    query = query.eq('aktif', false)
  }

  const { data, error } = await query
  const siswaList = (data ?? []) as SiswaRow[]

  const totalSiswa = siswaList.length
  const totalAktif = siswaList.filter((siswa) => siswa.aktif).length
  const totalNonaktif = siswaList.filter((siswa) => !siswa.aktif).length
  const totalKelas = new Set(
    siswaList
      .map((siswa) => siswa.kelas)
      .filter(Boolean)
  ).size

  if (error) {
    return (
      <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <section className="rounded-[30px] border border-red-200 bg-red-50 p-6">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">
              Error
            </p>

            <h1 className="mt-3 text-2xl font-black tracking-tight text-red-700">
              Gagal mengambil data siswa
            </h1>

            <p className="mt-2 text-sm font-semibold leading-7 text-red-600">
              {error.message}
            </p>
          </section>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="overflow-hidden rounded-[32px] border border-[#E7EFE6] bg-white">
          <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-7">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
                <UsersRound className="h-4 w-4" />
                Admin · Data Siswa
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Kelola Siswa
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                Data murid dibuat lebih rapi, tenang, dan mudah dipindai. Pakai filter kalau datanya mulai banyak.
              </p>
            </div>

            <Link
              href="/admin/siswa/tambah"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0B5738]"
            >
              <Plus className="h-4 w-4" />
              Tambah Siswa
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Siswa"
            value={totalSiswa}
            desc="Sesuai filter saat ini"
            icon={<GraduationCap className="h-5 w-5" />}
          />

          <StatCard
            title="Siswa Aktif"
            value={totalAktif}
            desc="Masih mengikuti bimbel"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <StatCard
            title="Nonaktif"
            value={totalNonaktif}
            desc="Tidak aktif sementara"
            icon={<XCircle className="h-5 w-5" />}
          />

          <StatCard
            title="Kelas Terdata"
            value={totalKelas}
            desc="Dari data yang tampil"
            icon={<School className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
              <Filter className="h-5 w-5" />
            </div>

            <div>
              <h2 className="text-base font-black text-[#063D27]">
                Filter Siswa
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                Cari nama, kelas, atau status siswa.
              </p>
            </div>
          </div>

          <form className="grid gap-3 lg:grid-cols-[1fr_190px_170px_auto] lg:items-end">
            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Cari Nama
              </label>

              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  name="search"
                  defaultValue={params.search ?? ''}
                  placeholder="Cari nama siswa..."
                  className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] pl-11 pr-4 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Kelas
              </label>

              <select
                name="kelas"
                defaultValue={params.kelas ?? ''}
                className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
              >
                <option value="">Semua Kelas</option>
                {kelasOptions.map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {kelas}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                Status
              </label>

              <select
                name="status"
                defaultValue={params.status ?? ''}
                className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
              >
                <option value="">Semua</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 lg:flex">
              <button
                type="submit"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738]"
              >
                <Search className="h-4 w-4" />
                Filter
              </button>

              <Link
                href="/admin/siswa"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-5 text-sm font-black text-[#063D27] transition hover:bg-[#EAF3E8]"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-black text-[#063D27]">
                Daftar Siswa
              </h2>

              <p className="mt-1 text-sm font-semibold text-slate-500">
                Menampilkan{' '}
                <span className="font-black text-[#063D27]">
                  {siswaList.length}
                </span>{' '}
                siswa.
              </p>
            </div>

            <div className="rounded-full border border-[#E7EFE6] bg-[#FAFCF9] px-4 py-2 text-xs font-black text-slate-500">
              Klik detail untuk info tambahan
            </div>
          </div>

          <div className="hidden overflow-hidden rounded-[24px] border border-[#EEF3EC] lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#F3F8F1] text-xs uppercase tracking-[0.12em] text-slate-500">
                  <th className="px-5 py-4 font-black">Nama</th>
                  <th className="px-5 py-4 font-black">Kelas</th>
                  <th className="px-5 py-4 font-black">Sekolah</th>
                  <th className="px-5 py-4 font-black">Orang Tua</th>
                  <th className="px-5 py-4 font-black">Tanggal Daftar</th>
                  <th className="px-5 py-4 font-black">Status</th>
                  <th className="px-5 py-4 text-right font-black">Aksi</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F1F4F0]">
                {siswaList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12">
                      <EmptyState />
                    </td>
                  </tr>
                ) : (
                  siswaList.map((siswa) => (
                    <tr key={siswa.id} className="transition hover:bg-[#FAFCF9]">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={siswa.nama} />

                          <div className="min-w-0">
                            <p className="font-black text-slate-800">
                              {siswa.nama}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-slate-400">
                              {siswa.alamat || 'Alamat belum diisi'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 font-bold text-slate-600">
                        {siswa.kelas ?? '-'}
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-500">
                        {siswa.sekolah ?? '-'}
                      </td>

                      <td className="px-5 py-4">
                        <p className="font-bold text-slate-700">
                          {siswa.ortu?.full_name ?? '-'}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {siswa.ortu?.phone ?? '-'}
                        </p>
                      </td>

                      <td className="px-5 py-4 font-semibold text-slate-500">
                        {siswa.created_at ? formatTanggal(siswa.created_at) : '-'}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge aktif={Boolean(siswa.aktif)} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/siswa/${siswa.id}`}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full border border-[#DDE9DB] bg-white px-3 text-xs font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>

                          <DeleteButton id={siswa.id} nama={siswa.nama} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {siswaList.length === 0 ? (
              <EmptyState />
            ) : (
              siswaList.map((siswa) => (
                <article
                  key={siswa.id}
                  className="rounded-[24px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                >
                  <div className="flex items-start gap-3">
                    <Avatar name={siswa.nama} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-800">
                          {siswa.nama}
                        </h3>

                        <StatusBadge aktif={Boolean(siswa.aktif)} />
                      </div>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {siswa.kelas ?? '-'} · {siswa.sekolah ?? '-'}
                      </p>
                    </div>
                  </div>

                  <details className="mt-4 group">
                    <summary className="cursor-pointer rounded-2xl border border-[#E7EFE6] bg-white px-4 py-3 text-sm font-black text-[#063D27] outline-none transition group-open:bg-[#F3F8F1]">
                      Detail siswa
                    </summary>

                    <div className="mt-3 grid gap-3 rounded-2xl border border-[#EEF3EC] bg-white p-4 text-sm">
                      <InfoRow
                        icon={<UserRound className="h-4 w-4" />}
                        label="Orang tua"
                        value={siswa.ortu?.full_name ?? '-'}
                        sub={siswa.ortu?.phone ?? '-'}
                      />

                      <InfoRow
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Tanggal daftar"
                        value={siswa.created_at ? formatTanggal(siswa.created_at) : '-'}
                      />

                      <InfoRow
                        icon={<School className="h-4 w-4" />}
                        label="Alamat"
                        value={siswa.alamat ?? '-'}
                      />
                    </div>
                  </details>

                  <div className="mt-4 flex gap-2">
                    <Link
                      href={`/admin/siswa/${siswa.id}`}
                      className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-[#063D27] text-sm font-black text-white transition hover:bg-[#0B5738]"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </Link>

                    <DeleteButton id={siswa.id} nama={siswa.nama} />
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  )
}

function StatCard({
  title,
  value,
  desc,
  icon,
}: {
  title: string
  value: number
  desc: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[26px] border border-[#E7EFE6] bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            {title}
          </p>

          <h2 className="mt-3 text-3xl font-black tracking-tight text-[#063D27]">
            {value}
          </h2>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {desc}
          </p>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
          {icon}
        </div>
      </div>
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FFF8E6] text-sm font-black text-[#063D27] ring-1 ring-[#F0E5BE]">
      {getInitials(name)}
    </div>
  )
}

function StatusBadge({ aktif }: { aktif: boolean }) {
  if (aktif) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aktif
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FEF3F2] px-3 py-1 text-xs font-black text-[#B42318]">
      <XCircle className="h-3.5 w-3.5" />
      Nonaktif
    </span>
  )
}

function InfoRow({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
        {icon}
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 font-bold text-slate-700">
          {value}
        </p>

        {sub && (
          <p className="mt-0.5 text-xs font-semibold text-slate-400">
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-[#F3F8F1] text-[#063D27]">
        <GraduationCap className="h-7 w-7" />
      </div>

      <h3 className="mt-4 text-base font-black text-[#063D27]">
        Belum ada data siswa
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm font-medium leading-6 text-slate-500">
        Tambahkan siswa baru atau ubah filter pencarian kalau data belum muncul.
      </p>

      <Link
        href="/admin/siswa/tambah"
        className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738]"
      >
        <Plus className="h-4 w-4" />
        Tambah Siswa
      </Link>
    </div>
  )
}

function getInitials(name?: string | null) {
  if (!name) return '?'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}