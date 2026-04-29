'use client'

import { Bell, Mail, Search } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { getInitials } from '@/lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export default function Header({ title, subtitle, actions }: HeaderProps) {
  const { profile } = useAuth()

  return (
    <>
      <style>{`
        .cbs-header-bar {
          height: 56px;
          background: #fff;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 12px;
          flex-shrink: 0;
          position: sticky;
          top: 0;
          z-index: 30;
        }

        .cbs-search {
          display: flex; align-items: center; gap: 8px;
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 10px; padding: 7px 12px;
          flex: 1; max-width: 300px;
          font-size: 12.5px; color: #94a3b8;
          cursor: pointer; transition: border 0.15s;
        }
        .cbs-search:hover { border-color: #cbd5e1; }

        .cbs-kbd {
          margin-left: auto;
          background: #e2e8f0; border-radius: 4px;
          padding: 1px 5px; font-size: 10px; color: #94a3b8;
        }

        .cbs-icon-btn {
          width: 36px; height: 36px; border-radius: 10px;
          border: 1px solid #e2e8f0; background: #fff;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; position: relative;
          transition: background 0.15s, border 0.15s;
          flex-shrink: 0;
        }
        .cbs-icon-btn:hover { background: #f8fafc; border-color: #cbd5e1; }

        .cbs-notif-dot {
          position: absolute; top: 7px; right: 7px;
          width: 7px; height: 7px;
          background: #ef4444; border-radius: 50%;
          border: 1.5px solid #fff;
        }

        .cbs-user-row {
          display: flex; align-items: center; gap: 8px;
          cursor: pointer; padding: 4px 8px; border-radius: 10px;
          transition: background 0.15s;
        }
        .cbs-user-row:hover { background: #f8fafc; }

        .cbs-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: #ffd000;
          border: 2px solid #ffd000;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #1a3a8f;
          flex-shrink: 0;
        }

        .cbs-page-head {
          display: flex; align-items: flex-start;
          justify-content: space-between;
          padding: 20px 24px 0;
          flex-wrap: wrap; gap: 12px;
        }

        .cbs-page-title {
          font-size: 22px; font-weight: 700;
          color: #0f172a; letter-spacing: -0.5px;
          line-height: 1.2;
        }

        .cbs-page-sub {
          font-size: 12.5px; color: #94a3b8; margin-top: 3px;
        }

        .cbs-actions {
          display: flex; gap: 8px; align-items: center;
          flex-wrap: wrap;
        }

        @media (max-width: 767px) {
          .cbs-header-bar { padding: 0 16px 0 60px; }
          .cbs-search { display: none; }
          .cbs-user-info { display: none; }
          .cbs-page-head { padding: 16px 16px 0; }
          .cbs-page-title { font-size: 18px; }
          .cbs-actions { width: 100%; }
        }
      `}</style>

      {/* Top Bar */}
      <div className="cbs-header-bar">
        <div className="cbs-search">
          <Search style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span>Cari siswa, sesi, jadwal...</span>
          <span className="cbs-kbd">⌘F</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="cbs-icon-btn">
            <Mail style={{ width: 15, height: 15, color: '#64748b' }} />
          </div>
          <div className="cbs-icon-btn">
            <Bell style={{ width: 15, height: 15, color: '#64748b' }} />
            <div className="cbs-notif-dot" />
          </div>
          <div className="cbs-user-row">
            <div className="cbs-avatar">
              {getInitials(profile?.full_name ?? 'A')}
            </div>
            <div className="cbs-user-info">
              <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>
                {profile?.full_name ?? 'Admin'}
              </p>
              <p style={{ fontSize: 10, color: '#94a3b8', textTransform: 'capitalize', marginTop: 2 }}>
                {profile?.role}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Page Header */}
      <div className="cbs-page-head">
        <div>
          <h1 className="cbs-page-title">{title}</h1>
          {subtitle && <p className="cbs-page-sub">{subtitle}</p>}
        </div>
        {actions && <div className="cbs-actions">{actions}</div>}
      </div>
    </>
  )
}