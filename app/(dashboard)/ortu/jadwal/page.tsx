import { createClient } from '@/lib/supabase/server'
import {
  CalendarDays,
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
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Header
          title="Jadwal Anak"
          desc="Pantau sesi belajar anak, mapel, tentor, jam, dan status sesi."
          icon={<CalendarDays className="h-5 w-5" />}
        />

        <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
          {jadwalList.length === 0 ? (
            <EmptyState text="Belum ada jadwal untuk anak yang terhubung." />
          ) : (
            <div className="space-y-3">
              {jadwalList.map((item: any) => {
                const sesi = item.sesi
                const siswa = item.siswa

                return (
                  <details
                    key={item.id}
                    className="group rounded-[24px] border border-[#EEF3EC] bg-[#FAFCF9]"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                        <CalendarDays className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#063D27]">
                            {sesi?.mapel ?? '-'}
                          </p>

                          <StatusBadge status={sesi?.status ?? 'terjadwal'} />
                        </div>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {siswa?.nama ?? '-'} ·{' '}
                          {sesi?.tanggal ? formatTanggal(sesi.tanggal) : '-'} ·{' '}
                          {sesi?.jam_mulai?.slice(0, 5) ?? '-'}
                        </p>
                      </div>
                    </summary>

                    <div className="grid gap-3 border-t border-[#EEF3EC] px-4 pb-4 pt-3 sm:grid-cols-2">
                      <InfoRow
                        icon={<GraduationCap className="h-4 w-4" />}
                        label="Siswa"
                        value={`${siswa?.nama ?? '-'} · ${siswa?.kelas ?? '-'}`}
                      />

                      <InfoRow
                        icon={<UserRound className="h-4 w-4" />}
                        label="Tentor"
                        value={sesi?.tentor?.full_name ?? '-'}
                      />

                      <InfoRow
                        icon={<Clock3 className="h-4 w-4" />}
                        label="Jam & Durasi"
                        value={`${sesi?.jam_mulai?.slice(0, 5) ?? '-'} · ${
                          sesi?.durasi ?? '-'
                        } menit`}
                      />

                      <InfoRow
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Tanggal"
                        value={sesi?.tanggal ? formatTanggal(sesi.tanggal) : '-'}
                      />
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
    <section className="rounded-[32px] border border-[#E7EFE6] bg-white p-6 sm:p-7">
      <div className="inline-flex items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
        {icon}
        Portal Orang Tua
      </div>

      <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
        {title}
      </h1>

      <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
        {desc}
      </p>
    </section>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex gap-3 rounded-[20px] border border-[#EEF3EC] bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
        {icon}
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-bold text-slate-700">{value}</p>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-10 text-center">
      <p className="text-sm font-bold text-slate-500">{text}</p>
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
    dibatalkan: 'Dibatalkan',
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