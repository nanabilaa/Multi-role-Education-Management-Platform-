import Link from 'next/link'
import {
  AlertCircle,
  BookOpenCheck,
  ChevronDown,
  CirclePlus,
  PencilLine,
  Search,
  ShieldAlert,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

type AuditFilter =
  | 'all'
  | 'create'
  | 'update'
  | 'danger'
  | 'other'

type AuditCategory = Exclude<AuditFilter, 'all'>

type ActorProfile = {
  full_name: string | null
  role: string | null
}

type AuditLog = {
  id: string
  action: string
  target_table: string | null
  target_id: string | null
  detail: string | null
  created_at: string
  profiles: ActorProfile | ActorProfile[] | null
}

type SearchParams = {
  q?: string
  type?: string
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getActor(log: AuditLog) {
  if (Array.isArray(log.profiles)) {
    return log.profiles[0] || null
  }

  return log.profiles
}

function getCategory(action: string): AuditCategory {
  const normalized = action.toLowerCase()

  if (
    normalized.includes('delete') ||
    normalized.includes('remove') ||
    normalized.includes('reset') ||
    normalized.includes('hapus')
  ) {
    return 'danger'
  }

  if (
    normalized.includes('create') ||
    normalized.includes('insert') ||
    normalized.includes('make') ||
    normalized.includes('tambah')
  ) {
    return 'create'
  }

  if (
    normalized.includes('update') ||
    normalized.includes('edit') ||
    normalized.includes('link') ||
    normalized.includes('save') ||
    normalized.includes('ubah')
  ) {
    return 'update'
  }

  return 'other'
}

function getCategoryStyle(category: AuditCategory) {
  if (category === 'danger') {
    return {
      dot: 'bg-[#EA4335]',
      iconBackground: 'bg-[#FEF1F0]',
      iconColor: 'text-[#EA4335]',
      badge: 'bg-[#FEF1F0] text-[#C5221F]',
      label: 'Risiko',
      icon: ShieldAlert,
    }
  }

  if (category === 'create') {
    return {
      dot: 'bg-[#34A853]',
      iconBackground: 'bg-[#EAF6ED]',
      iconColor: 'text-[#34A853]',
      badge: 'bg-[#EAF6ED] text-[#137333]',
      label: 'Tambah',
      icon: CirclePlus,
    }
  }

  if (category === 'update') {
    return {
      dot: 'bg-[#FABB05]',
      iconBackground: 'bg-[#FEF7E0]',
      iconColor: 'text-[#F9AB00]',
      badge: 'bg-[#FEF7E0] text-[#B06000]',
      label: 'Perubahan',
      icon: PencilLine,
    }
  }

  return {
    dot: 'bg-[#9AA0A6]',
    iconBackground: 'bg-[#F1F3F4]',
    iconColor: 'text-[#5F6368]',
    badge: 'bg-[#F1F3F4] text-[#5F6368]',
    label: 'Lainnya',
    icon: BookOpenCheck,
  }
}

function isAuditFilter(value?: string): value is AuditFilter {
  return (
    value === 'all' ||
    value === 'create' ||
    value === 'update' ||
    value === 'danger' ||
    value === 'other'
  )
}

function buildAuditHref({
  query,
  filter,
}: {
  query: string
  filter: AuditFilter
}) {
  const params = new URLSearchParams()

  if (query) {
    params.set('q', query)
  }

  if (filter !== 'all') {
    params.set('type', filter)
  }

  const queryString = params.toString()

  return queryString
    ? `/superadmin/audit?${queryString}`
    : '/superadmin/audit'
}

export default async function SuperadminAuditPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const supabase = await createClient()

  const keyword = searchParams?.q?.trim().toLowerCase() || ''

  const activeFilter: AuditFilter = isAuditFilter(
    searchParams?.type
  )
    ? searchParams.type
    : 'all'

  const { data, error } = await supabase
    .from('cbs_audit_logs')
    .select(
      `
      id,
      action,
      target_table,
      target_id,
      detail,
      created_at,
      profiles:actor_id (
        full_name,
        role
      )
    `
    )
    .order('created_at', {
      ascending: false,
    })
    .limit(100)

  const allLogs = (data || []) as AuditLog[]

  const filteredLogs = allLogs.filter((log) => {
    const category = getCategory(log.action)
    const actor = getActor(log)

    const matchesFilter =
      activeFilter === 'all' || category === activeFilter

    const matchesKeyword =
      !keyword ||
      [
        log.action,
        log.target_table,
        log.target_id,
        log.detail,
        actor?.full_name,
        actor?.role,
      ].some((value) =>
        value?.toLowerCase().includes(keyword)
      )

    return matchesFilter && matchesKeyword
  })

  const counts = {
    all: allLogs.length,
    create: allLogs.filter(
      (log) => getCategory(log.action) === 'create'
    ).length,
    update: allLogs.filter(
      (log) => getCategory(log.action) === 'update'
    ).length,
    danger: allLogs.filter(
      (log) => getCategory(log.action) === 'danger'
    ).length,
    other: allLogs.filter(
      (log) => getCategory(log.action) === 'other'
    ).length,
  }

  const filters: {
    value: AuditFilter
    label: string
    count: number
  }[] = [
    {
      value: 'all',
      label: 'Semua',
      count: counts.all,
    },
    {
      value: 'create',
      label: 'Tambah',
      count: counts.create,
    },
    {
      value: 'update',
      label: 'Perubahan',
      count: counts.update,
    },
    {
      value: 'danger',
      label: 'Risiko',
      count: counts.danger,
    },
    {
      value: 'other',
      label: 'Lainnya',
      count: counts.other,
    },
  ]

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      {/* Hero */}
      <div className="mx-auto max-w-4xl py-4 text-center sm:py-8">
        <div className="mb-6 flex justify-center gap-2">
          <span className="h-1.5 w-11 rounded-full bg-[#EA4335]" />
          <span className="h-1.5 w-11 rounded-full bg-[#FABB05]" />
          <span className="h-1.5 w-11 rounded-full bg-[#34A853]" />
        </div>

        <p className="text-sm font-medium text-[#80868B]">
          Riwayat sistem
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#202124] sm:text-5xl">
          Telusuri aktivitas
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5F6368] sm:text-base">
          Temukan aktivitas berdasarkan aksi, target data,
          detail, nama pengguna, atau role.
        </p>

        <form
          method="GET"
          action="/superadmin/audit"
          className="mx-auto mt-8 max-w-3xl"
        >
          {activeFilter !== 'all' && (
            <input
              type="hidden"
              name="type"
              value={activeFilter}
            />
          )}

          <div className="flex items-center rounded-full border border-[#DADCE0] bg-white px-5 shadow-[0_2px_8px_rgba(60,64,67,0.14)] transition focus-within:border-transparent focus-within:shadow-[0_4px_18px_rgba(60,64,67,0.20)]">
            <Search className="h-5 w-5 shrink-0 text-[#9AA0A6]" />

            <input
              type="search"
              name="q"
              defaultValue={searchParams?.q || ''}
              placeholder="Cari aksi, target, detail, atau pengguna..."
              className="h-[64px] min-w-0 flex-1 bg-transparent px-4 text-base text-[#202124] outline-none placeholder:text-[#9AA0A6]"
            />

            <button
              type="submit"
              className="shrink-0 rounded-full bg-[#202124] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-black"
            >
              Cari
            </button>
          </div>
        </form>

        {(keyword || activeFilter !== 'all') && (
          <div className="mt-4">
            <Link
              href="/superadmin/audit"
              className="text-sm font-medium text-[#1A73E8] hover:underline"
            >
              Hapus pencarian dan filter
            </Link>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-2xl border border-[#FAD2CF] bg-[#FEF1F0] p-4 text-sm font-medium text-[#C5221F]">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

          <p>
            Tabel audit belum siap atau policy belum benar:{' '}
            {error.message}
          </p>
        </div>
      )}

      {/* Ringkasan */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          label="Total aktivitas"
          value={counts.all}
          color="#202124"
          background="#F1F3F4"
          icon={<BookOpenCheck className="h-5 w-5" />}
        />

        <SummaryCard
          label="Penambahan"
          value={counts.create}
          color="#34A853"
          background="#EAF6ED"
          icon={<CirclePlus className="h-5 w-5" />}
        />

        <SummaryCard
          label="Perubahan"
          value={counts.update}
          color="#F9AB00"
          background="#FEF7E0"
          icon={<PencilLine className="h-5 w-5" />}
        />

        <SummaryCard
          label="Risiko"
          value={counts.danger}
          color="#EA4335"
          background="#FEF1F0"
          icon={<ShieldAlert className="h-5 w-5" />}
        />
      </div>

      {/* Daftar audit */}
      <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Audit log
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
              Aktivitas ditemukan
            </h2>

            <p className="mt-2 text-sm text-[#80868B]">
              {filteredLogs.length} dari {allLogs.length} log
              ditampilkan.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => {
              const active = filter.value === activeFilter

              return (
                <Link
                  key={filter.value}
                  href={buildAuditHref({
                    query: searchParams?.q || '',
                    filter: filter.value,
                  })}
                  className={[
                    'inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition',
                    active
                      ? 'bg-[#202124] text-white'
                      : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED]',
                  ].join(' ')}
                >
                  {filter.label}

                  <span
                    className={[
                      'rounded-full px-1.5 py-0.5 text-[10px]',
                      active
                        ? 'bg-white/15 text-white'
                        : 'bg-white text-[#80868B]',
                    ].join(' ')}
                  >
                    {filter.count}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>

        {filteredLogs.length === 0 ? (
          <div className="mt-7 rounded-[22px] bg-[#F8F9FA] p-10 text-center">
            <BookOpenCheck className="mx-auto h-8 w-8 text-[#9AA0A6]" />

            <p className="mt-4 font-semibold text-[#3C4043]">
              Aktivitas tidak ditemukan
            </p>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#80868B]">
              Coba gunakan kata kunci atau kategori aktivitas
              yang berbeda.
            </p>
          </div>
        ) : (
          <div className="mt-7 space-y-3">
            {filteredLogs.map((log) => {
              const actor = getActor(log)
              const category = getCategory(log.action)
              const accent = getCategoryStyle(category)
              const Icon = accent.icon

              return (
                <details
                  key={log.id}
                  className="group rounded-[22px] border border-[#E8EAED] bg-white transition open:shadow-[0_6px_18px_rgba(60,64,67,0.08)]"
                >
                  <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
                    <div
                      className={[
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl',
                        accent.iconBackground,
                        accent.iconColor,
                      ].join(' ')}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-semibold text-[#202124]">
                          {log.action}
                        </p>

                        <span
                          className={[
                            'inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold',
                            accent.badge,
                          ].join(' ')}
                        >
                          {accent.label}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-[#80868B]">
                        {actor?.full_name || 'System'} ·{' '}
                        {formatDate(log.created_at)}
                      </p>
                    </div>

                    {log.target_table && (
                      <span className="hidden rounded-full bg-[#F1F3F4] px-3 py-1 text-xs font-medium text-[#5F6368] sm:inline-flex">
                        {log.target_table}
                      </span>
                    )}

                    <ChevronDown className="h-5 w-5 shrink-0 text-[#9AA0A6] transition group-open:rotate-180" />
                  </summary>

                  <div className="border-t border-[#ECEFF1] p-5 sm:p-6">
                    <div className="grid gap-4 md:grid-cols-2">
                      <InfoItem
                        label="Pelaku"
                        value={actor?.full_name || 'System'}
                      />

                      <InfoItem
                        label="Role"
                        value={actor?.role || 'system'}
                      />

                      <InfoItem
                        label="Target tabel"
                        value={log.target_table || '-'}
                      />

                      <InfoItem
                        label="Target ID"
                        value={log.target_id || '-'}
                        mono
                      />
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#F8F9FA] p-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
                        Detail aktivitas
                      </p>

                      <p className="mt-3 text-sm leading-7 text-[#3C4043]">
                        {log.detail ||
                          'Tidak ada detail tambahan untuk aktivitas ini.'}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-[#80868B]">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-3.5 w-3.5" />
                        {actor?.full_name || 'System'}
                      </div>

                      <span>
                        {formatDate(log.created_at)}
                      </span>
                    </div>
                  </div>
                </details>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function SummaryCard({
  label,
  value,
  color,
  background,
  icon,
}: {
  label: string
  value: number
  color: string
  background: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[22px] border border-[#E8EAED] bg-white p-5">
      <div className="flex items-center justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-2xl"
          style={{
            color,
            backgroundColor: background,
          }}
        >
          {icon}
        </div>

        <span
          className="h-2.5 w-2.5 rounded-full"
          style={{
            backgroundColor: color,
          }}
        />
      </div>

      <p className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-[#202124]">
        {value}
      </p>

      <p className="mt-1 text-sm text-[#80868B]">
        {label}
      </p>
    </div>
  )
}

function InfoItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="rounded-2xl border border-[#E8EAED] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
        {label}
      </p>

      <p
        className={[
          'mt-2 break-all text-sm font-medium text-[#3C4043]',
          mono ? 'font-mono text-xs' : '',
        ].join(' ')}
      >
        {value}
      </p>
    </div>
  )
}