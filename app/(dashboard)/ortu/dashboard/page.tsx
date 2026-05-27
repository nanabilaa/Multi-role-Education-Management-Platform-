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
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[32px] border border-[#E2EBDD] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-bold text-[#063D27]">
                <Clock3 className="h-4 w-4" />
                {todayStr}
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Selamat {greeting}, {data.profile?.full_name ?? 'Orang Tua'}.
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Ringkasan belajar anak hari ini. Dibuat sederhana supaya mudah dipantau tanpa terlalu banyak informasi.
              </p>
            </div>

            <div className="rounded-[26px] bg-[#063D27] p-5 text-white lg:w-[280px]">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/55">
                Tagihan {bulanIni}
              </p>

              <p className="mt-3 text-2xl font-black">
                {formatRupiah(totalTagihan)}
              </p>

              <p className="mt-2 text-sm font-semibold text-white/65">
                {sppLunas} lunas · {sppBelum} belum
              </p>
            </div>
          </div>
        </section>

        {data.anakList.length === 0 && (
          <section className="rounded-[28px] border border-[#EFE6BF] bg-[#FFFBEA] p-5">
            <p className="text-sm font-semibold leading-7 text-[#7A5C00]">
              Belum ada anak yang terhubung ke akun ini. Hubungi admin agar data anak bisa muncul di portal orang tua.
            </p>
          </section>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <SmallCard
            title="Anak"
            value={`${totalAnak}`}
            desc="Terhubung"
            icon={<GraduationCap className="h-5 w-5" />}
          />

          <SmallCard
            title="Jadwal"
            value={`${data.jadwalTerdekat.length}`}
            desc="Terdekat"
            icon={<CalendarDays className="h-5 w-5" />}
          />

          <SmallCard
            title="SPP"
            value={sppBelum > 0 ? `${sppBelum}` : '0'}
            desc={sppBelum > 0 ? 'Belum lunas' : 'Aman'}
            icon={<WalletCards className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Anak"
            desc="Data anak yang terhubung."
            href="/ortu/profil"
            label="Lihat profil"
          >
            {data.anakList.length === 0 ? (
              <EmptyState text="Belum ada data anak." />
            ) : (
              <div className="space-y-2">
                {data.anakList.map((anak) => (
                  <div
                    key={anak.id}
                    className="flex items-center gap-3 rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-sm font-black text-[#063D27]">
                      {getInitials(anak.nama)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-[#063D27]">
                        {anak.nama}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-400">
                        {anak.kelas ?? '-'} · {anak.sekolah ?? '-'}
                      </p>
                    </div>

                    {anak.aktif ? (
                      <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
                        Aktif
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
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
              <div className="space-y-2">
                {data.jadwalTerdekat.map((item: any) => {
                  const sesi = item.sesi

                  return (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-black text-[#063D27]">
                            {sesi?.mapel ?? '-'}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {item.siswa?.nama ?? '-'} ·{' '}
                            {sesi?.tanggal ? formatTanggal(sesi.tanggal) : '-'}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            {sesi?.jam_mulai?.slice(0, 5) ?? '-'} ·{' '}
                            {sesi?.tentor?.full_name ?? 'Tentor'}
                          </p>
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
            title="Tagihan Bulan Ini"
            desc="Status SPP anak bulan berjalan."
            href="/ortu/tagihan"
            label="Lihat tagihan"
          >
            {data.sppBulanIni.length === 0 ? (
              <EmptyState text="Belum ada tagihan bulan ini." />
            ) : (
              <div className="space-y-2">
                {data.sppBulanIni.map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                  >
                    <div>
                      <p className="font-black text-[#063D27]">
                        {item.siswa?.nama ?? '-'}
                      </p>
                      <p className="mt-1 text-sm font-semibold text-slate-500">
                        {formatRupiah(Number(item.nominal || 0))}
                      </p>
                    </div>

                    {item.status === 'lunas' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Lunas
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                        Belum
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
              <div className="space-y-2">
                {data.jurnalTerbaru.map((item: any) => {
                  const sesi = item.sesi

                  return (
                    <div
                      key={item.id}
                      className="rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
                          <BookOpenCheck className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-black text-[#063D27]">
                            {sesi?.mapel ?? 'Sesi belajar'}
                          </p>

                          <p className="mt-1 text-sm font-semibold text-slate-500">
                            {item.siswa?.nama ?? '-'} ·{' '}
                            {sesi?.tanggal ? formatTanggal(sesi.tanggal) : '-'}
                          </p>

                          <p className="mt-1 line-clamp-2 text-xs font-semibold leading-5 text-slate-400">
                            {item.deskripsi || item.materi || 'Klik menu jurnal untuk melihat detail.'}
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

function SmallCard({
  title,
  value,
  desc,
  icon,
}: {
  title: string
  value: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[26px] border border-[#E2EBDD] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-black text-[#063D27]">{value}</p>
          <p className="mt-1 text-sm font-semibold text-slate-400">{desc}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
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
    <section className="rounded-[28px] border border-[#E2EBDD] bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-black text-[#063D27]">{title}</h2>
          <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
            {desc}
          </p>
        </div>

        <Link
          href={href}
          className="shrink-0 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-black text-[#063D27] transition hover:bg-[#E7F1E4]"
        >
          {label}
        </Link>
      </div>

      {children}
    </section>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-8 text-center">
      <p className="text-sm font-bold text-slate-400">{text}</p>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    selesai: 'bg-[#ECFDF3] text-[#027A48]',
    berlangsung: 'bg-blue-50 text-blue-700',
    terjadwal: 'bg-[#F3F8F1] text-[#063D27]',
    dibatalkan: 'bg-red-50 text-red-600',
  }

  const label: Record<string, string> = {
    selesai: 'Selesai',
    berlangsung: 'Berlangsung',
    terjadwal: 'Terjadwal',
    dibatalkan: 'Batal',
  }

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
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