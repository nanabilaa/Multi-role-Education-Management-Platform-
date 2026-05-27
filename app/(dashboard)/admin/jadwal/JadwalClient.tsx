// app/(dashboard)/admin/jadwal/JadwalClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Loader2, Trash2, Eye } from 'lucide-react'
import { formatTanggal, DAFTAR_MAPEL } from '@/lib/utils'
import type { Sesi, Profile, Siswa } from '@/lib/types'

interface Props {
  tentorList: Pick<Profile, 'id' | 'full_name'>[]
  siswaList: Pick<Siswa, 'id' | 'nama' | 'kelas'>[]
}

export default function JadwalClient({ tentorList, siswaList }: Props) {
  const supabase = createClient()
  const [sesiList, setSesiList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [filterTanggal, setFilterTanggal] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    tentor_id: '',
    tanggal: new Date().toISOString().split('T')[0],
    jam_mulai: '08:00',
    durasi: 60,
    mapel: '',
    siswa_ids: [] as string[],
  })

  async function fetchSesi() {
    setLoading(true)
    let query = supabase
      .from('sesi')
      .select('*, tentor:profiles(full_name), sesi_siswa(siswa_id, hadir, siswa:siswa(nama)), jurnal(id)')
      .order('tanggal', { ascending: false })
      .order('jam_mulai')

    if (filterTanggal) query = query.eq('tanggal', filterTanggal)
    if (filterStatus) query = query.eq('status', filterStatus)

    const { data } = await query
    setSesiList(data ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchSesi() }, [filterTanggal, filterStatus])

  async function handleSimpan(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: sesi, error } = await supabase.from('sesi').insert({
      tentor_id: form.tentor_id,
      tanggal: form.tanggal,
      jam_mulai: form.jam_mulai,
      durasi: form.durasi,
      mapel: form.mapel,
      status: 'terjadwal',
    }).select().single()

    if (error || !sesi) { setSaving(false); return }

    // Tambah siswa ke sesi
    if (form.siswa_ids.length > 0) {
      await supabase.from('sesi_siswa').insert(
        form.siswa_ids.map(sid => ({ sesi_id: sesi.id, siswa_id: sid }))
      )
    }

    setShowModal(false)
    setSaving(false)
    fetchSesi()
  }

  async function hapusSesi(id: string) {
    if (!confirm('Hapus sesi ini?')) return
    await supabase.from('sesi').delete().eq('id', id)
    fetchSesi()
  }

  return (
    <div className="px-6 pb-6 mt-4 space-y-4">
      {/* Filter + Tombol Tambah */}
      <div className="card flex gap-3 items-end flex-wrap">
        <div>
          <label className="label-base">Filter Tanggal</label>
          <input type="date" value={filterTanggal} onChange={e => setFilterTanggal(e.target.value)}
            className="input-base w-40" />
        </div>
        <div>
          <label className="label-base">Status</label>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="input-base w-36">
            <option value="">Semua Status</option>
            <option value="terjadwal">Terjadwal</option>
            <option value="berlangsung">Berlangsung</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>
        <button onClick={() => { setFilterTanggal(''); setFilterStatus('') }} className="btn-outline">Reset</button>

      </div>

      {/* Tabel Sesi */}
      <div className="card overflow-x-auto">
        {loading ? (
          <div className="flex items-center justxify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-green-500" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Tanggal</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Tentor</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Mapel</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Jam</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Durasi</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Siswa</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Jurnal</th>
                <th className="text-left text-xs font-semibold text-gray-400 pb-3">Status</th>
                <th className="text-right text-xs font-semibold text-gray-400 pb-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {sesiList.map(sesi => (
                <tr key={sesi.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 text-xs text-gray-600">{formatTanggal(sesi.tanggal)}</td>
                  <td className="py-3 text-xs font-medium text-gray-800">{sesi.tentor?.full_name}</td>
                  <td className="py-3 text-xs text-gray-600">{sesi.mapel}</td>
                  <td className="py-3 text-xs text-gray-600">{sesi.jam_mulai.slice(0,5)}</td>
                  <td className="py-3 text-xs text-gray-600">{sesi.durasi} mnt</td>
                  <td className="py-3 text-xs text-gray-600">{sesi.sesi_siswa?.length ?? 0} siswa</td>
                  <td className="py-3 text-xs">
                    {sesi.jurnal
                      ? <span className="badge-lunas">Ada</span>
                      : <span className="badge-pending">Belum</span>}
                  </td>
                  <td className="py-3">
                    <StatusBadge status={sesi.status} />
                  </td>
                  <td className="py-3 text-right">
                    <button onClick={() => hapusSesi(sesi.id)}
                      className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {sesiList.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-gray-400">Tidak ada sesi</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Tambah Jadwal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-4">Buat Jadwal Sesi</h2>
              <form onSubmit={handleSimpan} className="space-y-4">
                <div>
                  <label className="label-base">Tentor *</label>
                  <select value={form.tentor_id}
                    onChange={e => setForm(p => ({ ...p, tentor_id: e.target.value }))}
                    className="input-base" required>
                    <option value="">Pilih Tentor</option>
                    {tentorList.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-base">Tanggal *</label>
                    <input type="date" value={form.tanggal}
                      onChange={e => setForm(p => ({ ...p, tanggal: e.target.value }))}
                      className="input-base" required />
                  </div>
                  <div>
                    <label className="label-base">Jam Mulai *</label>
                    <input type="time" value={form.jam_mulai}
                      onChange={e => setForm(p => ({ ...p, jam_mulai: e.target.value }))}
                      className="input-base" required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-base">Durasi (menit) *</label>
                    <select value={form.durasi}
                      onChange={e => setForm(p => ({ ...p, durasi: Number(e.target.value) as any }))}
                      className="input-base">
                      <option value={60}>60 menit</option>
                      <option value={70}>70 menit</option>
                      <option value={90}>90 menit</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-base">Mata Pelajaran *</label>
                    <select value={form.mapel}
                      onChange={e => setForm(p => ({ ...p, mapel: e.target.value }))}
                      className="input-base" required>
                      <option value="">Pilih Mapel</option>
                      {DAFTAR_MAPEL.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="label-base">Siswa (pilih beberapa)</label>
                  <div className="border border-gray-200 rounded-lg p-2 max-h-36 overflow-y-auto space-y-1">
                    {siswaList.map(s => (
                      <label key={s.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          className="accent-green-500"
                          checked={form.siswa_ids.includes(s.id)}
                          onChange={e => setForm(p => ({
                            ...p,
                            siswa_ids: e.target.checked
                              ? [...p.siswa_ids, s.id]
                              : p.siswa_ids.filter(id => id !== s.id)
                          }))}
                        />
                        <span className="text-xs">{s.nama}</span>
                        <span className="text-[10px] text-gray-400">{s.kelas}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={saving} className="btn-primary">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Simpan Jadwal
                  </button>
                  <button type="button" onClick={() => setShowModal(false)} className="btn-outline">Batal</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    selesai: 'badge-lunas', berlangsung: 'badge-aktif',
    terjadwal: 'badge-pending',
    dibatalkan: 'bg-red-100 text-red-600 text-xs font-medium px-2.5 py-1 rounded-full',
  }
  const label: Record<string, string> = {
    selesai: 'Selesai', berlangsung: 'Berlangsung', terjadwal: 'Terjadwal', dibatalkan: 'Dibatalkan',
  }
  return <span className={map[status] ?? 'badge-pending'}>{label[status] ?? status}</span>
}