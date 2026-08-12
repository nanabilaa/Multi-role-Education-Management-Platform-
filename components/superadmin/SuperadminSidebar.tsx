'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpenCheck,
  DatabaseBackup,
  Home,
  LogOut,
  ShieldCheck,
  UsersRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const menuItems = [
  {
    href: '/superadmin',
    label: 'Beranda',
    icon: Home,
    accent: 'text-[#34A853]',
  },
  {
    href: '/superadmin/admin',
    label: 'Admin',
    icon: ShieldCheck,
    accent: 'text-[#FABB05]',
  },
  {
    href: '/superadmin/users',
    label: 'Users',
    icon: UsersRound,
    accent: 'text-[#4285F4]',
  },
  {
    href: '/superadmin/audit',
    label: 'Audit',
    icon: BookOpenCheck,
    accent: 'text-[#EA4335]',
  },
  {
    href: '/superadmin/backup',
    label: 'Backup',
    icon: DatabaseBackup,
    accent: 'text-[#34A853]',
  },
]

export default function SuperadminSidebar() {
  const pathname = usePathname()
  const supabase = createClient()

  function isActive(href: string) {
    if (href === '/superadmin') {
      return pathname === href
    }

    return pathname.startsWith(href)
  }

  async function logout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 flex-col border-r border-[#ECEFF1] bg-white px-5 py-7 lg:flex">
        <div className="px-3">
          <div className="mb-3 flex items-center gap-1.5">
            <span className="h-1.5 w-8 rounded-full bg-[#EA4335]" />
            <span className="h-1.5 w-8 rounded-full bg-[#FABB05]" />
            <span className="h-1.5 w-8 rounded-full bg-[#34A853]" />
          </div>

          <h1 className="text-xl font-bold tracking-[-0.03em] text-[#202124]">
            Superadmin
          </h1>
          <p className="mt-1 text-sm text-[#80868B]">
            Pusat kontrol sistem
          </p>
        </div>

        <nav className="mt-10 space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
                  active
                    ? 'bg-[#F1F3F4] text-[#202124]'
                    : 'text-[#5F6368] hover:bg-[#F8F9FA] hover:text-[#202124]',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'h-[19px] w-[19px] transition-transform group-hover:scale-105',
                    active ? item.accent : 'text-[#9AA0A6]',
                  ].join(' ')}
                />

                <span className="flex-1">{item.label}</span>

                {active && (
                  <span className="h-2 w-2 rounded-full bg-[#34A853]" />
                )}
              </Link>
            )
          })}
        </nav>

        <div className="mt-auto">
          <div className="mb-5 rounded-3xl bg-[#F8F9FA] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#80868B]">
              Status
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#34A853]" />
              <p className="text-sm font-medium text-[#3C4043]">
                Sistem aktif
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[#5F6368] transition hover:bg-[#FEF1F0] hover:text-[#C5221F]"
          >
            <LogOut className="h-[19px] w-[19px]" />
            Keluar
          </button>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E3E7E5] bg-white/95 px-2 pb-[max(8px,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl lg:hidden">
        <div className="grid grid-cols-5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex flex-col items-center justify-center gap-1 rounded-2xl px-1 py-2 text-[10px] font-semibold transition',
                  active
                    ? 'bg-[#F1F3F4] text-[#202124]'
                    : 'text-[#80868B]',
                ].join(' ')}
              >
                <Icon
                  className={[
                    'h-[18px] w-[18px]',
                    active ? item.accent : 'text-[#9AA0A6]',
                  ].join(' ')}
                />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}