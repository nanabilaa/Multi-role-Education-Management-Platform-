// app/(auth)/login/page.tsx
'use client'

import Image from 'next/image'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Headphones } from 'lucide-react'

const palette = {
  green: '#063D27',
  greenSoft: '#0B5738',
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setLoading(true)
    setError('')

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (!user) {
      setError('User tidak ditemukan setelah login.')
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.log('PROFILE ERROR:', profileError)
      setError('Role akun tidak ditemukan. Hubungi admin.')
      setLoading(false)
      return
    }

    const role = profile?.role

    if (role === 'admin') {
      window.location.href = '/admin'
      return
    }

    if (role === 'ortu') {
      window.location.href = '/ortu/dashboard'
      return
    }

    if (role === 'tentor') {
      window.location.href = '/tentor'
      return
    }

    if (role === 'siswa') {
      window.location.href = '/siswa'
      return
    }

    setError('Role akun tidak valid.')
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="flex items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
          <div className="w-full max-w-md">
            <div className="mb-12">
              <Image
                src="/images/logo.png"
                alt="CBS System"
                width={150}
                height={44}
                priority
                className="mb-10 h-auto w-[150px] object-contain"
              />

              <h1 className="text-4xl font-black tracking-tight text-[#063D27] sm:text-5xl">
                Balik lagi!
              </h1>

              <p className="mt-4 max-w-sm text-base leading-7 text-slate-500">
                Masuk dulu yuk, biar data bimbel hari ini bisa lanjut dikelola dengan rapi.
              </p>
            </div>

            {error && (
              <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="flex h-16 items-center rounded-full border border-slate-300 bg-white px-6 transition focus-within:border-[#E6A11F] focus-within:ring-4 focus-within:ring-[#FFD24D]/25">
                <Mail className="mr-3 h-5 w-5 text-slate-400" />

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
              </div>

              <div className="flex h-16 items-center rounded-full border border-slate-300 bg-white px-6 transition focus-within:border-[#E6A11F] focus-within:ring-4 focus-within:ring-[#FFD24D]/25">
                <Lock className="mr-3 h-5 w-5 text-slate-400" />

                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />

                <button
                  type="button"
                  onClick={() => setShowPass((prev) => !prev)}
                  className="ml-3 text-slate-400 transition hover:text-[#063D27]"
                  aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-sm font-semibold text-[#063D27] transition hover:text-[#E6A11F]"
                >
                  Lupa password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group mt-5 flex h-16 w-full items-center justify-center gap-3 rounded-full text-sm font-bold text-white shadow-lg shadow-green-950/20 transition disabled:cursor-not-allowed disabled:bg-slate-500"
                style={{
                  backgroundColor: loading ? '#64748b' : palette.green,
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = palette.greenSoft
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.backgroundColor = palette.green
                }}
              >
                {loading ? (
                  <>
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="white"
                        strokeWidth="3"
                        strokeOpacity="0.3"
                      />
                      <path
                        d="M12 2a10 10 0 0 1 10 10"
                        stroke="white"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                    Lagi masuk...
                  </>
                ) : (
                  <>
                    Masuk
                    <ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <div className="my-10 flex items-center gap-4 text-sm text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              <span>Bantuan akses</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <div className="rounded-3xl bg-[#FFF8E6] p-5 ring-1 ring-[#E6A11F]/15">
              <div className="flex gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5B82E] text-[#063D27]">
                  <Headphones className="h-6 w-6" />
                </div>

                <p className="text-sm leading-6 text-slate-600">
                  Kalau belum bisa masuk, hubungi admin. Nanti dicek akun, role, atau password kamu.
                </p>
              </div>
            </div>

            <p className="mt-10 text-center text-sm text-slate-500">
              CBS System · Manajemen Bimbingan Belajar
            </p>
          </div>
        </section>

        <section className="hidden items-center justify-center p-8 lg:flex">
          <div className="relative flex h-[calc(100vh-4rem)] min-h-[640px] w-full max-w-4xl items-center justify-center overflow-hidden rounded-[36px] bg-[#F3F8F1] p-8">
            <Image
              src="/images/login.jpg"
              alt="Ilustrasi pengelolaan bimbel CBS System"
              width={900}
              height={760}
              priority
              className="h-full w-full object-contain"
            />
          </div>
        </section>
      </div>
    </main>
  )
}