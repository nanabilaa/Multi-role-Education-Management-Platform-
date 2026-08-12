import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SuperadminSidebar from '@/components/superadmin/SuperadminSidebar'

export default async function SuperadminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'superadmin') {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-white text-[#202124]">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px]">
        <SuperadminSidebar />

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-[#ECEFF1] bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-10">
            <div className="flex h-[72px] items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">

                </div>
                <p className="hidden text-sm font-medium text-[#5F6368] sm:block">
                  Superadmin Workspace
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#202124]">
                    {profile.full_name || 'Superadmin'}
                  </p>
                  <p className="text-xs text-[#80868B]">Akses penuh sistem</p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F3F4] text-sm font-bold text-[#3C4043]">
                  {(profile.full_name || 'S').charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </header>

          <main className="px-4 pb-28 pt-7 sm:px-6 lg:px-10 lg:pb-12 lg:pt-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}