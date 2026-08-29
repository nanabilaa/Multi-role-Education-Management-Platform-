'use client'

import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function MobileLogoutButton() {
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-bold text-red-500 transition hover:bg-red-50"
    >
      <LogOut className="h-4 w-4" />
      Keluar
    </button>
  )
}
