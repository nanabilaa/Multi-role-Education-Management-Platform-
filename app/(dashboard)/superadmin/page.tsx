import Link from 'next/link'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarDays,
  DatabaseBackup,
  Mic2,
  Search,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type AuditRow = {
  id: string
  action: string
  detail: string | null
  target_table: string | null
  created_at: string
}

async function countRows(
  table: string,
  filter?: {
    column: string
    value: string
  }
) {
  const supabase = await createClient()

  let query = supabase.from(table).select('*', {
    count: 'exact',
    head: true,
  })

  if (filter) {
    query = query.eq(filter.column, filter.value)
  }

  const { count, error } = await query

  if (error) {
    console.log(`COUNT ERROR ${table}:`, error)
    return 0
  }

  return count || 0
}

function formatDate() {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date())
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

export default async function SuperadminHomePage() {
  const supabase = await createClient()

  const [
    totalAdmin,
    totalTentor,
    totalOrtu,
    totalSiswa,
    totalSesi,
    totalJurnal,
  ] = await Promise.all([
    countRows('profiles', { column: 'role', value: 'admin' }),
    countRows('profiles', { column: 'role', value: 'tentor' }),
    countRows('profiles', { column: 'role', value: 'ortu' }),
    countRows('siswa'),
    countRows('sesi'),
    countRows('jurnal'),
  ])

  const { data: auditData, error: auditError } = await supabase
    .from('cbs_audit_logs')
    .select('id, action, detail, target_table, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  if (auditError) {
    console.log('AUDIT ERROR:', auditError)
  }

  const auditRows = (auditData || []) as AuditRow[]

  const stats = [
    {
      label: 'Admin',
      value: totalAdmin,
      icon: ShieldCheck,
      accent: '#EA4335',
      background: '#FEF1F0',
    },
    {
      label: 'Tentor',
      value: totalTentor,
      icon: UsersRound,
      accent: '#34A853',
      background: '#EAF6ED',
    },
    {
      label: 'Orang Tua',
      value: totalOrtu,
      icon: UsersRound,
      accent: '#F9AB00',
      background: '#FEF7E0',
    },
    {
      label: 'Siswa',
      value: totalSiswa,
      icon: UsersRound,
      accent: '#4285F4',
      background: '#E8F0FE',
    },
    {
      label: 'Sesi',
      value: totalSesi,
      icon: CalendarDays,
      accent: '#34A853',
      background: '#EAF6ED',
    },
    {
      label: 'Jurnal',
      value: totalJurnal,
      icon: BookOpenCheck,
      accent: '#EA4335',
      background: '#FEF1F0',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl space-y-12">
      <div className="mx-auto max-w-4xl py-6 text-center sm:py-10">
        <div className="mb-6 flex justify-center gap-2">
          <span className="h-1.5 w-12 rounded-full bg-[#EA4335]" />
          <span className="h-1.5 w-12 rounded-full bg-[#FABB05]" />
          <span className="h-1.5 w-12 rounded-full bg-[#34A853]" />
        </div>

        <p className="text-sm font-medium text-[#80868B]">
          {formatDate()}
        </p>

        <h1 className="mt-4 text-4xl font-semibold tracking-[-0.045em] text-[#202124] sm:text-5xl">
          Apa yang ingin kamu kelola?
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#5F6368]">
          Cari akun, pengguna, ID login, role, atau data penting dari satu
          tempat.
        </p>

        <form
          action="/superadmin/users"
          method="GET"
          className="mx-auto mt-9 max-w-3xl"
        >
          <div className="flex items-center rounded-full border border-[#DADCE0] bg-white px-5 shadow-[0_2px_8px_rgba(60,64,67,0.15)] transition focus-within:border-transparent focus-within:shadow-[0_4px_18px_rgba(60,64,67,0.20)]">
            <Search className="h-5 w-5 shrink-0 text-[#9AA0A6]" />

            <input
              type="text"
              name="q"
              placeholder="Cari nama, ID login, email, atau role..."
              className="h-[64px] min-w-0 flex-1 bg-transparent px-4 text-base text-[#202124] outline-none placeholder:text-[#9AA0A6]"
            />

            <span
              title="Pencarian suara"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#4285F4]"
            >
              <Mic2 className="h-5 w-5" />
            </span>
          </div>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F1F3F4] px-5 py-3 text-sm font-medium text-[#3C4043] transition hover:bg-[#E8EAED]"
            >
              Cari pengguna
              <Search className="h-4 w-4" />
            </button>

            <Link
              href="/superadmin/audit"
              className="inline-flex items-center gap-2 rounded-xl bg-[#F1F3F4] px-5 py-3 text-sm font-medium text-[#3C4043] transition hover:bg-[#E8EAED]"
            >
              Aktivitas terbaru
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </form>
      </div>

      <div>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Ringkasan
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
              Data sistem
            </h2>
          </div>

          <p className="hidden text-sm text-[#80868B] sm:block">
            Diperbarui otomatis
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.label}
                className="rounded-[24px] border border-[#E8EAED] bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(60,64,67,0.10)]"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-2xl"
                    style={{
                      color: item.accent,
                      backgroundColor: item.background,
                    }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: item.accent }}
                  />
                </div>

                <p className="mt-7 text-4xl font-semibold tracking-[-0.05em] text-[#202124]">
                  {item.value}
                </p>

                <p className="mt-1 text-sm text-[#5F6368]">{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-7">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Akses cepat
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
              Kelola sistem
            </h2>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <QuickCard
              href="/superadmin/admin"
              title="Kelola Admin"
              description="Tambah dan edit admin."
              icon={<ShieldCheck className="h-5 w-5" />}
              color="#EA4335"
              background="#FEF1F0"
            />

            <QuickCard
              href="/superadmin/users"
              title="Semua User"
              description="Role, akun, dan relasi siswa."
              icon={<UsersRound className="h-5 w-5" />}
              color="#F9AB00"
              background="#FEF7E0"
            />

            <QuickCard
              href="/superadmin/backup"
              title="Backup"
              description="Reset dan pengelolaan data."
              icon={<DatabaseBackup className="h-5 w-5" />}
              color="#34A853"
              background="#EAF6ED"
            />
          </div>
        </div>

        <div className="rounded-[28px] bg-[#202124] p-6 text-white sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#BDC1C6]">
            Status sistem
          </p>

          <div className="mt-8 flex items-center gap-3">
            <span className="h-3 w-3 rounded-full bg-[#34A853]" />

            <div>
              <p className="font-semibold">Semua layanan aktif</p>
              <p className="mt-1 text-sm text-[#BDC1C6]">
                Database dan autentikasi terhubung.
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-white/10 pt-6">
            <p className="text-sm text-[#BDC1C6]">Mode akses</p>
            <p className="mt-1 text-xl font-semibold">Superadmin</p>
          </div>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Audit
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
              Aktivitas terbaru
            </h2>
          </div>

          <Link
            href="/superadmin/audit"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#1A73E8] hover:underline"
          >
            Lihat semua
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {auditRows.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-[#F8F9FA] p-6 text-center text-sm text-[#80868B]">
            Belum ada aktivitas sistem.
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[#ECEFF1]">
            {auditRows.map((log, index) => (
              <div
                key={log.id}
                className="flex gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="pt-1.5">
                  <span
                    className={[
                      'block h-2.5 w-2.5 rounded-full',
                      index % 3 === 0
                        ? 'bg-[#EA4335]'
                        : index % 3 === 1
                          ? 'bg-[#FABB05]'
                          : 'bg-[#34A853]',
                    ].join(' ')}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <p className="truncate text-sm font-semibold text-[#202124]">
                      {log.action}
                    </p>
                    <p className="shrink-0 text-xs text-[#9AA0A6]">
                      {formatTime(log.created_at)}
                    </p>
                  </div>

                  <p className="mt-1 text-sm leading-6 text-[#5F6368]">
                    {log.detail || 'Tidak ada detail tambahan.'}
                  </p>

                  {log.target_table && (
                    <span className="mt-2 inline-flex rounded-full bg-[#F1F3F4] px-2.5 py-1 text-[11px] font-medium text-[#5F6368]">
                      {log.target_table}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function QuickCard({
  href,
  title,
  description,
  icon,
  color,
  background,
}: {
  href: string
  title: string
  description: string
  icon: React.ReactNode
  color: string
  background: string
}) {
  return (
    <Link
      href={href}
      className="group rounded-[22px] border border-[#E8EAED] p-5 transition hover:border-[#DADCE0] hover:shadow-[0_6px_18px_rgba(60,64,67,0.10)]"
    >
      <div
        className="flex h-11 w-11 items-center justify-center rounded-2xl"
        style={{
          color,
          backgroundColor: background,
        }}
      >
        {icon}
      </div>

      <h3 className="mt-5 font-semibold text-[#202124]">{title}</h3>

      <p className="mt-1 text-sm leading-6 text-[#80868B]">
        {description}
      </p>

      <div className="mt-4 flex items-center gap-1 text-sm font-semibold text-[#5F6368] transition group-hover:text-[#202124]">
        Buka
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}