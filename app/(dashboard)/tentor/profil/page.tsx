'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  Save,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type ProfileRow = {
  id: string
  full_name: string | null
  role: string | null
  phone: string | null
  avatar_url: string | null
  created_at: string | null
  updated_at: string | null
}

type ProfileForm = {
  full_name: string
  phone: string
}

function formatTanggal(value: string | null) {
  if (!value) return '-'

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

export default function TentorProfilPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [email, setEmail] = useState('')

  const [form, setForm] = useState<ProfileForm>({
    full_name: '',
    phone: '',
  })

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState('')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function updateForm(key: keyof ProfileForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function loadProfile() {
    setLoading(true)
    setError('')
    setSuccess('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Sesi login tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }

    setEmail(user.email || '')

    const { data, error: profileError } = await supabase
      .from('profiles')
      .select(
        `
        id,
        full_name,
        role,
        phone,
        avatar_url,
        created_at,
        updated_at
      `
      )
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log(profileError)
      setError(profileError.message)
      setLoading(false)
      return
    }

    const row = data as ProfileRow

    setProfile(row)
    setForm({
      full_name: row.full_name || '',
      phone: row.phone || '',
    })
    setAvatarPreview(row.avatar_url || '')
    setLoading(false)
  }

  useEffect(() => {
    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setAvatarFile(file)

    if (file) {
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!profile) {
      setError('Data profil belum siap.')
      return
    }

    if (!form.full_name.trim()) {
      setError('Nama lengkap wajib diisi.')
      return
    }

    setSavingProfile(true)

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (updateError) {
      console.log(updateError)
      setError(updateError.message)
      setSavingProfile(false)
      return
    }

    setSuccess('Profil berhasil disimpan.')
    setSavingProfile(false)
    await loadProfile()
  }

  async function handleUploadAvatar() {
    setError('')
    setSuccess('')

    if (!profile) {
      setError('Data profil belum siap.')
      return
    }

    if (!avatarFile) {
      setError('Pilih foto dulu.')
      return
    }

    if (!avatarFile.type.startsWith('image/')) {
      setError('File harus berupa gambar.')
      return
    }

    if (avatarFile.size > 2 * 1024 * 1024) {
      setError('Ukuran foto maksimal 2 MB.')
      return
    }

    setSavingAvatar(true)

    const safeName = avatarFile.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const avatarPath = `${profile.id}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(avatarPath, avatarFile, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.log(uploadError)
      setError(uploadError.message)
      setSavingAvatar(false)
      return
    }

    const { data: publicUrlData } = supabase.storage
      .from('profile-avatars')
      .getPublicUrl(avatarPath)

    const avatarUrl = publicUrlData.publicUrl

    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)

    if (updateError) {
      console.log(updateError)
      setError(updateError.message)
      setSavingAvatar(false)
      return
    }

    setAvatarFile(null)
    setSuccess('Foto profil berhasil disimpan.')
    setSavingAvatar(false)
    await loadProfile()
  }

  async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Password baru dan konfirmasi wajib diisi.')
      return
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password belum sama.')
      return
    }

    setSavingPassword(true)

    const { error: passwordError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (passwordError) {
      console.log(passwordError)
      setError(passwordError.message)
      setSavingPassword(false)
      return
    }

    setNewPassword('')
    setConfirmPassword('')
    setSuccess('Password berhasil diperbarui.')
    setSavingPassword(false)
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl space-y-5">
        <div className="rounded-[32px] border border-[#DDE9DB] bg-white p-6 sm:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B5738]/70">
              Profil Tentor
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#063D27] sm:text-3xl">
              Akun saya
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52645A]">
              Kelola foto, nama, nomor HP, dan password.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-[24px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-[24px] border border-[#DDE9DB] bg-[#F3F8F1] p-4 text-sm text-[#063D27]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-8 text-center text-sm font-semibold text-[#52645A]">
            Memuat profil...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            <aside className="space-y-5">
              <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[32px] border border-[#DDE9DB] bg-[#F3F8F1] text-[#063D27]">
                      {avatarPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={avatarPreview}
                          alt="Foto profil"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-12 w-12" />
                      )}
                    </div>

                    <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#DDE9DB] bg-white text-[#063D27] shadow-sm">
                      <Camera className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <h2 className="mt-4 text-lg font-black text-[#063D27]">
                    {form.full_name || 'Tentor'}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-[#52645A]">
                    {profile?.role || 'tentor'}
                  </p>

                  <button
                    type="button"
                    onClick={handleUploadAvatar}
                    disabled={!avatarFile || savingAvatar}
                    className="mt-4 inline-flex items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-[#B8C9B8]"
                  >
                    {savingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4" />
                        Simpan foto
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                <h3 className="text-sm font-black text-[#063D27]">Info akun</h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3 rounded-2xl bg-[#F8FAF7] p-3">
                    <Mail className="mt-0.5 h-4 w-4 text-[#0B5738]" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0B5738]/70">
                        Email
                      </p>
                      <p className="mt-1 break-all font-semibold text-[#52645A]">
                        {email || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-[#F8FAF7] p-3">
                    <UserRound className="mt-0.5 h-4 w-4 text-[#0B5738]" />
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0B5738]/70">
                        Dibuat
                      </p>
                      <p className="mt-1 font-semibold text-[#52645A]">
                        {formatTanggal(profile?.created_at || null)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            <section className="space-y-5">
              <form
                onSubmit={handleSaveProfile}
                className="rounded-[28px] border border-[#DDE9DB] bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <UserRound className="h-5 w-5 text-[#0B5738]" />
                  <h2 className="text-base font-black text-[#063D27]">
                    Data profil
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-black text-[#063D27]">
                      Nama lengkap
                    </label>
                    <input
                      value={form.full_name}
                      onChange={(event) => updateForm('full_name', event.target.value)}
                      placeholder="Nama lengkap"
                      className="mt-2 w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm text-[#063D27] outline-none focus:border-[#063D27]"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-black text-[#063D27]">
                      Nomor HP
                    </label>
                    <div className="relative mt-2">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />
                      <input
                        value={form.phone}
                        onChange={(event) => updateForm('phone', event.target.value)}
                        placeholder="08xxxxxxxxxx"
                        className="w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] py-3 pl-11 pr-4 text-sm text-[#063D27] outline-none focus:border-[#063D27]"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-[#B8C9B8]"
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan
                      </>
                    )}
                  </button>
                </div>
              </form>

              <form
                onSubmit={handleChangePassword}
                className="rounded-[28px] border border-[#DDE9DB] bg-white p-5"
              >
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-[#0B5738]" />
                  <h2 className="text-base font-black text-[#063D27]">
                    Ganti password
                  </h2>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-black text-[#063D27]">
                      Password baru
                    </label>
                    <div className="relative mt-2">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 pr-11 text-sm text-[#063D27] outline-none focus:border-[#063D27]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A8C80]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-black text-[#063D27]">
                      Konfirmasi password
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Ulangi password"
                      className="mt-2 w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm text-[#063D27] outline-none focus:border-[#063D27]"
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-[#B8C9B8]"
                  >
                    {savingPassword ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" />
                        Simpan password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </section>
    </main>
  )
}