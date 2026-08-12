import { createClient } from '@/lib/supabase/server'
import {
  CheckCircle2,
  Clock3,
  GraduationCap,
  WalletCards,
  XCircle,
} from 'lucide-react'
import { formatRupiah, NAMA_BULAN } from '@/lib/utils'

async function getTagihanData() {
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
      keterangan,
      siswa:siswa(id, nama, kelas, sekolah)
    `
    )
    .in('siswa_id', anakIds)
    .order('tahun', { ascending: false })
    .order('bulan', { ascending: false })

  return data ?? []
}

export default async function OrtuTagihanPage() {
  const tagihanList = await getTagihanData()

  const totalTagihan = tagihanList.reduce(
    (total: number, item: any) => total + Number(item.nominal || 0),
    0
  )

  const totalLunas = tagihanList
    .filter((item: any) => item.status === 'lunas')
    .reduce((total: number, item: any) => total + Number(item.nominal || 0), 0)

  const totalBelum = Math.max(totalTagihan - totalLunas, 0)

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Header
          title="Tagihan SPP"
          desc="Orang tua hanya melihat status tagihan. Pembayaran dilakukan cash dan divalidasi manual oleh admin."
          icon={<WalletCards className="h-5 w-5" />}
        />

        <section className="grid gap-3 sm:grid-cols-3">

          <StatCard
            title="Sudah Lunas"
            value={formatRupiah(totalLunas)}
            desc="Divalidasi admin"
          />

          <StatCard
            title="Belum Lunas"
            value={formatRupiah(totalBelum)}
            desc="Menunggu pembayaran"
          />
        </section>

        <section className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
          {tagihanList.length === 0 ? (
            <EmptyState text="Belum ada tagihan SPP." />
          ) : (
            <div className="space-y-3">
              {tagihanList.map((item: any) => (
                <details
                  key={item.id}
                  className="group rounded-[24px] border border-[#EEF3EC] bg-[#FAFCF9]"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-3 p-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                      <WalletCards className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-black text-[#063D27]">
                          {item.siswa?.nama ?? '-'}
                        </p>

                        {item.status === 'lunas' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Lunas
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                            <XCircle className="h-3.5 w-3.5" />
                            Belum Lunas
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm font-bold text-slate-500">
                        {NAMA_BULAN[item.bulan]} {item.tahun} ·{' '}
                        {formatRupiah(Number(item.nominal || 0))}
                      </p>
                    </div>
                  </summary>

                  <div className="grid gap-3 border-t border-[#EEF3EC] px-4 pb-4 pt-3 sm:grid-cols-2">
                    <InfoRow
                      icon={<GraduationCap className="h-4 w-4" />}
                      label="Siswa"
                      value={`${item.siswa?.nama ?? '-'} · ${
                        item.siswa?.kelas ?? '-'
                      }`}
                    />

                    <InfoRow
                      icon={<WalletCards className="h-4 w-4" />}
                      label="Nominal"
                      value={formatRupiah(Number(item.nominal || 0))}
                    />

                    <InfoRow
                      icon={<Clock3 className="h-4 w-4" />}
                      label="Tanggal Bayar"
                      value={item.tanggal_bayar ?? '-'}
                    />

                    <InfoRow
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      label="Status"
                      value={item.status === 'lunas' ? 'Lunas' : 'Belum lunas'}
                    />
                  </div>
                </details>
              ))}
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

function StatCard({
  title,
  value,
  desc,
}: {
  title: string
  value: string
  desc: string
}) {
  return (
    <div className="rounded-[26px] border border-[#E7EFE6] bg-white p-5">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
        {title}
      </p>

      <h2 className="mt-3 text-2xl font-black tracking-tight text-[#063D27]">
        {value}
      </h2>

      <p className="mt-1 text-sm font-semibold text-slate-500">{desc}</p>
    </div>
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