import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OrtuSidebar from '@/components/ortu/OrtuSidebar'
import Link from 'next/link'
import {
  BookOpenCheck,
  CalendarDays,
  Home,
  UserRound,
  WalletCards,
} from 'lucide-react'

export default async function OrtuLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'ortu') redirect('/login')

  return (
    <div className="min-h-screen bg-[#F8FAF7]">
      <div className="flex min-h-screen">
        <OrtuSidebar />

        <main className="min-w-0 flex-1 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#E2EBDD] bg-white/95 px-3 py-2 backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          <MobileNavItem href="/ortu/dashboard" label="Home" icon={<Home className="h-4 w-4" />} />
          <MobileNavItem href="/ortu/jadwal" label="Jadwal" icon={<CalendarDays className="h-4 w-4" />} />
          <MobileNavItem href="/ortu/jurnal" label="Jurnal" icon={<BookOpenCheck className="h-4 w-4" />} />
          <MobileNavItem href="/ortu/tagihan" label="SPP" icon={<WalletCards className="h-4 w-4" />} />
          <MobileNavItem href="/ortu/profil" label="Profil" icon={<UserRound className="h-4 w-4" />} />
        </div>
      </nav>
    </div>
  )
}

function MobileNavItem({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold text-slate-500 transition hover:bg-[#F3F8F1] hover:text-[#063D27]"
    >
      {icon}
      {label}
    </Link>
  )
}