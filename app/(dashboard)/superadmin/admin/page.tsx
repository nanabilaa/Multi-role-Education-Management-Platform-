'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Save,
  Search,
  ShieldCheck,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ProfileRow = {
  id: string
  full_name: string | null
  role: string | null
  phone: string | null
  created_at: string | null
}

export default function SuperadminAdminPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState('')
  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [selectedUserId, setSelectedUserId] = useState('')
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const admins = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return profiles.filter((item) => {
      if (item.role !== 'admin') return false

      return (
        !keyword ||
        item.full_name?.toLowerCase().includes(keyword) ||
        item.phone?.toLowerCase().includes(keyword)
      )
    })
  }, [profiles, search])

  const candidates = useMemo(
    () =>
      profiles.filter(
        (item) => item.role !== 'admin' && item.role !== 'superadmin'
      ),
    [profiles]
  )

  async function loadData() {
    setLoading(true)
    setError('')

    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('id, full_name, role, phone, created_at')
      .order('created_at', { ascending: false })

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    setProfiles((data || []) as ProfileRow[])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function makeAdmin() {
    setError('')
    setSuccess('')

    if (!selectedUserId) {
      setError('Pilih user yang akan dijadikan admin.')
      return
    }

    setSavingId(selectedUserId)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        updated_at: new Date().toISOString(),
      })
      .eq('id', selectedUserId)

    if (updateError) {
      setError(updateError.message)
      setSavingId('')
      return
    }

    await supabase.from('cbs_audit_logs').insert({
      action: 'MAKE_ADMIN',
      target_table: 'profiles',
      target_id: selectedUserId,
      detail: 'User dijadikan admin.',
    })

    setSelectedUserId('')
    setSavingId('')
    await loadData()
    setSuccess('User berhasil dijadikan admin.')
  }

  async function updateAdmin(
    admin: ProfileRow,
    fullName: string,
    phone: string
  ) {
    setError('')
    setSuccess('')

    if (!fullName.trim()) {
      setError('Nama admin wajib diisi.')
      return
    }

    setSavingId(admin.id)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: fullName.trim(),
        phone: phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.id)

    if (updateError) {
      setError(updateError.message)
      setSavingId('')
      return
    }

    await supabase.from('cbs_audit_logs').insert({
      action: 'UPDATE_ADMIN',
      target_table: 'profiles',
      target_id: admin.id,
      detail: `Memperbarui admin ${fullName.trim()}.`,
    })

    setSavingId('')
    await loadData()
    setSuccess('Data admin berhasil disimpan.')
  }

  async function removeAdmin(admin: ProfileRow) {
    const confirmed = window.confirm(
      `Turunkan ${admin.full_name || 'admin'} menjadi tentor?`
    )

    if (!confirmed) return

    setSavingId(admin.id)
    setError('')
    setSuccess('')

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'tentor',
        updated_at: new Date().toISOString(),
      })
      .eq('id', admin.id)

    if (updateError) {
      setError(updateError.message)
      setSavingId('')
      return
    }

    await supabase.from('cbs_audit_logs').insert({
      action: 'REMOVE_ADMIN',
      target_table: 'profiles',
      target_id: admin.id,
      detail: 'Admin diturunkan menjadi tentor.',
    })

    setSavingId('')
    await loadData()
    setSuccess('Role admin berhasil diturunkan menjadi tentor.')
  }

  return (
    <section className="mx-auto max-w-6xl space-y-8">
      <div className="py-4 text-center sm:py-8">
        <div className="mb-5 flex justify-center gap-2">
          <span className="h-1.5 w-10 rounded-full bg-[#EA4335]" />
          <span className="h-1.5 w-10 rounded-full bg-[#FABB05]" />
          <span className="h-1.5 w-10 rounded-full bg-[#34A853]" />
        </div>

        <p className="text-sm font-medium text-[#80868B]">
          Manajemen akses
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#202124]">
          Kelola admin
        </h1>

        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[#5F6368]">
          Tambahkan admin baru, perbarui informasi, atau turunkan hak akses
          admin.
        </p>
      </div>

      {error && (
        <AlertBox type="error" message={error} />
      )}

      {success && (
        <AlertBox type="success" message={success} />
      )}

      <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-7">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#EAF6ED] text-[#34A853]">
            <UserPlus className="h-5 w-5" />
          </div>

          <div>
            <h2 className="text-lg font-semibold text-[#202124]">
              Tambah admin
            </h2>
            <p className="mt-0.5 text-sm text-[#80868B]">
              Pilih akun yang sudah tersedia.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
              className="h-[52px] w-full appearance-none rounded-2xl border border-[#DADCE0] bg-white px-4 pr-11 text-sm text-[#202124] outline-none transition focus:border-[#34A853] focus:ring-4 focus:ring-[#34A853]/10"
            >
              <option value="">Pilih user</option>

              {candidates.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.full_name || 'Tanpa nama'} · {item.role || '-'}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#80868B]" />
          </div>

          <button
            type="button"
            onClick={makeAdmin}
            disabled={!selectedUserId || Boolean(savingId)}
            className="inline-flex h-[52px] items-center justify-center gap-2 rounded-2xl bg-[#34A853] px-6 text-sm font-semibold text-white transition hover:bg-[#2D9249] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {savingId === selectedUserId && selectedUserId ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}

            Jadikan admin
          </button>
        </div>
      </div>

      <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Administrator
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
              Daftar admin
            </h2>
          </div>

          <span className="w-fit rounded-full bg-[#F1F3F4] px-3 py-1.5 text-xs font-semibold text-[#5F6368]">
            {admins.length} admin
          </span>
        </div>

        <div className="relative mt-6">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9AA0A6]" />

          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Cari nama atau nomor HP..."
            className="h-[56px] w-full rounded-full border border-[#DADCE0] bg-white pl-13 pr-5 text-sm text-[#202124] outline-none transition focus:border-transparent focus:shadow-[0_2px_10px_rgba(60,64,67,0.18)]"
          />
        </div>

        <div className="mt-6">
          {loading ? (
            <LoadingState />
          ) : admins.length === 0 ? (
            <EmptyState message="Admin tidak ditemukan." />
          ) : (
            <div className="space-y-3">
              {admins.map((admin) => (
                <AdminCard
                  key={admin.id}
                  admin={admin}
                  saving={savingId === admin.id}
                  onSave={updateAdmin}
                  onRemove={removeAdmin}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function AdminCard({
  admin,
  saving,
  onSave,
  onRemove,
}: {
  admin: ProfileRow
  saving: boolean
  onSave: (
    admin: ProfileRow,
    fullName: string,
    phone: string
  ) => void
  onRemove: (admin: ProfileRow) => void
}) {
  const [fullName, setFullName] = useState(admin.full_name || '')
  const [phone, setPhone] = useState(admin.phone || '')

  return (
    <details className="group rounded-[22px] border border-[#E8EAED] bg-white">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FEF7E0] text-sm font-bold text-[#F9AB00]">
          {(admin.full_name || 'A').charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-[#202124]">
            {admin.full_name || 'Admin tanpa nama'}
          </p>
          <p className="mt-0.5 truncate text-sm text-[#80868B]">
            {admin.phone || 'Nomor HP belum diisi'}
          </p>
        </div>

        <span className="rounded-full bg-[#FEF7E0] px-3 py-1 text-xs font-semibold text-[#B06000]">
          Admin
        </span>

        <ChevronDown className="h-5 w-5 text-[#9AA0A6] transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#ECEFF1] p-5">
        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Nama admin"
            value={fullName}
            onChange={setFullName}
            placeholder="Nama lengkap"
          />

          <InputField
            label="Nomor HP"
            value={phone}
            onChange={setPhone}
            placeholder="08xxxxxxxxxx"
          />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onRemove(admin)}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#FAD2CF] px-4 text-sm font-semibold text-[#C5221F] transition hover:bg-[#FEF1F0] disabled:opacity-50"
          >
            <UserMinus className="h-4 w-4" />
            Turunkan jadi tentor
          </button>

          <button
            type="button"
            onClick={() => onSave(admin, fullName, phone)}
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#202124] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Simpan
          </button>
        </div>
      </div>
    </details>
  )
}

function InputField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#5F6368]">{label}</span>

      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-[50px] w-full rounded-2xl border border-[#DADCE0] bg-white px-4 text-sm text-[#202124] outline-none transition focus:border-[#34A853] focus:ring-4 focus:ring-[#34A853]/10"
      />
    </label>
  )
}

function AlertBox({
  type,
  message,
}: {
  type: 'error' | 'success'
  message: string
}) {
  const success = type === 'success'

  return (
    <div
      className={[
        'flex items-start gap-3 rounded-2xl border p-4 text-sm font-medium',
        success
          ? 'border-[#CEEAD6] bg-[#EAF6ED] text-[#137333]'
          : 'border-[#FAD2CF] bg-[#FEF1F0] text-[#C5221F]',
      ].join(' ')}
    >
      {success ? (
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
      ) : (
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
      )}

      {message}
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F8F9FA] p-8 text-sm text-[#5F6368]">
      <Loader2 className="h-5 w-5 animate-spin" />
      Memuat data admin...
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl bg-[#F8F9FA] p-8 text-center">
      <ShieldCheck className="mx-auto h-7 w-7 text-[#9AA0A6]" />
      <p className="mt-3 text-sm text-[#80868B]">{message}</p>
    </div>
  )
}