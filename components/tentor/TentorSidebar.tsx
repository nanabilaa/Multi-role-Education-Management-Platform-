'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  CalendarDays,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  UserRound,
  Wallet,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Avatar from '@/components/ui/Avatar'

const menuItems = [
  {
    label: 'Beranda',
    href: '/tentor',
    icon: LayoutDashboard,
  },
  {
    label: 'Sesi',
    href: '/tentor/sesi',
    icon: CalendarDays,
  },
  {
    label: 'Honor',
    href: '/tentor/honor',
    icon: Wallet,
  },
  {
    label: 'Profil',
    href: '/tentor/profil',
    icon: UserRound,
  },
]

export default function TentorSidebar() {
  const pathname = usePathname()
  const supabase = createClient()
  const [userName, setUserName] = useState('')
  const [userAvatar, setUserAvatar] = useState<string | null>(null)

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url')
          .eq('id', user.id)
          .single()
        if (profile) {
          setUserName(profile.full_name || '')
          setUserAvatar(profile.avatar_url)
        }
      }
    }
    loadUser()
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <aside className="hidden min-h-screen w-[260px] shrink-0 border-r border-[#DDE9DB] bg-[#FBFDF9] px-4 py-5 md:block">
      <div className="sticky top-5 flex max-h-[calc(100vh-40px)] flex-col">
        <div className="rounded-[26px] border border-[#DDE9DB] bg-white p-4">
          <div className="flex items-center gap-3">
            <Avatar src={userAvatar} alt={userName} size="md" />
            <div>
              <p className="text-sm font-black leading-tight text-[#063D27]">
                {userName || 'Tentor'}
              </p>
              <p className="mt-1 text-xs font-semibold text-slate-400">
                Portal Tentor
              </p>
            </div>
          </div>
        </div>

        <nav className="mt-5 flex flex-1 flex-col gap-1.5 overflow-y-auto pr-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            const active =
              pathname === item.href ||
              (item.href !== '/tentor' && pathname.startsWith(`${item.href}/`))

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
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="mt-5 rounded-[24px] border border-[#DDE9DB] bg-white p-3">
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