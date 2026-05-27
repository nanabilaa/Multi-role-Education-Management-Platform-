import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  ImageIcon,
  RotateCcw,
  Search,
  UserRound,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  searchParams?: {
    q?: string
    status?: string
    tanggal?: string
  }
}

type JurnalRow = {
  id: string
  sesi_id: string | null
  tentor_id: string | null
  catatan_umum: string | null
  foto_validasi_url: string | null
  foto_validasi_path: string | null
}

type SesiRow = {
  id: string
  tentor_id: string | null
  tanggal: string | null
  jam_mulai: string | null
  durasi: number | null
  status: string | null
  mapel: string | null
}

type RelasiRow = {
  id: string
  sesi_id: string | null
  siswa_id: string | null
  materi: string | null
  deskripsi: string | null
}

type SiswaRow = {
  id: string
  nama: string | null
  kelas: string | null
  sekolah: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
}

type JurnalItem = {
  jurnal: JurnalRow
  sesi: SesiRow | null
  tentorId: string | null
  tentor: ProfileRow | null
  muridList: {
    id: string
    nama: string
    kelas: string
    sekolah: string
    materi: string
    deskripsi: string
  }[]
}

function formatTanggal(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function formatJam(value: string | null) {
  if (!value) return '-'
  return value.slice(0, 5)
}

function shortId(value: string | null) {
  if (!value) return '-'
  return value.slice(0, 8)
}

function getInitials(name?: string | null) {
  if (!name) return 'AD'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function statusLabel(status: string | null) {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'selesai') return 'Selesai'
  if (normalized === 'berlangsung') return 'Berlangsung'
  if (normalized === 'terjadwal') return 'Terjadwal'
  if (normalized === 'dibatalkan') return 'Dibatalkan'

  return status || '-'
}

function statusClass(status: string | null) {
  const normalized = String(status || '').toLowerCase()

  if (normalized === 'selesai') {
    return 'border-[#DDE9DB] bg-[#F3F8F1] text-[#063D27]'
  }

  if (normalized === 'berlangsung') {
    return 'border-[#EFE6BF] bg-[#FFFBEA] text-[#7A5C00]'
  }

  if (normalized === 'dibatalkan') {
    return 'border-[#F3D4D4] bg-[#FFF7F7] text-[#9F3030]'
  }

  return 'border-slate-100 bg-slate-50 text-slate-500'
}

function StatCard({
  title,
  value,
  desc,
  icon,
  tone = 'soft',
}: {
  title: string
  value: string | number
  desc: string
  icon: React.ReactNode
  tone?: 'green' | 'yellow' | 'soft'
}) {
  const cardClass = {
    green: 'border-[#DDE9DB] bg-[#F3F8F1]',
    yellow: 'border-[#EFE6BF] bg-[#FFFBEA]',
    soft: 'border-[#E7EFE6] bg-white',
  }

  const iconClass = {
    green: 'bg-white text-[#063D27] ring-1 ring-[#DDE9DB]',
    yellow: 'bg-white text-[#8A6A00] ring-1 ring-[#EFE6BF]',
    soft: 'bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]',
  }

  return (
    <div className={`rounded-[28px] border p-5 ${cardClass[tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            {title}
          </p>

          <p className="mt-3 text-3xl font-black tracking-tight text-[#063D27]">
            {value}
          </p>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
            {desc}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] ${iconClass[tone]}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-[30px] border border-dashed border-[#DDE9DB] bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-[#F3F8F1] text-[#063D27]">
        <FileText className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-lg font-black text-[#063D27]">
        Belum ada jurnal yang sesuai filter
      </h2>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Coba ubah kata kunci, status, atau tanggal. Data jurnal akan muncul dalam bentuk kartu ringkas.
      </p>
    </div>
  )
}

function StatusBadge({ status }: { status: string | null }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black ${statusClass(
        status
      )}`}
    >
      {statusLabel(status)}
    </span>
  )
}

function JurnalCard({ item }: { item: JurnalItem }) {
  const tentorName = item.tentor?.full_name || `ID ${shortId(item.tentorId)}`

  const catatanPreview =
    item.jurnal.catatan_umum && item.jurnal.catatan_umum.trim().length > 0
      ? item.jurnal.catatan_umum.trim()
      : 'Belum ada catatan umum.'

  return (
    <details className="group rounded-[28px] border border-[#E7EFE6] bg-white transition hover:bg-[#FDFEFB]">
      <summary className="flex cursor-pointer list-none flex-col gap-4 p-5 marker:hidden lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-[#F8FAF7] text-sm font-black text-[#063D27] ring-1 ring-[#E7EFE6]">
            {getInitials(tentorName)}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-lg font-black tracking-tight text-[#063D27]">
                {item.sesi?.mapel ?? 'Tanpa Mapel'}
              </h2>

              <StatusBadge status={item.sesi?.status ?? null} />
            </div>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="h-4 w-4 text-slate-400" />
                {tentorName}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4 text-slate-400" />
                {formatTanggal(item.sesi?.tanggal ?? null)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4 text-slate-400" />
                {formatJam(item.sesi?.jam_mulai ?? null)}
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-slate-400" />
                {item.muridList.length} murid
              </span>
            </div>

            <p className="mt-3 line-clamp-1 max-w-3xl text-sm leading-6 text-slate-500">
              {catatanPreview}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {item.jurnal.foto_validasi_url ? (
            <a
              href={item.jurnal.foto_validasi_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F8FAF7] px-4 text-xs font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
            >
              <ImageIcon className="h-4 w-4" />
              Foto
            </a>
          ) : (
            <span className="inline-flex h-10 items-center justify-center rounded-full border border-slate-100 bg-slate-50 px-4 text-xs font-black text-slate-400">
              Tanpa Foto
            </span>
          )}

          <span className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-4 text-xs font-black text-[#063D27] transition group-open:bg-[#EAF3E8]">
            Detail
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </span>
        </div>
      </summary>

      <div className="border-t border-[#EEF3ED] px-5 pb-5">
        <div className="mt-5 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="rounded-[24px] border border-[#E7EFE6] bg-[#FAFBF7] p-5">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Catatan Umum
            </p>

            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {item.jurnal.catatan_umum || '-'}
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-[18px] border border-[#E7EFE6] bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                  Durasi
                </p>
                <p className="mt-1 text-sm font-black text-[#063D27]">
                  {item.sesi?.durasi ?? 0} menit
                </p>
              </div>

              <div className="rounded-[18px] border border-[#E7EFE6] bg-white p-3">
                <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                  Sesi ID
                </p>
                <p className="mt-1 text-sm font-black text-[#063D27]">
                  {shortId(item.sesi?.id ?? null)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#E7EFE6] bg-white p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Progres Murid
                </p>
                <h3 className="mt-1 text-base font-black text-[#063D27]">
                  Materi & deskripsi per murid
                </h3>
              </div>

              <span className="rounded-full bg-[#F3F8F1] px-3 py-1 text-xs font-black text-[#063D27]">
                {item.muridList.length} data
              </span>
            </div>

            {item.muridList.length > 0 ? (
              <div className="space-y-3">
                {item.muridList.map((murid) => (
                  <details
                    key={murid.id}
                    className="group/murid rounded-[20px] border border-[#E7EFE6] bg-[#FAFBF7]"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 marker:hidden">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-[#063D27]">
                          {murid.nama}
                        </p>
                        <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                          {murid.kelas} · {murid.sekolah}
                        </p>
                      </div>

                      <ChevronDown className="h-4 w-4 shrink-0 text-[#063D27] transition group-open/murid:rotate-180" />
                    </summary>

                    <div className="border-t border-[#E7EFE6] px-4 pb-4 pt-3">
                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                            Materi
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {murid.materi || '-'}
                          </p>
                        </div>

                        <div>
                          <p className="text-[11px] font-black uppercase tracking-wide text-slate-400">
                            Deskripsi
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                            {murid.deskripsi || '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            ) : (
              <div className="rounded-[20px] border border-dashed border-[#DDE9DB] bg-[#FAFBF7] p-5 text-sm font-semibold text-slate-500">
                Tidak ada data murid untuk sesi ini.
              </div>
            )}
          </div>
        </div>
      </div>
    </details>
  )
}

export default async function AdminJurnalPage({ searchParams }: PageProps) {
  const supabase = await createClient()

  const authRes = await supabase.auth.getUser()
  const user = authRes.data.user

  if (!user) {
    redirect('/login')
  }

  const q = String(searchParams?.q || '').trim().toLowerCase()
  const statusFilter = String(searchParams?.status || '').trim()
  const tanggalFilter = String(searchParams?.tanggal || '').trim()

  const jurnalRes = await supabase
    .from('jurnal')
    .select(
      'id, sesi_id, tentor_id, catatan_umum, foto_validasi_url, foto_validasi_path'
    )
    .limit(300)

  if (jurnalRes.error) {
    return (
      <div className="p-6">
        <div className="rounded-[28px] border border-red-100 bg-red-50 p-5 text-red-700">
          <h1 className="text-lg font-black">Gagal mengambil data jurnal</h1>
          <p className="mt-2 text-sm">{jurnalRes.error.message}</p>
        </div>
      </div>
    )
  }

  const jurnalRows: JurnalRow[] = []

  for (const raw of jurnalRes.data ?? []) {
    if (!raw) continue
    if (typeof raw.id !== 'string') continue

    jurnalRows.push({
      id: raw.id,
      sesi_id: typeof raw.sesi_id === 'string' ? raw.sesi_id : null,
      tentor_id: typeof raw.tentor_id === 'string' ? raw.tentor_id : null,
      catatan_umum:
        typeof raw.catatan_umum === 'string' ? raw.catatan_umum : null,
      foto_validasi_url:
        typeof raw.foto_validasi_url === 'string'
          ? raw.foto_validasi_url
          : null,
      foto_validasi_path:
        typeof raw.foto_validasi_path === 'string'
          ? raw.foto_validasi_path
          : null,
    })
  }

  const sesiIds = Array.from(
    new Set(
      jurnalRows
        .map((item) => item.sesi_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const sesiMap = new Map<string, SesiRow>()

  if (sesiIds.length > 0) {
    const sesiRes = await supabase
      .from('sesi')
      .select('id, tentor_id, tanggal, jam_mulai, durasi, status, mapel')
      .in('id', sesiIds)

    if (sesiRes.error) {
      return (
        <div className="p-6">
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-5 text-red-700">
            <h1 className="text-lg font-black">Gagal mengambil data sesi</h1>
            <p className="mt-2 text-sm">{sesiRes.error.message}</p>
          </div>
        </div>
      )
    }

    for (const raw of sesiRes.data ?? []) {
      if (!raw) continue
      if (typeof raw.id !== 'string') continue

      sesiMap.set(raw.id, {
        id: raw.id,
        tentor_id: typeof raw.tentor_id === 'string' ? raw.tentor_id : null,
        tanggal: typeof raw.tanggal === 'string' ? raw.tanggal : null,
        jam_mulai: typeof raw.jam_mulai === 'string' ? raw.jam_mulai : null,
        durasi: typeof raw.durasi === 'number' ? raw.durasi : null,
        status: typeof raw.status === 'string' ? raw.status : null,
        mapel: typeof raw.mapel === 'string' ? raw.mapel : null,
      })
    }
  }

  const relasiRows: RelasiRow[] = []

  if (sesiIds.length > 0) {
    const relasiRes = await supabase
      .from('sesi_siswa')
      .select('id, sesi_id, siswa_id, materi, deskripsi')
      .in('sesi_id', sesiIds)

    if (relasiRes.error) {
      return (
        <div className="p-6">
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-5 text-red-700">
            <h1 className="text-lg font-black">
              Gagal mengambil progres murid
            </h1>
            <p className="mt-2 text-sm">{relasiRes.error.message}</p>
          </div>
        </div>
      )
    }

    for (const raw of relasiRes.data ?? []) {
      if (!raw) continue
      if (typeof raw.id !== 'string') continue

      relasiRows.push({
        id: raw.id,
        sesi_id: typeof raw.sesi_id === 'string' ? raw.sesi_id : null,
        siswa_id: typeof raw.siswa_id === 'string' ? raw.siswa_id : null,
        materi: typeof raw.materi === 'string' ? raw.materi : null,
        deskripsi: typeof raw.deskripsi === 'string' ? raw.deskripsi : null,
      })
    }
  }

  const siswaIds = Array.from(
    new Set(
      relasiRows
        .map((item) => item.siswa_id)
        .filter((id): id is string => Boolean(id))
    )
  )

  const siswaMap = new Map<string, SiswaRow>()

  if (siswaIds.length > 0) {
    const siswaRes = await supabase
      .from('siswa')
      .select('id, nama, kelas, sekolah')
      .in('id', siswaIds)

    if (siswaRes.error) {
      return (
        <div className="p-6">
          <div className="rounded-[28px] border border-red-100 bg-red-50 p-5 text-red-700">
            <h1 className="text-lg font-black">Gagal mengambil data siswa</h1>
            <p className="mt-2 text-sm">{siswaRes.error.message}</p>
          </div>
        </div>
      )
    }

    for (const raw of siswaRes.data ?? []) {
      if (!raw) continue
      if (typeof raw.id !== 'string') continue

      siswaMap.set(raw.id, {
        id: raw.id,
        nama: typeof raw.nama === 'string' ? raw.nama : null,
        kelas: typeof raw.kelas === 'string' ? raw.kelas : null,
        sekolah: typeof raw.sekolah === 'string' ? raw.sekolah : null,
      })
    }
  }

  const tentorIdSet = new Set<string>()

  for (const jurnal of jurnalRows) {
    if (jurnal.tentor_id) {
      tentorIdSet.add(jurnal.tentor_id)
    }

    if (jurnal.sesi_id) {
      const sesi = sesiMap.get(jurnal.sesi_id)

      if (sesi?.tentor_id) {
        tentorIdSet.add(sesi.tentor_id)
      }
    }
  }

  const tentorIds = Array.from(tentorIdSet)
  const profileMap = new Map<string, ProfileRow>()

  if (tentorIds.length > 0) {
    const profileRes = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', tentorIds)

    if (!profileRes.error) {
      for (const raw of profileRes.data ?? []) {
        if (!raw) continue
        if (typeof raw.id !== 'string') continue

        profileMap.set(raw.id, {
          id: raw.id,
          full_name: typeof raw.full_name === 'string' ? raw.full_name : null,
        })
      }
    }
  }

  const relasiBySesi = new Map<string, RelasiRow[]>()

  for (const relasi of relasiRows) {
    if (!relasi.sesi_id) continue

    const current = relasiBySesi.get(relasi.sesi_id) ?? []
    current.push(relasi)
    relasiBySesi.set(relasi.sesi_id, current)
  }

  const items: JurnalItem[] = jurnalRows
    .map((jurnal) => {
      const sesi = jurnal.sesi_id ? sesiMap.get(jurnal.sesi_id) ?? null : null
      const tentorId = jurnal.tentor_id || sesi?.tentor_id || null
      const tentor = tentorId ? profileMap.get(tentorId) ?? null : null
      const relasiList = jurnal.sesi_id
        ? relasiBySesi.get(jurnal.sesi_id) ?? []
        : []

      const muridList = relasiList.map((relasi, index) => {
        const siswa = relasi.siswa_id
          ? siswaMap.get(relasi.siswa_id) ?? null
          : null

        return {
          id: relasi.id,
          nama: siswa?.nama ?? `Murid ${index + 1}`,
          kelas: siswa?.kelas ?? '-',
          sekolah: siswa?.sekolah ?? '-',
          materi: relasi.materi ?? '',
          deskripsi: relasi.deskripsi ?? '',
        }
      })

      return {
        jurnal,
        sesi,
        tentorId,
        tentor,
        muridList,
      }
    })
    .filter((item) => {
      if (statusFilter && item.sesi?.status !== statusFilter) {
        return false
      }

      if (tanggalFilter && item.sesi?.tanggal !== tanggalFilter) {
        return false
      }

      if (!q) {
        return true
      }

      const searchable = [
        item.sesi?.mapel,
        item.sesi?.status,
        item.jurnal.catatan_umum,
        item.tentor?.full_name,
        item.tentorId,
        ...item.muridList.map((murid) => murid.nama),
        ...item.muridList.map((murid) => murid.materi),
        ...item.muridList.map((murid) => murid.deskripsi),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchable.includes(q)
    })
    .sort((a, b) => {
      const tanggalA = a.sesi?.tanggal ? new Date(a.sesi.tanggal).getTime() : 0
      const tanggalB = b.sesi?.tanggal ? new Date(b.sesi.tanggal).getTime() : 0

      return tanggalB - tanggalA
    })

  const totalJurnal = items.length
  const totalSelesai = items.filter(
    (item) => String(item.sesi?.status || '').toLowerCase() === 'selesai'
  ).length
  const totalDenganFoto = items.filter((item) =>
    Boolean(item.jurnal.foto_validasi_url)
  ).length

  return (
    <main className="min-h-screen bg-[#FAFBF7] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-7xl">
        <section className="rounded-[32px] border border-[#E7EFE6] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
                Admin · Jurnal
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                History Jurnal Tentor
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                Jurnal dibuat ringkas dan tenang. Detail catatan serta progres murid disembunyikan dulu,
                lalu bisa dibuka saat dibutuhkan.
              </p>
            </div>

            <div className="rounded-[24px] border border-[#E7EFE6] bg-[#F8FAF7] p-4">
              <p className="text-xs font-bold text-slate-400">Total data tampil</p>
              <p className="mt-1 text-3xl font-black text-[#063D27]">{totalJurnal}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Total Jurnal"
            value={totalJurnal}
            desc="Sesuai filter aktif"
            icon={<FileText className="h-5 w-5" />}
            tone="soft"
          />

          <StatCard
            title="Sesi Selesai"
            value={totalSelesai}
            desc="Jurnal sesi selesai"
            icon={<CheckCircle2 className="h-5 w-5" />}
            tone="green"
          />

          <StatCard
            title="Dengan Foto"
            value={totalDenganFoto}
            desc="Ada foto validasi"
            icon={<ImageIcon className="h-5 w-5" />}
            tone="yellow"
          />
        </section>

        <section className="mt-5 rounded-[30px] border border-[#E7EFE6] bg-white p-5">
          <form
            className="grid gap-3 lg:grid-cols-[1fr_190px_190px_auto_auto]"
            method="GET"
          >
            <div>
              <label
                htmlFor="q"
                className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
              >
                Cari
              </label>

              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  id="q"
                  name="q"
                  defaultValue={searchParams?.q ?? ''}
                  placeholder="Cari tentor, siswa, mapel, materi..."
                  className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#F8FAF7] px-11 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="status"
                className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
              >
                Status
              </label>

              <select
                id="status"
                name="status"
                defaultValue={searchParams?.status ?? ''}
                className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#F8FAF7] px-4 text-sm font-black text-[#063D27] outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
              >
                <option value="">Semua</option>
                <option value="terjadwal">Terjadwal</option>
                <option value="berlangsung">Berlangsung</option>
                <option value="selesai">Selesai</option>
                <option value="dibatalkan">Dibatalkan</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="tanggal"
                className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
              >
                Tanggal
              </label>

              <input
                id="tanggal"
                name="tanggal"
                type="date"
                defaultValue={searchParams?.tanggal ?? ''}
                className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#F8FAF7] px-4 text-sm font-black text-[#063D27] outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-5 text-sm font-black text-[#063D27] transition hover:bg-[#EAF3E8] lg:w-auto"
              >
                <Activity className="h-4 w-4" />
                Filter
              </button>
            </div>

            <div className="flex items-end">
              <Link
                href="/admin/jurnal"
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-5 text-sm font-black text-[#063D27] transition hover:bg-[#F3F8F1] lg:w-auto"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Link>
            </div>
          </form>
        </section>

        <section className="mt-5">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
                Daftar Jurnal
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-[#063D27]">
                Klik detail untuk membuka isi jurnal
              </h2>
            </div>

            <p className="text-sm font-semibold text-slate-500">
              Default tertutup supaya halaman tidak penuh.
            </p>
          </div>

          <div className="space-y-3">
            {items.length > 0 ? (
              items.map((item) => (
                <JurnalCard key={item.jurnal.id} item={item} />
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </section>
      </div>
    </main>
  )
}