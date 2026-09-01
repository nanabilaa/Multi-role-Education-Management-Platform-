import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  BookOpenCheck,
  CalendarDays,
  Clock3,
  Plus,
  UsersRound,
} from 'lucide-react'
import { formatTanggal } from '@/lib/utils'

async function getTentorSesiData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('[DEBUG tentor/sesi] auth user:', user?.id)

  if (!user) return []

  // Check profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role')
    .eq('id', user.id)
    .maybeSingle()
  console.log('[DEBUG tentor/sesi] profile:', profile)

  // First check ALL sesi without filter to see if RLS is blocking
  const { data: allSesi, error: allError } = await supabase
    .from('sesi')
    .select('id, tentor_id, tanggal, status')
    .limit(20)
  console.log('[DEBUG tentor/sesi] ALL sesi visible to user:', allSesi?.length, allSesi?.map(s => ({ id: s.id, tentor_id: s.tentor_id })))
  if (allError) console.log('[DEBUG tentor/sesi] all sesi error:', allError)

  const { data, error } = await supabase
    .from('sesi')
    .select(
      `
      id,
      tanggal,
      jam_mulai,
      durasi,
      mapel,
      status,
      created_at,
      sesi_siswa(
        id,
        hadir,
        siswa:siswa(
          id,
          nama,
          kelas,
          sekolah
        )
      ),
      jurnal(id)
    `
    )
    .eq('tentor_id', user.id)
    .order('tanggal', { ascending: false })
    .order('jam_mulai', { ascending: false })

  console.log('[DEBUG tentor/sesi] filtered sesi count:', data?.length)
  if (error) {
    console.log('[DEBUG tentor/sesi] FILTERED ERROR:', error)
    return []
  }

  return data ?? []
}

export default async function TentorSesiPage() {
  const sesiList = await getTentorSesiData()

  const sesiHariIni = sesiList.filter((sesi: any) => {
    const today = new Date().toISOString().slice(0, 10)
    return sesi.tanggal === today
  })

  const sesiSelesai = sesiList.filter((sesi: any) => sesi.status === 'selesai')

  const belumJurnal = sesiList.filter((sesi: any) => {
    const jurnal = sesi.jurnal ?? []
    return sesi.status === 'selesai' && jurnal.length === 0
  })

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[32px] border border-[#DDE9DB] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-bold text-[#063D27]">
                <CalendarDays className="h-4 w-4" />
                Portal Tentor
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Sesi Mengajar
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Semua sesi yang kamu buat dan jadwalkan. Klik detail siswa untuk melihat peserta
              </p>
            </div>

            <Link
              href="/tentor/sesi/buat"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738]"
            >
              <Plus className="h-4 w-4" />
              Buat Sesi
            </Link>
          </div>
        </section>

        <section className="grid gap-3 sm:grid-cols-3">
          <SmallCard
            title="Hari Ini"
            value={`${sesiHariIni.length}`}
            desc="Sesi"
            icon={<Clock3 className="h-5 w-5" />}
          />

          <SmallCard
            title="Selesai"
            value={`${sesiSelesai.length}`}
            desc="Total sesi"
            icon={<CalendarDays className="h-5 w-5" />}
          />

          <SmallCard
            title="Jurnal"
            value={`${belumJurnal.length}`}
            desc="Belum diisi"
            icon={<BookOpenCheck className="h-5 w-5" />}
          />
        </section>

        <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-[#063D27]">
                Daftar Sesi
              </h2>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                Urutan terbaru ada di atas.
              </p>
            </div>
          </div>

          {sesiList.length === 0 ? (
            <EmptyState text="Belum ada sesi. Buat sesi pertama dulu." />
          ) : (
            <div className="space-y-3">
              {sesiList.map((sesi: any) => {
                const siswaList = sesi.sesi_siswa ?? []
                const jurnal = sesi.jurnal ?? []
                const sudahAdaJurnal = jurnal.length > 0

                return (
                  <article
                    key={sesi.id}
                    className="rounded-[24px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-black text-[#063D27]">
                            {sesi.mapel}
                          </h3>

                          <StatusBadge status={sesi.status ?? 'terjadwal'} />

                          {sudahAdaJurnal ? (
                            <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
                              Jurnal Ada
                            </span>
                          ) : sesi.status === 'selesai' ? (
                            <span className="rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-black text-[#7A5C00]">
                              Belum Jurnal
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-2 text-sm font-semibold text-slate-500">
                          {sesi.tanggal ? formatTanggal(sesi.tanggal) : '-'} ·{' '}
                          {sesi.jam_mulai?.slice(0, 5) ?? '-'} ·{' '}
                          {sesi.durasi ?? '-'} menit
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          {siswaList.length} siswa terdaftar
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/tentor/sesi/${sesi.id}/jurnal`}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-4 text-xs font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
                        >
                          <BookOpenCheck className="h-4 w-4" />
                          Jurnal
                        </Link>
                      </div>
                    </div>

                    <details className="mt-4 rounded-[20px] border border-[#EEF3EC] bg-white">
                      <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-black text-[#063D27]">
                        <span className="inline-flex items-center gap-2">
                          <UsersRound className="h-4 w-4" />
                          Lihat siswa
                        </span>

                        <span className="text-xs font-bold text-slate-400">
                          {siswaList.length} orang
                        </span>
                      </summary>

                      <div className="space-y-2 border-t border-[#EEF3EC] p-3">
                        {siswaList.length === 0 ? (
                          <p className="rounded-2xl bg-[#FAFCF9] px-4 py-3 text-sm font-bold text-slate-400">
                            Belum ada siswa di sesi ini.
                          </p>
                        ) : (
                          siswaList.map((relasi: any) => (
                            <div
                              key={relasi.id}
                              className="rounded-2xl bg-[#FAFCF9] px-4 py-3"
                            >
                              <p className="text-sm font-black text-[#063D27]">
                                {relasi.siswa?.nama ?? '-'}
                              </p>

                              <p className="mt-0.5 text-xs font-semibold text-slate-400">
                                {relasi.siswa?.kelas ?? '-'} ·{' '}
                                {relasi.siswa?.sekolah ?? '-'}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </details>
                  </article>
                )
              })}
            </div>
          )}
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-10 text-center">
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