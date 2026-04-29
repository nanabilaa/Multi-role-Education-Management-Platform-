// ============================================================
// FILE: app/(dashboard)/tentor/sesi/buat/page.tsx
// ============================================================
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Trash2, Loader2, ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { DAFTAR_MAPEL } from '@/lib/utils'

type Siswa = { id: string; nama: string; kelas: string }

export default function BuatSesiPage() {
  const router = useRouter()
  const supabase = createClient()
  const [siswaList, setSiswaList] = useState<Siswa[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '08:00',
    durasi: 60 as 60 | 70 | 90,
    mapel: '',
    siswa_ids: [] as string[],
  })

  useEffect(() => {
    supabase.from('siswa').select('id, nama, kelas').eq('aktif', true).order('nama')
      .then(({ data }) => setSiswaList(data ?? []))
  }, [])

  // Hitung estimasi honor
  const rateMap: Record<number, number> = { 60: 75000, 70: 85000, 90: 100000 }
  const estimasiHonor = rateMap[form.durasi] ?? 75000

  const toggleSiswa = (id: string) => {
    setForm(p => ({
      ...p,
      siswa_ids: p.siswa_ids.includes(id)
        ? p.siswa_ids.filter(s => s !== id)
        : [...p.siswa_ids, id]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.mapel) { setError('Pilih mata pelajaran terlebih dahulu'); return }
    if (form.siswa_ids.length === 0) { setError('Pilih minimal 1 siswa'); return }

    setLoading(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()

    const { data: sesi, error: sesiErr } = await supabase.from('sesi').insert({
      tentor_id: user!.id,
      tanggal: form.tanggal,
      jam_mulai: form.jam_mulai,
      durasi: form.durasi,
      mapel: form.mapel,
      status: 'terjadwal',
    }).select().single()

    if (sesiErr || !sesi) {
      setError('Gagal membuat sesi. Coba lagi.')
      setLoading(false)
      return
    }

    await supabase.from('sesi_siswa').insert(
      form.siswa_ids.map(sid => ({ sesi_id: sesi.id, siswa_id: sid }))
    )

    router.push('/tentor')
    router.refresh()
  }

  return (
    <>
      <style>{`
        .bs-wrap { font-family: 'DM Sans', sans-serif; max-width: 680px; margin: 0 auto; padding: 24px; }
        .bs-back { display: flex; align-items: center; gap: 8px; color: #64748b; font-size: 13px; text-decoration: none; margin-bottom: 20px; transition: color 0.15s; }
        .bs-back:hover { color: #1a3a8f; }
        .bs-title { font-size: 20px; font-weight: 700; color: #0f172a; letter-spacing: -0.4px; margin-bottom: 4px; }
        .bs-sub { font-size: 12.5px; color: #94a3b8; margin-bottom: 24px; }
        .bs-card { background: #fff; border-radius: 18px; border: 1px solid #f1f5f9; padding: 20px; margin-bottom: 14px; }
        .bs-card-title { font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 14px; }
        .bs-label { display: block; font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .bs-input {
          width: 100%; padding: 10px 14px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          font-size: 13px; color: #0f172a; outline: none;
          transition: border 0.15s, background 0.15s, box-shadow 0.15s;
          font-family: inherit; box-sizing: border-box;
        }
        .bs-input:focus { border-color: #2557d6; background: #fff; box-shadow: 0 0 0 3px rgba(37,87,214,0.08); }
        .bs-grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px; }
        .bs-field { margin-bottom: 12px; }

        /* Durasi Pills */
        .dur-pills { display: flex; gap: 8px; }
        .dur-pill {
          flex: 1; padding: 10px; border-radius: 10px; text-align: center;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          cursor: pointer; transition: all 0.15s;
          font-family: inherit;
        }
        .dur-pill:hover { border-color: #2557d6; background: #eff6ff; }
        .dur-pill.active { border-color: #1a3a8f; background: #1a3a8f; color: #fff; }
        .dur-pill-val { font-size: 16px; font-weight: 700; line-height: 1; }
        .dur-pill-lbl { font-size: 10px; opacity: 0.7; margin-top: 2px; }

        /* Siswa pills */
        .siswa-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 6px; max-height: 240px; overflow-y: auto; }
        .siswa-pill {
          display: flex; align-items: center; gap: 8px;
          padding: 8px 10px; border-radius: 10px;
          border: 1.5px solid #e2e8f0; background: #f8fafc;
          cursor: pointer; transition: all 0.15s; text-align: left;
          font-family: inherit; width: 100%;
        }
        .siswa-pill:hover { border-color: #2557d6; background: #eff6ff; }
        .siswa-pill.selected { border-color: #1a3a8f; background: #eff6ff; }
        .siswa-check {
          width: 18px; height: 18px; border-radius: 5px;
          border: 1.5px solid #cbd5e1; background: #fff;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; transition: all 0.15s;
        }
        .siswa-pill.selected .siswa-check { background: #1a3a8f; border-color: #1a3a8f; }

        /* Honor preview */
        .honor-box {
          background: linear-gradient(135deg, #1a3a8f, #2557d6);
          border-radius: 14px; padding: 16px 20px;
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
        }
        .honor-label { font-size: 12px; color: rgba(255,255,255,0.7); margin-bottom: 4px; }
        .honor-val { font-size: 22px; font-weight: 700; color: '#fff'; letter-spacing: -0.5px; }

        /* Error */
        .bs-error { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 12px; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }

        /* Submit */
        .bs-submit {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: #1a3a8f; color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .bs-submit:hover:not(:disabled) { background: #2557d6; }
        .bs-submit:disabled { background: #94a3b8; cursor: not-allowed; }

        @media (max-width: 640px) {
          .bs-wrap { padding: 16px 14px; }
          .bs-grid2 { grid-template-columns: 1fr; }
          .siswa-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="bs-wrap">
        <Link href="/tentor" className="bs-back">
          <ArrowLeft style={{ width: 16, height: 16 }} /> Kembali ke Dashboard
        </Link>
        <h1 className="bs-title">Buat Sesi Kelas</h1>
        <p className="bs-sub">Isi detail sesi yang akan dilaksanakan</p>

        {error && <div className="bs-error">{error}</div>}

        {/* Estimasi Honor */}
        <div className="honor-box">
          <div>
            <p className="honor-label">Estimasi Honor Sesi Ini</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              Rp {estimasiHonor.toLocaleString('id-ID')}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginBottom: 2 }}>Durasi dipilih</p>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#ffd000' }}>{form.durasi} mnt</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Waktu & Mapel */}
          <div className="bs-card">
            <p className="bs-card-title">📅 Waktu & Mata Pelajaran</p>
            <div className="bs-grid2">
              <div className="bs-field">
                <label className="bs-label">Tanggal *</label>
                <input type="date" className="bs-input" value={form.tanggal}
                  onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))} required />
              </div>
              <div className="bs-field">
                <label className="bs-label">Jam Mulai *</label>
                <input type="time" className="bs-input" value={form.jam_mulai}
                  onChange={e => setForm(p => ({ ...p, jam_mulai: e.target.value }))} required />
              </div>
            </div>
            <div className="bs-field">
              <label className="bs-label">Mata Pelajaran *</label>
              <select className="bs-input" value={form.mapel}
                onChange={e => setForm(p => ({ ...p, mapel: e.target.value }))} required>
                <option value="">Pilih Mata Pelajaran</option>
                {DAFTAR_MAPEL.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="bs-field">
              <label className="bs-label">Durasi Sesi *</label>
              <div className="dur-pills">
                {([60, 70, 90] as const).map(d => (
                  <button key={d} type="button"
                    className={`dur-pill ${form.durasi === d ? 'active' : ''}`}
                    onClick={() => setForm(p => ({ ...p, durasi: d }))}>
                    <div className="dur-pill-val">{d}</div>
                    <div className="dur-pill-lbl">menit</div>
                    <div style={{ fontSize: 10, marginTop: 3, opacity: 0.8 }}>
                      Rp {(rateMap[d] / 1000).toFixed(0)}k
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Pilih Siswa */}
          <div className="bs-card">
            <p className="bs-card-title">
              👥 Pilih Siswa
              <span style={{ fontSize: 11, color: '#2557d6', fontWeight: 400, marginLeft: 8 }}>
                {form.siswa_ids.length} dipilih
              </span>
            </p>
            <div className="siswa-grid">
              {siswaList.map(s => (
                <button key={s.id} type="button"
                  className={`siswa-pill ${form.siswa_ids.includes(s.id) ? 'selected' : ''}`}
                  onClick={() => toggleSiswa(s.id)}>
                  <div className="siswa-check">
                    {form.siswa_ids.includes(s.id) && (
                      <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" width="11" height="11">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.nama}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8' }}>{s.kelas}</p>
                  </div>
                </button>
              ))}
              {siswaList.length === 0 && (
                <p style={{ fontSize: 12, color: '#94a3b8', gridColumn: '1/-1', textAlign: 'center', padding: '16px 0' }}>
                  Tidak ada siswa aktif
                </p>
              )}
            </div>
          </div>

          <button type="submit" disabled={loading} className="bs-submit">
            {loading
              ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Menyimpan...</>
              : <><Plus style={{ width: 16, height: 16 }} /> Buat Sesi Kelas</>}
          </button>
        </form>
      </div>
    </>
  )
}