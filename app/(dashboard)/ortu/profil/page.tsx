'use client'

import { ChangeEvent, FormEvent, useEffect, useState } from 'react'
import {
  AlertCircle,
  Baby,
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  Save,
  School,
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

type SiswaRow = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
  aktif: boolean | null
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

function getLoginIdFromEmail(email: string) {
  return email.replace(/@example\.com$/i, '')
}

export default function OrtuProfilPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)

  const [savingProfile, setSavingProfile] = useState(false)
  const [savingAvatar, setSavingAvatar] = useState(false)
  const [savingLoginId, setSavingLoginId] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  const [profile, setProfile] = useState<ProfileRow | null>(null)
  const [children, setChildren] = useState<SiswaRow[]>([])

  const [loginId, setLoginId] = useState('')
  const [newLoginId, setNewLoginId] = useState('')

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

  const loadProfile = async () => {
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

    const currentLoginId = getLoginIdFromEmail(user.email || '')

    setLoginId(currentLoginId)
    setNewLoginId(currentLoginId)

    const { data: profileData, error: profileError } = await supabase
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

    const row = profileData as ProfileRow

    setProfile(row)

    setForm({
      full_name: row.full_name || '',
      phone: row.phone || '',
    })

    setAvatarPreview(row.avatar_url || '')

    const { data: siswaData, error: siswaError } = await supabase
      .from('siswa')
      .select('id, nama, kelas, sekolah, aktif')
      .eq('ortu_id', user.id)
      .order('nama', { ascending: true })

    if (siswaError) {
      console.log(siswaError)
      setChildren([])
    } else {
      setChildren((siswaData || []) as SiswaRow[])
    }

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

  const handleSaveProfile = async (
    event: FormEvent<HTMLFormElement>
  ) => {
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

    setProfile((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        updated_at: new Date().toISOString(),
      }
    })

    setSuccess('Profil berhasil disimpan.')
    setSavingProfile(false)
  }

  const handleUploadAvatar = async () => {
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

    const safeName = avatarFile.name.replace(
      /[^a-zA-Z0-9._-]/g,
      '-'
    )

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

    setProfile((prev) => {
      if (!prev) return prev

      return {
        ...prev,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      }
    })

    setAvatarPreview(avatarUrl)
    setAvatarFile(null)

    setSuccess('Foto profil berhasil disimpan.')
    setSavingAvatar(false)
  }

  const handleChangeLoginId = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    const normalizedLoginId = newLoginId
      .trim()
      .toLowerCase()

    if (!normalizedLoginId) {
      setError('ID Login wajib diisi.')
      return
    }

    if (normalizedLoginId.length < 4) {
      setError('ID Login minimal 4 karakter.')
      return
    }

    if (normalizedLoginId.length > 30) {
      setError('ID Login maksimal 30 karakter.')
      return
    }

    if (!/^[a-z0-9._-]+$/.test(normalizedLoginId)) {
      setError(
        'ID Login hanya boleh berisi huruf kecil, angka, titik, underscore, dan tanda hubung.'
      )
      return
    }

    if (normalizedLoginId === loginId) {
      setError('ID Login baru masih sama dengan ID Login sekarang.')
      return
    }

    setSavingLoginId(true)

    try {
      /*
       * Ambil access token akun yang sedang login.
       * Token dikirim ke API supaya server tahu user mana
       * yang sedang meminta perubahan ID Login.
       */
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession()

      if (sessionError || !session?.access_token) {
        throw new Error(
          'Sesi login tidak ditemukan. Silakan login ulang.'
        )
      }

      const response = await fetch(
  '/ortu/profil/login-id',
  {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      loginId: normalizedLoginId,
    }),
  }
)


      const result = await response.json()

      if (!response.ok) {
        throw new Error(
          result.error || 'Gagal mengubah ID Login.'
        )
      }

      setLoginId(result.loginId)
      setNewLoginId(result.loginId)

      /*
       * Karena email Auth internal berubah,
       * logout supaya session lama tidak membawa
       * identitas email sebelumnya.
       */
      await supabase.auth.signOut()

      window.location.href =
        '/login?message=login-id-changed'
    } catch (err) {
      console.log(err)

      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengubah ID Login.'
      )

      setSavingLoginId(false)
    }
  }

  const handleChangePassword = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError(
        'Password baru dan konfirmasi wajib diisi.'
      )
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

    const { error: passwordError } =
      await supabase.auth.updateUser({
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
              Profil Orang Tua
            </p>

            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#063D27] sm:text-3xl">
              Akun saya
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52645A]">
              Kelola foto, nama, nomor HP, ID Login, dan
              password.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-[24px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="font-semibold">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-[24px] border border-[#DDE9DB] bg-[#F3F8F1] p-4 text-sm text-[#063D27]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />

            <p className="font-semibold">
              {success}
            </p>
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-8 text-center text-sm font-semibold text-[#52645A]">
            Memuat profil...
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
            {/* LEFT */}
            <aside className="space-y-5">
              {/* FOTO */}
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
                    {form.full_name || 'Orang Tua'}
                  </h2>

                  <p className="mt-1 text-sm font-semibold text-[#52645A]">
                    {profile?.role || 'ortu'}
                  </p>

                  <button
                    type="button"
                    onClick={handleUploadAvatar}
                    disabled={
                      !avatarFile ||
                      savingAvatar
                    }
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

              {/* INFO AKUN */}
              <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                <h3 className="text-sm font-black text-[#063D27]">
                  Info akun
                </h3>

                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-start gap-3 rounded-2xl bg-[#F8FAF7] p-3">
                    <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-[#0B5738]" />

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0B5738]/70">
                        ID Login
                      </p>

                      <p className="mt-1 break-all font-semibold text-[#52645A]">
                        {loginId || '-'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 rounded-2xl bg-[#F8FAF7] p-3">
                    <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#0B5738]" />

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-[#0B5738]/70">
                        Dibuat
                      </p>

                      <p className="mt-1 font-semibold text-[#52645A]">
                        {formatTanggal(
                          profile?.created_at ||
                            null
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ANAK */}
              <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                <div className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-[#0B5738]" />

                  <h3 className="text-sm font-black text-[#063D27]">
                    Anak
                  </h3>
                </div>

                {children.length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-[#BFD2BE] bg-[#F8FAF7] p-4 text-sm font-semibold text-[#52645A]">
                    Belum ada anak.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {children.map((child) => (
                      <div
                        key={child.id}
                        className="rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] p-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-white text-[#063D27]">
                            <School className="h-4 w-4" />
                          </div>

                          <div>
                            <p className="font-black text-[#063D27]">
                              {child.nama}
                            </p>

                            <p className="mt-1 text-xs font-semibold text-[#52645A]">
                              {child.kelas ||
                                '-'}{' '}
                              ·{' '}
                              {child.sekolah ||
                                '-'}
                            </p>

                            {!child.aktif && (
                              <span className="mt-2 inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-black text-red-700">
                                Nonaktif
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* RIGHT */}
            <section className="space-y-5">
              {/* DATA PROFIL */}
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
                      onChange={(event) =>
                        updateForm(
                          'full_name',
                          event.target.value
                        )
                      }
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
                        onChange={(event) =>
                          updateForm(
                            'phone',
                            event.target.value
                          )
                        }
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

              {/* GANTI ID LOGIN */}
              <form
                onSubmit={handleChangeLoginId}
                className="rounded-[28px] border border-[#DDE9DB] bg-white p-5"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#0B5738]">
                    <KeyRound className="h-5 w-5" />
                  </div>

                  <div>
                    <h2 className="text-base font-black text-[#063D27]">
                      ID Login
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[#52645A]">
                      ID Login digunakan untuk masuk
                      ke akun CBS. Tidak perlu
                      menuliskan @example.com.
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <label className="text-sm font-black text-[#063D27]">
                    ID Login sekarang
                  </label>

                  <div className="mt-2 rounded-2xl border border-[#DDE9DB] bg-[#F3F8F1] px-4 py-3">
                    <p className="break-all text-sm font-black text-[#063D27]">
                      {loginId || '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label
                    htmlFor="new-login-id"
                    className="text-sm font-black text-[#063D27]"
                  >
                    ID Login baru
                  </label>

                  <div className="relative mt-2">
                    <KeyRound className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7A8C80]" />

                    <input
                      id="new-login-id"
                      type="text"
                      value={newLoginId}
                      onChange={(event) => {
                        const value =
                          event.target.value
                            .toLowerCase()
                            .replace(
                              /\s+/g,
                              '-'
                            )

                        setNewLoginId(value)
                      }}
                      placeholder="contoh: ayah-adista"
                      autoComplete="username"
                      maxLength={30}
                      className="w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] py-3 pl-11 pr-4 text-sm font-semibold text-[#063D27] outline-none focus:border-[#063D27]"
                    />
                  </div>

                  <p className="mt-2 text-xs font-semibold leading-5 text-[#7A8C80]">
                    Gunakan 4–30 karakter.
                    Boleh memakai huruf kecil,
                    angka, titik (.), underscore
                    (_), atau tanda hubung (-).
                  </p>

                  <p className="mt-1 text-xs font-semibold leading-5 text-[#7A8C80]">
                    Contoh: ayah-adista,
                    bunda.nayla, atau
                    ortu_rahma.
                  </p>
                </div>

                <div className="mt-5 flex justify-end">
                  <button
                    type="submit"
                    disabled={
                      savingLoginId ||
                      !newLoginId.trim() ||
                      newLoginId.trim() ===
                        loginId
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-[#B8C9B8]"
                  >
                    {savingLoginId ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Mengubah...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan ID Login
                      </>
                    )}
                  </button>
                </div>

                <div className="mt-4 rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] p-4">
                  <p className="text-xs font-semibold leading-5 text-[#52645A]">
                    Setelah ID Login berhasil
                    diubah, akun akan keluar
                    otomatis. Masuk kembali
                    menggunakan ID Login baru
                    dan password yang sama.
                  </p>
                </div>
              </form>

              {/* GANTI PASSWORD */}
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
                        type={
                          showPassword
                            ? 'text'
                            : 'password'
                        }
                        value={newPassword}
                        onChange={(event) =>
                          setNewPassword(
                            event.target.value
                          )
                        }
                        placeholder="Minimal 6 karakter"
                        autoComplete="new-password"
                        className="w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 pr-11 text-sm text-[#063D27] outline-none focus:border-[#063D27]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowPassword(
                            (prev) => !prev
                          )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7A8C80]"
                        aria-label={
                          showPassword
                            ? 'Sembunyikan password'
                            : 'Tampilkan password'
                        }
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
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(event) =>
                        setConfirmPassword(
                          event.target.value
                        )
                      }
                      placeholder="Ulangi password"
                      autoComplete="new-password"
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