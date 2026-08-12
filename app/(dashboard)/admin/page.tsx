import { createClient } from '@/lib/supabase/server'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import Link from 'next/link'
import {
  ArrowUpRight,
  Banknote,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  GraduationCap,
  Sparkles,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { formatRupiah, formatTanggal, NAMA_BULAN } from '@/lib/utils'

function getGreeting() {
  const hour = new Date().getHours()

  if (hour >= 4 && hour < 11) return 'Selamat pagi'
  if (hour >= 11 && hour < 15) return 'Selamat siang'
  if (hour >= 15 && hour < 18) return 'Selamat sore'
  return 'Selamat malam'
}

async function getDashboardData() {
  const supabase = await createClient()

  const today = format(new Date(), 'yyyy-MM-dd')
  const bulanIni = new Date().getMonth() + 1
  const tahunIni = new Date().getFullYear()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [
    profileRes,
    siswa,
    sesiHariIni,
    sppData,
    jurnalHariIni,
    recentSesi,
    tentorList,
    transaksiDana,
  ] = await Promise.all([
    user
      ? supabase
          .from('profiles')
          .select('id, full_name, role')
          .eq('id', user.id)
          .single()
      : Promise.resolve({ data: null, error: null }),

    supabase.from('siswa').select('id', { count: 'exact' }).eq('aktif', true),

    supabase
      .from('sesi')
      .select('*, tentor:profiles(full_name), sesi_siswa(siswa_id), jurnal(id)')
      .eq('tanggal', today)
      .order('jam_mulai'),

    supabase
      .from('spp')
      .select('status, nominal, dibayar')
      .eq('bulan', bulanIni)
      .eq('tahun', tahunIni),

    supabase
      .from('jurnal')
      .select('id', { count: 'exact' })
      .gte('submitted_at', `${today}T00:00:00`),

    supabase
      .from('sesi')
      .select('*, tentor:profiles(full_name), sesi_siswa(hadir, siswa:siswa(nama)), jurnal(id)')
      .order('tanggal', { ascending: false })
      .order('jam_mulai', { ascending: false })
      .limit(7),

    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tentor')
      .order('full_name', { ascending: true }),

    supabase
      .from('transaksi_dana')
      .select('jenis, nominal')
      .gte('tanggal', `${tahunIni}-${String(bulanIni).padStart(2, '0')}-01`),
  ])

  const totalSiswa = siswa.count ?? 0
  const sesiCount = sesiHariIni.data?.length ?? 0
  const jurnalCount = jurnalHariIni.count ?? 0
  const jurnalPending = Math.max(sesiCount - jurnalCount, 0)

  const sppLunas =
    sppData.data?.filter((item) => item.status === 'lunas').length ?? 0

  const sppBelum =
    sppData.data?.filter((item) => item.status === 'belum').length ?? 0

  const totalTagihanBulanIni =
    sppData.data?.reduce(
      (total, item: any) => total + Number(item.nominal || 0),
      0
    ) ?? 0

  const totalDibayarBulanIni =
    sppData.data?.reduce(
      (total, item: any) => total + Number(item.dibayar || 0),
      0
    ) ?? 0

  const totalTunggakanBulanIni = Math.max(
    totalTagihanBulanIni - totalDibayarBulanIni,
    0
  )

  const pemasukanBulanIni =
    transaksiDana.data
      ?.filter((item: any) => item.jenis === 'pemasukan')
      .reduce((total: number, item: any) => total + Number(item.nominal || 0), 0) ?? 0

  const pengeluaranBulanIni =
    transaksiDana.data
      ?.filter((item: any) => item.jenis === 'pengeluaran')
      .reduce((total: number, item: any) => total + Number(item.nominal || 0), 0) ?? 0

  const saldoBulanIni = pemasukanBulanIni - pengeluaranBulanIni

  return {
    adminName: profileRes.data?.full_name ?? 'Admin',
    adminRole: profileRes.data?.role ?? 'admin',
    totalSiswa,
    sesiHariIni: sesiHariIni.data ?? [],
    sesiCount,
    sppLunas,
    sppBelum,
    jurnalCount,
    jurnalPending,
    recentSesi: recentSesi.data ?? [],
    tentorList: tentorList.data ?? [],
    totalTagihanBulanIni,
    totalTunggakanBulanIni,
    pemasukanBulanIni,
    pengeluaranBulanIni,
    saldoBulanIni,
  }
}

export default async function AdminDashboard() {
  const data = await getDashboardData()

  const now = new Date()
  const greeting = getGreeting()
  const todayStr = format(now, 'EEEE, dd MMMM yyyy', { locale: id })
  const timeStr = format(now, 'HH:mm', { locale: id })
  const bulanIni = NAMA_BULAN[now.getMonth() + 1]

  return (
    <main className="min-h-screen bg-[#F8FAF7]">
      <style>{`
        .page {
          padding: 32px 40px 48px;
        }

        .inner {
          max-width: 1440px;
          margin: 0 auto;
        }

        .soft-hero {
          border-radius: 32px;
          background:
            radial-gradient(circle at top right, rgba(255, 247, 208, 0.9), transparent 35%),
            linear-gradient(135deg, #F3F8F1 0%, #FFFFFF 58%, #FFFDE8 100%);
          border: 1px solid #E7EFE6;
          padding: 30px;
        }

        .hero-grid {
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 24px;
          align-items: center;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          background: #FFFFFF;
          border: 1px solid #E7EFE6;
          color: #0B5738;
          padding: 8px 13px;
          font-size: 12px;
          font-weight: 800;
        }

        .time-pill {
          margin-top: 14px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.72);
          border: 1px solid #E7EFE6;
          color: #667085;
          padding: 9px 14px;
          font-size: 13px;
          font-weight: 800;
        }

        .hero-title {
          margin-top: 18px;
          color: #063D27;
          font-size: 44px;
          line-height: 1.08;
          letter-spacing: -1.5px;
          font-weight: 900;
        }

        .hero-name {
          color: #0B5738;
        }

        .hero-desc {
          margin-top: 14px;
          color: #667085;
          font-size: 15px;
          line-height: 1.8;
          font-weight: 500;
          max-width: 720px;
        }

        .hero-actions {
          margin-top: 24px;
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .btn-primary,
        .btn-soft {
          display: inline-flex;
          height: 44px;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border-radius: 999px;
          padding: 0 18px;
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          transition: 0.18s ease;
        }

        .btn-primary {
          background: #063D27;
          color: white;
        }

        .btn-primary:hover {
          background: #0B5738;
        }

        .btn-soft {
          background: #FFFFFF;
          color: #063D27;
          border: 1px solid #E7EFE6;
        }

        .btn-soft:hover {
          background: #F3F8F1;
        }

        .finance-card {
          border-radius: 28px;
          background: #063D27;
          color: white;
          padding: 24px;
          box-shadow: 0 18px 50px rgba(6, 61, 39, 0.16);
        }

        .finance-label {
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
          font-weight: 800;
        }

        .finance-value {
          margin-top: 9px;
          font-size: 36px;
          line-height: 1.05;
          letter-spacing: -1.2px;
          font-weight: 900;
        }

        .mini-grid {
          margin-top: 22px;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .mini-stat {
          border-radius: 18px;
          background: rgba(255, 255, 255, 0.09);
          border: 1px solid rgba(255, 255, 255, 0.12);
          padding: 13px;
        }

        .mini-label {
          color: rgba(255, 255, 255, 0.58);
          font-size: 11px;
          font-weight: 800;
        }

        .mini-value {
          margin-top: 5px;
          color: white;
          font-size: 14px;
          font-weight: 900;
        }

        .stat-grid {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
        }

        .stat-card {
          border-radius: 26px;
          background: white;
          border: 1px solid #E7EFE6;
          padding: 20px;
        }

        .stat-icon {
          width: 46px;
          height: 46px;
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .stat-green .stat-icon {
          color: #063D27;
          background: #F3F8F1;
        }

        .stat-blue .stat-icon {
          color: #2563EB;
          background: #EFF6FF;
        }

        .stat-yellow .stat-icon {
          color: #9A6A00;
          background: #FFF8D9;
        }

        .stat-cream .stat-icon {
          color: #7A5C00;
          background: #FFFBEA;
        }

        .stat-label {
          color: #667085;
          font-size: 12px;
          font-weight: 850;
        }

        .stat-value {
          margin-top: 8px;
          color: #063D27;
          font-size: 32px;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .stat-foot {
          margin-top: 4px;
          color: #98A2B3;
          font-size: 12px;
          font-weight: 750;
        }

        .grid-main {
          margin-top: 18px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 18px;
        }

        .grid-two {
          display: grid;
          grid-template-columns: 1fr;
          gap: 18px;
        }

        .panel {
          border-radius: 28px;
          background: white;
          border: 1px solid #E7EFE6;
          padding: 22px;
        }

        .panel-head {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          align-items: flex-start;
          margin-bottom: 18px;
        }

        .panel-kicker {
          color: #0B5738;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .panel-title {
          margin-top: 5px;
          color: #063D27;
          font-size: 20px;
          font-weight: 950;
          letter-spacing: -0.4px;
        }

        .panel-desc {
          margin-top: 4px;
          color: #667085;
          font-size: 13px;
          line-height: 1.6;
          font-weight: 600;
        }

        .panel-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: #063D27;
          background: #F3F8F1;
          border: 1px solid #E7EFE6;
          border-radius: 999px;
          padding: 9px 13px;
          font-size: 12px;
          font-weight: 900;
          text-decoration: none;
          white-space: nowrap;
        }

        .today-list {
          display: grid;
          gap: 10px;
        }

        .today-item {
          display: grid;
          grid-template-columns: 44px 1fr auto;
          gap: 12px;
          align-items: center;
          border-radius: 20px;
          background: #FAFCF9;
          border: 1px solid #EEF3EC;
          padding: 12px;
        }

        .avatar {
          width: 44px;
          height: 44px;
          border-radius: 17px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #F3F8F1;
          color: #063D27;
          font-size: 13px;
          font-weight: 950;
        }

        .item-title {
          color: #1F2937;
          font-size: 14px;
          font-weight: 900;
        }

        .item-meta {
          margin-top: 3px;
          color: #7A8699;
          font-size: 12px;
          font-weight: 700;
        }

        .badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 6px 10px;
          font-size: 11px;
          font-weight: 900;
          white-space: nowrap;
        }

        .badge-selesai {
          background: #ECFDF3;
          color: #027A48;
        }

        .badge-berlangsung {
          background: #EFF6FF;
          color: #2563EB;
        }

        .badge-terjadwal {
          background: #F3F8F1;
          color: #0B5738;
        }

        .badge-dibatalkan {
          background: #FEF3F2;
          color: #B42318;
        }

        .empty-state {
          border-radius: 22px;
          background: #FAFCF9;
          border: 1px solid #EEF3EC;
          padding: 28px 18px;
          text-align: center;
          color: #7A8699;
          font-size: 13px;
          font-weight: 700;
        }

        .quick-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }

        .quick-link {
          border-radius: 20px;
          background: #FAFCF9;
          border: 1px solid #EEF3EC;
          padding: 14px;
          text-decoration: none;
          transition: 0.18s ease;
        }

        .quick-link:hover {
          background: #F3F8F1;
        }

        .quick-icon {
          width: 40px;
          height: 40px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: white;
          color: #063D27;
          border: 1px solid #E7EFE6;
          margin-bottom: 12px;
        }

        .quick-title {
          color: #063D27;
          font-size: 14px;
          font-weight: 950;
        }

        .quick-desc {
          margin-top: 3px;
          color: #7A8699;
          font-size: 12px;
          font-weight: 700;
        }

        .table-wrap {
          overflow-x: auto;
          border-radius: 22px;
          border: 1px solid #EEF3EC;
        }

        .dash-table {
          width: 100%;
          border-collapse: collapse;
          min-width: 820px;
          background: white;
        }

        .dash-table th {
          background: #F3F8F1;
          color: #475467;
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.45px;
          padding: 14px 15px;
          font-weight: 850;
          white-space: nowrap;
        }

        .dash-table td {
          border-bottom: 1px solid #F1F4F0;
          padding: 14px 15px;
          color: #475467;
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }

        .dash-table tr:hover td {
          background: #FAFCF9;
        }

        .tentor-list {
          display: grid;
          gap: 10px;
        }

        .tentor-item {
          display: grid;
          grid-template-columns: 44px 1fr;
          gap: 12px;
          align-items: center;
          border-radius: 20px;
          background: #FAFCF9;
          border: 1px solid #EEF3EC;
          padding: 11px;
        }

        .donut-wrap {
          display: grid;
          justify-items: center;
          gap: 12px;
        }

        .donut-center {
          position: relative;
          width: 136px;
          height: 136px;
        }

        .donut-text {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .donut-percent {
          color: #063D27;
          font-size: 28px;
          font-weight: 950;
          letter-spacing: -1px;
        }

        .donut-label {
          color: #98A2B3;
          font-size: 11px;
          font-weight: 800;
        }

        .legend {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          color: #667085;
          font-size: 12px;
          font-weight: 750;
        }

        .legend-item {
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        .legend-dot {
          width: 9px;
          height: 9px;
          border-radius: 999px;
        }

        @media (max-width: 1200px) {
          .hero-grid,
          .grid-main {
            grid-template-columns: 1fr;
          }

          .stat-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .page {
            padding: 18px 14px 28px;
          }

          .soft-hero {
            padding: 22px;
            border-radius: 26px;
          }

          .hero-title {
            font-size: 34px;
            letter-spacing: -1px;
          }

          .finance-value {
            font-size: 28px;
          }

          .stat-grid,
          .grid-two,
          .quick-grid {
            grid-template-columns: 1fr;
          }

          .panel {
            padding: 18px;
            border-radius: 24px;
          }

          .today-item {
            grid-template-columns: 44px 1fr;
          }

          .today-item .badge {
            grid-column: 1 / -1;
            justify-self: flex-start;
          }
        }
      `}</style>

      <div className="page">
        <div className="inner">
          <section className="soft-hero">
            <div className="hero-grid">
              <div>


                <div className="time-pill">
                  <Clock3 size={15} />
                  {todayStr} · {timeStr} WIB
                </div>

                <h1 className="hero-title">
                  {greeting},{' '}
                  <span className="hero-name">{data.adminName}</span>.
                </h1>



                <div className="hero-actions">
                  <Link href="/admin/jadwal" className="btn-primary">
                    <CalendarDays size={17} />
                    Buat Jadwal
                  </Link>

                  <Link href="/admin/dana" className="btn-soft">
                    <WalletCards size={17} />
                    Kelola Dana
                  </Link>
                </div>
              </div>

              <div className="finance-card">
                <p className="finance-label">Saldo bulan ini</p>

                <h2 className="finance-value">
                  {formatRupiah(data.saldoBulanIni)}
                </h2>

                <div className="mini-grid">
                  <MiniStat
                    label="Pemasukan"
                    value={formatRupiah(data.pemasukanBulanIni)}
                  />
                  <MiniStat
                    label="Pengeluaran"
                    value={formatRupiah(data.pengeluaranBulanIni)}
                  />
                  <MiniStat label="SPP Lunas" value={`${data.sppLunas} siswa`} />
                  <MiniStat
                    label="Tunggakan"
                    value={formatRupiah(data.totalTunggakanBulanIni)}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="stat-grid">
            <StatCard
              color="green"
              icon={<UsersRound size={22} />}
              label="Total Siswa"
              value={String(data.totalSiswa)}
              foot="Aktif terdaftar"
            />

            <StatCard
              color="blue"
              icon={<CalendarDays size={22} />}
              label="Sesi Hari Ini"
              value={String(data.sesiCount)}
              foot={`${
                data.sesiHariIni.filter((s: any) => s.status === 'berlangsung')
                  .length
              } berlangsung`}
            />

            <StatCard
              color="yellow"
              icon={<Banknote size={22} />}
              label={`SPP Lunas ${bulanIni}`}
              value={String(data.sppLunas)}
              foot={`${data.sppBelum} belum bayar`}
            />

            <StatCard
              color="cream"
              icon={<FileText size={22} />}
              label="Jurnal Hari Ini"
              value={String(data.jurnalCount)}
              foot={
                data.jurnalPending > 0
                  ? `${data.jurnalPending} belum submit`
                  : 'Semua sudah submit'
              }
            />
          </section>

          <section className="grid-main">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">Aktivitas</span>
                  <h2 className="panel-title">Sesi Hari Ini</h2>
                  <p className="panel-desc">
                    Jadwal hari ini berdasarkan jam mulai.
                  </p>
                </div>

                <Link href="/admin/jadwal" className="panel-link">
                  Lihat Jadwal
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              {data.sesiHariIni.length === 0 ? (
                <div className="empty-state">Tidak ada sesi hari ini.</div>
              ) : (
                <div className="today-list">
                  {data.sesiHariIni.slice(0, 5).map((sesi: any) => (
                    <SesiTodayItem key={sesi.id} sesi={sesi} />
                  ))}
                </div>
              )}
            </div>

            <div className="grid-two">
              <div className="panel">
                <div className="panel-head">
                  <div>
                    <span className="panel-kicker">SPP</span>
                    <h2 className="panel-title">Progress SPP</h2>
                    <p className="panel-desc">
                      Periode {bulanIni}, {now.getFullYear()}.
                    </p>
                  </div>
                </div>

                <SppDonut lunas={data.sppLunas} belum={data.sppBelum} />

                <p
                  style={{
                    marginTop: 14,
                    textAlign: 'center',
                    color: '#667085',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Total tagihan:{' '}
                  <strong style={{ color: '#063D27' }}>
                    {formatRupiah(data.totalTagihanBulanIni)}
                  </strong>
                </p>
              </div>

              <div className="panel">
                <div className="panel-head">
                  <div>
                    <span className="panel-kicker">Akses Cepat</span>
                    <h2 className="panel-title">Menu Admin</h2>
                    <p className="panel-desc">Modul utama sistem.</p>
                  </div>
                </div>

                <div className="quick-grid">
                  <QuickLink
                    href="/admin/siswa"
                    icon={<GraduationCap size={19} />}
                    title="Siswa"
                    desc="Data murid"
                  />
                  <QuickLink
                    href="/admin/jadwal"
                    icon={<CalendarDays size={19} />}
                    title="Jadwal"
                    desc="Sesi belajar"
                  />
                  <QuickLink
                    href="/admin/dana"
                    icon={<WalletCards size={19} />}
                    title="Dana"
                    desc="SPP & laporan"
                  />
                  <QuickLink
                    href="/admin/jurnal"
                    icon={<BookOpenCheck size={19} />}
                    title="Jurnal"
                    desc="Catatan tentor"
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="grid-main">
            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">Riwayat</span>
                  <h2 className="panel-title">Sesi Terbaru</h2>
                  <p className="panel-desc">
                    Ringkasan sesi terbaru beserta status jurnal.
                  </p>
                </div>

                <Link href="/admin/jadwal" className="panel-link">
                  Lihat Semua
                  <ArrowUpRight size={14} />
                </Link>
              </div>

              <div className="table-wrap">
                <table className="dash-table">
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
                        <td
                          colSpan={8}
                          style={{ textAlign: 'center', padding: '28px 16px' }}
                        >
                          Belum ada data sesi.
                        </td>
                      </tr>
                    ) : (
                      data.recentSesi.map((sesi: any) => (
                        <tr key={sesi.id}>
                          <td>{formatTanggal(sesi.tanggal)}</td>
                          <td style={{ color: '#1F2937', fontWeight: 800 }}>
                            {sesi.tentor?.full_name ?? '-'}
                          </td>
                          <td>{sesi.mapel}</td>
                          <td>{sesi.jam_mulai?.slice(0, 5)}</td>
                          <td>{sesi.durasi} mnt</td>
                          <td>{sesi.sesi_siswa?.length ?? 0} siswa</td>
                          <td>
                            {sesi.jurnal ? (
                              <span className="badge badge-selesai">Ada</span>
                            ) : (
                              <span className="badge badge-terjadwal">Belum</span>
                            )}
                          </td>
                          <td>
                            <SesiStatusBadge status={sesi.status} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="panel">
              <div className="panel-head">
                <div>
                  <span className="panel-kicker">Tim</span>
                  <h2 className="panel-title">Tentor Aktif</h2>
                  <p className="panel-desc">Daftar tentor yang terdaftar.</p>
                </div>
              </div>

              {data.tentorList.length === 0 ? (
                <div className="empty-state">Belum ada tentor.</div>
              ) : (
                <div className="tentor-list">
                  {data.tentorList.slice(0, 6).map((tentor: any) => (
                    <div key={tentor.id} className="tentor-item">
                      <div className="avatar">{getInitials(tentor.full_name)}</div>
                      <div>
                        <p className="item-title">{tentor.full_name}</p>
                        <p className="item-meta">Tentor aktif</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-stat">
      <p className="mini-label">{label}</p>
      <p className="mini-value">{value}</p>
    </div>
  )
}

function StatCard({
  color,
  icon,
  label,
  value,
  foot,
}: {
  color: 'green' | 'blue' | 'yellow' | 'cream'
  icon: React.ReactNode
  label: string
  value: string
  foot: string
}) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className="stat-icon">{icon}</div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      <p className="stat-foot">{foot}</p>
    </div>
  )
}

function QuickLink({
  href,
  icon,
  title,
  desc,
}: {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
}) {
  return (
    <Link href={href} className="quick-link">
      <div className="quick-icon">{icon}</div>
      <p className="quick-title">{title}</p>
      <p className="quick-desc">{desc}</p>
    </Link>
  )
}

function SesiTodayItem({ sesi }: { sesi: any }) {
  return (
    <div className="today-item">
      <div className="avatar">{getInitials(sesi.tentor?.full_name)}</div>

      <div>
        <p className="item-title">{sesi.tentor?.full_name ?? 'Tentor'}</p>
        <p className="item-meta">
          {sesi.mapel} · {sesi.jam_mulai?.slice(0, 5)} ·{' '}
          {sesi.sesi_siswa?.length ?? 0} siswa
        </p>
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
    selesai: 'Selesai',
    berlangsung: 'Berlangsung',
    terjadwal: 'Terjadwal',
    dibatalkan: 'Dibatalkan',
  }

  return (
    <span className={`badge ${map[status] ?? 'badge-terjadwal'}`}>
      {label[status] ?? status}
    </span>
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
      <div className="donut-center">
        <svg
          viewBox="0 0 120 120"
          width="136"
          height="136"
          style={{ transform: 'rotate(-90deg)' }}
        >
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#F1F4F0"
            strokeWidth="13"
          />

          {belum > 0 && (
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#F6C945"
              strokeWidth="13"
              strokeDasharray={`${belumArc} ${circ}`}
              strokeDashoffset={-lunasArc}
              strokeLinecap="round"
            />
          )}

          {lunas > 0 && (
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="none"
              stroke="#063D27"
              strokeWidth="13"
              strokeDasharray={`${lunasArc} ${circ}`}
              strokeDashoffset="0"
              strokeLinecap="round"
            />
          )}
        </svg>

        <div className="donut-text">
          <span className="donut-percent">{pct}%</span>
          <span className="donut-label">Lunas</span>
        </div>
      </div>

      <div className="legend">
        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#063D27' }} />
          Lunas ({lunas})
        </span>

        <span className="legend-item">
          <span className="legend-dot" style={{ background: '#F6C945' }} />
          Belum ({belum})
        </span>
      </div>
    </div>
  )
}

function getInitials(name?: string | null) {
  if (!name) return 'AD'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}