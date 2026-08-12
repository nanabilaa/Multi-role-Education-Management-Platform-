import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  WalletCards,
} from 'lucide-react'
import { formatRupiah, formatTanggal, NAMA_BULAN } from '@/lib/utils'

type AnakRow = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
  aktif: boolean | null
}

function getGreeting() {
  const hour = new Date().getHours()

  if (hour >= 4 && hour < 11) return 'Pagi'
  if (hour >= 11 && hour < 15) return 'Siang'
  if (hour >= 15 && hour < 18) return 'Sore'
  return 'Malam'
}

async function getOrtuDashboardData() {
  const supabase = await createClient()

  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const bulanIni = now.getMonth() + 1
  const tahunIni = now.getFullYear()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      profile: null,
      anakList: [],
      jadwalTerdekat: [],
      sppBulanIni: [],
      jurnalTerbaru: [],
    }
  }

  const [profileRes, anakRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, phone, role')
      .eq('id', user.id)
      .single(),

    supabase
      .from('siswa')
      .select('id, nama, kelas, sekolah, aktif')
      .eq('ortu_id', user.id)
      .order('nama', { ascending: true }),
  ])

  const anakList = (anakRes.data ?? []) as AnakRow[]
  const anakIds = anakList.map((anak) => anak.id)

  if (anakIds.length === 0) {
    return {
      profile: profileRes.data,
      anakList,
      jadwalTerdekat: [],
      sppBulanIni: [],
      jurnalTerbaru: [],
    }
  }

  const [jadwalRes, sppRes, sesiSiswaRes] = await Promise.all([
    supabase
      .from('sesi_siswa')
      .select(
        `
        id,
        siswa_id,
        siswa:siswa(id, nama, kelas),
        sesi:sesi(
          id,
          tanggal,
          jam_mulai,
          durasi,
          mapel,
          status,
          tentor:profiles(full_name)
        )
      `
      )
      .in('siswa_id', anakIds)
      .gte('sesi.tanggal', today)
      .order('sesi(tanggal)', { ascending: true })
      .limit(3),

    supabase
      .from('spp')
      .select(
        `
        id,
        siswa_id,
        bulan,
        tahun,
        nominal,
        status,
        tanggal_bayar,
        siswa:siswa(id, nama, kelas)
      `
      )
      .in('siswa_id', anakIds)
      .eq('bulan', bulanIni)
      .eq('tahun', tahunIni)
      .order('created_at', { ascending: false }),

    supabase
      .from('sesi_siswa')
      .select(
        `
        id,
        siswa_id,
        hadir,
        materi,
        deskripsi,
        siswa:siswa(id, nama, kelas),
        sesi:sesi(
          id,
          tanggal,
          jam_mulai,
          mapel,
          status,
          tentor:profiles(full_name)
        )
      `
      )
      .in('siswa_id', anakIds)
      .order('id', { ascending: false })
      .limit(3),
  ])

  return {
    profile: profileRes.data,
    anakList,
    jadwalTerdekat: jadwalRes.data ?? [],
    sppBulanIni: sppRes.data ?? [],
    jurnalTerbaru: sesiSiswaRes.data ?? [],
  }
}

export default async function OrtuDashboardPage() {
  const data = await getOrtuDashboardData()

  const now = new Date()
  const greeting = getGreeting()
  const todayStr = format(now, 'EEEE, dd MMMM yyyy', { locale: id })
  const bulanIni = NAMA_BULAN[now.getMonth() + 1]

  const totalAnak = data.anakList.length

  const sppLunas = data.sppBulanIni.filter(
    (item: any) => item.status === 'lunas'
  ).length

  const sppBelum = data.sppBulanIni.filter(
    (item: any) => item.status !== 'lunas'
  ).length

  const totalTagihan = data.sppBulanIni.reduce(
    (total: number, item: any) => total + Number(item.nominal || 0),
    0
  )

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <section className="overflow-hidden rounded-3xl border border-[#DDE7E2] bg-[#0B513B] shadow-[0_10px_30px_rgba(15,61,46,0.08)]">
          <div className="flex min-h-[190px] flex-col justify-between gap-7 p-6 sm:p-8 lg:flex-row lg:items-end">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-white/90">
                <Clock3 className="h-4 w-4" />
                <span className="capitalize">{todayStr}</span>
              </div>

              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[34px]">
                Selamat {greeting}, {data.profile?.full_name ?? 'Orang Tua'}
              </h1>

              <p className="mt-2 text-sm font-medium text-white/70 sm:text-base">
                Jadwal, tagihan, dan catatan belajar terbaru.
              </p>
            </div>

            <div className="grid w-full grid-cols-3 gap-2 lg:w-auto lg:min-w-[360px]">
              <HeaderStat
                label="Anak"
                value={`${totalAnak}`}
              />
              <HeaderStat
                label="Jadwal"
                value={`${data.jadwalTerdekat.length}`}
              />
              <HeaderStat
                label="Belum lunas"
                value={`${sppBelum}`}
              />
            </div>
          </div>
        </section>

        {data.anakList.length === 0 && (
          <section className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div>
              <p className="font-bold text-amber-900">Data anak belum tersedia</p>
              <p className="mt-1 text-sm font-medium leading-6 text-amber-800/80">
                Hubungi admin untuk menghubungkan data anak ke akun Anda.
              </p>
            </div>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <SmallCard
            title="Anak Terhubung"
            value={`${totalAnak}`}
            desc={totalAnak > 0 ? 'Data anak aktif di akun' : 'Belum ada data anak'}
            icon={<GraduationCap className="h-5 w-5" />}
            iconClassName="bg-blue-50 text-blue-700"
          />

          <SmallCard
            title="Jadwal Mendatang"
            value={`${data.jadwalTerdekat.length}`}
            desc={
              data.jadwalTerdekat.length > 0
                ? 'Sesi belajar terdekat'
                : 'Belum ada jadwal'
            }
            icon={<CalendarDays className="h-5 w-5" />}
            iconClassName="bg-amber-50 text-amber-700"
          />

          <SmallCard
            title="Tagihan SPP"
            value={`${sppBelum}`}
            desc={sppBelum > 0 ? 'Perlu dibayar' : 'Tidak ada tunggakan'}
            icon={<WalletCards className="h-5 w-5" />}
            iconClassName={
              sppBelum > 0
                ? 'bg-red-50 text-red-700'
                : 'bg-emerald-50 text-emerald-700'
            }
          />
        </section>

        <section className="grid items-stretch gap-5 lg:grid-cols-2">
          <Panel
            title="Data Anak"
            desc="Anak yang terhubung ke akun Anda."
            href="/ortu/profil"
            label="Lihat profil"
          >
            {data.anakList.length === 0 ? (
              <EmptyState text="Belum ada data anak." />
            ) : (
              <div className="space-y-3">
                {data.anakList.map((anak) => (
                  <div
                    key={anak.id}
                    className="flex min-h-[76px] items-center gap-3 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">
                      {getInitials(anak.nama)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                        {anak.nama}
                      </p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-500">
                        {anak.kelas ?? '-'} · {anak.sekolah ?? '-'}
                      </p>
                    </div>

                    {anak.aktif ? (
                      <span className="shrink-0 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                        Aktif
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-lg bg-slate-200/70 px-2.5 py-1.5 text-xs font-bold text-slate-600">
                        Nonaktif
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Jadwal Terdekat"
            desc="Sesi belajar yang akan datang."
            href="/ortu/jadwal"
            label="Lihat jadwal"
          >
            {data.jadwalTerdekat.length === 0 ? (
              <EmptyState text="Belum ada jadwal terdekat." />
            ) : (
              <div className="space-y-3">
                {data.jadwalTerdekat.map((item: any) => {
                  const sesi = item.sesi

                  return (
                    <div
                      key={item.id}
                      className="min-h-[92px] rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                            {sesi?.mapel ?? '-'}
                          </p>

                          <p className="mt-1.5 text-sm font-medium text-slate-600">
                            {item.siswa?.nama ?? '-'}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-500">
                            <span>
                              {sesi?.tanggal
                                ? formatTanggal(sesi.tanggal)
                                : '-'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span>{sesi?.jam_mulai?.slice(0, 5) ?? '-'}</span>
                            <span className="text-slate-300">•</span>
                            <span>{sesi?.tentor?.full_name ?? 'Tentor'}</span>
                          </div>
                        </div>

                        <StatusBadge status={sesi?.status ?? 'terjadwal'} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>

          <Panel
            title={`Tagihan ${bulanIni}`}
            desc="Status pembayaran SPP bulan ini."
            href="/ortu/tagihan"
            label="Lihat tagihan"
          >
            {data.sppBulanIni.length === 0 ? (
              <EmptyState text="Belum ada tagihan bulan ini." />
            ) : (
              <div className="space-y-3">
                {data.sppBulanIni.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex min-h-[76px] items-center justify-between gap-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                        {item.siswa?.nama ?? '-'}
                      </p>
                      <p className="mt-1.5 text-sm font-bold text-slate-600">
                        {formatRupiah(Number(item.nominal || 0))}
                      </p>
                    </div>

                    {item.status === 'lunas' ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Lunas
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-bold text-red-700">
                        Belum lunas
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Jurnal Terbaru"
            desc="Catatan belajar terbaru dari tentor."
            href="/ortu/jurnal"
            label="Lihat jurnal"
          >
            {data.jurnalTerbaru.length === 0 ? (
              <EmptyState text="Belum ada jurnal terbaru." />
            ) : (
              <div className="space-y-3">
                {data.jurnalTerbaru.map((item: any) => {
                  const sesi = item.sesi

                  return (
                    <div
                      key={item.id}
                      className="min-h-[92px] rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                          <BookOpenCheck className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                            {sesi?.mapel ?? 'Sesi belajar'}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-600">
                            {item.siswa?.nama ?? '-'} ·{' '}
                            {sesi?.tanggal
                              ? formatTanggal(sesi.tanggal)
                              : '-'}
                          </p>

                          <p className="mt-2 line-clamp-2 text-xs font-medium leading-5 text-slate-500">
                            {item.deskripsi ||
                              item.materi ||
                              'Buka jurnal untuk melihat catatan belajar.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Panel>
        </section>
      </div>
    </main>
  )
}

function HeaderStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="flex min-h-[76px] flex-col justify-center rounded-2xl border border-white/10 bg-white/10 px-3 py-3 text-center backdrop-blur-sm sm:px-4">
      <p className="text-xl font-bold leading-none text-white sm:text-2xl">
        {value}
      </p>
      <p className="mt-2 text-[11px] font-semibold leading-tight text-white/65 sm:text-xs">
        {label}
      </p>
    </div>
  )
}

function SmallCard({
  title,
  value,
  desc,
  icon,
  iconClassName,
}: {
  title: string
  value: string
  desc: string
  icon: React.ReactNode
  iconClassName: string
}) {
  return (
    <div className="min-h-[140px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex h-full items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1.5 text-xs font-medium leading-5 text-slate-500">
            {desc}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function Panel({
  title,
  desc,
  href,
  label,
  children,
}: {
  title: string
  desc: string
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <section className="flex h-full min-h-[350px] flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
            {desc}
          </p>
        </div>

        <Link
          href={href}
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-[#0B513B] transition-colors hover:border-[#BFD6CB] hover:bg-[#F1F8F4] focus:outline-none focus:ring-2 focus:ring-[#0B513B]/20"
        >
          {label}
        </Link>
      </div>

      <div className="flex-1">{children}</div>
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[190px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-8 text-center">
      <p className="text-sm font-semibold text-slate-500">{text}</p>
    </div>
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
    dibatalkan: 'Batal',
  }

  return (
    <span
      className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-bold ${
        map[status] ?? map.terjadwal
      }`}
    >
      {label[status] ?? status}
    </span>
  )
}

function getInitials(name?: string | null) {
  if (!name) return 'AN'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}
