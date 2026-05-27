import { createClient } from '@/lib/supabase/server'
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  ImageIcon,
  UserRound,
  XCircle,
} from 'lucide-react'
import { formatTanggal } from '@/lib/utils'

type AnakRow = {
  id: string
  nama: string
  kelas: string | null
}

type SesiRow = {
  id: string
  tanggal: string
  jam_mulai: string
  mapel: string
  status: string
  tentor_id: string | null
}

type TentorRow = {
  id: string
  full_name: string | null
}

type SesiSiswaRow = {
  id: string
  siswa_id: string
  sesi_id: string
  hadir: boolean | null
  materi: string | null
  deskripsi: string | null
}

type JurnalRow = {
  id: string
  sesi_id: string
  materi: string | null
  catatan: string | null
  ringkasan: string | null
  foto_url: string | null
  foto_validasi_url: string | null
  foto_validasi_path: string | null
  submitted_at: string | null
  tentor_id: string | null
}

type JurnalViewRow = {
  id: string
  siswa: AnakRow | null
  sesi: SesiRow | null
  tentor: TentorRow | null
  jurnal: JurnalRow | null
  hadir: boolean | null
  materiSesiSiswa: string | null
  deskripsiSesiSiswa: string | null
}

async function getJurnalData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return []

  const { data: anakList, error: anakError } = await supabase
    .from('siswa')
    .select('id, nama, kelas')
    .eq('ortu_id', user.id)
    .order('nama', { ascending: true })

  if (anakError) {
    console.log('ORTU JURNAL ANAK ERROR:', anakError)
    return []
  }

  const anakRows = (anakList ?? []) as AnakRow[]
  const anakIds = anakRows.map((anak) => anak.id)

  if (anakIds.length === 0) return []

  const { data: sesiSiswaData, error: sesiSiswaError } = await supabase
    .from('sesi_siswa')
    .select('id, siswa_id, sesi_id, hadir, materi, deskripsi')
    .in('siswa_id', anakIds)

  if (sesiSiswaError) {
    console.log('ORTU JURNAL SESI_SISWA ERROR:', sesiSiswaError)
    return []
  }

  const sesiSiswaRows = (sesiSiswaData ?? []) as SesiSiswaRow[]

  const sesiIds = Array.from(
    new Set(
      sesiSiswaRows
        .map((row) => row.sesi_id)
        .filter(Boolean)
    )
  )

  if (sesiIds.length === 0) return []

  const { data: sesiData, error: sesiError } = await supabase
    .from('sesi')
    .select('id, tanggal, jam_mulai, mapel, status, tentor_id')
    .in('id', sesiIds)
    .order('tanggal', { ascending: false })
    .order('jam_mulai', { ascending: false })

  if (sesiError) {
    console.log('ORTU JURNAL SESI ERROR:', sesiError)
    return []
  }

  const sesiRows = ((sesiData ?? []) as SesiRow[]).filter(
    (sesi) => sesi.status === 'selesai'
  )

  const selesaiSesiIds = sesiRows.map((sesi) => sesi.id)

  if (selesaiSesiIds.length === 0) return []

  const tentorIds = Array.from(
    new Set(
      sesiRows
        .map((sesi) => sesi.tentor_id)
        .filter(Boolean) as string[]
    )
  )

  const [jurnalRes, tentorRes] = await Promise.all([
    supabase
      .from('jurnal')
      .select(
        `
        id,
        sesi_id,
        materi,
        catatan,
        ringkasan,
        foto_url,
        foto_validasi_url,
        foto_validasi_path,
        submitted_at,
        tentor_id
      `
      )
      .in('sesi_id', selesaiSesiIds)
      .order('submitted_at', { ascending: false }),

    tentorIds.length > 0
      ? supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', tentorIds)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (jurnalRes.error) {
    console.log('ORTU JURNAL DATA ERROR:', jurnalRes.error)
    return []
  }

  if (tentorRes.error) {
    console.log('ORTU JURNAL TENTOR ERROR:', tentorRes.error)
  }

  const jurnalRows = (jurnalRes.data ?? []) as JurnalRow[]
  const tentorRows = (tentorRes.data ?? []) as TentorRow[]

  const siswaMap = new Map(anakRows.map((anak) => [anak.id, anak]))
  const sesiMap = new Map(sesiRows.map((sesi) => [sesi.id, sesi]))
  const jurnalMap = new Map(jurnalRows.map((jurnal) => [jurnal.sesi_id, jurnal]))
  const tentorMap = new Map(tentorRows.map((tentor) => [tentor.id, tentor]))

  const result: JurnalViewRow[] = sesiSiswaRows
    .filter((row) => selesaiSesiIds.includes(row.sesi_id))
    .map((row) => {
      const sesi = sesiMap.get(row.sesi_id) ?? null
      const jurnal = jurnalMap.get(row.sesi_id) ?? null
      const tentor = sesi?.tentor_id
        ? tentorMap.get(sesi.tentor_id) ?? null
        : null

      return {
        id: row.id,
        siswa: siswaMap.get(row.siswa_id) ?? null,
        sesi,
        tentor,
        jurnal,
        hadir: row.hadir,
        materiSesiSiswa: row.materi,
        deskripsiSesiSiswa: row.deskripsi,
      }
    })
    .sort((a, b) => {
      const dateA = `${a.sesi?.tanggal ?? ''} ${a.sesi?.jam_mulai ?? ''}`
      const dateB = `${b.sesi?.tanggal ?? ''} ${b.sesi?.jam_mulai ?? ''}`
      return dateB.localeCompare(dateA)
    })

  return result
}

export default async function OrtuJurnalPage() {
  const jurnalList = await getJurnalData()

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Header
          title="Jurnal Anak"
          desc="Lihat ringkasan materi, catatan tentor, kehadiran, dan foto validasi pembelajaran."
          icon={<BookOpenCheck className="h-5 w-5" />}
        />

        <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
          {jurnalList.length === 0 ? (
            <EmptyState text="Belum ada jurnal pembelajaran yang bisa ditampilkan." />
          ) : (
            <div className="space-y-3">
              {jurnalList.map((item) => {
                const materi =
                  item.jurnal?.materi ||
                  item.materiSesiSiswa ||
                  'Belum ada materi.'

                const catatan =
                  item.jurnal?.catatan ||
                  item.jurnal?.ringkasan ||
                  item.deskripsiSesiSiswa ||
                  'Belum ada catatan.'

                const fotoValidasi =
                  item.jurnal?.foto_validasi_url ||
                  item.jurnal?.foto_url ||
                  null

                return (
                  <details
                    key={item.id}
                    className="group rounded-[24px] border border-[#EEF3EC] bg-[#FAFCF9]"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                        <BookOpenCheck className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#063D27]">
                            {item.sesi?.mapel ?? '-'}
                          </p>

                          {item.hadir ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Hadir
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                              <XCircle className="h-3.5 w-3.5" />
                              Tidak Hadir
                            </span>
                          )}

                          {item.jurnal ? (
                            <span className="rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-black text-[#7A5C00]">
                              Jurnal Terkirim
                            </span>
                          ) : (
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                              Belum Ada Detail Jurnal
                            </span>
                          )}

                          {fotoValidasi ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-700">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Ada Foto
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                              <ImageIcon className="h-3.5 w-3.5" />
                              Tanpa Foto
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {item.siswa?.nama ?? '-'} ·{' '}
                          {item.sesi?.tanggal
                            ? formatTanggal(item.sesi.tanggal)
                            : '-'}{' '}
                          · {item.sesi?.jam_mulai?.slice(0, 5) ?? '-'}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-400">
                          Klik untuk lihat isi jurnal dan foto validasi.
                        </p>
                      </div>
                    </summary>

                    <div className="space-y-3 border-t border-[#EEF3EC] px-4 pb-4 pt-3">
                      <InfoRow
                        icon={<GraduationCap className="h-4 w-4" />}
                        label="Siswa"
                        value={`${item.siswa?.nama ?? '-'} · ${
                          item.siswa?.kelas ?? '-'
                        }`}
                      />

                      <InfoRow
                        icon={<UserRound className="h-4 w-4" />}
                        label="Tentor"
                        value={item.tentor?.full_name ?? '-'}
                      />

                      <InfoRow
                        icon={<CalendarDays className="h-4 w-4" />}
                        label="Tanggal"
                        value={
                          item.sesi?.tanggal
                            ? formatTanggal(item.sesi.tanggal)
                            : '-'
                        }
                      />

                      <TextBlock label="Materi" value={materi} />

                      <TextBlock label="Catatan" value={catatan} />

                      <PhotoBlock fotoUrl={fotoValidasi} />
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

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-[#EEF3EC] bg-white p-4">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
        {value}
      </p>
    </div>
  )
}

function PhotoBlock({ fotoUrl }: { fotoUrl: string | null }) {
  return (
    <div className="rounded-[20px] border border-[#EEF3EC] bg-white p-4">
      <div className="flex items-center gap-2">
        <ImageIcon className="h-4 w-4 text-[#063D27]" />
        <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          Foto Validasi
        </p>
      </div>

      {!fotoUrl ? (
        <div className="mt-3 rounded-[18px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-4 py-6 text-center">
          <p className="text-sm font-bold text-slate-500">
            Belum ada foto validasi untuk jurnal ini.
          </p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-[20px] border border-[#EEF3EC] bg-[#FAFCF9]">
          <img
            src={fotoUrl}
            alt="Foto validasi jurnal"
            className="max-h-[420px] w-full object-contain"
          />
        </div>
      )}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-10 text-center">
      <BookOpenCheck className="mx-auto h-8 w-8 text-[#063D27]" />
      <p className="mt-3 text-sm font-bold text-slate-500">{text}</p>
    </div>
  )
}