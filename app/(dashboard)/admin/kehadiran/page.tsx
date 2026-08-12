import Link from 'next/link'
import {
  CalendarDays,
  CheckCircle2,
  RotateCcw,
  Search,
  Users,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

type RekapKehadiran = {
  siswa_id: string
  nama_siswa: string
  kelas: string
  total_hadir: number | string
  tanggal_hadir: string[] | null
}

type PageProps = {
  searchParams?: {
    bulan?: string
    tahun?: string
    kelas?: string
    nama?: string
  }
}

const daftarBulan = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function getPeriodeSekarang() {
  const parts = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'numeric',
    year: 'numeric',
  }).formatToParts(new Date())

  const bulan = Number(
    parts.find((part) => part.type === 'month')?.value,
  )

  const tahun = Number(
    parts.find((part) => part.type === 'year')?.value,
  )

  return {
    bulan: bulan || 1,
    tahun: tahun || new Date().getFullYear(),
  }
}

function formatTanggal(tanggal: string) {
  const [tahun, bulan, hari] = tanggal.split('-')

  if (!tahun || !bulan || !hari) {
    return tanggal
  }

  return `${hari}/${bulan}/${tahun}`
}

function urutkanKelas(a: string, b: string) {
  return a.localeCompare(b, 'id-ID', {
    numeric: true,
    sensitivity: 'base',
  })
}

export default async function KehadiranPage({
  searchParams,
}: PageProps) {
  const periodeSekarang = getPeriodeSekarang()

  const bulanInput = Number(searchParams?.bulan)
  const tahunInput = Number(searchParams?.tahun)

  const bulan =
    bulanInput >= 1 && bulanInput <= 12
      ? bulanInput
      : periodeSekarang.bulan

  const tahun =
    tahunInput >= 2020 && tahunInput <= 2100
      ? tahunInput
      : periodeSekarang.tahun

  const kelasFilter = searchParams?.kelas?.trim() ?? ''
  const namaFilter = searchParams?.nama?.trim() ?? ''

  const supabase = await createClient()

  const { data, error } = await supabase.rpc(
    'get_rekap_hadir_bulanan',
    {
      p_bulan: bulan,
      p_tahun: tahun,
    },
  )

  const rekap = (data ?? []) as RekapKehadiran[]

  const daftarKelas = Array.from(
    new Set(
      rekap
        .map((siswa) => siswa.kelas?.trim())
        .filter(
          (kelas): kelas is string =>
            Boolean(kelas),
        ),
    ),
  ).sort(urutkanKelas)

  const namaPencarian = namaFilter.toLocaleLowerCase('id-ID')

  const rekapTersaring = rekap.filter((siswa) => {
    const cocokKelas =
      !kelasFilter ||
      siswa.kelas?.trim() === kelasFilter

    const cocokNama =
      !namaPencarian ||
      siswa.nama_siswa
        .toLocaleLowerCase('id-ID')
        .includes(namaPencarian)

    return cocokKelas && cocokNama
  })

  const totalSiswa = rekapTersaring.length

  const siswaSudahHadir = rekapTersaring.filter(
    (siswa) => Number(siswa.total_hadir || 0) > 0,
  ).length

  const totalKehadiran = rekapTersaring.reduce(
    (total, siswa) =>
      total + Number(siswa.total_hadir || 0),
    0,
  )

  const daftarTahun = Array.from(
    { length: 7 },
    (_, index) => periodeSekarang.tahun - 3 + index,
  )

  const resetHref =
    `/admin/kehadiran?bulan=${bulan}&tahun=${tahun}`

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-5">
        <section className="overflow-hidden rounded-3xl border border-[#DDE7E2] bg-[#0B513B] shadow-[0_10px_30px_rgba(15,61,46,0.08)]">
          <div className="p-6 sm:p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
              <CheckCircle2 className="h-5 w-5" />
            </div>

            <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[34px]">
              Rekap Kehadiran
            </h1>

            <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
              Lihat jumlah dan tanggal kehadiran siswa berdasarkan periode.
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
          <div className="mb-5">
            <h2 className="text-base font-bold text-slate-900">
              Filter Data
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Pilih periode, kelas, atau cari nama siswa.
            </p>
          </div>

          <form method="get">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <FilterField label="Bulan">
                <select
                  name="bulan"
                  defaultValue={bulan}
                  className="filter-control"
                >
                  {daftarBulan.map((namaBulan, index) => (
                    <option
                      key={namaBulan}
                      value={index + 1}
                    >
                      {namaBulan}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Tahun">
                <select
                  name="tahun"
                  defaultValue={tahun}
                  className="filter-control"
                >
                  {daftarTahun.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Kelas">
                <select
                  name="kelas"
                  defaultValue={kelasFilter}
                  className="filter-control"
                >
                  <option value="">Semua kelas</option>

                  {daftarKelas.map((kelas) => (
                    <option key={kelas} value={kelas}>
                      {kelas}
                    </option>
                  ))}
                </select>
              </FilterField>

              <FilterField label="Nama Siswa">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                  <input
                    type="search"
                    name="nama"
                    defaultValue={namaFilter}
                    placeholder="Cari nama siswa"
                    className="filter-control pl-10"
                  />
                </div>
              </FilterField>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 sm:max-w-[340px]">
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B513B] px-4 text-sm font-bold text-white transition-colors hover:bg-[#08442F] focus:outline-none focus:ring-2 focus:ring-[#0B513B]/20"
              >
                <Search className="h-4 w-4" />
                Tampilkan
              </button>

              <Link
                href={resetHref}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Periode"
            value={`${daftarBulan[bulan - 1]} ${tahun}`}
            icon={<CalendarDays className="h-5 w-5" />}
            iconClassName="bg-blue-50 text-blue-700"
          />

          <StatCard
            title="Siswa Ditampilkan"
            value={`${totalSiswa} siswa`}
            icon={<Users className="h-5 w-5" />}
            iconClassName="bg-violet-50 text-violet-700"
          />

          <StatCard
            title="Sudah Pernah Hadir"
            value={`${siswaSudahHadir} siswa`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClassName="bg-emerald-50 text-emerald-700"
          />

          <StatCard
            title="Total Kehadiran"
            value={`${totalKehadiran} kali`}
            icon={<CheckCircle2 className="h-5 w-5" />}
            iconClassName="bg-amber-50 text-amber-700"
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
          <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Kehadiran Per Siswa
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {rekapTersaring.length} dari {rekap.length} siswa ditampilkan.
              </p>
            </div>

            {(kelasFilter || namaFilter) && (
              <div className="flex flex-wrap gap-2">
                {kelasFilter && (
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-bold text-blue-700">
                    Kelas: {kelasFilter}
                  </span>
                )}

                {namaFilter && (
                  <span className="rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-700">
                    Nama: {namaFilter}
                  </span>
                )}
              </div>
            )}
          </div>

          {error ? (
            <div className="p-5 sm:p-6">
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                Data kehadiran gagal dimuat. {error.message}
              </div>
            </div>
          ) : rekapTersaring.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[850px] text-left text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="w-16 px-6 py-4 text-xs font-bold text-slate-500">
                        No.
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Nama Siswa
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Kelas
                      </th>

                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500">
                        Jumlah Hadir
                      </th>

                      <th className="px-6 py-4 text-xs font-bold text-slate-500">
                        Tanggal Hadir
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-200">
                    {rekapTersaring.map((siswa, index) => {
                      const totalHadir = Number(
                        siswa.total_hadir || 0,
                      )

                      const tanggalHadir =
                        siswa.tanggal_hadir ?? []

                      return (
                        <tr
                          key={siswa.siswa_id}
                          className="transition-colors hover:bg-slate-50/70"
                        >
                          <td className="px-6 py-4 font-medium text-slate-400">
                            {index + 1}
                          </td>

                          <td className="px-6 py-4">
                            <p className="font-bold text-slate-900">
                              {siswa.nama_siswa}
                            </p>
                          </td>

                          <td className="px-6 py-4 font-semibold text-slate-600">
                            {siswa.kelas || '-'}
                          </td>

                          <td className="px-6 py-4 text-center">
                            <AttendanceBadge total={totalHadir} />
                          </td>

                          <td className="px-6 py-4">
                            <DateList
                              siswaId={siswa.siswa_id}
                              dates={tanggalHadir}
                            />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="divide-y divide-slate-200 md:hidden">
                {rekapTersaring.map((siswa, index) => {
                  const totalHadir = Number(
                    siswa.total_hadir || 0,
                  )

                  const tanggalHadir =
                    siswa.tanggal_hadir ?? []

                  return (
                    <article
                      key={siswa.siswa_id}
                      className="p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600">
                          {index + 1}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-slate-900">
                            {siswa.nama_siswa}
                          </p>
                          <p className="mt-1 text-sm font-medium text-slate-500">
                            Kelas {siswa.kelas || '-'}
                          </p>
                        </div>

                        <AttendanceBadge total={totalHadir} />
                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-3">
                        <p className="mb-2 text-xs font-semibold text-slate-500">
                          Tanggal hadir
                        </p>

                        <DateList
                          siswaId={siswa.siswa_id}
                          dates={tanggalHadir}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </div>

      <style>{`
        .filter-control {
          height: 2.75rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding-left: 0.875rem;
          padding-right: 0.875rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .filter-control:focus {
          border-color: #0b513b;
          box-shadow: 0 0 0 3px rgba(11, 81, 59, 0.1);
        }
      `}</style>
    </main>
  )
}

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  )
}

function StatCard({
  title,
  value,
  icon,
  iconClassName,
}: {
  title: string
  value: string
  icon: React.ReactNode
  iconClassName: string
}) {
  return (
    <div className="flex min-h-[126px] items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">
          {title}
        </p>
        <p className="mt-1.5 truncate text-xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      </div>
    </div>
  )
}

function AttendanceBadge({
  total,
}: {
  total: number
}) {
  return (
    <span
      className={
        total > 0
          ? 'inline-flex shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700'
          : 'inline-flex shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-bold text-slate-500'
      }
    >
      {total} kali
    </span>
  )
}

function DateList({
  siswaId,
  dates,
}: {
  siswaId: string
  dates: string[]
}) {
  if (dates.length === 0) {
    return (
      <span className="text-sm font-medium text-slate-400">
        Belum hadir
      </span>
    )
  }

  return (
    <div className="flex flex-wrap gap-2">
      {dates.map((tanggal, tanggalIndex) => (
        <span
          key={`${siswaId}-${tanggal}-${tanggalIndex}`}
          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {formatTanggal(tanggal)}
        </span>
      ))}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[260px] items-center justify-center p-6 text-center">
      <div>
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Search className="h-5 w-5" />
        </div>

        <p className="mt-4 font-bold text-slate-800">
          Data siswa tidak ditemukan
        </p>

        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Ubah filter kelas atau nama siswa, lalu coba lagi.
        </p>
      </div>
    </div>
  )
}
