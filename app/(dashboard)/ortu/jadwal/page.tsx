import { createClient } from '@/lib/supabase/server'
import {
  CalendarDays,
  ChevronDown,
  Clock3,
  GraduationCap,
  UserRound,
} from 'lucide-react'
import { formatTanggal } from '@/lib/utils'

async function getJadwalData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: anakList } = await supabase
    .from('siswa')
    .select('id')
    .eq('ortu_id', user.id)

  const anakIds = anakList?.map((anak) => anak.id) ?? []

  if (anakIds.length === 0) return []

  const { data } = await supabase
    .from('sesi_siswa')
    .select(
      `
        id,
        hadir,
        siswa:siswa(id, nama, kelas, sekolah),
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
    .order('sesi(tanggal)', { ascending: false })

  return data ?? []
}

export default async function OrtuJadwalPage() {
  const jadwalList = await getJadwalData()

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <Header
          title="Jadwal Anak"
          desc="Lihat jadwal belajar, tentor, waktu, dan status sesi."
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
          {jadwalList.length === 0 ? (
            <EmptyState text="Belum ada jadwal belajar." />
          ) : (
            <div className="space-y-3">
              {jadwalList.map((item: any) => {
                const sesi = item.sesi
                const siswa = item.siswa

                return (
                  <details
                    key={item.id}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-colors open:border-[#BFD6CB]"
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4 transition-colors hover:bg-slate-50 sm:p-5 [&::-webkit-details-marker]:hidden">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                            {sesi?.mapel ?? '-'}
                          </p>

                          <StatusBadge
                            status={sesi?.status ?? 'terjadwal'}
                          />
                        </div>

                        <p className="mt-1.5 truncate text-sm font-medium text-slate-500">
                          {siswa?.nama ?? '-'} ·{' '}
                          {sesi?.tanggal
                            ? formatTanggal(sesi.tanggal)
                            : '-'}{' '}
                          · {sesi?.jam_mulai?.slice(0, 5) ?? '-'}
                        </p>
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition-transform duration-200 group-open:rotate-180">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </summary>

                    <div className="border-t border-slate-200 bg-slate-50/60 p-4 sm:p-5">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <InfoRow
                          icon={<GraduationCap className="h-4 w-4" />}
                          label="Siswa"
                          value={`${siswa?.nama ?? '-'} · ${
                            siswa?.kelas ?? '-'
                          }`}
                          iconClassName="bg-blue-50 text-blue-700"
                        />

                        <InfoRow
                          icon={<UserRound className="h-4 w-4" />}
                          label="Tentor"
                          value={sesi?.tentor?.full_name ?? '-'}
                          iconClassName="bg-violet-50 text-violet-700"
                        />

                        <InfoRow
                          icon={<Clock3 className="h-4 w-4" />}
                          label="Jam & Durasi"
                          value={`${sesi?.jam_mulai?.slice(0, 5) ?? '-'} · ${
                            sesi?.durasi ?? '-'
                          } menit`}
                          iconClassName="bg-amber-50 text-amber-700"
                        />

                        <InfoRow
                          icon={<CalendarDays className="h-4 w-4" />}
                          label="Tanggal"
                          value={
                            sesi?.tanggal
                              ? formatTanggal(sesi.tanggal)
                              : '-'
                          }
                          iconClassName="bg-emerald-50 text-emerald-700"
                        />
                      </div>
                    </div>
                  </details>
                )
              })}
            </div>
          )}
        </section>
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

function InfoRow({
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
    <div className="flex min-h-[82px] items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconClassName}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="mt-1 truncate text-sm font-bold text-slate-800">
          {value}
        </p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <CalendarDays className="h-5 w-5" />
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-500">{text}</p>
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
    dibatalkan: 'Dibatalkan',
  }

  return (
    <span
      className={`shrink-0 rounded-lg px-2.5 py-1 text-xs font-bold ${
        map[status] ?? map.terjadwal
      }`}
    >
      {label[status] ?? status}
    </span>
  )
}
