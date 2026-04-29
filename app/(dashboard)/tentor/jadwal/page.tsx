'use client'
 
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { formatTanggal } from '@/lib/utils'
 
export default function TentorJadwalPage() {
  const supabase = createClient()
  const [sesiList, setSesiList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
 
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      let q = supabase.from('sesi')
        .select('*, sesi_siswa(siswa_id, hadir, siswa:siswa(nama)), jurnal(id)')
        .eq('tentor_id', user!.id)
        .order('tanggal', { ascending: false }).order('jam_mulai')
      if (filter) q = q.eq('status', filter)
      const { data } = await q
      setSesiList(data ?? [])
      setLoading(false)
    }
    load()
  }, [filter])
 
  return (
    <>
      <style>{`
        .tj-wrap { font-family: 'DM Sans', sans-serif; padding: 0 0 32px; }
        .tj-hdr { height: 56px; background: #fff; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; padding: 0 24px; }
        .tj-content { padding: 20px 24px; }
        .tj-filter { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .tj-pill { padding: 6px 14px; border-radius: 99px; border: 1.5px solid #e2e8f0; background: #fff; font-size: 12px; color: #64748b; cursor: pointer; transition: all 0.15s; font-family: inherit; }
        .tj-pill:hover { border-color: #2557d6; color: #1a3a8f; }
        .tj-pill.active { background: #1a3a8f; border-color: #1a3a8f; color: #fff; }
        .tj-sesi {
          background: #fff; border-radius: 14px; border: 1px solid #f1f5f9;
          padding: 14px 16px; margin-bottom: 8px;
          display: flex; align-items: center; gap: 14px;
          transition: border 0.15s, box-shadow 0.15s;
        }
        .tj-sesi:hover { border-color: #bfdbfe; box-shadow: 0 4px 12px rgba(37,87,214,0.08); }
        .tj-time { background: #eff6ff; border-radius: 10px; padding: 8px 12px; text-align: center; flex-shrink: 0; }
        .tj-hh { font-size: 16px; font-weight: 700; color: #1a3a8f; line-height: 1; }
        .tj-dur { font-size: 9px; color: #64748b; margin-top: 2px; }
        .badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 99px; }
        .badge-selesai { background: #dcfce7; color: #166534; }
        .badge-berlangsung { background: #dbeafe; color: #1d4ed8; }
        .badge-terjadwal { background: #f1f5f9; color: #64748b; }
      `}</style>
 
      <div className="tj-wrap">
        <div className="tj-hdr">
          <h1 style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>Jadwal Sesi Saya</h1>
          <Link href="/tentor/sesi/buat" style={{ marginLeft: 'auto', background: '#1a3a8f', color: '#fff', borderRadius: 10, padding: '7px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}>
            + Buat Sesi
          </Link>
        </div>
 
        <div className="tj-content">
          <div className="tj-filter">
            {['', 'terjadwal', 'berlangsung', 'selesai'].map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`tj-pill ${filter === s ? 'active' : ''}`}>
                {s === '' ? 'Semua' : s === 'terjadwal' ? 'Terjadwal' : s === 'berlangsung' ? 'Berlangsung' : 'Selesai'}
              </button>
            ))}
          </div>
 
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <Loader2 style={{ width: 24, height: 24, color: '#1a3a8f' }} className="animate-spin" />
            </div>
          ) : sesiList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0', color: '#94a3b8' }}>
              <Calendar style={{ width: 36, height: 36, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14 }}>Belum ada sesi</p>
            </div>
          ) : (
            sesiList.map(sesi => (
              <div key={sesi.id} className="tj-sesi">
                <div className="tj-time">
                  <div className="tj-hh">{sesi.jam_mulai?.slice(0, 5)}</div>
                  <div className="tj-dur">{sesi.durasi} mnt</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#0f172a' }}>{sesi.mapel}</p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                    {formatTanggal(sesi.tanggal)} · {sesi.sesi_siswa?.length ?? 0} siswa
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <span className={`badge badge-${sesi.status}`}>
                    {sesi.status === 'selesai' ? 'Selesai' : sesi.status === 'berlangsung' ? 'Berlangsung' : 'Terjadwal'}
                  </span>
                  {sesi.jurnal ? (
                    <span style={{ fontSize: 10, color: '#16a34a' }}>✓ Jurnal</span>
                  ) : sesi.status === 'selesai' ? (
                    <Link href={`/tentor/sesi/${sesi.id}/jurnal`} style={{ fontSize: 10, color: '#2557d6', textDecoration: 'none', fontWeight: 500 }}>Isi Jurnal →</Link>
                  ) : (
                    <Link href={`/tentor/sesi/${sesi.id}/masuk`} style={{ fontSize: 10, color: '#1a3a8f', textDecoration: 'none', fontWeight: 500 }}>Masuk Sesi →</Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}