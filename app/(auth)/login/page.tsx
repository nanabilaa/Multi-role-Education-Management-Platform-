'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Headphones,
  Loader2,
  LockKeyhole,
  UserRound,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type ProfileRole = {
  role: string | null
}

type LoginSlide = {
  src: string
  alt: string
  label: string
  title: string
  description: string
}

// Domain untuk akun orang tua - sesuai format yang diharapkan: ortu-adheen@bimbelcbs.my.id
const CBS_PARENT_EMAIL_DOMAIN = 'bimbelcbs.my.id'

const SLIDES: LoginSlide[] = [
  {
    src: '/images/photolog1.jpg',
    alt: 'Kegiatan belajar siswa bersama tentor CBS',
    label: 'Belajar terarah',
    title: 'Pendampingan belajar yang lebih terpantau',
    description:
      'Kelola jadwal, kehadiran, jurnal pembelajaran, dan perkembangan siswa dalam satu sistem.',
  },
  {
    src: '/images/photolog2.jpg',
    alt: 'Tentor mendampingi kegiatan belajar siswa',
    label: 'Informasi terhubung',
    title: 'Tentor dan orang tua tetap terhubung',
    description:
      'Informasi pembelajaran tersimpan dengan rapi dan dapat diakses sesuai kebutuhan.',
  },
  {
    src: '/images/photolog3.jpg',
    alt: 'Siswa mengikuti kegiatan pembelajaran CBS',
    label: 'Akses praktis',
    title: 'Satu akun untuk mengakses layanan CBS',
    description:
      'Masuk menggunakan ID Login dan password yang telah diberikan oleh pengelola CBS.',
  },
]

const SLIDE_INTERVAL = 5000

function getDashboardPath(
  role: string | null | undefined,
) {
  const normalizedRole = role
    ?.trim()
    .toLowerCase()

  switch (normalizedRole) {
    case 'superadmin':
      return '/superadmin'

    case 'admin':
      return '/admin'

    case 'tentor':
      return '/tentor'

    case 'ortu':
      return '/ortu/dashboard'

    default:
      return null
  }
}

export default function LoginPage() {
  const router = useRouter()

  const supabase = useMemo(
    () => createClient(),
    [],
  )

  const sliderItems = useMemo(
    () => [...SLIDES, SLIDES[0]],
    [],
  )

  const [loginCode, setLoginCode] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [
    checkingSession,
    setCheckingSession,
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [slideIndex, setSlideIndex] =
    useState(0)

  const [
    transitionEnabled,
    setTransitionEnabled,
  ] = useState(true)

  const [
    reduceMotion,
    setReduceMotion,
  ] = useState(false)

  const redirectByRole = useCallback(
    async (userId: string) => {
      const {
        data: profileData,
        error: profileError,
      } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error(
          'PROFILE ERROR:',
          profileError,
        )

        setErrorMessage(
          'Akun berhasil ditemukan, tetapi akses dashboard belum dapat dibaca. Hubungi admin CBS.',
        )

        setLoading(false)
        setCheckingSession(false)

        return
      }

      const profile =
        profileData as ProfileRole | null

      const dashboardPath =
        getDashboardPath(
          profile?.role,
        )

      if (!dashboardPath) {
        setErrorMessage(
          'Role akun belum memiliki akses dashboard. Hubungi admin CBS.',
        )

        setLoading(false)
        setCheckingSession(false)

        return
      }

      router.replace(dashboardPath)
      router.refresh()
    },
    [router, supabase],
  )

  /*
   * Cek session yang sudah ada.
   */
  useEffect(() => {
    let active = true

    const checkExistingSession =
      async () => {
        setCheckingSession(true)

        const {
          data: { user },
          error: sessionError,
        } =
          await supabase.auth.getUser()

        if (!active) {
          return
        }

        if (sessionError) {
          console.error(
            'SESSION ERROR:',
            sessionError,
          )

          setCheckingSession(false)

          return
        }

        if (user) {
          await redirectByRole(
            user.id,
          )

          return
        }

        setCheckingSession(false)
      }

    void checkExistingSession()

    return () => {
      active = false
    }
  }, [
    redirectByRole,
    supabase,
  ])

  /*
   * Mengikuti preferensi reduced motion.
   */
  useEffect(() => {
    const mediaQuery =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)',
      )

    const updateMotionPreference =
      () => {
        setReduceMotion(
          mediaQuery.matches,
        )
      }

    updateMotionPreference()

    mediaQuery.addEventListener(
      'change',
      updateMotionPreference,
    )

    return () => {
      mediaQuery.removeEventListener(
        'change',
        updateMotionPreference,
      )
    }
  }, [])

  /*
   * Slider foto desktop.
   */
  useEffect(() => {
    if (reduceMotion) {
      return
    }

    const intervalId =
      window.setInterval(() => {
        setSlideIndex(
          (currentIndex) => {
            if (
              currentIndex >=
              SLIDES.length
            ) {
              return currentIndex
            }

            return currentIndex + 1
          },
        )
      }, SLIDE_INTERVAL)

    return () => {
      window.clearInterval(
        intervalId,
      )
    }
  }, [reduceMotion])

  /*
   * Menerjemahkan ID Login menjadi
   * email yang dipakai Supabase Auth.
   */
  const resolveLoginEmail =
    async (
      identifier: string,
    ): Promise<{
      email: string | null
      error: string
    }> => {
      const normalizedIdentifier =
        identifier
          .trim()
          .toLowerCase()

      if (!normalizedIdentifier) {
        return {
          email: null,
          error:
            'Masukkan ID Login terlebih dahulu.',
        }
      }

      /*
       * Jika pengguna memasukkan email.
       */
      if (
        normalizedIdentifier.includes(
          '@',
        )
      ) {
        return {
          email:
            normalizedIdentifier,
          error: '',
        }
      }

      /*
       * Resolver ID Login.
       */
      const {
        data,
        error: resolveError,
      } = await supabase.rpc(
        'resolve_login_identifier',
        {
          p_identifier:
            identifier.trim(),
        },
      )

      if (resolveError) {
        console.error(
          'RESOLVE LOGIN ERROR:',
          resolveError,
        )
      }

      if (data) {
        return {
          email: String(data)
            .trim()
            .toLowerCase(),
          error: '',
        }
      }

      /*
       * Fallback untuk akun orang tua.
       */
      if (
        /^[a-z0-9._-]{4,30}$/.test(
          normalizedIdentifier,
        )
      ) {
        return {
          email:
            `${normalizedIdentifier}@${CBS_PARENT_EMAIL_DOMAIN}`,
          error: '',
        }
      }

      return {
        email: null,
        error:
          'Format ID Login tidak valid. Periksa kembali penulisannya.',
      }
    }

  const handleLogin = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault()

    if (loading) {
      return
    }

    setErrorMessage('')

    const normalizedLoginCode =
      loginCode.trim()

    const normalizedPassword =
      password

    if (!normalizedLoginCode) {
      setErrorMessage(
        'Masukkan ID Login terlebih dahulu.',
      )

      return
    }

    if (!normalizedPassword) {
      setErrorMessage(
        'Masukkan password terlebih dahulu.',
      )

      return
    }

    setLoading(true)

    try {
      const resolvedLogin =
        await resolveLoginEmail(
          normalizedLoginCode,
        )

      if (!resolvedLogin.email) {
        setErrorMessage(
          resolvedLogin.error,
        )

        return
      }

      const {
        data: authData,
        error: authError,
      } =
        await supabase.auth.signInWithPassword(
          {
            email:
              resolvedLogin.email,

            password:
              normalizedPassword,
          },
        )

      if (authError) {
        console.error(
          'AUTH ERROR:',
          authError,
        )

        setErrorMessage(
          'ID Login atau password belum sesuai. Periksa kembali lalu coba lagi.',
        )

        return
      }

      if (!authData.user) {
        setErrorMessage(
          'Akun tidak ditemukan. Hubungi admin CBS jika masalah berlanjut.',
        )

        return
      }

      await redirectByRole(
        authData.user.id,
      )
    } catch (loginError) {
      console.error(
        'LOGIN ERROR:',
        loginError,
      )

      setErrorMessage(
        'Login belum berhasil karena terjadi gangguan. Silakan coba kembali.',
      )
    } finally {
      setLoading(false)
    }
  }

  const handleSlideTransitionEnd =
    () => {
      if (
        slideIndex !==
        SLIDES.length
      ) {
        return
      }

      setTransitionEnabled(false)
      setSlideIndex(0)

      window.requestAnimationFrame(
        () => {
          window.requestAnimationFrame(
            () => {
              setTransitionEnabled(
                true,
              )
            },
          )
        },
      )
    }

  const selectSlide = (
    index: number,
  ) => {
    setTransitionEnabled(true)
    setSlideIndex(index)
  }

  const activeSlideIndex =
    slideIndex === SLIDES.length
      ? 0
      : slideIndex

  /*
   * Loading awal.
   */
  if (checkingSession) {
    return (
      <main className="flex min-h-screen min-h-[100dvh] w-full items-center justify-center bg-[#F7F9F6] px-4 py-6">
        <div
          className="flex max-w-sm items-center gap-3 rounded-xl border border-[#DCE6DA] bg-white px-5 py-4 text-sm font-medium text-[#063D27] shadow-sm"
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="h-5 w-5 shrink-0 animate-spin"
            aria-hidden="true"
          />

          <span>
            Memeriksa sesi akun...
          </span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen min-h-[100dvh] w-full overflow-x-hidden bg-[#F7F9F6]">
      <div className="grid min-h-screen min-h-[100dvh] w-full lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)]">

        {/* ================================= */}
        {/* PANEL FOTO - DESKTOP */}
        {/* ================================= */}

        <section className="hidden p-6 lg:block">
          <div
            className="relative h-[calc(100dvh-3rem)] min-h-[580px] overflow-hidden rounded-2xl border border-[#DCE6DA] bg-[#EAF1E8]"
            aria-label="Informasi layanan CBS"
          >
            <div
              className={
                transitionEnabled
                  ? 'flex h-full transition-transform duration-700 ease-[cubic-bezier(0.2,0.8,0.2,1)] motion-reduce:transition-none'
                  : 'flex h-full'
              }
              style={{
                transform: `translateX(-${
                  slideIndex * 100
                }%)`,
              }}
              onTransitionEnd={
                handleSlideTransitionEnd
              }
            >
              {sliderItems.map(
                (
                  slide,
                  index,
                ) => (
                  <article
                    key={`${slide.src}-${index}`}
                    className="relative h-full min-w-full"
                    aria-hidden={
                      activeSlideIndex !==
                      index %
                        SLIDES.length
                    }
                  >
                    <Image
                      src={
                        slide.src
                      }
                      alt={
                        slide.alt
                      }
                      fill
                      priority={
                        index === 0
                      }
                      sizes="60vw"
                      className="object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-[#063D27]/95 p-7 text-white">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#DCEBDD]">
                        {
                          slide.label
                        }
                      </p>

                      <h2 className="mt-2 max-w-xl text-2xl font-semibold leading-tight">
                        {
                          slide.title
                        }
                      </h2>

                      <p className="mt-3 max-w-xl text-sm leading-6 text-white/75">
                        {
                          slide.description
                        }
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>

            {/* Dots slider */}
            <div
              className="absolute right-6 top-6 flex items-center gap-2 rounded-xl border border-white/40 bg-white/90 p-2 shadow-sm backdrop-blur-sm"
              aria-label="Pilih gambar"
            >
              {SLIDES.map(
                (
                  slide,
                  index,
                ) => {
                  const active =
                    activeSlideIndex ===
                    index

                  return (
                    <button
                      key={
                        slide.src
                      }
                      type="button"
                      onClick={() =>
                        selectSlide(
                          index,
                        )
                      }
                      aria-label={`Tampilkan gambar ${
                        index + 1
                      }`}
                      aria-current={
                        active
                          ? 'true'
                          : undefined
                      }
                      className={
                        active
                          ? 'h-2.5 w-7 rounded-full bg-[#063D27] transition-all'
                          : 'h-2.5 w-2.5 rounded-full bg-slate-300 transition-all hover:bg-slate-400'
                      }
                    />
                  )
                },
              )}
            </div>
          </div>
        </section>

        {/* ================================= */}
        {/* PANEL LOGIN */}
        {/* ================================= */}

        <section
          className="
            flex
            min-h-[100dvh]
            w-full
            items-start
            justify-center
            bg-white
            px-4
            pb-6
            pt-5
            sm:items-center
            sm:px-8
            sm:py-8
            lg:border-l
            lg:border-[#DCE6DA]
            lg:px-12
            lg:py-10
          "
        >
          <div className="mx-auto w-full max-w-md sm:py-4 lg:py-0">

            {/* Logo */}
            <div className="mb-6 flex items-center gap-3 sm:mb-8">
              <Image
                src="/images/logo.png"
                alt="Logo CBS"
                width={48}
                height={48}
                priority
                className="h-10 w-10 shrink-0 object-contain sm:h-12 sm:w-12"
              />

              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight text-[#063D27]">
                  CBS System
                </p>

                <p className="mt-0.5 text-xs text-slate-500">
                  Bimbel Manager
                </p>
              </div>
            </div>

            {/* Heading */}
            <div>
              <h1 className="text-[28px] font-semibold leading-[1.15] tracking-tight text-slate-900 sm:text-3xl">
                Selamat datang kembali
              </h1>

              <p className="mt-2.5 max-w-sm text-sm leading-6 text-slate-600 sm:mt-3">
                Masukkan ID Login dan
                password yang diberikan
                oleh pengelola CBS.
              </p>
            </div>

            {/* Error */}
            {errorMessage && (
              <div
                className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 sm:mt-6 sm:px-4"
                role="alert"
                aria-live="assertive"
              >
                <AlertCircle
                  className="mt-0.5 h-5 w-5 shrink-0"
                  aria-hidden="true"
                />

                <p className="min-w-0 break-words leading-6">
                  {
                    errorMessage
                  }
                </p>
              </div>
            )}

            {/* Form */}
            <form
              onSubmit={
                handleLogin
              }
              className="mt-6 space-y-4.5 sm:mt-7 sm:space-y-5"
            >

              {/* ID LOGIN */}
              <div>
                <label
                  htmlFor="login-code"
                  className="text-sm font-medium text-slate-800"
                >
                  ID Login
                </label>

                <div className="mt-2 flex min-h-[50px] w-full items-center rounded-xl border border-slate-300 bg-white px-3 transition-colors focus-within:border-[#0B6B43] focus-within:ring-2 focus-within:ring-[#0B6B43]/15">
                  <UserRound
                    className="mr-3 h-5 w-5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />

                  <input
                    id="login-code"
                    type="text"
                    value={
                      loginCode
                    }
                    onChange={(
                      event,
                    ) => {
                      setLoginCode(
                        event.target.value,
                      )

                      if (
                        errorMessage
                      ) {
                        setErrorMessage(
                          '',
                        )
                      }
                    }}
                    placeholder="Contoh: orangtuaaldia"
                    required
                    disabled={
                      loading
                    }
                    autoComplete="username"
                    autoCapitalize="none"
                    spellCheck={
                      false
                    }
                    className="h-[50px] min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
                  />
                </div>

                <p className="mt-1.5 text-xs leading-5 text-slate-500 sm:mt-2">
                  Gunakan ID Login
                  yang diberikan oleh
                  pengelola CBS.
                </p>
              </div>

              {/* PASSWORD */}
              <div>
                <label
                  htmlFor="password"
                  className="text-sm font-medium text-slate-800"
                >
                  Password
                </label>

                <div className="mt-2 flex min-h-[50px] w-full items-center rounded-xl border border-slate-300 bg-white px-3 transition-colors focus-within:border-[#0B6B43] focus-within:ring-2 focus-within:ring-[#0B6B43]/15">
                  <LockKeyhole
                    className="mr-3 h-5 w-5 shrink-0 text-slate-400"
                    aria-hidden="true"
                  />

                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) => {
                      setPassword(
                        event.target.value,
                      )

                      if (
                        errorMessage
                      ) {
                        setErrorMessage(
                          '',
                        )
                      }
                    }}
                    placeholder="Masukkan password"
                    required
                    disabled={
                      loading
                    }
                    autoComplete="current-password"
                    className="h-[50px] min-w-0 flex-1 bg-transparent text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-500"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (
                          currentValue,
                        ) =>
                          !currentValue,
                      )
                    }
                    disabled={
                      loading
                    }
                    aria-label={
                      showPassword
                        ? 'Sembunyikan password'
                        : 'Tampilkan password'
                    }
                    aria-pressed={
                      showPassword
                    }
                    className="ml-1 flex h-11 w-11 shrink-0 touch-manipulation items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B6B43] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Eye
                        className="h-5 w-5"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                disabled={
                  loading
                }
                className="flex min-h-[50px] w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-[#063D27] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#0A5035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#063D27] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="h-5 w-5 shrink-0 animate-spin"
                      aria-hidden="true"
                    />

                    Memeriksa akun...
                  </>
                ) : (
                  <>
                    Masuk ke dashboard

                    <ArrowRight
                      className="h-5 w-5 shrink-0"
                      aria-hidden="true"
                    />
                  </>
                )}
              </button>
            </form>

            {/* BANTUAN */}
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5 sm:mt-6 sm:p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                  <Headphones
                    className="h-5 w-5"
                    aria-hidden="true"
                  />
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium text-amber-950">
                    Mengalami kendala
                    saat masuk?
                  </p>

                  <p className="mt-1 text-sm leading-5 text-amber-800 sm:leading-6">
                    Periksa kembali ID
                    Login dan password.
                    Hubungi admin CBS
                    jika akun tetap tidak
                    dapat digunakan.
                  </p>
                </div>
              </div>
            </div>

            {/* FOOTER */}
            <p className="mt-5 pb-1 text-center text-xs leading-5 text-slate-400 sm:mt-8 sm:pb-2">
              Akses hanya diberikan
              kepada pengguna CBS yang
              terdaftar.
            </p>

          </div>
        </section>
      </div>
    </main>
  )
}