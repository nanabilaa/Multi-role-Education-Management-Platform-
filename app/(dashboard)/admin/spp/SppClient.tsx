'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Header from '@/components/admin/Header'
import { formatRupiah, formatTanggal, NAMA_BULAN } from '@/lib/utils'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

type SppWithSiswa = {
  id: string
  siswa_id: string
  bulan: number
  tahun: number
  nominal: number
  status: 'lunas' | 'belum'
  tanggal_bayar?: string
  siswa: { id: string; nama: string; kelas: string }
}

export default function SppClient() {
  const supabase = createClient()
  const [data, setData] = useState<SppWithSiswa[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  const now = new Date()
  const [bulan, setBulan] = useState(now.getMonth() + 1)
  const [tahun, setTahun] = useState(now.getFullYear())
  const [filterStatus, setFilterStatus] = useState<'semua' | 'lunas' | 'belum'>('semua')

  async function fetchData() {
    setLoading(true)
    let query = supabase
      .from('spp')
      .select('*, siswa:siswa(id, nama, kelas)')
      .eq('bulan', bulan)
      .eq('tahun', tahun)
      .order('created_at', { ascending: false })

    if (filterStatus !== 'semua') {
      query = query.eq('status', filterStatus)
    }

    const { data: result } = await query
    setData((result as SppWithSiswa[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [bulan, tahun, filterStatus])

  async function toggleStatus(spp: SppWithSiswa) {
    setUpdating(spp.id)
    const newStatus = spp.status === 'lunas' ? 'belum' : 'lunas'
    await supabase.from('spp').update({
      status: newStatus,
      tanggal_bayar: newStatus === 'lunas'
        ? new Date().toISOString().split('T')[0]
        : null,
    }).eq('id', spp.id)
    await fetchData()
    setUpdating(null)
  }

  async function generateSpp() {
    if (!confirm(`Generate SPP ${NAMA_BULAN[bulan]} ${tahun} untuk semua siswa aktif?`)) return
    const { data: siswaList } = await supabase
      .from('siswa').select('id').eq('aktif', true)
    if (!siswaList || siswaList.length === 0) {
      alert('Tidak ada siswa aktif')
      return
    }
    const inserts = siswaList.map(s => ({
      siswa_id: s.id,
      bulan,
      tahun,
      nominal: 500000,
      status: 'belum',
    }))
    await supabase.from('spp').upsert(inserts, {
      onConflict: 'siswa_id,bulan,tahun',
      ignoreDuplicates: true,
    })
    await fetchData()
  }

  const lunas = data.filter(d => d.status === 'lunas').length
  const belum = data.filter(d => d.status === 'belum').length
  const totalTagihan = data.reduce((sum, d) => sum + d.nominal, 0)
  const totalLunas = data
    .filter(d => d.status === 'lunas')
    .reduce((sum, d) => sum + d.nominal, 0)

  return (
    <>
      <Header
        title="Monitoring SPP"
        subtitle="Pantau status pembayaran SPP semua siswa"
        actions={
          <button onClick={generateSpp} className="btn-outline">
            Generate SPP Bulan Ini
          </button>
        }
      />

      <div className="px-6 pb-6 mt-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="card text-center">
            <p className="text-xs text-gray-400 mb-1">Total Tagihan</p>
            <p className="text-lg font-bold text-gray-900">{formatRupiah(totalTagihan)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-gray-400 mb-1">Terkumpul</p>
            <p className="text-lg font-bold text-green-600">{formatRupiah(totalLunas)}</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-green-600 font-semibold mb-1">Lunas</p>
            <p className="text-3xl font-bold text-green-600">{lunas}</p>
            <p className="text-[10px] text-gray-400">siswa</p>
          </div>
          <div className="card text-center">
            <p className="text-xs text-yellow-600 font-semibold mb-1">Belum Bayar</p>
            <p className="text-3xl font-bold text-yellow-600">{belum}</p>
            <p className="text-[10px] text-gray-400">siswa</p>
          </div>
        </div>

        {/* Filter */}
        <div className="card">
          <div className="flex gap-3 items-end flex-wrap">
            <div>
              <label className="label-base">Bulan</label>
              <select
                value={bulan}
                onChange={e => setBulan(Number(e.target.value))}
                className="input-base w-36"
              >
                {NAMA_BULAN.slice(1).map((n, i) => (
                  <option key={i + 1} value={i + 1}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Tahun</label>
              <select
                value={tahun}
                onChange={e => setTahun(Number(e.target.value))}
                className="input-base w-28"
              >
                {[2024, 2025, 2026].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-base">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as any)}
                className="input-base w-36"
              >
                <option value="semua">Semua</option>
                <option value="lunas">Lunas</option>
                <option value="belum">Belum Bayar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabel SPP */}
        <div className="card overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-green-500" />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Nama Siswa</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Kelas</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Nominal</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Status</th>
                  <th className="text-left text-xs font-semibold text-gray-400 pb-3">Tgl Bayar</th>
                  <th className="text-right text-xs font-semibold text-gray-400 pb-3">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {data.map(spp => (
                  <tr key={spp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-3 text-xs font-medium text-gray-800">
                      {spp.siswa?.nama ?? '-'}
                    </td>
                    <td className="py-3 text-xs text-gray-500">
                      {spp.siswa?.kelas ?? '-'}
                    </td>
                    <td className="py-3 text-xs text-gray-700">
                      {formatRupiah(spp.nominal)}
                    </td>
                    <td className="py-3">
                      {spp.status === 'lunas'
                        ? <span className="badge-lunas">Lunas</span>
                        : <span className="badge-belum">Belum Bayar</span>}
                    </td>
                    <td className="py-3 text-xs text-gray-500">
                      {spp.tanggal_bayar ? formatTanggal(spp.tanggal_bayar) : '-'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => toggleStatus(spp)}
                        disabled={updating === spp.id}
                        className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg ml-auto transition-colors ${
                          spp.status === 'lunas'
                            ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100'
                            : 'text-green-600 bg-green-50 hover:bg-green-100'
                        }`}
                      >
                        {updating === spp.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : spp.status === 'lunas' ? (
                          <><XCircle className="w-3 h-3" /> Batalkan</>
                        ) : (
                          <><CheckCircle className="w-3 h-3" /> Tandai Lunas</>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-gray-400">
                      Belum ada data SPP untuk {NAMA_BULAN[bulan]} {tahun}.<br />
                      <button
                        onClick={generateSpp}
                        className="mt-2 text-green-600 hover:underline font-medium"
                      >
                        Klik di sini untuk Generate SPP
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  )
}