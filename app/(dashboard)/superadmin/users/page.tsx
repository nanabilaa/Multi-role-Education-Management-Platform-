'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Link2,
  Loader2,
  Mic2,
  Save,
  Search,
  Trash2,
  UserPlus,
  UsersRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Role = 'superadmin' | 'admin' | 'tentor' | 'ortu'

type ProfileRow = {
  id: string
  full_name: string | null
  role: Role | null
  phone: string | null
  email: string | null
  login_code: string | null
  created_at: string | null
}

type SiswaRow = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
  ortu_id: string | null
  aktif: boolean | null
}

type CreateUserForm = {
  email: string
  password: string
  fullName: string
  phone: string
  loginCode: string
  role: Role
  siswaId: string
}

const roles: Role[] = ['superadmin', 'admin', 'tentor', 'ortu']

const roleLabels: Record<Role, string> = {
  superadmin: 'Superadmin',
  admin: 'Admin',
  tentor: 'Tentor',
  ortu: 'Orang Tua',
}

const roleStyles: Record<
  Role,
  {
    badge: string
    avatar: string
    dot: string
  }
> = {
  superadmin: {
    badge: 'bg-[#FEF1F0] text-[#C5221F]',
    avatar: 'bg-[#FEF1F0] text-[#EA4335]',
    dot: 'bg-[#EA4335]',
  },
  admin: {
    badge: 'bg-[#FEF7E0] text-[#B06000]',
    avatar: 'bg-[#FEF7E0] text-[#F9AB00]',
    dot: 'bg-[#FABB05]',
  },
  tentor: {
    badge: 'bg-[#EAF6ED] text-[#137333]',
    avatar: 'bg-[#EAF6ED] text-[#34A853]',
    dot: 'bg-[#34A853]',
  },
  ortu: {
    badge: 'bg-[#F1F3F4] text-[#5F6368]',
    avatar: 'bg-[#F1F3F4] text-[#5F6368]',
    dot: 'bg-[#9AA0A6]',
  },
}

function normalizeLoginCode(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
}

function makeSuggestedLoginCode(name: string, role: Role) {
  const cleanName = normalizeLoginCode(name)

  if (cleanName) {
    return cleanName
  }

  return `${role}-user`
}

function openPanel(id: string) {
  const element = document.getElementById(id)

  if (element instanceof HTMLDetailsElement) {
    element.open = true
    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }
}

export default function SuperadminUsersPage() {
  const supabase = createClient()

  const [currentUserId, setCurrentUserId] = useState('')
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [savingId, setSavingId] = useState('')
  const [deletingId, setDeletingId] = useState('')

  const [profiles, setProfiles] = useState<ProfileRow[]>([])
  const [siswa, setSiswa] = useState<SiswaRow[]>([])

  const [filterRole, setFilterRole] = useState<'all' | Role>('all')
  const [search, setSearch] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loginCodeTouched, setLoginCodeTouched] = useState(false)

  const [createForm, setCreateForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    loginCode: '',
    role: 'ortu',
    siswaId: '',
  })

  const filteredProfiles = useMemo(() => {
    const keyword = search.toLowerCase().trim()

    return profiles.filter((item) => {
      const matchRole =
        filterRole === 'all' || item.role === filterRole

      const matchSearch =
        !keyword ||
        item.full_name?.toLowerCase().includes(keyword) ||
        item.phone?.toLowerCase().includes(keyword) ||
        item.email?.toLowerCase().includes(keyword) ||
        item.login_code?.toLowerCase().includes(keyword) ||
        item.role?.toLowerCase().includes(keyword)

      return matchRole && matchSearch
    })
  }, [profiles, filterRole, search])

  const ortuList = useMemo(() => {
    return profiles.filter((item) => item.role === 'ortu')
  }, [profiles])

  const siswaBelumAdaOrtu = useMemo(() => {
    return siswa.filter((item) => !item.ortu_id)
  }, [siswa])

  const totalSuperadmin = useMemo(() => {
    return profiles.filter((item) => item.role === 'superadmin').length
  }, [profiles])

  const totalAdmin = useMemo(() => {
    return profiles.filter((item) => item.role === 'admin').length
  }, [profiles])

  const totalTentor = useMemo(() => {
    return profiles.filter((item) => item.role === 'tentor').length
  }, [profiles])

  const totalOrtu = useMemo(() => {
    return profiles.filter((item) => item.role === 'ortu').length
  }, [profiles])

  function updateCreateForm<K extends keyof CreateUserForm>(
    key: K,
    value: CreateUserForm[K]
  ) {
    setCreateForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  function clearMessages() {
    setError('')
    setSuccess('')
  }

  async function writeAudit({
    action,
    targetTable,
    targetId,
    detail,
  }: {
    action: string
    targetTable: string
    targetId: string
    detail: string
  }) {
    const { error: auditError } = await supabase
      .from('cbs_audit_logs')
      .insert({
        actor_id: currentUserId || null,
        action,
        target_table: targetTable,
        target_id: targetId,
        detail,
      })

    if (auditError) {
      console.log('AUDIT ERROR:', auditError)
    }
  }

  async function loadData() {
    setLoading(true)

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.log(authError)
      setError(authError.message)
      setLoading(false)
      return
    }

    setCurrentUserId(user?.id || '')

    const [
      {
        data: profileData,
        error: profileError,
      },
      {
        data: siswaData,
        error: siswaError,
      },
    ] = await Promise.all([
      supabase
        .from('profiles')
        .select(
          'id, full_name, role, phone, email, login_code, created_at'
        )
        .order('created_at', {
          ascending: false,
        }),

      supabase
        .from('siswa')
        .select(
          'id, nama, kelas, sekolah, ortu_id, aktif'
        )
        .order('nama', {
          ascending: true,
        }),
    ])

    if (profileError) {
      console.log(profileError)
      setError(profileError.message)
      setLoading(false)
      return
    }

    if (siswaError) {
      console.log(siswaError)
      setError(siswaError.message)
      setLoading(false)
      return
    }

    setProfiles((profileData || []) as ProfileRow[])
    setSiswa((siswaData || []) as SiswaRow[])
    setLoading(false)
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const query = params.get('q')

    if (query) {
      setSearch(query)
    }

    loadData()

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function saveLoginCode(
    userId: string,
    loginCode: string
  ) {
    const cleanCode = normalizeLoginCode(loginCode)

    const { error: loginCodeError } = await supabase.rpc(
      'superadmin_set_profile_login_code',
      {
        target_user_id: userId,
        new_login_code: cleanCode,
      }
    )

    return loginCodeError
  }

  async function createUser() {
    clearMessages()

    const cleanEmail = createForm.email.trim()
    const cleanFullName = createForm.fullName.trim()
    const cleanPhone = createForm.phone.trim()
    const cleanLoginCode = normalizeLoginCode(
      createForm.loginCode
    )

    if (!cleanFullName) {
      setError('Nama lengkap wajib diisi.')
      return
    }

    if (!cleanLoginCode) {
      setError('ID Login wajib diisi.')
      return
    }

    if (!cleanEmail) {
      setError('Email wajib diisi untuk membuat akun Auth.')
      return
    }

    if (!createForm.password.trim()) {
      setError('Password wajib diisi.')
      return
    }

    if (createForm.password.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    const duplicateLoginCode = profiles.find(
      (item) =>
        normalizeLoginCode(item.login_code || '') ===
        cleanLoginCode
    )

    if (duplicateLoginCode) {
      setError('ID Login sudah dipakai user lain.')
      return
    }

    setCreating(true)

    const {
      data: newUserId,
      error: rpcError,
    } = await supabase.rpc('create_cbs_auth_user', {
      user_email: cleanEmail,
      user_password: createForm.password,
      user_full_name: cleanFullName,
      user_role: createForm.role,
      user_phone: cleanPhone || null,
    })

    if (rpcError) {
      console.log(rpcError)
      setError(rpcError.message)
      setCreating(false)
      return
    }

    if (!newUserId) {
      setError(
        'Akun berhasil diproses, tetapi ID user baru tidak terbaca.'
      )
      setCreating(false)
      await loadData()
      return
    }

    const userId = String(newUserId)

    const loginCodeError = await saveLoginCode(
      userId,
      cleanLoginCode
    )

    if (loginCodeError) {
      console.log(loginCodeError)

      setError(
        `Akun berhasil dibuat, tetapi ID Login gagal disimpan: ${loginCodeError.message}`
      )

      setCreating(false)
      await loadData()
      return
    }

    if (
      createForm.role === 'ortu' &&
      createForm.siswaId
    ) {
      const { error: linkError } = await supabase
        .from('siswa')
        .update({
          ortu_id: userId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', createForm.siswaId)

      if (linkError) {
        console.log(linkError)

        setError(
          `Akun berhasil dibuat, tetapi relasi anak gagal: ${linkError.message}`
        )

        setCreating(false)
        await loadData()
        return
      }

      await writeAudit({
        action: 'CREATE_PARENT_AND_LINK_STUDENT',
        targetTable: 'siswa',
        targetId: createForm.siswaId,
        detail: `Membuat akun orang tua ${cleanFullName} dengan ID Login ${cleanLoginCode} dan menghubungkannya ke siswa.`,
      })
    } else {
      await writeAudit({
        action: 'CREATE_USER',
        targetTable: 'profiles',
        targetId: userId,
        detail: `Membuat akun ${cleanFullName} dengan role ${createForm.role} dan ID Login ${cleanLoginCode}.`,
      })
    }

    setCreateForm({
      email: '',
      password: '',
      fullName: '',
      phone: '',
      loginCode: '',
      role: 'ortu',
      siswaId: '',
    })

    setLoginCodeTouched(false)
    setCreating(false)

    await loadData()

    setSuccess(
      'Akun berhasil dibuat. User dapat masuk menggunakan ID Login.'
    )
  }

  async function updateUser(
    profile: ProfileRow,
    fullName: string,
    phone: string,
    loginCode: string,
    role: Role,
    password: string
  ) {
    clearMessages()

    const cleanFullName = fullName.trim()
    const cleanLoginCode = normalizeLoginCode(loginCode)

    if (!cleanFullName) {
      setError('Nama lengkap wajib diisi.')
      return
    }

    if (!cleanLoginCode) {
      setError('ID Login wajib diisi.')
      return
    }

    if (password.trim() && password.trim().length < 6) {
      setError('Password baru minimal 6 karakter.')
      return
    }

    const duplicateLoginCode = profiles.find(
      (item) =>
        item.id !== profile.id &&
        normalizeLoginCode(item.login_code || '') ===
          cleanLoginCode
    )

    if (duplicateLoginCode) {
      setError('ID Login sudah dipakai user lain.')
      return
    }

    setSavingId(profile.id)

    const {
      data,
      error: rpcError,
    } = await supabase.rpc('superadmin_update_cbs_user', {
      target_user_id: profile.id,
      new_full_name: cleanFullName,
      new_phone: phone.trim() || null,
      new_role: role,
      new_password: password.trim() || null,
    })

    if (rpcError) {
      console.log(rpcError)
      setError(rpcError.message)
      setSavingId('')
      return
    }

    const loginCodeError = await saveLoginCode(
      profile.id,
      cleanLoginCode
    )

    if (loginCodeError) {
      console.log(loginCodeError)

      setError(
        `User berhasil diperbarui, tetapi ID Login gagal disimpan: ${loginCodeError.message}`
      )

      setSavingId('')
      await loadData()
      return
    }

    await writeAudit({
      action: 'UPDATE_USER',
      targetTable: 'profiles',
      targetId: profile.id,
      detail: `Memperbarui user ${cleanFullName}, role ${role}, dan ID Login ${cleanLoginCode}.`,
    })

    setSavingId('')

    await loadData()

    setSuccess(
      String(data || 'User berhasil diperbarui.')
    )
  }

  async function deleteUser(profile: ProfileRow) {
    clearMessages()

    if (profile.id === currentUserId) {
      setError(
        'Akun yang sedang digunakan tidak boleh dihapus.'
      )
      return
    }

    const confirmOne = window.confirm(
      `Hapus akun ${profile.full_name || 'tanpa nama'}?`
    )

    if (!confirmOne) {
      return
    }

    const confirmTwo = window.confirm(
      'Akun Auth dan profile akan dihapus secara permanen. Lanjutkan?'
    )

    if (!confirmTwo) {
      return
    }

    setDeletingId(profile.id)

    const {
      data,
      error: rpcError,
    } = await supabase.rpc('superadmin_delete_cbs_user', {
      target_user_id: profile.id,
    })

    if (rpcError) {
      console.log(rpcError)
      setError(rpcError.message)
      setDeletingId('')
      return
    }

    setDeletingId('')

    await loadData()

    setSuccess(
      String(data || 'User berhasil dihapus.')
    )
  }

  async function linkOrtu(
    siswaId: string,
    ortuId: string
  ) {
    clearMessages()
    setSavingId(siswaId)

    const { error: updateError } = await supabase
      .from('siswa')
      .update({
        ortu_id: ortuId || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', siswaId)

    if (updateError) {
      console.log(updateError)
      setError(updateError.message)
      setSavingId('')
      return
    }

    await writeAudit({
      action: 'LINK_PARENT_STUDENT',
      targetTable: 'siswa',
      targetId: siswaId,
      detail: ortuId
        ? 'Orang tua dihubungkan ke siswa.'
        : 'Relasi orang tua dengan siswa dilepas.',
    })

    setSavingId('')

    await loadData()

    setSuccess('Relasi orang tua dan siswa berhasil disimpan.')
  }

  return (
    <section className="mx-auto max-w-7xl space-y-8">
      {/* Hero */}
      <div className="mx-auto max-w-4xl py-4 text-center sm:py-8">
        <div className="mb-6 flex justify-center gap-2">
          <span className="h-1.5 w-11 rounded-full bg-[#EA4335]" />
          <span className="h-1.5 w-11 rounded-full bg-[#FABB05]" />
          <span className="h-1.5 w-11 rounded-full bg-[#34A853]" />
        </div>

        <p className="text-sm font-medium text-[#80868B]">
          Direktori pengguna
        </p>

        <h1 className="mt-2 text-4xl font-semibold tracking-[-0.045em] text-[#202124] sm:text-5xl">
          Temukan pengguna
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#5F6368] sm:text-base">
          Cari akun berdasarkan nama, ID Login, email, nomor
          telepon, atau role.
        </p>

        <div className="mx-auto mt-8 max-w-3xl">
          <div className="flex items-center rounded-full border border-[#DADCE0] bg-white px-5 shadow-[0_2px_8px_rgba(60,64,67,0.14)] transition focus-within:border-transparent focus-within:shadow-[0_4px_18px_rgba(60,64,67,0.20)]">
            <Search className="h-5 w-5 shrink-0 text-[#9AA0A6]" />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari nama, ID Login, email, telepon, atau role..."
              className="h-[64px] min-w-0 flex-1 bg-transparent px-4 text-base text-[#202124] outline-none placeholder:text-[#9AA0A6]"
            />

            <button
              type="button"
              disabled
              title="Pencarian suara belum tersedia"
              className="flex h-10 w-10 shrink-0 cursor-default items-center justify-center rounded-full text-[#34A853]"
            >
              <Mic2 className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={() => openPanel('create-user')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F1F3F4] px-5 py-3 text-sm font-medium text-[#3C4043] transition hover:bg-[#E8EAED]"
            >
              <UserPlus className="h-4 w-4 text-[#34A853]" />
              Buat akun
            </button>

            <button
              type="button"
              onClick={() => openPanel('parent-relations')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#F1F3F4] px-5 py-3 text-sm font-medium text-[#3C4043] transition hover:bg-[#E8EAED]"
            >
              <Link2 className="h-4 w-4 text-[#F9AB00]" />
              Relasi orang tua
            </button>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <AlertBox
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {success && (
        <AlertBox
          type="success"
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryItem
          label="Semua akun"
          value={profiles.length}
          color="#202124"
          background="#F1F3F4"
        />

        <SummaryItem
          label="Superadmin"
          value={totalSuperadmin}
          color="#EA4335"
          background="#FEF1F0"
        />

        <SummaryItem
          label="Admin"
          value={totalAdmin}
          color="#F9AB00"
          background="#FEF7E0"
        />

        <SummaryItem
          label="Tentor"
          value={totalTentor}
          color="#34A853"
          background="#EAF6ED"
        />

        <SummaryItem
          label="Orang Tua"
          value={totalOrtu}
          color="#5F6368"
          background="#F1F3F4"
        />
      </div>

      {/* Create user */}
      <details
        id="create-user"
        className="group scroll-mt-28 rounded-[28px] border border-[#E8EAED] bg-white"
      >
        <summary className="flex cursor-pointer list-none items-center gap-4 p-6 sm:p-7">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EAF6ED] text-[#34A853]">
            <UserPlus className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[#202124]">
              Buat akun baru
            </h2>

            <p className="mt-1 text-sm text-[#80868B]">
              Tambahkan akun superadmin, admin, tentor, atau
              orang tua.
            </p>
          </div>

          <ChevronDown className="h-5 w-5 shrink-0 text-[#9AA0A6] transition group-open:rotate-180" />
        </summary>

        <div className="border-t border-[#ECEFF1] p-6 sm:p-7">
          <div className="grid gap-7 xl:grid-cols-[1fr_310px]">
            <div className="grid gap-5 md:grid-cols-2">
              <InputField
                label="Nama lengkap"
                value={createForm.fullName}
                placeholder="Contoh: Orang Tua Alya"
                onChange={(value) => {
                  updateCreateForm('fullName', value)

                  if (!loginCodeTouched) {
                    updateCreateForm(
                      'loginCode',
                      makeSuggestedLoginCode(
                        value,
                        createForm.role
                      )
                    )
                  }
                }}
              />

              <InputField
                label="ID Login"
                value={createForm.loginCode}
                placeholder="ortu-alya"
                helper="Huruf kecil, angka, titik, garis bawah, atau tanda hubung."
                onChange={(value) => {
                  setLoginCodeTouched(true)

                  updateCreateForm(
                    'loginCode',
                    normalizeLoginCode(value)
                  )
                }}
              />

              <InputField
                label="Nomor HP"
                value={createForm.phone}
                placeholder="08xxxxxxxxxx"
                onChange={(value) =>
                  updateCreateForm('phone', value)
                }
              />

              <InputField
                label="Email Auth"
                type="email"
                value={createForm.email}
                placeholder="ortu.alya@cbs.id"
                onChange={(value) =>
                  updateCreateForm('email', value)
                }
              />

              <InputField
                label="Password"
                type="password"
                value={createForm.password}
                placeholder="Minimal 6 karakter"
                onChange={(value) =>
                  updateCreateForm('password', value)
                }
              />

              <SelectField
                label="Role"
                value={createForm.role}
                onChange={(value) => {
                  const nextRole = value as Role

                  updateCreateForm('role', nextRole)

                  if (nextRole !== 'ortu') {
                    updateCreateForm('siswaId', '')
                  }

                  if (!loginCodeTouched) {
                    updateCreateForm(
                      'loginCode',
                      makeSuggestedLoginCode(
                        createForm.fullName,
                        nextRole
                      )
                    )
                  }
                }}
              >
                {roles.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </SelectField>

              <div className="md:col-span-2">
                <SelectField
                  label="Hubungkan ke siswa"
                  value={createForm.siswaId}
                  disabled={createForm.role !== 'ortu'}
                  helper={
                    createForm.role === 'ortu'
                      ? 'Opsional. Pilih anak yang akan dihubungkan dengan akun ini.'
                      : 'Relasi siswa hanya tersedia untuk role orang tua.'
                  }
                  onChange={(value) =>
                    updateCreateForm('siswaId', value)
                  }
                >
                  <option value="">
                    {createForm.role === 'ortu'
                      ? 'Belum dihubungkan ke siswa'
                      : 'Khusus role orang tua'}
                  </option>

                  {siswa.map((child) => (
                    <option
                      key={child.id}
                      value={child.id}
                    >
                      {child.nama} · {child.kelas || '-'} ·{' '}
                      {child.sekolah || '-'}
                      {child.ortu_id
                        ? ' · sudah memiliki orang tua'
                        : ''}
                    </option>
                  ))}
                </SelectField>
              </div>
            </div>

            <div className="rounded-[24px] bg-[#F8F9FA] p-5 sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
                Pratinjau akun
              </p>

              <div className="mt-6 flex items-center gap-3">
                <div
                  className={[
                    'flex h-12 w-12 items-center justify-center rounded-full text-base font-bold',
                    roleStyles[createForm.role].avatar,
                  ].join(' ')}
                >
                  {(createForm.fullName || 'U')
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#202124]">
                    {createForm.fullName || 'Nama pengguna'}
                  </p>

                  <span
                    className={[
                      'mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold',
                      roleStyles[createForm.role].badge,
                    ].join(' ')}
                  >
                    {roleLabels[createForm.role]}
                  </span>
                </div>
              </div>

              <div className="mt-6 rounded-2xl border border-[#E8EAED] bg-white p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
                  ID Login
                </p>

                <p className="mt-2 break-all text-base font-semibold text-[#202124]">
                  {createForm.loginCode || '-'}
                </p>
              </div>

              <p className="mt-4 text-xs leading-5 text-[#80868B]">
                Pengguna masuk memakai ID Login. Email tetap
                digunakan Supabase Auth di belakang layar.
              </p>

              <button
                type="button"
                onClick={createUser}
                disabled={creating}
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#34A853] px-5 text-sm font-semibold text-white transition hover:bg-[#2D9249] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Membuat akun...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    Buat akun
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </details>

      {/* User directory */}
      <div className="rounded-[28px] border border-[#E8EAED] bg-white p-6 sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9AA0A6]">
              Direktori akun
            </p>

            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em] text-[#202124]">
              Daftar pengguna
            </h2>

            <p className="mt-2 text-sm text-[#80868B]">
              {filteredProfiles.length} dari {profiles.length}{' '}
              akun ditampilkan.
            </p>
          </div>

          <div className="relative w-full lg:w-[220px]">
            <select
              value={filterRole}
              onChange={(event) =>
                setFilterRole(
                  event.target.value as 'all' | Role
                )
              }
              className="h-[48px] w-full appearance-none rounded-2xl border border-[#DADCE0] bg-white px-4 pr-11 text-sm text-[#202124] outline-none transition focus:border-[#34A853] focus:ring-4 focus:ring-[#34A853]/10"
            >
              <option value="all">Semua role</option>

              {roles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>

            <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#80868B]" />
          </div>
        </div>

        <div className="mt-7">
          {loading ? (
            <LoadingState message="Memuat data pengguna..." />
          ) : filteredProfiles.length === 0 ? (
            <EmptyState
              title="Pengguna tidak ditemukan"
              description="Coba gunakan kata kunci atau filter role yang berbeda."
            />
          ) : (
            <div className="space-y-3">
              {filteredProfiles.map((profile) => (
                <UserCrudCard
                  key={profile.id}
                  profile={profile}
                  saving={savingId === profile.id}
                  deleting={deletingId === profile.id}
                  isCurrentUser={
                    profile.id === currentUserId
                  }
                  onUpdate={updateUser}
                  onDelete={deleteUser}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Parent relations */}
      <details
        id="parent-relations"
        className="group scroll-mt-28 rounded-[28px] border border-[#E8EAED] bg-white"
      >
        <summary className="flex cursor-pointer list-none items-center gap-4 p-6 sm:p-7">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FEF7E0] text-[#F9AB00]">
            <Link2 className="h-5 w-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-[#202124]">
              Relasi orang tua dan siswa
            </h2>

            <p className="mt-1 text-sm text-[#80868B]">
              {siswaBelumAdaOrtu.length} siswa belum memiliki
              akun orang tua.
            </p>
          </div>

          <span className="hidden rounded-full bg-[#FEF7E0] px-3 py-1.5 text-xs font-semibold text-[#B06000] sm:inline-flex">
            {siswa.length} siswa
          </span>

          <ChevronDown className="h-5 w-5 shrink-0 text-[#9AA0A6] transition group-open:rotate-180" />
        </summary>

        <div className="border-t border-[#ECEFF1] p-6 sm:p-7">
          {loading ? (
            <LoadingState message="Memuat relasi siswa..." />
          ) : siswa.length === 0 ? (
            <EmptyState
              title="Belum ada siswa"
              description="Tambahkan data siswa terlebih dahulu dari halaman admin."
            />
          ) : (
            <div className="space-y-3">
              {siswa.map((child) => (
                <div
                  key={child.id}
                  className="grid gap-4 rounded-[22px] border border-[#E8EAED] p-5 lg:grid-cols-[1fr_330px_auto] lg:items-center"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div
                      className={[
                        'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                        child.ortu_id
                          ? 'bg-[#EAF6ED] text-[#34A853]'
                          : 'bg-[#FEF7E0] text-[#F9AB00]',
                      ].join(' ')}
                    >
                      {child.nama.charAt(0).toUpperCase()}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-[#202124]">
                        {child.nama}
                      </p>

                      <p className="mt-1 truncate text-sm text-[#80868B]">
                        {child.kelas || 'Kelas belum diisi'} ·{' '}
                        {child.sekolah ||
                          'Sekolah belum diisi'}
                      </p>
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      value={child.ortu_id || ''}
                      disabled={savingId === child.id}
                      onChange={(event) =>
                        linkOrtu(
                          child.id,
                          event.target.value
                        )
                      }
                      className="h-[48px] w-full appearance-none rounded-2xl border border-[#DADCE0] bg-white px-4 pr-11 text-sm text-[#202124] outline-none transition focus:border-[#F9AB00] focus:ring-4 focus:ring-[#F9AB00]/10 disabled:cursor-wait disabled:opacity-60"
                    >
                      <option value="">
                        Belum memiliki orang tua
                      </option>

                      {ortuList.map((ortu) => (
                        <option
                          key={ortu.id}
                          value={ortu.id}
                        >
                          {ortu.full_name ||
                            'Orang tua tanpa nama'}{' '}
                          · {ortu.login_code || 'tanpa ID'}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#80868B]" />
                  </div>

                  <div className="flex items-center justify-end">
                    {savingId === child.id ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#F1F3F4] px-3 py-1.5 text-xs font-semibold text-[#5F6368]">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Menyimpan
                      </span>
                    ) : child.ortu_id ? (
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF6ED] px-3 py-1.5 text-xs font-semibold text-[#137333]">
                        <span className="h-2 w-2 rounded-full bg-[#34A853]" />
                        Terhubung
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 rounded-full bg-[#FEF7E0] px-3 py-1.5 text-xs font-semibold text-[#B06000]">
                        <span className="h-2 w-2 rounded-full bg-[#FABB05]" />
                        Belum terhubung
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </details>
    </section>
  )
}

function UserCrudCard({
  profile,
  saving,
  deleting,
  isCurrentUser,
  onUpdate,
  onDelete,
}: {
  profile: ProfileRow
  saving: boolean
  deleting: boolean
  isCurrentUser: boolean
  onUpdate: (
    profile: ProfileRow,
    fullName: string,
    phone: string,
    loginCode: string,
    role: Role,
    password: string
  ) => void
  onDelete: (profile: ProfileRow) => void
}) {
  const initialRole = profile.role || 'ortu'
  const style = roleStyles[initialRole]

  const [fullName, setFullName] = useState(
    profile.full_name || ''
  )

  const [phone, setPhone] = useState(
    profile.phone || ''
  )

  const [loginCode, setLoginCode] = useState(
    profile.login_code || ''
  )

  const [role, setRole] = useState<Role>(
    initialRole
  )

  const [password, setPassword] = useState('')

  return (
    <details className="group rounded-[22px] border border-[#E8EAED] bg-white transition open:shadow-[0_6px_18px_rgba(60,64,67,0.08)]">
      <summary className="flex cursor-pointer list-none items-center gap-4 p-5">
        <div
          className={[
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold',
            style.avatar,
          ].join(' ')}
        >
          {(profile.full_name || 'U')
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-semibold text-[#202124]">
              {profile.full_name || 'Pengguna tanpa nama'}
            </p>

            {isCurrentUser && (
              <span className="rounded-full bg-[#EAF6ED] px-2 py-0.5 text-[10px] font-semibold text-[#137333]">
                Akun aktif
              </span>
            )}
          </div>

          <p className="mt-1 truncate text-sm text-[#80868B]">
            {profile.login_code || 'Tanpa ID Login'} ·{' '}
            {profile.email || 'Email belum tersedia'}
          </p>
        </div>

        <span
          className={[
            'hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex',
            style.badge,
          ].join(' ')}
        >
          {roleLabels[initialRole]}
        </span>

        <ChevronDown className="h-5 w-5 shrink-0 text-[#9AA0A6] transition group-open:rotate-180" />
      </summary>

      <div className="border-t border-[#ECEFF1] p-5 sm:p-6">
        <div className="mb-5 rounded-2xl bg-[#F8F9FA] p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9AA0A6]">
            Email Auth
          </p>

          <p className="mt-2 break-all text-sm font-medium text-[#3C4043]">
            {profile.email || '-'}
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <InputField
            label="Nama lengkap"
            value={fullName}
            onChange={setFullName}
            placeholder="Nama pengguna"
          />

          <InputField
            label="ID Login"
            value={loginCode}
            onChange={(value) =>
              setLoginCode(normalizeLoginCode(value))
            }
            placeholder="admin1 / tentor1 / ortu-alya"
          />

          <InputField
            label="Nomor HP"
            value={phone}
            onChange={setPhone}
            placeholder="08xxxxxxxxxx"
          />

          <SelectField
            label="Role"
            value={role}
            disabled={isCurrentUser}
            helper={
              isCurrentUser
                ? 'Role akun yang sedang digunakan dikunci untuk mencegah kehilangan akses.'
                : undefined
            }
            onChange={(value) =>
              setRole(value as Role)
            }
          >
            {roles.map((item) => (
              <option key={item} value={item}>
                {roleLabels[item]}
              </option>
            ))}
          </SelectField>

          <div className="md:col-span-2">
            <InputField
              label="Password baru"
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="Kosongkan jika password tidak diganti"
              helper="Password baru minimal 6 karakter."
            />
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onDelete(profile)}
            disabled={
              saving ||
              deleting ||
              isCurrentUser
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#FAD2CF] px-4 text-sm font-semibold text-[#C5221F] transition hover:bg-[#FEF1F0] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            Hapus akun
          </button>

          <button
            type="button"
            onClick={() =>
              onUpdate(
                profile,
                fullName,
                phone,
                loginCode,
                role,
                password
              )
            }
            disabled={saving || deleting}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#202124] px-5 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            Simpan perubahan
          </button>
        </div>

        {isCurrentUser && (
          <p className="mt-4 rounded-xl bg-[#FEF7E0] px-4 py-3 text-xs leading-5 text-[#B06000]">
            Akun yang sedang digunakan tidak dapat dihapus
            atau diubah role-nya.
          </p>
        )}
      </div>
    </details>
  )
}

function SummaryItem({
  label,
  value,
  color,
  background,
}: {
  label: string
  value: number
  color: string
  background: string
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
          <UsersRound className="h-5 w-5" />
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

function InputField({
  label,
  value,
  onChange,
  placeholder,
  helper,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  helper?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#5F6368]">
        {label}
      </span>

      <input
        type={type}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="mt-2 h-[50px] w-full rounded-2xl border border-[#DADCE0] bg-white px-4 text-sm text-[#202124] outline-none transition placeholder:text-[#9AA0A6] focus:border-[#34A853] focus:ring-4 focus:ring-[#34A853]/10"
      />

      {helper && (
        <span className="mt-2 block text-xs leading-5 text-[#9AA0A6]">
          {helper}
        </span>
      )}
    </label>
  )
}

function SelectField({
  label,
  value,
  onChange,
  children,
  helper,
  disabled = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  children: React.ReactNode
  helper?: string
  disabled?: boolean
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold text-[#5F6368]">
        {label}
      </span>

      <div className="relative mt-2">
        <select
          value={value}
          disabled={disabled}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className="h-[50px] w-full appearance-none rounded-2xl border border-[#DADCE0] bg-white px-4 pr-11 text-sm text-[#202124] outline-none transition focus:border-[#34A853] focus:ring-4 focus:ring-[#34A853]/10 disabled:cursor-not-allowed disabled:bg-[#F1F3F4] disabled:text-[#9AA0A6]"
        >
          {children}
        </select>

        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#80868B]" />
      </div>

      {helper && (
        <span className="mt-2 block text-xs leading-5 text-[#9AA0A6]">
          {helper}
        </span>
      )}
    </label>
  )
}

function AlertBox({
  type,
  message,
  onClose,
}: {
  type: 'error' | 'success'
  message: string
  onClose: () => void
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

      <p className="min-w-0 flex-1">{message}</p>

      <button
        type="button"
        onClick={onClose}
        className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold transition hover:bg-black/5"
      >
        Tutup
      </button>
    </div>
  )
}

function LoadingState({
  message,
}: {
  message: string
}) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl bg-[#F8F9FA] p-10 text-sm text-[#5F6368]">
      <Loader2 className="h-5 w-5 animate-spin" />
      {message}
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-2xl bg-[#F8F9FA] p-10 text-center">
      <UsersRound className="mx-auto h-8 w-8 text-[#9AA0A6]" />

      <p className="mt-4 font-semibold text-[#3C4043]">
        {title}
      </p>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#80868B]">
        {description}
      </p>
    </div>
  )
}