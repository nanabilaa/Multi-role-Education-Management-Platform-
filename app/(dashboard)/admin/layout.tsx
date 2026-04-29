// ============================================================
// FILE: app/(dashboard)/admin/layout.tsx
// ============================================================

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Sidebar from '@/components/admin/Sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') redirect('/login')

  return (
    <>
      <style>{`
        .admin-layout {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #f0f4ff;
        }
        .admin-main {
          flex: 1;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .admin-content {
          flex: 1;
          padding-bottom: 32px;
        }
        @media (max-width: 767px) {
          .admin-layout { height: auto; overflow: visible; }
          .admin-main { overflow-y: visible; }
        }
      `}</style>

      <div className="admin-layout">
        <Sidebar />
        <main className="admin-main">
          <div className="admin-content">
            {children}
          </div>
        </main>
      </div>
    </>
  )
}