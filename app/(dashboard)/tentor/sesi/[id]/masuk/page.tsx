'use client'
 
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, XCircle, Loader2, ArrowLeft, Camera, Plus, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { DAFTAR_MAPEL } from '@/lib/utils'
 
type SesiSiswa = { id: string; siswa_id: string; hadir: boolean | null; siswa: { nama: string; kelas: string } }
type Sesi = { id: string; mapel: string; jam_mulai: string; durasi: number; status: string; sesi_siswa: SesiSiswa[] }
 
export default function MasukSesiPage() {
  const router = useRouter()
  const params = useParams()
  const sesiId = params.id as string
  const supabase = createClient()
 
  const [sesi, setSesi] = useState<Sesi | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hadir, setHadir] = useState<Record<string, boolean>>({})
 
  // Form tambah siswa dinamis
  const [siswaList, setSiswaList] = useState<{ id: string; nama: string; kelas: string }[]>([])
  const [tambahSiswaId, setTambahSiswaId] = useState('')
  const [tambahLoading, setTambahLoading] = useState(false)
 
  useEffect(() => {
    async function load() {
      const [{ data: sesiData }, { data: allSiswa }] = await Promise.all([
        supabase.from('sesi').select('*, sesi_siswa(id, siswa_id, hadir, siswa:siswa(nama, kelas))').eq('id', sesiId).single(),
        supabase.from('siswa').select('id, nama, kelas').eq('aktif', true).order('nama'),
      ])
      if (sesiData) {
        setSesi(sesiData as any)
        const hadirMap: Record<string, boolean> = {}
        sesiData.sesi_siswa?.forEach((ss: any) => { hadirMap[ss.siswa_id] = ss.hadir ?? false })
        setHadir(hadirMap)
      }
      setSiswaList(allSiswa ?? [])
      setLoading(false)
    }
    load()
  }, [sesiId])
 
  async function tambahSiswa() {
    if (!tambahSiswaId) return
    setTambahLoading(true)
    await supabase.from('sesi_siswa').upsert({ sesi_id: sesiId, siswa_id: tambahSiswaId }, { onConflict: 'sesi_id,siswa_id', ignoreDuplicates: true })
    const { data } = await supabase.from('sesi').select('*, sesi_siswa(id, siswa_id, hadir, siswa:siswa(nama, kelas))').eq('id', sesiId).single()
    if (data) setSesi(data as any)
    setTambahSiswaId('')
    setTambahLoading(false)
  }
 
  async function hapusSiswa(sesiSiswaId: string, siswaId: string) {
    await supabase.from('sesi_siswa').delete().eq('id', sesiSiswaId)
    setSesi(p => p ? { ...p, sesi_siswa: p.sesi_siswa.filter(ss => ss.id !== sesiSiswaId) } : p)
    setHadir(p => { const n = { ...p }; delete n[siswaId]; return n })
  }
 
  async function handleSelesai() {
    setSaving(true)
    // Update presensi semua siswa
    await Promise.all(
      (sesi?.sesi_siswa ?? []).map(ss =>
        supabase.from('sesi_siswa').update({ hadir: hadir[ss.siswa_id] ?? false }).eq('id', ss.id)
      )
    )
    // Update status sesi
    await supabase.from('sesi').update({ status: 'selesai' }).eq('id', sesiId)
    router.push(`/tentor/sesi/${sesiId}/jurnal`)
  }
 
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
      <Loader2 style={{ width: 24, height: 24, color: '#1a3a8f' }} className="animate-spin" />
    </div>
  )
 
  const hadirCount = Object.values(hadir).filter(Boolean).length
 
  return (
    <>
      <style>{`
        .ms-wrap { font-family: 'DM Sans', sans-serif; max-width: 640px; margin: 0 auto; padding: 24px; }
        .ms-card { background: #fff; border-radius: 18px; border: 1px solid #f1f5f9; padding: 18px; margin-bottom: 14px; }
        .ms-title { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }
        .ms-siswa-row {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 12px; border-radius: 12px;
          border: 1px solid #f1f5f9; margin-bottom: 6px;
          transition: border 0.15s;
        }
        .ms-siswa-row:hover { border-color: #e2e8f0; }
        .ms-av { width: 32px; height: 32px; border-radius: 50%; background: #eff6ff; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #1a3a8f; flex-shrink: 0; }
        .ms-hadir-btn {
          margin-left: auto; display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 99px; border: none;
          font-size: 11px; font-weight: 600; cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .ms-hadir-btn.hadir { background: #dcfce7; color: #166534; }
        .ms-hadir-btn.tidak { background: #fee2e2; color: #dc2626; }
        .ms-hadir-btn.default { background: #f1f5f9; color: #64748b; }
        .ms-info-bar {
          background: linear-gradient(135deg, #1a3a8f, #2557d6);
          border-radius: 14px; padding: 14px 18px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .ms-submit {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: #1a3a8f; color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ms-submit:hover:not(:disabled) { background: #2557d6; }
        .ms-submit:disabled { background: #94a3b8; cursor: not-allowed; }
        .ms-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: 13px; color: #0f172a; outline: none; font-family: inherit; box-sizing: border-box; }
        .ms-input:focus { border-color: #2557d6; background: #fff; }
      `}</style>
 
      <div className="ms-wrap">
        <Link href="/tentor" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Kembali
        </Link>
 
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 4 }}>
          Masuk Sesi
        </h1>
        <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 20 }}>
          {sesi?.mapel} · {sesi?.jam_mulai?.slice(0, 5)} · {sesi?.durasi} menit
        </p>
 
        {/* Info Bar */}
        <div className="ms-info-bar">
          <div>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Total Siswa</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>{sesi?.sesi_siswa?.length ?? 0}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Hadir</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#ffd000' }}>{hadirCount}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>Tidak Hadir</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#ff6b6b' }}>
              {(sesi?.sesi_siswa?.length ?? 0) - hadirCount}
            </p>
          </div>
        </div>
 
        {/* Presensi */}
        <div className="ms-card">
          <p className="ms-title">✋ Presensi Siswa</p>
          {sesi?.sesi_siswa?.map(ss => (
            <div key={ss.id} className="ms-siswa-row">
              <div className="ms-av">
                {ss.siswa?.nama?.split(' ').slice(0, 2).map(n => n[0]).join('') ?? '?'}
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a' }}>{ss.siswa?.nama}</p>
                <p style={{ fontSize: 10, color: '#94a3b8' }}>{ss.siswa?.kelas}</p>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setHadir(p => ({ ...p, [ss.siswa_id]: true }))}
                  className={`ms-hadir-btn ${hadir[ss.siswa_id] === true ? 'hadir' : 'default'}`}
                >
                  <CheckCircle style={{ width: 12, height: 12 }} /> Hadir
                </button>
                <button
                  onClick={() => setHadir(p => ({ ...p, [ss.siswa_id]: false }))}
                  className={`ms-hadir-btn ${hadir[ss.siswa_id] === false && hadir[ss.siswa_id] !== undefined ? 'tidak' : 'default'}`}
                >
                  <XCircle style={{ width: 12, height: 12 }} /> Absen
                </button>
                <button
                  onClick={() => hapusSiswa(ss.id, ss.siswa_id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', padding: 4 }}
                  title="Hapus dari sesi"
                >
                  <Trash2 style={{ width: 14, height: 14 }} />
                </button>
              </div>
            </div>
          ))}
 
          {/* Tambah siswa dinamis */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <select className="ms-input" value={tambahSiswaId} onChange={e => setTambahSiswaId(e.target.value)}>
              <option value="">+ Tambah siswa ke sesi ini</option>
              {siswaList
                .filter(s => !sesi?.sesi_siswa?.some(ss => ss.siswa_id === s.id))
                .map(s => <option key={s.id} value={s.id}>{s.nama} — {s.kelas}</option>)
              }
            </select>
            <button onClick={tambahSiswa} disabled={!tambahSiswaId || tambahLoading}
              style={{ background: '#1a3a8f', color: '#fff', border: 'none', borderRadius: 10, padding: '0 14px', cursor: 'pointer', flexShrink: 0, opacity: !tambahSiswaId ? 0.5 : 1 }}>
              {tambahLoading ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" /> : <Plus style={{ width: 14, height: 14 }} />}
            </button>
          </div>
        </div>
 
        <button className="ms-submit" onClick={handleSelesai} disabled={saving}>
          {saving
            ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Menyimpan...</>
            : <>Selesai & Isi Jurnal →</>}
        </button>
      </div>
    </>
  )
}