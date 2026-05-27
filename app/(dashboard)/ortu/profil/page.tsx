import { createClient } from '@/lib/supabase/server'
import {
  GraduationCap,
  Mail,
  Phone,
  UserRound,
} from 'lucide-react'

async function getProfilData() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return {
      email: '',
      profile: null,
      anakList: [],
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

  return {
    email: user.email ?? '',
    profile: profileRes.data,
    anakList: anakRes.data ?? [],
  }
}

export default async function OrtuProfilPage() {
  const data = await getProfilData()

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-5">
        <Header
          title="Profil Orang Tua"
          desc="Informasi akun orang tua dan daftar anak yang terhubung ke akun ini."
          icon={<UserRound className="h-5 w-5" />}
        />

        <section className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
            <h2 className="text-lg font-black text-[#063D27]">Data Akun</h2>

            <div className="mt-5 space-y-3">
              <InfoRow
                icon={<UserRound className="h-4 w-4" />}
                label="Nama"
                value={data.profile?.full_name ?? '-'}
              />

              <InfoRow
                icon={<Mail className="h-4 w-4" />}
                label="Email Login"
                value={data.email || '-'}
              />

              <InfoRow
                icon={<Phone className="h-4 w-4" />}
                label="Nomor HP"
                value={data.profile?.phone ?? '-'}
              />
            </div>

            <div className="mt-5 rounded-[22px] border border-[#EFE6BF] bg-[#FFFBEA] p-4">
              <p className="text-sm font-semibold leading-7 text-[#7A5C00]">
                Untuk mengubah data akun atau menghubungkan anak, silakan hubungi
                admin bimbel.
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-[#E7EFE6] bg-white p-5">
            <h2 className="text-lg font-black text-[#063D27]">
              Anak Terhubung
            </h2>

            <p className="mt-1 text-sm font-semibold text-slate-500">
              Data siswa yang dapat dilihat oleh akun ini.
            </p>

            <div className="mt-5 space-y-3">
              {data.anakList.length === 0 ? (
                <EmptyState text="Belum ada anak yang terhubung." />
              ) : (
                data.anakList.map((anak: any) => (
                  <div
                    key={anak.id}
                    className="rounded-[24px] border border-[#EEF3EC] bg-[#FAFCF9] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#FFF8E6] text-sm font-black text-[#063D27] ring-1 ring-[#F0E5BE]">
                        {getInitials(anak.nama)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-[#063D27]">
                            {anak.nama}
                          </p>

                          {anak.aktif ? (
                            <span className="rounded-full bg-[#ECFDF3] px-3 py-1 text-xs font-black text-[#027A48]">
                              Aktif
                            </span>
                          ) : (
                            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-600">
                              Nonaktif
                            </span>
                          )}
                        </div>

                        <p className="mt-1 text-sm font-bold text-slate-500">
                          {anak.kelas ?? '-'} · {anak.sekolah ?? '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
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
    <div className="flex gap-3 rounded-[20px] border border-[#EEF3EC] bg-[#FAFCF9] p-4">
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
      <GraduationCap className="mx-auto h-7 w-7 text-[#063D27]" />
      <p className="mt-3 text-sm font-bold text-slate-500">{text}</p>
    </div>
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