// ============================================================
// FILE: app/(dashboard)/tentor/page.tsx  ← DASHBOARD TENTOR
// ============================================================
import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import { Plus, Clock, BookOpen, CheckCircle, Calendar } from 'lucide-react'
import { formatTanggal, formatRupiah, DAFTAR_MAPEL } from '@/lib/utils'

async function getTentorDashboard(userId: string) {
  const supabase = await createClient()
  const today = format(new Date(), 'yyyy-MM-dd')

  const [sesiHariIni, sesiMingguIni, allSesi, siswaList] = await Promise.all([
    // Sesi hari ini milik tentor ini
    supabase.from('sesi')
      .select('*, sesi_siswa(siswa_id, hadir, siswa:siswa(nama)), jurnal(id, materi)')
      .eq('tentor_id', userId).eq('tanggal', today).order('jam_mulai'),

    // Sesi minggu ini
    supabase.from('sesi')
      .select('id, tanggal, jam_mulai, mapel, durasi, status')
      .eq('tentor_id', userId)
      .gte('tanggal', format(new Date(new Date().setDate(new Date().getDate() - new Date().getDay())), 'yyyy-MM-dd'))
      .lte('tanggal', format(new Date(new Date().setDate(new Date().getDate() + (6 - new Date().getDay()))), 'yyyy-MM-dd')),

    // Semua sesi untuk hitung honor
    supabase.from('sesi')
      .select('durasi, status, tanggal')
      .eq('tentor_id', userId)
      .eq('status', 'selesai')
      .gte('tanggal', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-01`),

    // Daftar siswa aktif untuk buat sesi
    supabase.from('siswa').select('id, nama, kelas').eq('aktif', true).order('nama'),
  ])

  // Hitung estimasi honor bulan ini
  // Rate: 60 mnt = Rp 75.000, 70 mnt = Rp 85.000, 90 mnt = Rp 100.000
  const rateMap: Record<number, number> = { 60: 75000, 70: 85000, 90: 100000 }
  const honorBulanIni = allSesi.data?.reduce((sum, s) => sum + (rateMap[s.durasi] ?? 75000), 0) ?? 0

  return {
    sesiHariIni: sesiHariIni.data ?? [],
    sesiMingguIni: sesiMingguIni.data ?? [],
    totalSesiSelesai: allSesi.data?.length ?? 0,
    honorBulanIni,
    siswaList: siswaList.data ?? [],
  }
}

export default async function TentorDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user!.id).single()

  const data = await getTentorDashboard(user!.id)
  const todayStr = format(new Date(), 'EEEE, dd MMMM yyyy', { locale: id })

  return (
    <>
      <style>{`
        .t-wrap { font-family: 'DM Sans', sans-serif; padding: 0 0 32px; }
        .t-header-bar {
          height: 56px; background: #fff;
          border-bottom: 1px solid #f1f5f9;
          display: flex; align-items: center;
          padding: 0 24px; gap: 12px; flex-shrink: 0;
          position: sticky; top: 0; z-index: 30;
        }
        .t-avatar {
          width: 32px; height: 32px; border-radius: 50%;
          background: #ffd000; border: 2px solid #ffd000;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #1a3a8f;
        }
        .t-content { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
        .t-page-hdr { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
        .t-title { font-size: 22px; font-weight: 700; color: #0f172a; letter-spacing: -0.5px; }
        .t-sub { font-size: 12.5px; color: #94a3b8; margin-top: 3px; }
        .t-btn-p {
          display: flex; align-items: center; gap: 6px;
          background: #1a3a8f; color: #fff; border: none;
          border-radius: 12px; padding: 9px 16px;
          font-size: 13px; font-weight: 600; cursor: pointer;
          text-decoration: none; transition: background 0.15s;
          font-family: inherit;
        }
        .t-btn-p:hover { background: #2557d6; }

        /* STAT GRID */
        .t-stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .t-sc {
          background: #fff; border-radius: 18px;
          border: 1px solid #f1f5f9; padding: 18px;
          position: relative; overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .t-sc:hover { box-shadow: 0 8px 28px rgba(37,87,214,0.1); transform: translateY(-2px); }
        .t-sc.feat { background: linear-gradient(135deg, #1a3a8f 0%, #2557d6 100%); border: none; }
        .t-sc-icon {
          width: 36px; height: 36px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 12px;
        }
        .t-sc-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px; }
        .t-sc-val { font-size: 30px; font-weight: 700; letter-spacing: -1.5px; line-height: 1; margin-bottom: 6px; }
        .t-sc-sub { font-size: 11px; }

        /* SESI HARI INI */
        .t-row2 { display: grid; grid-template-columns: 1fr 280px; gap: 12px; }
        .t-card { background: #fff; border-radius: 18px; border: 1px solid #f1f5f9; padding: 18px; }
        .t-card-title {
          font-size: 13px; font-weight: 600; color: #0f172a;
          margin-bottom: 14px; display: flex;
          align-items: center; justify-content: space-between;
        }
        .t-card-link { font-size: 11px; color: #2557d6; text-decoration: none; font-weight: 500; }

        .t-sesi-item {
          display: flex; align-items: flex-start; gap: 12px;
          padding: 12px; border-radius: 12px;
          border: 1px solid #f1f5f9; margin-bottom: 8px;
          transition: border 0.15s, background 0.15s;
        }
        .t-sesi-item:hover { border-color: #bfdbfe; background: #f0f7ff; }
        .t-sesi-item:last-child { margin-bottom: 0; }
        .t-sesi-time {
          background: #eff6ff; border-radius: 10px;
          padding: 8px 10px; text-align: center; flex-shrink: 0;
          min-width: 52px;
        }
        .t-sesi-hh { font-size: 15px; font-weight: 700; color: #1a3a8f; line-height: 1; }
        .t-sesi-dur { font-size: 9px; color: #64748b; margin-top: 2px; }
        .t-sesi-info { flex: 1; min-width: 0; }
        .t-sesi-mapel { font-size: 13px; font-weight: 600; color: #0f172a; }
        .t-sesi-siswa { font-size: 11px; color: #64748b; margin-top: 3px; }
        .t-sesi-actions { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
        .t-btn-masuk {
          background: #1a3a8f; color: #fff; border: none;
          border-radius: 8px; padding: 6px 12px;
          font-size: 11px; font-weight: 600; cursor: pointer;
          text-decoration: none; display: inline-flex;
          align-items: center; gap: 4px; font-family: inherit;
          transition: background 0.15s;
        }
        .t-btn-masuk:hover { background: #2557d6; }
        .t-btn-jurnal {
          background: #f0f7ff; color: #1a3a8f; border: 1px solid #bfdbfe;
          border-radius: 8px; padding: 6px 12px;
          font-size: 11px; font-weight: 500; cursor: pointer;
          text-decoration: none; display: inline-flex;
          align-items: center; gap: 4px; font-family: inherit;
        }

        /* JADWAL MINGGU */
        .t-jadwal-item {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 0; border-bottom: 1px solid #f8fafc;
        }
        .t-jadwal-item:last-child { border-bottom: none; }
        .t-jadwal-dot {
          width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
        }

        .badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 99px; }
        .badge-selesai { background: #dcfce7; color: #166534; }
        .badge-berlangsung { background: #dbeafe; color: #1d4ed8; }
        .badge-terjadwal { background: #f1f5f9; color: #64748b; }

        /* RESPONSIVE */
        @media (max-width: 1024px) {
          .t-stat-grid { grid-template-columns: repeat(2, 1fr); }
          .t-row2 { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .t-content { padding: 14px 14px; gap: 12px; }
          .t-stat-grid { grid-template-columns: repeat(2, 1fr); gap: 8px; }
          .t-title { font-size: 18px; }
        }
      `}</style>

      <div className="t-wrap">
        {/* Top Bar */}
        <div className="t-header-bar">
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="t-avatar">
              {profile?.full_name?.split(' ').slice(0, 2).map((n: string) => n[0]).join('') ?? 'T'}
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#0f172a', lineHeight: 1 }}>{profile?.full_name}</p>
              <p style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>Tentor</p>
            </div>
          </div>
        </div>

        <div className="t-content">
          {/* Page Header */}
          <div className="t-page-hdr">
            <div>
              <h1 className="t-title">Selamat Datang, {profile?.full_name?.split(' ')[0]}! 👋</h1>
              <p className="t-sub">{todayStr}</p>
            </div>
            <Link href="/tentor/sesi/buat" className="t-btn-p">
              <Plus style={{ width: 14, height: 14 }} />
              Buat Sesi Baru
            </Link>
          </div>

          {/* STAT CARDS */}
          <div className="t-stat-grid">
            <div className="t-sc feat">
              <div className="t-sc-icon" style={{ background: 'rgba(255,208,0,0.2)' }}>
                <Calendar style={{ width: 18, height: 18, color: '#ffd000' }} />
              </div>
              <p className="t-sc-label" style={{ color: 'rgba(255,255,255,0.55)' }}>Sesi Hari Ini</p>
              <p className="t-sc-val" style={{ color: '#fff' }}>{data.sesiHariIni.length}</p>
              <p className="t-sc-sub" style={{ color: 'rgba(255,255,255,0.6)' }}>
                {data.sesiHariIni.filter(s => s.status === 'selesai').length} sudah selesai
              </p>
              <div style={{ position: 'absolute', bottom: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,208,0,0.2), transparent 70%)' }} />
            </div>

            <div className="t-sc">
              <div className="t-sc-icon" style={{ background: '#eff6ff' }}>
                <BookOpen style={{ width: 18, height: 18, color: '#1a3a8f' }} />
              </div>
              <p className="t-sc-label" style={{ color: '#94a3b8' }}>Sesi Minggu Ini</p>
              <p className="t-sc-val" style={{ color: '#0f172a' }}>{data.sesiMingguIni.length}</p>
              <p className="t-sc-sub" style={{ color: '#64748b' }}>sesi terjadwal</p>
            </div>

            <div className="t-sc">
              <div className="t-sc-icon" style={{ background: '#f0fdf4' }}>
                <CheckCircle style={{ width: 18, height: 18, color: '#16a34a' }} />
              </div>
              <p className="t-sc-label" style={{ color: '#94a3b8' }}>Sesi Selesai</p>
              <p className="t-sc-val" style={{ color: '#0f172a' }}>{data.totalSesiSelesai}</p>
              <p className="t-sc-sub" style={{ color: '#64748b' }}>bulan ini</p>
            </div>

            <div className="t-sc">
              <div className="t-sc-icon" style={{ background: '#fefce8' }}>
                <DollarSign style={{ width: 18, height: 18, color: '#ca8a04' }} />
              </div>
              <p className="t-sc-label" style={{ color: '#94a3b8' }}>Est. Honor</p>
              <p style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 6, lineHeight: 1 }}>
                {formatRupiah(data.honorBulanIni)}
              </p>
              <p className="t-sc-sub" style={{ color: '#64748b' }}>bulan ini</p>
            </div>
          </div>

          {/* ROW 2: Sesi Hari Ini + Jadwal Minggu */}
          <div className="t-row2">
            {/* Sesi Hari Ini */}
            <div className="t-card">
              <div className="t-card-title">
                Sesi Hari Ini
                <Link href="/tentor/sesi/buat" className="t-card-link">+ Buat Sesi</Link>
              </div>
              {data.sesiHariIni.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                  <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Tidak ada sesi hari ini</p>
                  <Link href="/tentor/sesi/buat" className="t-btn-masuk">
                    <Plus style={{ width: 12, height: 12 }} /> Buat Sesi Baru
                  </Link>
                </div>
              ) : (
                data.sesiHariIni.map((sesi: any) => (
                  <div key={sesi.id} className="t-sesi-item">
                    <div className="t-sesi-time">
                      <div className="t-sesi-hh">{sesi.jam_mulai?.slice(0, 5)}</div>
                      <div className="t-sesi-dur">{sesi.durasi} mnt</div>
                    </div>
                    <div className="t-sesi-info">
                      <div className="t-sesi-mapel">{sesi.mapel}</div>
                      <div className="t-sesi-siswa">
                        {sesi.sesi_siswa?.length ?? 0} siswa ·{' '}
                        {sesi.sesi_siswa?.map((ss: any) => ss.siswa?.nama).slice(0, 2).join(', ')}
                        {(sesi.sesi_siswa?.length ?? 0) > 2 && ` +${sesi.sesi_siswa.length - 2} lainnya`}
                      </div>
                      <div className="t-sesi-actions">
                        {sesi.status !== 'selesai' ? (
                          <Link href={`/tentor/sesi/${sesi.id}/masuk`} className="t-btn-masuk">
                            Masuk Sesi →
                          </Link>
                        ) : (
                          <span className="badge badge-selesai">✓ Selesai</span>
                        )}
                        {sesi.jurnal ? (
                          <span style={{ fontSize: 11, color: '#16a34a', display: 'flex', alignItems: 'center', gap: 3 }}>
                            <CheckCircle style={{ width: 12, height: 12 }} /> Jurnal tersubmit
                          </span>
                        ) : sesi.status === 'selesai' ? (
                          <Link href={`/tentor/sesi/${sesi.id}/jurnal`} className="t-btn-jurnal">
                            Isi Jurnal
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Jadwal Minggu Ini */}
            <div className="t-card">
              <div className="t-card-title">
                Jadwal Minggu Ini
                <Link href="/tentor/jadwal" className="t-card-link">Semua →</Link>
              </div>
              {data.sesiMingguIni.length === 0 ? (
                <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>
                  Belum ada jadwal minggu ini
                </p>
              ) : (
                data.sesiMingguIni.slice(0, 6).map((sesi: any) => (
                  <div key={sesi.id} className="t-jadwal-item">
                    <div className="t-jadwal-dot" style={{
                      background: sesi.status === 'selesai' ? '#16a34a'
                        : sesi.status === 'berlangsung' ? '#1d4ed8' : '#94a3b8'
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{sesi.mapel}</p>
                      <p style={{ fontSize: 10, color: '#94a3b8' }}>
                        {formatTanggal(sesi.tanggal)} · {sesi.jam_mulai?.slice(0, 5)}
                      </p>
                    </div>
                    <span className={`badge badge-${sesi.status}`}>
                      {sesi.status === 'selesai' ? 'Selesai' : sesi.status === 'berlangsung' ? 'Berlangsung' : 'Terjadwal'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}