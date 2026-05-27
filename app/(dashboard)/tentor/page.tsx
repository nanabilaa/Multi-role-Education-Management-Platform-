import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Plus,
  Wallet,
} from 'lucide-react'
import { formatRupiah, formatTanggal } from '@/lib/utils'

function getGreeting() {
  const hour = new Date().getHours()

  if (hour >= 4 && hour < 11) return 'Pagi'
  if (hour >= 11 && hour < 15) return 'Siang'
  if (hour >= 15 && hour < 18) return 'Sore'
  return 'Malam'
}

async function getTentorDashboardData() {
  const supabase = await createClient()

  const now = new Date()
  const today = format(now, 'yyyy-MM-dd')
  const bulanAwal = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
  const bulanAkhir = format(new Date(now.getFullYear(), now.getMonth() + 1, 0), 'yyyy-MM-dd')

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      profile: null,
      sesiHariIni: [],
      sesiTerdekat: [],
      sesiBelumJurnal: [],
      honorBulanIni: [],
    }
  }

  const [profileRes, sesiHariIniRes, sesiTerdekatRes, sesiSelesaiRes, honorRes] =
    await Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, phone, role')
        .eq('id', user.id)
        .single(),

      supabase
        .from('sesi')
        .select(
          `
          id,
          tanggal,
          jam_mulai,
          durasi,
          mapel,
          status,
          sesi_siswa(
            id,
            siswa:siswa(id, nama, kelas)
          ),
          jurnal(id)
        `
        )
        .eq('tentor_id', user.id)
        .eq('tanggal', today)
        .order('jam_mulai', { ascending: true }),

      supabase
        .from('sesi')
        .select(
          `
          id,
          tanggal,
          jam_mulai,
          durasi,
          mapel,
          status,
          sesi_siswa(
            id,
            siswa:siswa(id, nama, kelas)
          ),
          jurnal(id)
        `
        )
        .eq('tentor_id', user.id)
        .gte('tanggal', today)
        .order('tanggal', { ascending: true })
        .order('jam_mulai', { ascending: true })
        .limit(3),

      supabase
        .from('sesi')
        .select(
          `
          id,
          tanggal,
          jam_mulai,
          durasi,
          mapel,
          status,
          sesi_siswa(
            id,
            siswa:siswa(id, nama, kelas)
          ),
          jurnal(id)
        `
        )
        .eq('tentor_id', user.id)
        .eq('status', 'selesai')
        .order('tanggal', { ascending: false })
        .order('jam_mulai', { ascending: false })
        .limit(8),

      supabase
        .from('honor')
        .select('id, jumlah_honor, tanggal_bayar, sesi_id')
        .eq('tentor_id', user.id)
        .gte('tanggal_bayar', `${bulanAwal}T00:00:00`)
        .lte('tanggal_bayar', `${bulanAkhir}T23:59:59`)
        .order('tanggal_bayar', { ascending: false }),
    ])

  const sesiSelesai = sesiSelesaiRes.data ?? []

  const sesiBelumJurnal = sesiSelesai.filter((sesi: any) => {
    const jurnal = sesi.jurnal
    return !jurnal || jurnal.length === 0
  })

  return {
    profile: profileRes.data,
    sesiHariIni: sesiHariIniRes.data ?? [],
    sesiTerdekat: sesiTerdekatRes.data ?? [],
    sesiBelumJurnal,
    honorBulanIni: honorRes.data ?? [],
  }
}

export default async function TentorDashboardPage() {
  const data = await getTentorDashboardData()

  const now = new Date()
  const greeting = getGreeting()
  const todayStr = format(now, 'EEEE, dd MMMM yyyy', { locale: id })

  const totalHonor = data.honorBulanIni.reduce(
    (total: number, item: any) => total + Number(item.jumlah_honor || 0),
    0
  )

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[32px] border border-[#DDE9DB] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-bold text-[#063D27]">
                <Clock3 className="h-4 w-4" />
                {todayStr}
              </div>

              <h1 className="mt-5 max-w-2xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Selamat {greeting}, {data.profile?.full_name ?? 'Tentor'}.
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Ini ringkasan sesi mengajar kamu. Dibuat lebih sederhana supaya fokus ke jadwal, jurnal, dan honor.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/tentor/sesi/buat"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738]"
              >
                <Plus className="h-4 w-4" />
                Buat Sesi
              </Link>

              <Link
                href="/tentor/jurnal"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-5 text-sm font-black text-[#063D27] transition hover:bg-[#EAF3E8]"
              >
                <BookOpenCheck className="h-4 w-4" />
                Isi Jurnal
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-4">
          <SmallCard
            title="Hari Ini"
            value={`${data.sesiHariIni.length}`}
            desc="Sesi"
            icon={<CalendarDays className="h-5 w-5" />}
          />

          <SmallCard
            title="Terdekat"
            value={`${data.sesiTerdekat.length}`}
            desc="Jadwal"
            icon={<Clock3 className="h-5 w-5" />}
          />

          <SmallCard
            title="Jurnal"
            value={`${data.sesiBelumJurnal.length}`}
            desc="Belum diisi"
            icon={<BookOpenCheck className="h-5 w-5" />}
          />

          <SmallCard
            title="Honor"
            value={formatRupiah(totalHonor)}
            desc="Bulan ini"
            icon={<Wallet className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <Panel
            title="Sesi Hari Ini"
            desc="Jadwal mengajar yang perlu kamu pantau hari ini."
            href="/tentor/sesi"
            label="Lihat sesi"
          >
            {data.sesiHariIni.length === 0 ? (
              <EmptyState text="Belum ada sesi hari ini." />
            ) : (
              <div className="space-y-2">
                {data.sesiHariIni.map((sesi: any) => (
                  <SesiCard key={sesi.id} sesi={sesi} />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Jurnal Belum Diisi"
            desc="Sesi selesai yang masih perlu dibuatkan jurnal."
            href="/tentor/jurnal"
            label="Isi jurnal"
          >
            {data.sesiBelumJurnal.length === 0 ? (
              <EmptyState text="Semua jurnal aman." />
            ) : (
              <div className="space-y-2">
                {data.sesiBelumJurnal.slice(0, 4).map((sesi: any) => (
                  <SesiCard key={sesi.id} sesi={sesi} showJournalAction />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Sesi Terdekat"
            desc="Jadwal berikutnya yang sudah masuk sistem."
            href="/tentor/sesi"
            label="Semua jadwal"
          >
            {data.sesiTerdekat.length === 0 ? (
              <EmptyState text="Belum ada sesi terdekat." />
            ) : (
              <div className="space-y-2">
                {data.sesiTerdekat.map((sesi: any) => (
                  <SesiCard key={sesi.id} sesi={sesi} />
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Honor Bulan Ini"
            desc="Honor yang sudah dicatat admin."
            href="/tentor/honor"
            label="Detail honor"
          >
            {data.honorBulanIni.length === 0 ? (
              <EmptyState text="Belum ada honor bulan ini." />
            ) : (
              <div className="space-y-2">
                {data.honorBulanIni.slice(0, 4).map((item: any) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                  >
                    <div>
                      <p className="font-black text-[#063D27]">
                        {formatRupiah(Number(item.jumlah_honor || 0))}
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-400">
                        {item.tanggal_bayar
                          ? formatTanggal(item.tanggal_bayar)
                          : '-'}
                      </p>
                    </div>

                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Dibayar
                    </span>
                  </div>
                ))}
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
    <div className="rounded-[26px] border border-[#DDE9DB] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 truncate text-2xl font-black text-[#063D27]">
            {value}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-400">{desc}</p>
        </div>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
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
    <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
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

function SesiCard({
  sesi,
  showJournalAction = false,
}: {
  sesi: any
  showJournalAction?: boolean
}) {
  const siswaList = sesi.sesi_siswa ?? []

  return (
    <div className="rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-black text-[#063D27]">
              {sesi.mapel ?? '-'}
            </p>

            <StatusBadge status={sesi.status ?? 'terjadwal'} />
          </div>

          <p className="mt-1 text-sm font-semibold text-slate-500">
            {sesi.tanggal ? formatTanggal(sesi.tanggal) : '-'} ·{' '}
            {sesi.jam_mulai?.slice(0, 5) ?? '-'} · {sesi.durasi ?? '-'} menit
          </p>

          <p className="mt-1 text-xs font-semibold text-slate-400">
            {siswaList.length} siswa
          </p>
        </div>

        {showJournalAction && (
          <Link
            href="/tentor/jurnal"
            className="inline-flex h-9 items-center justify-center rounded-full bg-[#063D27] px-4 text-xs font-black text-white transition hover:bg-[#0B5738]"
          >
            Isi Jurnal
          </Link>
        )}
      </div>

      {siswaList.length > 0 && (
        <details className="mt-3 rounded-[18px] border border-[#EEF3EC] bg-white">
          <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black text-slate-500">
            Lihat siswa
          </summary>

          <div className="space-y-2 border-t border-[#EEF3EC] p-3">
            {siswaList.map((relasi: any) => (
              <div
                key={relasi.id}
                className="rounded-2xl bg-[#FAFCF9] px-3 py-2"
              >
                <p className="text-sm font-bold text-[#063D27]">
                  {relasi.siswa?.nama ?? '-'}
                </p>

                <p className="text-xs font-semibold text-slate-400">
                  {relasi.siswa?.kelas ?? '-'}
                </p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
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