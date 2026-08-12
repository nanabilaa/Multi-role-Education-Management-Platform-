'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import Image from 'next/image'
import {
  LayoutDashboard,
  Users,
  Calendar,
  DollarSign,
  BookOpen,
  FileSpreadsheet,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react'

import { useAuth } from '@/hooks/useAuth'
import { cn, getInitials } from '@/lib/utils'

const navItems = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/siswa',
    label: 'Kelola Siswa',
    icon: Users,
  },
  {
    href: '/admin/jadwal',
    label: 'Jadwal Sesi',
    icon: Calendar,
  },
  {
    href: '/admin/dana',
    label: 'Keuangan',
    icon: DollarSign,
  },
  {
    href: '/admin/jurnal',
    label: 'Jurnal & Presensi',
    icon: BookOpen,
  },
  {
    href: '/admin/kehadiran',
    label: 'Rekap Kehadiran',
    icon: FileSpreadsheet,
  },
]

const bottomItems = [
  {
    href: '/admin/pengaturan',
    label: 'Pengaturan',
    icon: Settings,
  },
  {
    href: '/admin/bantuan',
    label: 'Bantuan',
    icon: HelpCircle,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()

  const [mobileOpen, setMobileOpen] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  const adminName = profile?.full_name || 'Admin CBS'
  const adminRole = profile?.role || 'admin'

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }

    return (
      pathname === href ||
      pathname.startsWith(`${href}/`)
    )
  }

  const handleSignOut = async () => {
    try {
      setSigningOut(true)
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  const closeMobile = () => {
    setMobileOpen(false)
  }

  const SidebarContent = () => (
    <aside className="flex h-full flex-col bg-[#063D27]">
      <div className="p-4">
        <Link
          href="/admin"
          onClick={closeMobile}
          className="flex items-center gap-3 rounded-[20px] border border-white/10 bg-white/10 p-3 transition hover:bg-white/15"
        >
        <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[14px] border border-white/15 bg-white">
  <Image
    src="/images/logo bimbel.jpg"
    alt="Logo CBS"
    fill
    priority
    sizes="44px"
    className="object-cover"
  />
</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black leading-tight tracking-tight text-white">
              CBS System
            </p>

            <p className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.12em] text-white/55">
              Bimbel Manager
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <div className="mb-2 px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/40">
            Menu Utama
          </p>
        </div>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(
              item.href,
              item.exact,
            )

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={cn(
                  'group relative flex h-10 items-center gap-2.5 rounded-[15px] px-2.5 text-[13px] font-extrabold transition',
                  active
                    ? 'bg-[#FFD24D] text-[#063D27] shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition',
                    active
                      ? 'bg-[#063D27]/10 text-[#063D27]'
                      : 'bg-white/10 text-white/65 group-hover:bg-white/15 group-hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1 truncate">
                  {item.label}
                </span>

                {active && (
                  <ChevronRight className="h-3.5 w-3.5 text-[#063D27]/70" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="my-4 h-px bg-white/10" />

        <div className="mb-2 px-2">
          <p className="text-[10px] font-black uppercase tracking-[0.17em] text-white/40">
            Lainnya
          </p>
        </div>

        <nav className="space-y-1">
          {bottomItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                className={cn(
                  'group flex h-10 items-center gap-2.5 rounded-[15px] px-2.5 text-[13px] font-extrabold transition',
                  active
                    ? 'bg-[#FFD24D] text-[#063D27] shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white',
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] transition',
                    active
                      ? 'bg-[#063D27]/10 text-[#063D27]'
                      : 'bg-white/10 text-white/65 group-hover:bg-white/15 group-hover:text-white',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span className="min-w-0 flex-1 truncate">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-[20px] border border-white/10 bg-white/10 p-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[15px] bg-[#FFD24D] text-xs font-black text-[#063D27]">
              {getInitials(adminName)}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-black text-white">
                {adminName}
              </p>

              <p className="mt-0.5 truncate text-[11px] font-bold capitalize text-white/45">
                {adminRole}
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          disabled={signingOut}
          className="flex h-10 w-full items-center justify-center gap-2 rounded-[15px] border border-red-300/20 bg-red-400/10 text-[13px] font-black text-red-100 transition hover:bg-red-400/20 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
        >
          <LogOut className="h-4 w-4" />

          {signingOut ? 'Keluar...' : 'Keluar'}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#E7EFE6] bg-white text-[#063D27] shadow-lg shadow-green-950/5 lg:hidden"
        aria-label="Buka menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="fixed left-0 top-0 z-30 hidden h-screen w-[260px] overflow-hidden bg-[#063D27] shadow-xl shadow-green-950/20 lg:block">
        <SidebarContent />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="absolute inset-0 bg-[#063D27]/45 backdrop-blur-[2px]"
            aria-label="Tutup menu"
          />

          <div className="absolute left-0 top-0 h-full w-[82vw] max-w-[300px] overflow-hidden rounded-r-[28px] bg-[#063D27] shadow-2xl shadow-green-950/30">
            <div className="absolute right-3 top-3 z-10">
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-white ring-1 ring-white/15"
                aria-label="Tutup menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
