'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenCheck,
  CalendarDays,
  GraduationCap,
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
    <aside className="hidden min-h-screen w-[260px] shrink-0 border-r border-[#E2EBDD] bg-[#FBFDF9] px-4 py-5 md:block">
      <div className="sticky top-5 flex max-h-[calc(100vh-40px)] flex-col">
        <div className="rounded-[26px] border border-[#E2EBDD] bg-white p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
              <GraduationCap className="h-5 w-5" />
            </div>

            <div>
              <p className="text-sm font-black leading-tight text-[#063D27]">
                CBS System
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Orang Tua
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex h-11 items-center gap-3 rounded-2xl px-4 text-sm font-bold transition ${
                  active
                    ? 'bg-[#063D27] text-white'
                    : 'text-slate-500 hover:bg-[#F3F8F1] hover:text-[#063D27]'
                }`}
              >
                <Icon className="h-4.5 w-4.5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-5 rounded-[24px] border border-[#E2EBDD] bg-white p-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-[#F8FAF7] text-sm font-bold text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </aside>
  )
}