'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  AlertTriangle,
  BookOpen,
  Building2,
  CheckCircle2,
  Edit3,
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

const defaultBusinessSettings: BusinessSettings = {
  name: 'Bimbingan Belajar CBS Salaman',
  address: 'Jl. Diponegoro No. 28 Gadean Salaman, Magelang',
  phone: '0813-9219-2401',
  email: 'bimbinganbelajarbcssalaman@gmail.com',
  logo_url: '',
}

const emptyTentorForm: TentorForm = {
  nama: '',
  phone: '',
  email: '',
  mapel: '',
  catatan: '',
}

export default function AdminSettingsPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

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

  const activeTentors = useMemo(() => {
    return tentors.filter((tentor) => tentor.aktif).length
  }, [tentors])

  const inactiveTentors = useMemo(() => {
    return tentors.filter((tentor) => !tentor.aktif).length
  }, [tentors])

  async function getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    return user
  }

  async function loadData() {
    setLoading(true)
    setMessage('')

    const user = await getCurrentUser()

    if (!user) {
      setMessage('User belum login.')
      setLoading(false)
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

    if (profileRes.error) {
      setMessage(profileRes.error.message)
    } else {
      const profileData = profileRes.data as ProfileRow
      setProfile(profileData)
      setAdminName(profileData.full_name || '')
      setAdminPhone(profileData.phone || '')
    }

    if (settingsRes.error) {
      setMessage(settingsRes.error.message)
    } else {
      const rows = settingsRes.data || []
      const businessRow = rows.find((row) => row.key === 'business')

      setBusiness({
        ...defaultBusinessSettings,
        ...(businessRow?.value as Partial<BusinessSettings> | undefined),
      })
    }

    if (tentorRes.error) {
      setMessage(tentorRes.error.message)
    } else {
      setTentors((tentorRes.data || []) as TentorMember[])
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  async function saveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSaving(true)
    setMessage('')

    const user = await getCurrentUser()

    if (!user) {
      setMessage('User belum login.')
      setSaving(false)
      return
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: adminName,
        phone: adminPhone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Profil admin berhasil disimpan.')
    setSaving(false)
    await loadData()
  }

  async function saveBusinessSettings(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSaving(true)
    setMessage('')

    const user = await getCurrentUser()

    const { error } = await supabase.from('app_settings').upsert(
      {
        key: 'business',
        value: business,
        updated_by: user?.id ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    )

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage('Pengaturan bimbel berhasil disimpan.')
    setSaving(false)
    await loadData()
  }

  async function saveTentor(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setSaving(true)
    setMessage('')

    if (!tentorForm.nama.trim()) {
      setMessage('Nama tentor wajib diisi.')
      setSaving(false)
      return
    }

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

      if (error) {
        setMessage(error.message)
        setSaving(false)
        return
      }

      setMessage('Data tentor berhasil diperbarui.')
    } else {
      const { error } = await supabase.from('tentor_members').insert({
        ...payload,
        aktif: true,
      })

      if (error) {
        setMessage(error.message)
        setSaving(false)
        return
      }

      setMessage('Tentor baru berhasil ditambahkan.')
    }

    setTentorForm(emptyTentorForm)
    setEditingTentorId(null)
    setSaving(false)
    await loadData()
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

    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEditTentor() {
    setEditingTentorId(null)
    setTentorForm(emptyTentorForm)
    setMessage('')
  }

  async function toggleTentor(tentor: TentorMember) {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('tentor_members')
      .update({
        aktif: !tentor.aktif,
        updated_at: new Date().toISOString(),
      })
      .eq('id', tentor.id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage(
      tentor.aktif
        ? 'Tentor berhasil dinonaktifkan.'
        : 'Tentor berhasil diaktifkan.'
    )

    setSaving(false)
    await loadData()
  }

  async function deleteTentor(tentor: TentorMember) {
    const confirmDelete = window.confirm(
      `Hapus tentor "${tentor.nama}"? Data ini akan hilang dari daftar anggota tentor.`
    )

    if (!confirmDelete) return

    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('tentor_members')
      .delete()
      .eq('id', tentor.id)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    if (editingTentorId === tentor.id) {
      setEditingTentorId(null)
      setTentorForm(emptyTentorForm)
    }

    setMessage('Tentor berhasil dihapus.')
    setSaving(false)
    await loadData()
  }

  async function sendResetPasswordEmail() {
    setSaving(true)
    setMessage('')

    if (!userEmail) {
      setMessage('Email admin tidak ditemukan.')
      setSaving(false)
      return
    }

    const { error } = await supabase.auth.resetPasswordForEmail(userEmail)

    if (error) {
      setMessage(error.message)
      setSaving(false)
      return
    }

    setMessage(`Link reset password sudah dikirim ke ${userEmail}.`)
    setSaving(false)
  }

  function resetLocalCache() {
    const confirmReset = window.confirm(
      'Reset cache lokal browser? Ini tidak menghapus data database.'
    )

    if (!confirmReset) return

    localStorage.clear()
    sessionStorage.clear()
    setMessage('Cache lokal browser berhasil direset.')
  }

  async function resetAllAppData() {
    const confirm1 = window.confirm(
      'PERINGATAN BESAR! Ini akan menghapus data operasional: jadwal, jurnal, SPP, invoice, transaksi dana, honor, anggota tentor, dan pengaturan. Data siswa, akun admin, dan akun user TIDAK dihapus. Lanjutkan?'
    )

    if (!confirm1) return

    const confirm2 = window.confirm(
      'Konfirmasi ke-2: Data operasional yang sudah dihapus TIDAK BISA dikembalikan. Data siswa tetap aman. Kamu benar-benar yakin?'
    )

    if (!confirm2) return

    const confirm3 = window.confirm(
      'Konfirmasi terakhir: Setelah ini data operasional sistem akan kosong, tetapi data siswa tetap ada. Klik OK hanya kalau benar-benar yakin.'
    )

    if (!confirm3) return

    const typed = window.prompt('Ketik RESET SEMUA DATA untuk melanjutkan.')

    if (typed !== 'RESET SEMUA DATA') {
      setMessage('Reset dibatalkan. Teks konfirmasi tidak sesuai.')
      return
    }

    setSaving(true)
    setMessage('Sedang menghapus data operasional...')

    const { error } = await supabase.rpc('reset_all_app_data')

    if (error) {
      setMessage(`Gagal reset data operasional: ${error.message}`)
      setSaving(false)
      return
    }

    setTentors([])
    setTentorForm(emptyTentorForm)
    setEditingTentorId(null)
    setBusiness(defaultBusinessSettings)

    localStorage.clear()
    sessionStorage.clear()

    setMessage(
      'Data operasional berhasil direset. Data siswa, akun admin, dan akun user tetap aman.'
    )

    setSaving(false)
    await loadData()
  }

  return (
    <main className="min-h-screen bg-[#FAFBF7] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-7xl space-y-5">
        <section className="rounded-[32px] border border-[#E7EFE6] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F3F8F1] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-[#063D27]">
                <Settings className="h-4 w-4" />
                Admin · Pengaturan
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Settings Admin
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500 sm:text-base">
                Atur profil admin, identitas bimbel, anggota tentor, keamanan akun,
                dan reset data operasional tanpa menghapus data siswa.
              </p>
            </div>

            <button
              type="button"
              onClick={loadData}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-5 text-sm font-black text-[#063D27] transition hover:bg-[#EAF3E8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCcw className="h-4 w-4" />
              )}
              Refresh
            </button>
          </div>
        </section>

        {message && (
          <div className="rounded-[24px] border border-[#EFE6BF] bg-[#FFFBEA] px-5 py-4 text-sm font-black text-[#063D27]">
            {message}
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-3">
          <MiniStatCard
            title="Login Admin"
            value={userEmail || '-'}
            desc={profile?.role ? `Role: ${profile.role}` : 'Akun aktif'}
            icon={<ShieldCheck className="h-5 w-5" />}
          />

          <MiniStatCard
            title="Tentor Aktif"
            value={`${activeTentors}`}
            desc={`${tentors.length} total anggota tentor`}
            icon={<UsersRound className="h-5 w-5" />}
          />

          <MiniStatCard
            title="Tentor Nonaktif"
            value={`${inactiveTentors}`}
            desc="Tidak tampil sebagai tentor aktif"
            icon={<BookOpen className="h-5 w-5" />}
          />
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
          <div className="space-y-5">
            <SettingsCard
              title="Profil Admin"
              desc="Data ini dipakai untuk identitas admin yang sedang login."
              icon={<UserRound className="h-5 w-5" />}
            >
              <form onSubmit={saveProfile} className="space-y-4">
                <Field label="Nama Admin">
                  <input
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="input-style"
                    placeholder="Nama admin"
                  />
                </Field>

                <Field label="Nomor HP">
                  <input
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    className="input-style"
                    placeholder="Nomor HP admin"
                  />
                </Field>

                <Field label="Email Login">
                  <div className="flex h-12 items-center gap-2 rounded-full border border-[#E7EFE6] bg-[#F8FAF7] px-4 text-sm font-bold text-slate-500">
                    <Mail className="h-4 w-4" />
                    {userEmail || '-'}
                  </div>
                </Field>

                <SubmitButton loading={saving} text="Simpan Profil" />
              </form>
            </SettingsCard>

            <SettingsCard
              title="Pengaturan Bimbel"
              desc="Data ini nanti bisa dipakai untuk header invoice dan laporan."
              icon={<Building2 className="h-5 w-5" />}
            >
              <form onSubmit={saveBusinessSettings} className="space-y-4">
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
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nomor WhatsApp">
                    <input
                      value={business.phone}
                      onChange={(e) =>
                        setBusiness((prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                      className="input-style"
                    />
                  </Field>

                  <Field label="Email Bimbel">
                    <input
                      value={business.email}
                      onChange={(e) =>
                        setBusiness((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="input-style"
                    />
                  </Field>
                </div>

                <Field label="Logo URL Opsional">
                  <input
                    value={business.logo_url}
                    onChange={(e) =>
                      setBusiness((prev) => ({
                        ...prev,
                        logo_url: e.target.value,
                      }))
                    }
                    className="input-style"
                    placeholder="https://..."
                  />
                </Field>

                <SubmitButton loading={saving} text="Simpan Pengaturan Bimbel" />
              </form>
            </SettingsCard>

            <SettingsCard
              title="Keamanan Akun"
              desc="Kirim link reset password ke email admin."
              icon={<KeyRound className="h-5 w-5" />}
            >
              <div className="rounded-[22px] border border-[#E7EFE6] bg-[#FAFBF7] p-4">
                <p className="text-sm font-black text-[#063D27]">
                  Reset password akan dikirim ke:
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-500">
                  {userEmail || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={sendResetPasswordEmail}
                disabled={saving || !userEmail}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] text-sm font-black text-[#063D27] transition hover:bg-[#EAF3E8] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Mail className="h-4 w-4" />
                )}
                Kirim Link Reset Password
              </button>
            </SettingsCard>

            <SettingsCard
              title="Danger Zone"
              desc="Reset cache atau reset data operasional tanpa menghapus siswa."
              icon={<AlertTriangle className="h-5 w-5" />}
            >
              <div className="rounded-[22px] border border-[#EFE6BF] bg-[#FFFBEA] p-4 text-sm font-semibold leading-6 text-[#7A5C00]">
                Reset cache hanya membersihkan localStorage dan sessionStorage di browser ini.
                Data database tidak ikut terhapus.
              </div>

              <button
                type="button"
                onClick={resetLocalCache}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#EFE6BF] bg-[#FFFBEA] text-sm font-black text-[#7A5C00] transition hover:bg-[#FFF7D0]"
              >
                <RefreshCcw className="h-4 w-4" />
                Reset Cache Lokal
              </button>

              <div className="mt-5 rounded-[22px] border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
                Tombol di bawah ini akan menghapus data operasional seperti jadwal,
                jurnal, SPP, invoice, transaksi dana, honor, anggota tentor, dan pengaturan.
                Data siswa, akun admin, dan akun user tidak dihapus.
              </div>

              <button
                type="button"
                onClick={resetAllAppData}
                disabled={saving}
                className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-red-200 bg-red-600 text-sm font-black text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-slate-300"
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
            <SettingsCard
              title={editingTentorId ? 'Edit Anggota Tentor' : 'Tambah Anggota Tentor'}
              desc="Kelola data tentor untuk kebutuhan operasional bimbel."
              icon={<UsersRound className="h-5 w-5" />}
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
                    placeholder="Contoh: Bu Rani"
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Nomor HP">
                    <input
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

                  <Field label="Email Opsional">
                    <input
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
                    placeholder="Matematika, IPA, Bahasa Inggris..."
                  />
                </Field>

                <Field label="Catatan Opsional">
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
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-slate-300"
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
                      className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-5 text-sm font-black text-[#063D27] transition hover:bg-[#F3F8F1]"
                    >
                      <X className="h-4 w-4" />
                      Batal
                    </button>
                  )}
                </div>
              </form>
            </SettingsCard>

            <SettingsCard
              title="Daftar Anggota Tentor"
              desc="Data dibuat ringkas. Klik edit kalau mau mengubah data tentor."
              icon={<BookOpen className="h-5 w-5" />}
            >
              <div className="space-y-3">
                {loading ? (
                  <div className="rounded-[22px] border border-[#E7EFE6] bg-[#FAFBF7] p-5 text-sm font-bold text-slate-500">
                    Loading anggota tentor...
                  </div>
                ) : tentors.length === 0 ? (
                  <div className="rounded-[22px] border border-dashed border-[#DDE9DB] bg-[#FAFBF7] p-5 text-sm font-bold text-slate-500">
                    Belum ada anggota tentor.
                  </div>
                ) : (
                  tentors.map((tentor) => (
                    <div
                      key={tentor.id}
                      className="rounded-[24px] border border-[#E7EFE6] bg-[#FAFBF7] p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex h-10 w-10 items-center justify-center rounded-[16px] bg-white text-sm font-black text-[#063D27] ring-1 ring-[#E7EFE6]">
                              {getInitials(tentor.nama)}
                            </div>

                            <div>
                              <p className="font-black text-[#063D27]">
                                {tentor.nama}
                              </p>

                              <div className="mt-1 flex flex-wrap gap-2">
                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-black ${
                                    tentor.aktif
                                      ? 'bg-[#F3F8F1] text-[#063D27]'
                                      : 'bg-slate-100 text-slate-400'
                                  }`}
                                >
                                  {tentor.aktif ? 'Aktif' : 'Nonaktif'}
                                </span>

                                {tentor.mapel && (
                                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500 ring-1 ring-[#E7EFE6]">
                                    {tentor.mapel}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 grid gap-2 text-sm font-semibold text-slate-500 md:grid-cols-2">
                            <p className="inline-flex items-center gap-2">
                              <Phone className="h-4 w-4 text-slate-400" />
                              {tentor.phone || '-'}
                            </p>

                            <p className="inline-flex items-center gap-2">
                              <Mail className="h-4 w-4 text-slate-400" />
                              {tentor.email || '-'}
                            </p>
                          </div>

                          {tentor.catatan && (
                            <p className="mt-3 rounded-[18px] bg-white p-3 text-sm font-medium leading-6 text-slate-500 ring-1 ring-[#E7EFE6]">
                              {tentor.catatan}
                            </p>
                          )}
                        </div>

                        <div className="flex shrink-0 flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditTentor(tentor)}
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-4 text-xs font-black text-[#063D27] transition hover:bg-[#F3F8F1] disabled:opacity-60"
                          >
                            <Edit3 className="h-4 w-4" />
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleTentor(tentor)}
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-white px-4 text-xs font-black text-[#063D27] transition hover:bg-[#F3F8F1] disabled:opacity-60"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            {tentor.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteTentor(tentor)}
                            disabled={saving}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 text-xs font-black text-red-700 transition hover:bg-red-100 disabled:opacity-60"
                          >
                            <Trash2 className="h-4 w-4" />
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
          border-radius: 999px;
          border: 1px solid #dde9db;
          background: #ffffff;
          padding: 0 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .input-style:focus {
          border-color: #063d27;
          box-shadow: 0 0 0 4px rgba(6, 61, 39, 0.08);
        }

        .textarea-style {
          width: 100%;
          resize: none;
          border-radius: 24px;
          border: 1px solid #dde9db;
          background: #ffffff;
          padding: 0.9rem 1rem;
          font-size: 0.875rem;
          font-weight: 700;
          color: #334155;
          outline: none;
          transition: 0.2s ease;
        }

        .textarea-style:focus {
          border-color: #063d27;
          box-shadow: 0 0 0 4px rgba(6, 61, 39, 0.08);
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
  children,
}: {
  title: string
  desc: string
  icon: ReactNode
  children: ReactNode
}) {
  return (
    <section className="rounded-[30px] border border-[#E7EFE6] bg-white p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
          {icon}
        </div>

        <div>
          <h2 className="text-lg font-black text-[#063D27]">{title}</h2>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">
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
}: {
  title: string
  value: string
  desc: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-[26px] border border-[#E7EFE6] bg-white p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27] ring-1 ring-[#E7EFE6]">
        {icon}
      </div>

      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
        {title}
      </p>

      <p className="mt-2 truncate text-xl font-black tracking-tight text-[#063D27]">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-500">{desc}</p>
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
      <label className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400">
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
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-slate-300"
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