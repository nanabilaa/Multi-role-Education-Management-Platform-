import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import TentorSidebar from '@/components/tentor/TentorSidebar'

export default async function TentorLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (profile?.role !== 'tentor') redirect('/login')

  return (
    <>
      <style>{`
        .tentor-layout { display: flex; height: 100vh; overflow: hidden; background: #eef2ff; }
        .tentor-main { flex: 1; overflow-y: auto; display: flex; flex-direction: column; min-width: 0; }
        @media (max-width: 767px) {
          .tentor-layout { height: auto; overflow: visible; }
          .tentor-main { overflow-y: visible; padding-top: 60px; }
        }
      `}</style>
      <div className="tentor-layout">
        <TentorSidebar />
        <main className="tentor-main">{children}</main>
      </div>
    </>
  )
}