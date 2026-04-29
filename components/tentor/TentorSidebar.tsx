'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Calendar, BookOpen,
  DollarSign, LogOut, GraduationCap, Menu, X, ChevronRight
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

const navItems = [
  { href: '/tentor', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/tentor/jadwal', label: 'Jadwal Sesi Saya', icon: Calendar },
  { href: '/tentor/sesi', label: 'Buat Sesi Kelas', icon: BookOpen },
  { href: '/tentor/honor', label: 'Estimasi Honor', icon: DollarSign },
]

export default function TentorSidebar() {
  const pathname = usePathname()
  const { profile, signOut } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  const SidebarContent = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo */}
      <div style={{
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          width: 36, height: 36, background: '#ffd000',
          borderRadius: 10, display: 'flex', alignItems: 'center',
          justifyContent: 'center', flexShrink: 0,
        }}>
          <GraduationCap style={{ width: 20, height: 20, color: '#1a3a8f' }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.3px', lineHeight: 1 }}>CBS System</p>
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: 3 }}>Panel Tentor</p>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 12px 8px' }}>
        <p style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '0 8px', marginBottom: 8 }}>Menu</p>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.href, item.exact)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 12px', borderRadius: 10,
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  background: active ? '#ffd000' : 'transparent',
                  color: active ? '#1a3a8f' : 'rgba(255,255,255,0.65)',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = '#fff' } }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.65)' } }}
              >
                <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {active && <ChevronRight style={{ width: 14, height: 14, opacity: 0.6 }} />}
              </Link>
            )
          })}
        </nav>

        <div style={{ marginTop: 20 }}>
          <button
            onClick={signOut}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 10,
              fontSize: 13, color: 'rgba(255,100,100,0.75)',
              background: 'none', border: 'none', cursor: 'pointer',
              width: '100%', textAlign: 'left', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,100,100,0.1)'; (e.currentTarget as HTMLElement).style.color = '#ff6b6b' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,100,100,0.75)' }}
          >
            <LogOut style={{ width: 16, height: 16 }} />
            Logout
          </button>
        </div>
      </div>

      {/* User */}
      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 12px', borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: '#ffd000', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 11, fontWeight: 700,
            color: '#1a3a8f', flexShrink: 0,
          }}>
            {getInitials(profile?.full_name ?? 'T')}
          </div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#fff', lineHeight: 1, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.full_name ?? 'Tentor'}
            </p>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>Tentor</p>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'linear-gradient(180deg, #1a3a8f 0%, #2557d6 100%)',
        height: '100vh', position: 'sticky', top: 0,
        display: 'flex', flexDirection: 'column',
      }} className="tentor-sb-desktop">
        <SidebarContent />
      </aside>

      <button onClick={() => setMobileOpen(true)} className="tentor-sb-mobile-btn" style={{
        position: 'fixed', top: 14, left: 14, zIndex: 50,
        width: 40, height: 40, borderRadius: 10,
        background: '#1a3a8f', border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', boxShadow: '0 4px 12px rgba(26,58,143,0.4)',
      }}>
        <Menu style={{ width: 18, height: 18, color: '#fff' }} />
      </button>

      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 40, backdropFilter: 'blur(2px)',
        }} />
      )}

      <aside className="tentor-sb-mobile-drawer" style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: 240,
        zIndex: 50, background: 'linear-gradient(180deg, #1a3a8f 0%, #2557d6 100%)',
        transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex', flexDirection: 'column',
      }}>
        <button onClick={() => setMobileOpen(false)} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,255,255,0.1)', border: 'none',
          borderRadius: 8, width: 32, height: 32,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <X style={{ width: 16, height: 16, color: '#fff' }} />
        </button>
        <SidebarContent />
      </aside>

      <style>{`
        @media (min-width: 768px) {
          .tentor-sb-desktop { display: flex !important; }
          .tentor-sb-mobile-btn { display: none !important; }
          .tentor-sb-mobile-drawer { display: none !important; }
        }
        @media (max-width: 767px) {
          .tentor-sb-desktop { display: none !important; }
          .tentor-sb-mobile-btn { display: flex !important; }
          .tentor-sb-mobile-drawer { display: flex !important; }
        }
      `}</style>
    </>
  )
}