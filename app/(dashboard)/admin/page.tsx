// app/(dashboard)/admin/page.tsx
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { Plus, Download } from 'lucide-react'
import Link from 'next/link'
import Header from '@/components/admin/Header'
import StatCard from '@/components/admin/StatCard'
import { formatRupiah, formatTanggal, NAMA_BULAN } from '@/lib/utils'

async function getDashboardData() {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')
  const bulanIni = new Date().getMonth() + 1
  const tahunIni = new Date().getFullYear()

  const [siswa, sesiHariIni, sppData, jurnalHariIni, recentSesi, tentorList] =
    await Promise.all([
      supabase.from('siswa').select('id', { count: 'exact' }).eq('aktif', true),
      supabase.from('sesi')
        .select('*, tentor:profiles(full_name), sesi_siswa(siswa_id), jurnal(id)')
        .eq('tanggal', today).order('jam_mulai'),
      supabase.from('spp')
        .select('status')
        .eq('bulan', bulanIni).eq('tahun', tahunIni),
      supabase.from('jurnal').select('id', { count: 'exact' })
        .gte('submitted_at', `${today}T00:00:00`),
      supabase.from('sesi')
        .select('*, tentor:profiles(full_name), sesi_siswa(hadir, siswa:siswa(nama))')
        .order('tanggal', { ascending: false })
        .order('jam_mulai', { ascending: false })
        .limit(6),
      supabase.from('profiles').select('id, full_name').eq('role', 'tentor'),
    ])

  const totalSiswa = siswa.count ?? 0
  const sppLunas = sppData.data?.filter(s => s.status === 'lunas').length ?? 0
  const sppBelum = sppData.data?.filter(s => s.status === 'belum').length ?? 0
  const jurnalCount = jurnalHariIni.count ?? 0
  const sesiCount = sesiHariIni.data?.length ?? 0
  const jurnalPending = sesiCount - jurnalCount

  return {
    totalSiswa,
    sesiHariIni: sesiHariIni.data ?? [],
    sesiCount,
    sppLunas,
    sppBelum,
    jurnalCount,
    jurnalPending,
    recentSesi: recentSesi.data ?? [],
    tentorList: tentorList.data ?? [],
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()
  const todayStr = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })
  const bulanIni = NAMA_BULAN[new Date().getMonth() + 1]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

        .dash-wrap {
          font-family: 'DM Sans', sans-serif;
          padding: 20px 24px 32px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        /* STAT GRID */
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
        }

        /* ROW 2 */
        .row2 {
          display: grid;
          grid-template-columns: 1fr 260px;
          gap: 12px;
        }

        /* ROW 3 */
        .row3 {
          display: grid;
          grid-template-columns: 1fr 1fr 220px;
          gap: 12px;
        }

        /* CARD BASE */
        .d-card {
          background: #ffffff;
          border-radius: 18px;
          border: 1px solid #f1f5f9;
          padding: 18px;
        }

        .d-card-title {
          font-size: 13px;
          font-weight: 600;
          color: #0f172a;
          margin-bottom: 14px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .d-card-link {
          font-size: 11px;
          color: #2557d6;
          text-decoration: none;
          font-weight: 500;
        }
        .d-card-link:hover { text-decoration: underline; }

        /* STAT CARD */
        .s-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #f1f5f9;
          padding: 18px;
          position: relative;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .s-card:hover {
          box-shadow: 0 8px 28px rgba(37,87,214,0.1);
          transform: translateY(-2px);
        }
        .s-card.featured {
          background: linear-gradient(135deg, #1a3a8f 0%, #2557d6 100%);
          border: none;
        }
        .s-label {
          font-size: 10px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.6px;
          margin-bottom: 10px;
        }
        .s-value {
          font-size: 38px; font-weight: 700;
          letter-spacing: -2px; line-height: 1;
          margin-bottom: 10px;
        }
        .s-trend {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; font-weight: 500;
        }
        .s-trend-icon {
          width: 20px; height: 20px; border-radius: 6px;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px;
        }
        .s-arrow {
          position: absolute; top: 16px; right: 16px;
          width: 26px; height: 26px; border-radius: 50%;
          border: 1px solid; display: flex;
          align-items: center; justify-content: center;
        }
        .s-orb {
          position: absolute; bottom: -24px; right: -24px;
          width: 100px; height: 100px; border-radius: 50%;
          background: radial-gradient(circle, rgba(255,208,0,0.2), transparent 70%);
          pointer-events: none;
        }

        /* BAR CHART */
        .bar-chart {
          display: flex; align-items: flex-end;
          gap: 6px; height: 90px;
        }
        .bar-group {
          flex: 1; display: flex;
          flex-direction: column; align-items: center; gap: 5px;
        }
        .bar-track {
          width: 100%; display: flex;
          flex-direction: column; align-items: center;
          justify-content: flex-end; flex: 1;
          position: relative;
        }
        .bar-fill {
          width: 100%; border-radius: 5px 5px 0 0;
          transition: height 0.3s;
        }
        .bar-pct {
          position: absolute; top: -16px;
          left: 50%; transform: translateX(-50%);
          font-size: 9px; font-weight: 700;
          color: #1a3a8f; white-space: nowrap;
        }
        .bar-lbl { font-size: 9px; color: #94a3b8; }

        /* REMINDER CARD */
        .remind-card {
          background: #fff;
          border-radius: 18px;
          border: 1px solid #f1f5f9;
          padding: 18px;
          display: flex;
          flex-direction: column;
        }
        .remind-title {
          font-size: 17px; font-weight: 700;
          color: #0f172a; line-height: 1.25;
          margin-bottom: 6px;
        }
        .remind-sub {
          font-size: 11.5px; color: #94a3b8;
          margin-bottom: auto; padding-bottom: 16px;
        }
        .remind-btn {
          width: 100%; background: #1a3a8f;
          color: #fff; border: none; border-radius: 12px;
          padding: 11px; font-size: 12.5px; font-weight: 600;
          cursor: pointer; transition: background 0.15s;
          font-family: inherit;
        }
        .remind-btn:hover { background: #2557d6; }

        /* SESI LIST */
        .sesi-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 0;
          border-bottom: 1px solid #f8fafc;
        }
        .sesi-item:last-child { border-bottom: none; }
        .sesi-av {
          width: 32px; height: 32px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; flex-shrink: 0;
        }
        .sesi-name { font-size: 12px; font-weight: 500; color: #0f172a; }
        .sesi-meta { font-size: 10px; color: #94a3b8; margin-top: 1px; }

        /* BADGES */
        .badge {
          font-size: 10px; font-weight: 600;
          padding: 3px 8px; border-radius: 99px; flex-shrink: 0;
        }
        .badge-selesai { background: #dcfce7; color: #166534; }
        .badge-berlangsung { background: #dbeafe; color: #1d4ed8; }
        .badge-terjadwal { background: #f1f5f9; color: #64748b; }
        .badge-dibatalkan { background: #fee2e2; color: #dc2626; }

        /* DONUT */
        .donut-wrap {
          display: flex; flex-direction: column;
          align-items: center; gap: 10px;
        }
        .donut-legend {
          display: flex; gap: 12px;
          flex-wrap: wrap; justify-content: center;
        }
        .legend-item {
          display: flex; align-items: center;
          gap: 5px; font-size: 10.5px; color: #64748b;
        }
        .legend-dot {
          width: 8px; height: 8px; border-radius: 50%;
        }

        /* TABLE */
        .d-table { width: 100%; border-collapse: collapse; }
        .d-table th {
          text-align: left; font-size: 10.5px;
          font-weight: 600; color: #94a3b8;
          padding-bottom: 10px; white-space: nowrap;
        }
        .d-table td {
          font-size: 12px; color: #374151;
          padding: 10px 0; border-bottom: 1px solid #f8fafc;
          vertical-align: middle;
        }
        .d-table tr:last-child td { border-bottom: none; }
        .d-table tr:hover td { background: #fafbff; }

        /* TENTOR LIST */
        .tentor-item {
          display: flex; align-items: center; gap: 8px;
          padding: 7px 0; border-bottom: 1px solid #f8fafc;
        }
        .tentor-item:last-child { border-bottom: none; }
        .tentor-av {
          width: 30px; height: 30px; border-radius: 50%;
          background: #eff6ff;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700; color: #1d4ed8;
          flex-shrink: 0;
        }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .stat-grid { grid-template-columns: repeat(2, 1fr); }
          .row2 { grid-template-columns: 1fr; }
          .row3 { grid-template-columns: 1fr 1fr; }
          .row3 > :last-child { grid-column: 1 / -1; }
        }

        @media (max-width: 640px) {
          .dash-wrap { padding: 16px 14px 24px; gap: 12px; }
          .stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .row2, .row3 { grid-template-columns: 1fr; }
          .s-value { font-size: 30px; }
          .d-table th, .d-table td { font-size: 11px; }
        }
      `}</style>

      <div className="dash-wrap">

        {/* ── STAT CARDS ── */}
        <div className="stat-grid">
          {/* Featured */}
          <div className="s-card featured">
            <p className="s-label" style={{ color: 'rgba(255,255,255,0.55)' }}>Total Siswa</p>
            <p className="s-value" style={{ color: '#fff' }}>{data.totalSiswa}</p>
            <div className="s-trend">
              <div className="s-trend-icon" style={{ background: 'rgba(255,255,255,0.15)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" width="10" height="10">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>+4 dari bulan lalu</span>
            </div>
            <div className="s-arrow" style={{ borderColor: 'rgba(255,255,255,0.25)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" width="10" height="10">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
            <div className="s-orb" />
          </div>

          {/* Sesi */}
          <div className="s-card">
            <p className="s-label" style={{ color: '#94a3b8' }}>Sesi Hari Ini</p>
            <p className="s-value" style={{ color: '#0f172a' }}>{data.sesiCount}</p>
            <div className="s-trend">
              <div className="s-trend-icon" style={{ background: '#dbeafe' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5" width="10" height="10">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                  <polyline points="17 6 23 6 23 12"/>
                </svg>
              </div>
              <span style={{ color: '#1d4ed8', fontSize: 10 }}>
                {data.sesiHariIni.filter((s: any) => s.status === 'berlangsung').length} berlangsung
              </span>
            </div>
            <div className="s-arrow" style={{ borderColor: '#e2e8f0' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="10" height="10">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
          </div>

          {/* SPP */}
          <div className="s-card">
            <p className="s-label" style={{ color: '#94a3b8' }}>SPP Lunas ({bulanIni})</p>
            <p className="s-value" style={{ color: '#0f172a' }}>{data.sppLunas}</p>
            <div className="s-trend">
              <div className="s-trend-icon" style={{ background: '#fef3c7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" width="10" height="10">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
              </div>
              <span style={{ color: '#d97706', fontSize: 10 }}>{data.sppBelum} belum bayar</span>
            </div>
            <div className="s-arrow" style={{ borderColor: '#e2e8f0' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="10" height="10">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
          </div>

          {/* Jurnal */}
          <div className="s-card">
            <p className="s-label" style={{ color: '#94a3b8' }}>Jurnal Hari Ini</p>
            <p className="s-value" style={{ color: '#0f172a' }}>{data.jurnalCount}</p>
            <div className="s-trend">
              <div className="s-trend-icon" style={{ background: data.jurnalPending > 0 ? '#fef3c7' : '#dcfce7' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke={data.jurnalPending > 0 ? '#d97706' : '#16a34a'} strokeWidth="2.5" width="10" height="10">
                  {data.jurnalPending > 0
                    ? <line x1="5" y1="12" x2="19" y2="12"/>
                    : <polyline points="20 6 9 17 4 12"/>}
                </svg>
              </div>
              <span style={{ color: data.jurnalPending > 0 ? '#d97706' : '#16a34a', fontSize: 10 }}>
                {data.jurnalPending > 0 ? `${data.jurnalPending} belum submit` : 'Semua sudah submit'}
              </span>
            </div>
            <div className="s-arrow" style={{ borderColor: '#e2e8f0' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" width="10" height="10">
                <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
              </svg>
            </div>
          </div>
        </div>

        {/* ── ROW 2: Chart + Reminder ── */}
        <div className="row2">
          <div className="d-card">
            <div className="d-card-title">
              Statistik Sesi Mingguan
              <Link href="/admin/jadwal" className="d-card-link">Lihat Jadwal →</Link>
            </div>
            <WeeklyChart />
          </div>
          <div className="remind-card">
            <p style={{ fontSize: 10, fontWeight: 600, color: '#ffd000', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: 10, background: '#1a3a8f', display: 'inline-block', padding: '3px 8px', borderRadius: 6 }}>
              Pengingat
            </p>
            <p className="remind-title">Deadline SPP<br />{bulanIni}</p>
            <p className="remind-sub">
              <strong style={{ color: '#374151' }}>{data.sppBelum} siswa</strong> belum bayar bulan ini
            </p>
            <Link href="/admin/spp">
              <button className="remind-btn">Cek Status SPP →</button>
            </Link>
          </div>
        </div>

        {/* ── ROW 3: Sesi + Donut + Tentor ── */}
        <div className="row3">
          {/* Sesi Aktif */}
          <div className="d-card">
            <div className="d-card-title">
              Sesi Hari Ini
              <Link href="/admin/jadwal" className="d-card-link">+ Buat Jadwal</Link>
            </div>
            {data.sesiHariIni.length === 0 ? (
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                Tidak ada sesi hari ini
              </p>
            ) : (
              data.sesiHariIni.slice(0, 4).map((sesi: any) => (
                <SesiItem key={sesi.id} sesi={sesi} />
              ))
            )}
          </div>

          {/* SPP Donut */}
          <div className="d-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="d-card-title" style={{ width: '100%' }}>Progress SPP</div>
            <SppDonut lunas={data.sppLunas} belum={data.sppBelum} />
            <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 12, textAlign: 'center' }}>
              Total: <strong style={{ color: '#0f172a' }}>{formatRupiah((data.sppLunas + data.sppBelum) * 500000)}</strong>
            </p>
          </div>

          {/* Tentor Aktif */}
          <div className="d-card">
            <div className="d-card-title">
              Tentor Aktif
              <Link href="/admin/siswa" className="d-card-link">+ Tambah</Link>
            </div>
            {data.tentorList.slice(0, 5).map((t: any) => (
              <div key={t.id} className="tentor-item">
                <div className="tentor-av">
                  {t.full_name.split(' ').slice(0, 2).map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{t.full_name}</p>
                  <p style={{ fontSize: 10, color: '#94a3b8' }}>Tentor Aktif</p>
                </div>
              </div>
            ))}
            {data.tentorList.length === 0 && (
              <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
                Belum ada tentor
              </p>
            )}
          </div>
        </div>

        {/* ── ROW 4: Tabel Sesi Terbaru ── */}
        <div className="d-card">
          <div className="d-card-title">
            Sesi Terbaru
            <Link href="/admin/jadwal" className="d-card-link">Lihat semua →</Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="d-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Tentor</th>
                  <th>Mapel</th>
                  <th>Jam</th>
                  <th>Durasi</th>
                  <th>Siswa</th>
                  <th>Jurnal</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentSesi.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', color: '#94a3b8', padding: '24px 0' }}>
                      Belum ada data sesi
                    </td>
                  </tr>
                ) : (
                  data.recentSesi.map((sesi: any) => (
                    <tr key={sesi.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatTanggal(sesi.tanggal)}</td>
                      <td style={{ fontWeight: 500, color: '#0f172a', whiteSpace: 'nowrap' }}>
                        {sesi.tentor?.full_name ?? '-'}
                      </td>
                      <td>{sesi.mapel}</td>
                      <td>{sesi.jam_mulai?.slice(0, 5)}</td>
                      <td>{sesi.durasi} mnt</td>
                      <td>{sesi.sesi_siswa?.length ?? 0} siswa</td>
                      <td>
                        {sesi.jurnal
                          ? <span className="badge badge-selesai">Ada</span>
                          : <span className="badge badge-terjadwal">Belum</span>}
                      </td>
                      <td><SesiStatusBadge status={sesi.status} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </>
  )
}

// ─── Sub Components ──────────────────────────────────────

function SesiItem({ sesi }: { sesi: any }) {
  const colors = ['#dbeafe|#1d4ed8', '#dcfce7|#166534', '#fef3c7|#92400e', '#ede9fe|#6d28d9']
  const idx = Math.abs(sesi.id?.charCodeAt(0) ?? 0) % colors.length
  const [bg, fg] = colors[idx].split('|')
  const initials = sesi.tentor?.full_name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') ?? '?'

  return (
    <div className="sesi-item">
      <div className="sesi-av" style={{ background: bg, color: fg }}>{initials}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="sesi-name">{sesi.tentor?.full_name ?? 'Tentor'}</p>
        <p className="sesi-meta">{sesi.mapel} · {sesi.jam_mulai?.slice(0, 5)}</p>
      </div>
      <SesiStatusBadge status={sesi.status} />
    </div>
  )
}

function SesiStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    selesai: 'badge-selesai',
    berlangsung: 'badge-berlangsung',
    terjadwal: 'badge-terjadwal',
    dibatalkan: 'badge-dibatalkan',
  }
  const label: Record<string, string> = {
    selesai: 'Selesai', berlangsung: 'Berlangsung',
    terjadwal: 'Terjadwal', dibatalkan: 'Dibatalkan',
  }
  return <span className={`badge ${map[status] ?? 'badge-terjadwal'}`}>{label[status] ?? status}</span>
}

function WeeklyChart() {
  const days = [
    { label: 'Sen', pct: 40, color: '#e8edf5' },
    { label: 'Sel', pct: 65, color: '#74aadc' },
    { label: 'Rab', pct: 74, color: '#1a3a8f', active: true },
    { label: 'Kam', pct: 90, color: '#e8edf5' },
    { label: 'Jum', pct: 30, color: '#e8edf5' },
    { label: 'Sab', pct: 55, color: '#ffd000' },
    { label: 'Min', pct: 20, color: '#e8edf5' },
  ]
  return (
    <div className="bar-chart">
      {days.map(d => (
        <div key={d.label} className="bar-group">
          <div className="bar-track">
            {d.active && <span className="bar-pct">{d.pct}%</span>}
            <div className="bar-fill" style={{ height: `${d.pct}%`, background: d.color }} />
          </div>
          <span className="bar-lbl">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

function SppDonut({ lunas, belum }: { lunas: number; belum: number }) {
  const total = lunas + belum || 1
  const pct = Math.round((lunas / total) * 100)
  const r = 52
  const circ = 2 * Math.PI * r
  const lunasArc = (lunas / total) * circ
  const belumArc = (belum / total) * circ

  return (
    <div className="donut-wrap">
      <div style={{ position: 'relative', width: 130, height: 130 }}>
        <svg viewBox="0 0 120 120" width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f1f5f9" strokeWidth="13" />
          {belum > 0 && (
            <circle cx="60" cy="60" r={r} fill="none" stroke="#ffd000" strokeWidth="13"
              strokeDasharray={`${belumArc} ${circ}`}
              strokeDashoffset={-lunasArc} strokeLinecap="round" />
          )}
          {lunas > 0 && (
            <circle cx="60" cy="60" r={r} fill="none" stroke="#1a3a8f" strokeWidth="13"
              strokeDasharray={`${lunasArc} ${circ}`}
              strokeDashoffset="0" strokeLinecap="round" />
          )}
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 26, fontWeight: 700, color: '#0f172a', letterSpacing: '-1px' }}>{pct}%</span>
          <span style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Lunas</span>
        </div>
      </div>
      <div className="donut-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#1a3a8f' }} />
          Lunas ({lunas})
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: '#ffd000' }} />
          Belum ({belum})
        </div>
      </div>
    </div>
  )
}