'use client'
 
import { useState, useRef } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Camera, Loader2, ArrowLeft, CheckCircle } from 'lucide-react'
import Link from 'next/link'
 
export default function IsiJurnalPage() {
  const router = useRouter()
  const params = useParams()
  const sesiId = params.id as string
  const supabase = createClient()
 
  const [materi, setMateri] = useState('')
  const [catatan, setCatatan] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [sukses, setSukses] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
 
  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { setError('Ukuran foto maksimal 5MB'); return }
    setFoto(file)
    setFotoPreview(URL.createObjectURL(file))
    setError('')
  }
 
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!materi.trim()) { setError('Materi wajib diisi'); return }
    setLoading(true)
    setError('')
 
    let foto_url = null
 
    // Upload foto jika ada
    if (foto) {
      const { data: { user } } = await supabase.auth.getUser()
      const ext = foto.name.split('.').pop()
      const path = `jurnal/${user!.id}/${sesiId}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('dokumentasi').upload(path, foto, { upsert: true })
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('dokumentasi').getPublicUrl(path)
        foto_url = urlData.publicUrl
      }
    }
 
    const { error: jurnalErr } = await supabase.from('jurnal').upsert({
      sesi_id: sesiId, materi, catatan: catatan || null, foto_url,
    }, { onConflict: 'sesi_id' })
 
    if (jurnalErr) {
      setError('Gagal menyimpan jurnal. Coba lagi.')
      setLoading(false)
      return
    }
 
    setSukses(true)
    setTimeout(() => router.push('/tentor'), 1500)
  }
 
  if (sukses) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12 }}>
      <CheckCircle style={{ width: 48, height: 48, color: '#16a34a' }} />
      <p style={{ fontSize: 16, fontWeight: 600, color: '#0f172a' }}>Jurnal Berhasil Disimpan!</p>
      <p style={{ fontSize: 13, color: '#94a3b8' }}>Kembali ke dashboard...</p>
    </div>
  )
 
  return (
    <>
      <style>{`
        .ij-wrap { font-family: 'DM Sans', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; }
        .ij-card { background: #fff; border-radius: 18px; border: 1px solid #f1f5f9; padding: 20px; margin-bottom: 14px; }
        .ij-label { display: block; font-size: 12px; font-weight: 500; color: #374151; margin-bottom: 6px; }
        .ij-input { width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: 13px; color: #0f172a; outline: none; font-family: inherit; box-sizing: border-box; transition: border 0.15s, background 0.15s; resize: vertical; }
        .ij-input:focus { border-color: #2557d6; background: #fff; box-shadow: 0 0 0 3px rgba(37,87,214,0.08); }
        .ij-foto-box {
          border: 2px dashed #e2e8f0; border-radius: 14px;
          padding: 28px; text-align: center; cursor: pointer;
          transition: border 0.15s, background 0.15s;
          background: #f8fafc;
        }
        .ij-foto-box:hover { border-color: #2557d6; background: #eff6ff; }
        .ij-foto-preview { width: 100%; max-height: 200px; object-fit: cover; border-radius: 10px; }
        .ij-submit {
          width: 100%; padding: 13px; border-radius: 12px; border: none;
          background: #1a3a8f; color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: inherit; transition: background 0.15s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .ij-submit:hover:not(:disabled) { background: #2557d6; }
        .ij-submit:disabled { background: #94a3b8; cursor: not-allowed; }
        .ij-error { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; font-size: 12px; border-radius: 10px; padding: 10px 14px; margin-bottom: 14px; }
      `}</style>
 
      <div className="ij-wrap">
        <Link href="/tentor" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 13, textDecoration: 'none', marginBottom: 20 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Kembali
        </Link>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.4px', marginBottom: 4 }}>Isi Jurnal Mengajar</h1>
        <p style={{ fontSize: 12.5, color: '#94a3b8', marginBottom: 20 }}>Catat materi dan dokumentasi sesi hari ini</p>
 
        {error && <div className="ij-error">{error}</div>}
 
        <form onSubmit={handleSubmit}>
          <div className="ij-card">
            <div style={{ marginBottom: 14 }}>
              <label className="ij-label">Materi yang Diajarkan *</label>
              <textarea className="ij-input" rows={4} placeholder="Contoh: Persamaan kuadrat, Faktorisasi, Rumus ABC..."
                value={materi} onChange={e => setMateri(e.target.value)} required />
            </div>
            <div>
              <label className="ij-label">Catatan Tambahan</label>
              <textarea className="ij-input" rows={3} placeholder="Catatan untuk orang tua atau admin (opsional)..."
                value={catatan} onChange={e => setCatatan(e.target.value)} />
            </div>
          </div>
 
          <div className="ij-card">
            <label className="ij-label">📸 Foto Dokumentasi (Opsional, maks 5MB)</label>
            <input type="file" ref={fileRef} accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
            {fotoPreview ? (
              <div style={{ position: 'relative' }}>
                <img src={fotoPreview} alt="Preview" className="ij-foto-preview" />
                <button type="button" onClick={() => { setFoto(null); setFotoPreview(null) }}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  ✕
                </button>
              </div>
            ) : (
              <div className="ij-foto-box" onClick={() => fileRef.current?.click()}>
                <Camera style={{ width: 28, height: 28, color: '#94a3b8', marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Klik untuk upload foto</p>
                <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>JPG, PNG, WEBP — Maks 5MB</p>
              </div>
            )}
          </div>
 
          <button type="submit" disabled={loading} className="ij-submit">
            {loading
              ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Menyimpan Jurnal...</>
              : <>✓ Submit Jurnal</>}
          </button>
        </form>
      </div>
    </>
  )
}