'use client'

import { useCallback, useMemo, useState, useEffect, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Mail,
  Phone,
  Plus,
  RefreshCcw,
  Save,
  Settings,
  ShieldCheck,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react'

type ProfileRow = {
  id: string
  full_name: string
  role: string
  phone: string | null
}

type BusinessSettings = {
  name: string
  address: string
  phone: string
  email: string
  logo_url: string
}

type TentorMember = {
  id: string
  nama: string
  phone: string | null
  email: string | null
  mapel: string | null
  aktif: boolean
  catatan: string | null
  created_at: string
  updated_at: string
}

type TentorForm = {
  nama: string
  phone: string
  email: string
  mapel: string
  catatan: string
}

type MessageType = 'success' | 'error' | 'info'

const defaultBusinessSettings: BusinessSettings = {
  name: 'Bimbingan Belajar CBS Salaman',
  address: 'Jl. Diponegoro No. 28 Gadean Salaman, Magelang',
  phone: '0813-9219-2401',
  email: 'bimbinganbelajarbcssalaman@gmail.com',
  logo_url: '/images/logo bimbel.jpg',
}

const emptyTentorForm: TentorForm = {
  nama: '',
  phone: '',
  email: '',
  mapel: '',
  catatan: '',
}

function normalizeBusinessSettings(value: unknown): BusinessSettings {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return defaultBusinessSettings
  }

  const raw = value as Partial<BusinessSettings>

  return {
    name: typeof raw.name === 'string' && raw.name.trim()
      ? raw.name
      : defaultBusinessSettings.name,
    address: typeof raw.address === 'string'
      ? raw.address
      : defaultBusinessSettings.address,
    phone: typeof raw.phone === 'string'
      ? raw.phone
      : defaultBusinessSettings.phone,
    email: typeof raw.email === 'string'
      ? raw.email
      : defaultBusinessSettings.email,
    logo_url: typeof raw.logo_url === 'string' && raw.logo_url.trim()
      ? raw.logo_url
      : defaultBusinessSettings.logo_url,
  }
}

function isValidEmail(value: string) {
  if (!value.trim()) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export default function AdminSettingsPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<MessageType>('info')

  const [userEmail, setUserEmail] = useState('')
  const [profile, setProfile] = useState<ProfileRow | null>(null)

  const [adminName, setAdminName] = useState('')
  const [adminPhone, setAdminPhone] = useState('')

  const [business, setBusiness] = useState<BusinessSettings>(
    defaultBusinessSettings
  )

  const [tentors, setTentors] = useState<TentorMember[]>([])
  const [tentorForm, setTentorForm] = useState<TentorForm>(emptyTentorForm)
  const [editingTentorId, setEditingTentorId] = useState<string | null>(null)

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const activeTentors = useMemo(() => {
    return tentors.filter((tentor) => tentor.aktif).length
  }, [tentors])

  const inactiveTentors = useMemo(() => {
    return tentors.filter((tentor) => !tentor.aktif).length
  }, [tentors])

  const showMessage = useCallback(
    (text: string, type: MessageType = 'info') => {
      setMessage(text)
      setMessageType(type)
    },
    []
  )

  const getCurrentUser = useCallback(async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw new Error(error.message)
    }

    return user
  }, [supabase])

  const loadData = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false

      if (!silent) {
        setLoading(true)
        setMessage('')
      }

      try {
        const user = await getCurrentUser()

        if (!user) {
          showMessage('User belum login.', 'error')
          return
        }

        setUserEmail(user.email || '')

        const [profileRes, settingsRes, tentorRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, role, phone')
            .eq('id', user.id)
            .single(),

          supabase.from('app_settings').select('key, value'),

          supabase
            .from('tentor_members')
            .select(
              'id, nama, phone, email, mapel, aktif, catatan, created_at, updated_at'
            )
            .order('created_at', { ascending: false }),
        ])

        const errors: string[] = []

        if (profileRes.error) {
          errors.push(`Profil: ${profileRes.error.message}`)
        } else if (profileRes.data) {
          const profileData = profileRes.data as ProfileRow
          setProfile(profileData)
          setAdminName(profileData.full_name || '')
          setAdminPhone(profileData.phone || '')
        }

        if (settingsRes.error) {
          errors.push(`Pengaturan bimbel: ${settingsRes.error.message}`)
        } else {
          const rows = settingsRes.data || []
          const businessRow = rows.find((row) => row.key === 'business')
          setBusiness(normalizeBusinessSettings(businessRow?.value))
        }

        if (tentorRes.error) {
          errors.push(`Tentor: ${tentorRes.error.message}`)
        } else {
          setTentors((tentorRes.data || []) as TentorMember[])
        }

        if (errors.length > 0) {
          showMessage(errors.join(' | '), 'error')
        }
      } catch (error) {
        showMessage(
          error instanceof Error ? error.message : 'Gagal memuat data.',
          'error'
        )
      } finally {
        if (!silent) {
          setLoading(false)
        }
      }
    },
    [getCurrentUser, showMessage, supabase]
  )

  useEffect(() => {
    void loadData()
  }, [loadData])

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!adminName.trim()) {
      showMessage('Nama admin wajib diisi.', 'error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const user = await getCurrentUser()

      if (!user) {
        showMessage('User belum login.', 'error')
        return
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: adminName.trim(),
          phone: adminPhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw new Error(error.message)

      await loadData({ silent: true })
      showMessage('Profil admin berhasil disimpan.', 'success')
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Gagal menyimpan profil.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveBusinessSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!business.name.trim()) {
      showMessage('Nama bimbel wajib diisi.', 'error')
      return
    }

    if (business.email && !isValidEmail(business.email)) {
      showMessage('Format email bimbel tidak valid.', 'error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const user = await getCurrentUser()

      if (!user) {
        showMessage('User belum login.', 'error')
        return
      }

      const payload: BusinessSettings = {
        name: business.name.trim(),
        address: business.address.trim(),
        phone: business.phone.trim(),
        email: business.email.trim(),
        logo_url:
          business.logo_url.trim() || defaultBusinessSettings.logo_url,
      }

      const { error } = await supabase.from('app_settings').upsert(
        {
          key: 'business',
          value: payload,
          updated_by: user.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )

      if (error) throw new Error(error.message)

      setBusiness(payload)
      await loadData({ silent: true })
      showMessage('Pengaturan bimbel berhasil disimpan.', 'success')
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : 'Gagal menyimpan pengaturan bimbel.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  async function saveTentor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (!tentorForm.nama.trim()) {
      showMessage('Nama tentor wajib diisi.', 'error')
      return
    }

    if (!isValidEmail(tentorForm.email)) {
      showMessage('Format email tentor tidak valid.', 'error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const payload = {
        nama: tentorForm.nama.trim(),
        phone: tentorForm.phone.trim() || null,
        email: tentorForm.email.trim() || null,
        mapel: tentorForm.mapel.trim() || null,
        catatan: tentorForm.catatan.trim() || null,
        updated_at: new Date().toISOString(),
      }

      if (editingTentorId) {
        const { error } = await supabase
          .from('tentor_members')
          .update(payload)
          .eq('id', editingTentorId)

        if (error) throw new Error(error.message)

        setTentorForm(emptyTentorForm)
        setEditingTentorId(null)
        await loadData({ silent: true })
        showMessage('Data tentor berhasil diperbarui.', 'success')
      } else {
        const { error } = await supabase.from('tentor_members').insert({
          ...payload,
          aktif: true,
        })

        if (error) throw new Error(error.message)

        setTentorForm(emptyTentorForm)
        await loadData({ silent: true })
        showMessage('Tentor baru berhasil ditambahkan.', 'success')
      }
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Gagal menyimpan tentor.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  function startEditTentor(tentor: TentorMember) {
    setEditingTentorId(tentor.id)
    setTentorForm({
      nama: tentor.nama || '',
      phone: tentor.phone || '',
      email: tentor.email || '',
      mapel: tentor.mapel || '',
      catatan: tentor.catatan || '',
    })
    setMessage('')

    requestAnimationFrame(() => {
      document
        .getElementById('form-tentor')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function cancelEditTentor() {
    setEditingTentorId(null)
    setTentorForm(emptyTentorForm)
    setMessage('')
  }

  async function toggleTentor(tentor: TentorMember) {
    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('tentor_members')
        .update({
          aktif: !tentor.aktif,
          updated_at: new Date().toISOString(),
        })
        .eq('id', tentor.id)

      if (error) throw new Error(error.message)

      await loadData({ silent: true })
      showMessage(
        tentor.aktif
          ? 'Tentor berhasil dinonaktifkan.'
          : 'Tentor berhasil diaktifkan.',
        'success'
      )
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Gagal mengubah status tentor.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  async function deleteTentor(tentor: TentorMember) {
    const confirmDelete = window.confirm(
      `Hapus tentor "${tentor.nama}"? Data ini akan hilang dari daftar tentor.`
    )

    if (!confirmDelete) return

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase
        .from('tentor_members')
        .delete()
        .eq('id', tentor.id)

      if (error) throw new Error(error.message)

      if (editingTentorId === tentor.id) {
        setEditingTentorId(null)
        setTentorForm(emptyTentorForm)
      }

      await loadData({ silent: true })
      showMessage('Tentor berhasil dihapus.', 'success')
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Gagal menghapus tentor.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  async function changePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    if (newPassword.length < 8) {
      showMessage('Password minimal 8 karakter.', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      showMessage('Konfirmasi password tidak sama.', 'error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      })

      if (error) throw new Error(error.message)

      setNewPassword('')
      setConfirmPassword('')
      showMessage('Password admin berhasil diperbarui.', 'success')
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : 'Gagal memperbarui password.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  function resetLocalCache() {
    const confirmReset = window.confirm(
      'Hapus cache lokal browser? Data database tidak akan terhapus.'
    )

    if (!confirmReset) return

    localStorage.clear()
    sessionStorage.clear()
    showMessage('Cache lokal browser berhasil dihapus.', 'success')
  }

  async function resetAllAppData() {
    const confirm1 = window.confirm(
      'PERINGATAN: Data operasional akan dihapus. Data siswa dan akun user tidak dihapus. Lanjutkan?'
    )

    if (!confirm1) return

    const confirm2 = window.confirm(
      'Data yang sudah dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?'
    )

    if (!confirm2) return

    const typed = window.prompt('Ketik RESET SEMUA DATA untuk melanjutkan.')

    if (typed !== 'RESET SEMUA DATA') {
      showMessage('Reset dibatalkan. Teks konfirmasi tidak sesuai.', 'info')
      return
    }

    setSaving(true)
    showMessage('Sedang menghapus data operasional...', 'info')

    try {
      const { error } = await supabase.rpc('reset_all_app_data')

      if (error) {
        throw new Error(
          `RPC reset_all_app_data gagal: ${error.message}`
        )
      }

      setTentors([])
      setTentorForm(emptyTentorForm)
      setEditingTentorId(null)
      setBusiness(defaultBusinessSettings)

      localStorage.clear()
      sessionStorage.clear()

      await loadData({ silent: true })
      showMessage(
        'Data operasional berhasil direset. Data siswa dan akun tetap aman.',
        'success'
      )
    } catch (error) {
      showMessage(
        error instanceof Error
          ? error.message
          : 'Gagal mereset data operasional.',
        'error'
      )
    } finally {
      setSaving(false)
    }
  }

  const logoPreview = business.logo_url.trim() || defaultBusinessSettings.logo_url

  return (
    <main className="min-h-screen bg-[#F5F7FA] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
      <div className="mx-auto w-full max-w-[1280px] space-y-5">
        <section className="overflow-hidden rounded-3xl border border-[#DDE7E2] bg-[#0B513B] shadow-[0_10px_30px_rgba(15,61,46,0.08)]">
          <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-white">
                <Settings className="h-5 w-5" />
              </div>

              <h1 className="mt-5 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-[34px]">
                Pengaturan
              </h1>

              <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                Kelola profil admin, data bimbel, tentor, dan keamanan akun.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading || saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Muat Ulang
            </button>
          </div>
        </section>

        {message && (
          <div
            role="status"
            className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
              messageType === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : messageType === 'error'
                  ? 'border-red-200 bg-red-50 text-red-700'
                  : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {message}
          </div>
        )}

        <section className="grid gap-3 md:grid-cols-3">
          <MiniStatCard
            title="Login Admin"
            value={userEmail || '-'}
            desc={profile?.role ? `Role: ${profile.role}` : 'Akun aktif'}
            icon={<ShieldCheck className="h-5 w-5" />}
            iconClassName="bg-blue-50 text-blue-700"
          />

          <MiniStatCard
            title="Tentor Aktif"
            value={`${activeTentors}`}
            desc={`${tentors.length} total tentor`}
            icon={<UsersRound className="h-5 w-5" />}
            iconClassName="bg-emerald-50 text-emerald-700"
          />

          <MiniStatCard
            title="Tentor Nonaktif"
            value={`${inactiveTentors}`}
            desc="Tidak tersedia untuk operasional aktif"
            icon={<BookOpen className="h-5 w-5" />}
            iconClassName="bg-amber-50 text-amber-700"
          />
        </section>

        <section className="grid items-start gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <SettingsCard
              title="Profil Admin"
              desc="Informasi akun admin yang sedang digunakan."
              icon={<UserRound className="h-5 w-5" />}
              iconClassName="bg-blue-50 text-blue-700"
            >
              <form onSubmit={saveProfile} className="space-y-4">
                <Field label="Nama Admin">
                  <input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="input-style"
                    placeholder="Nama admin"
                    autoComplete="name"
                  />
                </Field>

                <Field label="Nomor HP">
                  <input
                    type="tel"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="input-style"
                    placeholder="08xxxxxxxxxx"
                    autoComplete="tel"
                  />
                </Field>

                <Field label="Email Login">
                  <div className="flex h-12 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-500">
                    <Mail className="h-4 w-4" />
                    <span className="truncate">{userEmail || '-'}</span>
                  </div>
                </Field>

                <SubmitButton loading={saving} text="Simpan Profil" />
              </form>
            </SettingsCard>

            <SettingsCard
              title="Pengaturan Bimbel"
              desc="Simpan identitas dan logo bimbel."
              icon={<Building2 className="h-5 w-5" />}
              iconClassName="bg-violet-50 text-violet-700"
            >
              <form onSubmit={saveBusinessSettings} className="space-y-4">
                <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoPreview}
                      alt="Logo bimbel"
                      className="h-full w-full object-cover"
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900">
                      Logo Bimbel
                    </p>
                    <p className="mt-1 truncate text-xs font-medium text-slate-500">
                      {logoPreview}
                    </p>
                  </div>
                </div>

                <Field label="Nama Bimbel">
                  <input
                    value={business.name}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="input-style"
                    placeholder="Nama bimbel"
                  />
                </Field>

                <Field label="Alamat">
                  <textarea
                    value={business.address}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                    className="textarea-style"
                    rows={3}
                    placeholder="Alamat bimbel"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nomor WhatsApp">
                    <input
                      type="tel"
                      value={business.phone}
                      onChange={(e) =>
                        setBusiness((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="input-style"
                      placeholder="08xxxxxxxxxx"
                    />
                  </Field>

                  <Field label="Email Bimbel">
                    <input
                      type="email"
                      value={business.email}
                      onChange={(e) =>
                        setBusiness((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="input-style"
                      placeholder="email@contoh.com"
                    />
                  </Field>
                </div>

                <Field label="Path / URL Logo">
                  <input
                    value={business.logo_url}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        logo_url: e.target.value,
                      }))
                    }
                    className="input-style"
                    placeholder="/images/logo bimbel.jpg"
                  />
                </Field>

                <SubmitButton
                  loading={saving}
                  text="Simpan Pengaturan Bimbel"
                />
              </form>
            </SettingsCard>

            <SettingsCard
              title="Keamanan Akun"
              desc="Ubah password admin langsung dari akun yang sedang login."
              icon={<KeyRound className="h-5 w-5" />}
              iconClassName="bg-amber-50 text-amber-700"
            >
              <form onSubmit={changePassword} className="space-y-4">
                <Field label="Password Baru">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="input-style pr-12"
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                <Field label="Ulangi Password Baru">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-style"
                    placeholder="Ulangi password"
                    autoComplete="new-password"
                  />
                </Field>

                <SubmitButton loading={saving} text="Ubah Password" />
              </form>
            </SettingsCard>

            <SettingsCard
              title="Reset Data"
              desc="Gunakan hanya saat memang diperlukan."
              icon={<AlertTriangle className="h-5 w-5" />}
              iconClassName="bg-red-50 text-red-700"
            >
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium leading-6 text-amber-800">
                Reset cache hanya menghapus data lokal di browser ini.
              </div>

              <button
                type="button"
                onClick={resetLocalCache}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white text-sm font-semibold text-amber-800 transition hover:bg-amber-50"
              >
                <RefreshCcw className="h-4 w-4" />
                Hapus Cache Lokal
              </button>

              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium leading-6 text-red-700">
                Reset data operasional memerlukan fungsi database
                <span className="font-bold"> reset_all_app_data</span> di Supabase.
                Data siswa dan akun user tidak boleh ikut terhapus.
              </div>

              <button
                type="button"
                onClick={resetAllAppData}
                disabled={saving}
                className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-red-600 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Reset Data Operasional
              </button>
            </SettingsCard>
          </div>

          <div className="space-y-5">
            <div id="form-tentor" className="scroll-mt-6">
              <SettingsCard
                title={editingTentorId ? 'Edit Tentor' : 'Tambah Tentor'}
                desc="Kelola data tentor yang digunakan dalam operasional bimbel."
                icon={<UsersRound className="h-5 w-5" />}
                iconClassName="bg-emerald-50 text-emerald-700"
              >
                <form onSubmit={saveTentor} className="space-y-4">
                  <Field label="Nama Tentor">
                    <input
                      value={tentorForm.nama}
                      onChange={(e) =>
                        setTentorForm((prev) => ({
                          ...prev,
                          nama: e.target.value,
                        }))
                      }
                      className="input-style"
                      placeholder="Nama tentor"
                    />
                  </Field>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Nomor HP">
                      <input
                        type="tel"
                        value={tentorForm.phone}
                        onChange={(e) =>
                          setTentorForm((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="input-style"
                        placeholder="08xxxxxxxxxx"
                      />
                    </Field>

                    <Field label="Email">
                      <input
                        type="email"
                        value={tentorForm.email}
                        onChange={(e) =>
                          setTentorForm((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="input-style"
                        placeholder="email@contoh.com"
                      />
                    </Field>
                  </div>

                  <Field label="Mapel / Keahlian">
                    <input
                      value={tentorForm.mapel}
                      onChange={(e) =>
                        setTentorForm((prev) => ({
                          ...prev,
                          mapel: e.target.value,
                        }))
                      }
                      className="input-style"
                      placeholder="Matematika, IPA, Bahasa Inggris"
                    />
                  </Field>

                  <Field label="Catatan">
                    <textarea
                      value={tentorForm.catatan}
                      onChange={(e) =>
                        setTentorForm((prev) => ({
                          ...prev,
                          catatan: e.target.value,
                        }))
                      }
                      className="textarea-style"
                      rows={3}
                      placeholder="Catatan internal admin"
                    />
                  </Field>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B513B] px-5 text-sm font-semibold text-white transition hover:bg-[#094832] disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : editingTentorId ? (
                        <Save className="h-4 w-4" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}

                      {editingTentorId ? 'Simpan Perubahan' : 'Tambah Tentor'}
                    </button>

                    {editingTentorId && (
                      <button
                        type="button"
                        onClick={cancelEditTentor}
                        disabled={saving}
                        className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                      >
                        <X className="h-4 w-4" />
                        Batal
                      </button>
                    )}
                  </div>
                </form>
              </SettingsCard>
            </div>

            <SettingsCard
              title="Daftar Tentor"
              desc="Edit, aktifkan, nonaktifkan, atau hapus data tentor."
              icon={<BookOpen className="h-5 w-5" />}
              iconClassName="bg-cyan-50 text-cyan-700"
            >
              <div className="space-y-3">
                {loading ? (
                  <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-50">
                    <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                  </div>
                ) : tentors.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm font-semibold text-slate-500">
                    Belum ada data tentor.
                  </div>
                ) : (
                  tentors.map((tentor) => (
                    <div
                      key={tentor.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-[#0B513B] ring-1 ring-slate-200">
                              {getInitials(tentor.nama)}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900 sm:text-[15px]">
                                {tentor.nama}
                              </p>

                              <div className="mt-1.5 flex flex-wrap gap-2">
                                <span
                                  className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                                    tentor.aktif
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-slate-200/70 text-slate-600'
                                  }`}
                                >
                                  {tentor.aktif ? 'Aktif' : 'Nonaktif'}
                                </span>

                                {tentor.mapel && (
                                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                    {tentor.mapel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 text-sm font-medium text-slate-500 md:grid-cols-2">
                            <p className="inline-flex min-w-0 items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0 text-slate-400" />
                              <span className="truncate">{tentor.phone || '-'}</span>
                            </p>

                            <p className="inline-flex min-w-0 items-center gap-2">
                              <Mail className="h-4 w-4 shrink-0 text-slate-400" />
                              <span className="truncate">{tentor.email || '-'}</span>
                            </p>
                          </div>

                          {tentor.catatan && (
                            <p className="mt-3 rounded-xl border border-slate-200 bg-white p-3 text-sm font-medium leading-6 text-slate-600">
                              {tentor.catatan}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditTentor(tentor)}
                            disabled={saving}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => void toggleTentor(tentor)}
                            disabled={saving}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#0B513B] transition hover:bg-[#F1F8F4] disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {tentor.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>

                          <button
                            type="button"
                            onClick={() => void deleteTentor(tentor)}
                            disabled={saving}
                            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Hapus
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </SettingsCard>
          </div>
        </section>
      </div>

      <style jsx global>{`
        .input-style {
          height: 3rem;
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .input-style::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .input-style:focus {
          border-color: #0b513b;
          box-shadow: 0 0 0 3px rgba(11, 81, 59, 0.1);
        }

        .textarea-style {
          width: 100%;
          resize: vertical;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 0.85rem 1rem;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .textarea-style::placeholder {
          color: #94a3b8;
          font-weight: 500;
        }

        .textarea-style:focus {
          border-color: #0b513b;
          box-shadow: 0 0 0 3px rgba(11, 81, 59, 0.1);
        }
      `}</style>
    </main>
  )
}

function getInitials(name?: string | null) {
  if (!name) return 'TN'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function SettingsCard({
  title,
  desc,
  icon,
  iconClassName,
  children,
}: {
  title: string
  desc: string
  icon: ReactNode
  iconClassName: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <p className="mt-1 text-sm font-medium leading-5 text-slate-500">
            {desc}
          </p>
        </div>
      </div>

      {children}
    </section>
  )
}

function MiniStatCard({
  title,
  value,
  desc,
  icon,
  iconClassName,
}: {
  title: string
  value: string
  desc: string
  icon: ReactNode
  iconClassName: string
}) {
  return (
    <div className="min-h-[140px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 truncate text-xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-1.5 text-xs font-medium leading-5 text-slate-500">
            {desc}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
        >
          {icon}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-slate-500">
        {label}
      </label>
      {children}
    </div>
  )
}

function SubmitButton({
  loading,
  text,
}: {
  loading: boolean
  text: string
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0B513B] px-5 text-sm font-semibold text-white transition hover:bg-[#094832] disabled:cursor-not-allowed disabled:bg-slate-300"
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Save className="h-4 w-4" />
      )}
      {text}
    </button>
  )
}
