import {
  BookOpen,
  CalendarDays,
  Camera,
  CheckCircle2,
  ChevronDown,
  Clock3,
  UserRound,
} from 'lucide-react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

type SiswaRow = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
}

type JurnalRow = {
  id: string
  submitted_at: string | null
  foto_url: string | null
  foto_validasi_url: string | null
  foto_validasi_path: string | null
}

type SesiRow = {
  id: string
  tanggal: string
  jam_mulai: string | null
  durasi: number | null
  mapel: string | null
  status: string | null
  jurnal: JurnalRow | JurnalRow[] | null
}

type SesiSiswaRow = {
  id: string
  siswa_id: string
  hadir: boolean | null
  materi: string | null
  deskripsi: string | null
  siswa: SiswaRow | SiswaRow[] | null
  sesi: SesiRow | SesiRow[] | null
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function formatTanggal(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function formatJam(value: string | null) {
  if (!value) return '-'
  return value.slice(0, 5)
}

export default async function OrtuJurnalPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: siswaData } = await supabase
    .from('siswa')
    .select('id, nama, kelas, sekolah')
    .eq('ortu_id', user.id)
    .eq('aktif', true)
    .order('nama', { ascending: true })

  const siswaRows = (siswaData || []) as SiswaRow[]
  const siswaIds = siswaRows.map((item) => item.id)

  let jurnalRows: SesiSiswaRow[] = []

  if (siswaIds.length > 0) {
    const { data, error } = await supabase
      .from('sesi_siswa')
      .select(
        `
          id,
          siswa_id,
          hadir,
          materi,
          deskripsi,
          siswa (
            id,
            nama,
            kelas,
            sekolah
          ),
          sesi (
            id,
            tanggal,
            jam_mulai,
            durasi,
            mapel,
            status,
            jurnal (
              id,
              submitted_at,
              foto_url,
              foto_validasi_url,
              foto_validasi_path
            )
          )
        `
      )
      .in('siswa_id', siswaIds)

    if (error) {
      console.log(error)
    }

    jurnalRows = ((data || []) as SesiSiswaRow[])
      .filter((row) => {
        const sesi = one(row.sesi)
        const jurnal = one(sesi?.jurnal)
        return Boolean(jurnal?.id)
      })
      .sort((a, b) => {
        const sesiA = one(a.sesi)
        const sesiB = one(b.sesi)

        const dateA = sesiA?.tanggal
          ? new Date(sesiA.tanggal).getTime()
          : 0
        const dateB = sesiB?.tanggal
          ? new Date(sesiB.tanggal).getTime()
          : 0

        return dateB - dateA
      })
  }

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <Header
          title="Jurnal Belajar"
          desc="Lihat catatan belajar, kehadiran, dan dokumentasi kelas."
          icon={<BookOpen className="h-5 w-5" />}
        />

        {siswaRows.length === 0 ? (
          <EmptyState
            icon={<UserRound className="h-6 w-6" />}
            title="Belum ada anak"
            text="Data anak yang aktif belum tersedia."
          />
        ) : jurnalRows.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="h-6 w-6" />}
            title="Belum ada jurnal"
            text="Catatan belajar akan muncul setelah tentor mengisi jurnal."
          />
        ) : (
          <section className="space-y-3">
            {jurnalRows.map((row, index) => {
              const siswa = one(row.siswa)
              const sesi = one(row.sesi)
              const jurnal = one(sesi?.jurnal)
              const fotoUrl =
                jurnal?.foto_validasi_url || jurnal?.foto_url || null

              return (
                <details
                  key={row.id}
                  open={index === 0}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] transition-colors open:border-[#BFD6CB]"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-slate-50 sm:p-5 [&::-webkit-details-marker]:hidden">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                      <UserRound className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                          {siswa?.nama || 'Anak'}
                        </h2>

                        {sesi?.status && (
                          <StatusBadge status={sesi.status} />
                        )}
                      </div>

                      <p className="mt-1.5 truncate text-sm font-medium text-slate-500">
                        {siswa?.kelas || '-'} · {siswa?.sekolah || '-'}
                      </p>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-transform duration-200 group-open:rotate-180">
                      <ChevronDown className="h-4 w-4" />
                    </div>
                  </summary>

                  <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
                      <div className="space-y-4">
                        <div className="grid gap-3 sm:grid-cols-3">
                          <InfoCard
                            icon={<CalendarDays className="h-4 w-4" />}
                            label="Tanggal"
                            value={
                              sesi?.tanggal
                                ? formatTanggal(sesi.tanggal)
                                : '-'
                            }
                            iconClassName="bg-blue-50 text-blue-700"
                          />

                          <InfoCard
                            icon={<Clock3 className="h-4 w-4" />}
                            label="Jam"
                            value={formatJam(sesi?.jam_mulai || null)}
                            iconClassName="bg-amber-50 text-amber-700"
                          />

                          <InfoCard
                            icon={<CheckCircle2 className="h-4 w-4" />}
                            label="Kehadiran"
                            value={row.hadir ? 'Hadir' : 'Tidak hadir'}
                            iconClassName={
                              row.hadir
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }
                          />
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold text-slate-500">
                                Mata pelajaran
                              </p>
                              <p className="mt-1 text-sm font-bold text-slate-900">
                                {sesi?.mapel || '-'}
                              </p>
                            </div>

                            {sesi?.durasi ? (
                              <span className="shrink-0 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">
                                {sesi.durasi} menit
                              </span>
                            ) : null}
                          </div>
                        </div>

                        {row.materi ? (
                          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                            <p className="text-sm font-bold text-slate-900">
                              Materi
                            </p>
                            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">
                              {row.materi}
                            </p>
                          </div>
                        ) : null}

                        <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                          <p className="text-sm font-bold text-slate-900">
                            Catatan
                          </p>
                          <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">
                            {row.deskripsi || '-'}
                          </p>
                        </div>
                      </div>

                      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                            <Camera className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              Foto Kelas
                            </p>
                            <p className="mt-0.5 text-xs font-medium text-slate-500">
                              Dokumentasi sesi belajar
                            </p>
                          </div>
                        </div>

                        {fotoUrl ? (
                          <div className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={fotoUrl}
                              alt="Foto kelas"
                              className="max-h-[360px] w-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="mt-4 flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                            <div>
                              <Camera className="mx-auto h-6 w-6 text-slate-400" />
                              <p className="mt-3 text-sm font-semibold text-slate-500">
                                Foto belum tersedia
                              </p>
                            </div>
                          </div>
                        )}
                      </aside>
                    </div>
                  </div>
                </details>
              )
            })}
          </section>
        )}
      </div>
    </main>
  )
}

function Header({
  title,
  desc,
  icon,
}: {
  title: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-[#DDE7E2] bg-[#0B513B] shadow-[0_10px_30px_rgba(15,61,46,0.08)]">
      <div className="p-6 sm:p-8">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
          {icon}
        </div>

        <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[34px]">
          {title}
        </h1>

        <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
          {desc}
        </p>
      </div>
    </section>
  )
}

function InfoCard({
  icon,
  label,
  value,
  iconClassName,
}: {
  icon: React.ReactNode
  label: string
  value: string
  iconClassName: string
}) {
  return (
    <div className="min-h-[98px] rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-2.5">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
        >
          {icon}
        </div>

        <p className="text-xs font-semibold text-slate-500">{label}</p>
      </div>

      <p className="mt-3 text-sm font-bold leading-5 text-slate-800">
        {value}
      </p>
    </div>
  )
}

function EmptyState({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode
  title: string
  text: string
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-8">
      <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          {icon}
        </div>

        <h2 className="mt-4 text-base font-bold text-slate-900">{title}</h2>
        <p className="mt-1.5 max-w-sm text-sm font-medium leading-6 text-slate-500">
          {text}
        </p>
      </div>
    </section>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    selesai: 'bg-emerald-50 text-emerald-700',
    berlangsung: 'bg-blue-50 text-blue-700',
    terjadwal: 'bg-amber-50 text-amber-700',
    dibatalkan: 'bg-red-50 text-red-700',
  }

  const label: Record<string, string> = {
    selesai: 'Selesai',
    berlangsung: 'Berlangsung',
    terjadwal: 'Terjadwal',
    dibatalkan: 'Dibatalkan',
  }

  return (
    <span
      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
        map[status] ?? 'bg-slate-100 text-slate-600'
      }`}
    >
      {label[status] ?? status}
    </span>
  )
}
