'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenCheck,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  UserRound,
  WalletCards,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const menuItems = [
  {
    label: 'Beranda',
    href: '/ortu/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Jadwal',
    href: '/ortu/jadwal',
    icon: CalendarDays,
  },
  {
    label: 'Jurnal',
    href: '/ortu/jurnal',
    icon: BookOpenCheck,
  },
  {
    label: 'Tagihan',
    href: '/ortu/tagihan',
    icon: WalletCards,
  },
  {
    label: 'Profil',
    href: '/ortu/profil',
    icon: UserRound,
  },
]

export default function OrtuSidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="hidden min-h-screen w-[280px] shrink-0 border-r border-slate-200 bg-white lg:block">
      <div className="sticky top-0 flex h-screen flex-col px-4 py-5">
        {/* Logo */}
        <div className="flex h-[82px] items-center gap-3.5 rounded-2xl border border-slate-200 bg-slate-50 px-4">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <Image
              src="/images/logo bimbel.jpg"
              alt="Logo CBS"
              fill
              priority
              sizes="48px"
              className="object-cover"
            />
          </div>

          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold leading-5 text-slate-900">
              CBS System
            </p>

            <p className="mt-0.5 text-xs font-medium text-slate-500">
              Orang Tua
            </p>
          </div>
        </div>

        {/* Menu */}
        <nav className="mt-6 flex flex-1 flex-col gap-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon

            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex h-12 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-[#0B513B] text-white shadow-[0_6px_16px_rgba(11,81,59,0.16)]'
                    : 'text-slate-600 hover:bg-[#F1F8F4] hover:text-[#0B513B]'
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    active
                      ? 'bg-white/10 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </span>

                <span className="leading-none">
                  {item.label}
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div className="mt-5 border-t border-slate-200 pt-4">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500/20"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Keluar
          </button>
        </div>
      </div>
    </aside>
  )
}