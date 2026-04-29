// ============================================================
// FILE 1: components/admin/StatCard.tsx
// ============================================================

import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  trend?: string
  trendType?: 'up' | 'down' | 'neutral'
  featured?: boolean
  onClick?: () => void
}

export default function StatCard({
  label, value, trend, trendType = 'up', featured, onClick
}: StatCardProps) {
  return (
    <>
      <style>{`
        .stat-card {
          border-radius: 18px;
          padding: 20px;
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
          background: #fff;
          transition: box-shadow 0.2s, transform 0.2s;
          cursor: ${onClick ? 'pointer' : 'default'};
        }
        .stat-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.08);
          transform: translateY(-1px);
        }
        .stat-card.featured {
          background: linear-gradient(135deg, #1a3a8f 0%, #2557d6 100%);
          border-color: #2557d6;
        }
        .stat-label {
          font-size: 11px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.6px;
          margin-bottom: 10px;
        }
        .stat-value {
          font-size: 36px; font-weight: 700;
          letter-spacing: -1.5px; line-height: 1;
          margin-bottom: 10px;
        }
        .stat-trend {
          display: flex; align-items: center; gap: 6px;
          font-size: 11.5px; font-weight: 500;
        }
        .stat-trend-icon {
          width: 20px; height: 20px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
        }
        .stat-arrow {
          position: absolute; top: 18px; right: 18px;
          width: 28px; height: 28px; border-radius: 50%;
          border: 1px solid;
          display: flex; align-items: center; justify-content: center;
        }
      `}</style>

      <div
        className={`stat-card${featured ? ' featured' : ''}`}
        onClick={onClick}
      >
        <p className="stat-label" style={{ color: featured ? 'rgba(255,255,255,0.6)' : '#94a3b8' }}>
          {label}
        </p>

        <p className="stat-value" style={{ color: featured ? '#fff' : '#0f172a' }}>
          {value}
        </p>

        {trend && (
          <div className="stat-trend">
            <span
              className="stat-trend-icon"
              style={{
                background: featured
                  ? 'rgba(255,255,255,0.15)'
                  : trendType === 'up' ? '#dcfce7'
                  : trendType === 'down' ? '#fee2e2' : '#fef3c7',
              }}
            >
              {trendType === 'up'
                ? <TrendingUp style={{ width: 11, height: 11, color: featured ? '#fff' : '#16a34a' }} />
                : trendType === 'down'
                ? <TrendingDown style={{ width: 11, height: 11, color: '#dc2626' }} />
                : <Minus style={{ width: 11, height: 11, color: '#d97706' }} />}
            </span>
            <span style={{
              color: featured ? 'rgba(255,255,255,0.75)'
                : trendType === 'up' ? '#16a34a'
                : trendType === 'down' ? '#dc2626' : '#d97706'
            }}>
              {trend}
            </span>
          </div>
        )}

        {/* Corner arrow */}
        <div
          className="stat-arrow"
          style={{ borderColor: featured ? 'rgba(255,255,255,0.2)' : '#e2e8f0' }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
            stroke={featured ? 'rgba(255,255,255,0.6)' : '#94a3b8'} strokeWidth="2">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        </div>

        {/* Featured glow orb */}
        {featured && (
          <div style={{
            position: 'absolute', bottom: -30, right: -30,
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,208,0,0.2), transparent 70%)',
            pointerEvents: 'none',
          }} />
        )}
      </div>
    </>
  )
}


// ============================================================
// FILE 2: app/globals.css  (GANTI SELURUH ISI)
// ============================================================

/*
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

@layer base {
  * { box-sizing: border-box; }

  body {
    font-family: 'DM Sans', system-ui, sans-serif;
    background: #f0f4ff;
    color: #0f172a;
    -webkit-font-smoothing: antialiased;
  }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: #f1f5f9; }
  ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 99px; }
}

@layer components {
  .btn-primary {
    @apply flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
           bg-blue-700 text-white hover:bg-blue-800 transition-colors cursor-pointer
           border-0 outline-none;
  }
  .btn-outline {
    @apply flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
           bg-white text-gray-700 border border-gray-200
           hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer outline-none;
  }
  .btn-danger {
    @apply flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
           bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer border-0;
  }
  .card {
    @apply bg-white rounded-2xl border border-slate-100 p-5;
  }
  .input-base {
    @apply w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm
           focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400
           placeholder:text-slate-400 bg-slate-50 focus:bg-white transition-all;
  }
  .label-base {
    @apply block text-xs font-medium text-slate-600 mb-1.5;
  }
  .badge-lunas {
    @apply bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full;
  }
  .badge-belum {
    @apply bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full;
  }
  .badge-aktif {
    @apply bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-1 rounded-full;
  }
  .badge-pending {
    @apply bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full;
  }
}

@media (max-width: 767px) {
  .card { @apply p-4; }
}
*/