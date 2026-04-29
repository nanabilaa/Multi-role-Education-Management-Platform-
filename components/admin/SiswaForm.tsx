// components/admin/SiswaForm.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Save, ArrowLeft } from 'lucide-react'
import { DAFTAR_KELAS } from '@/lib/utils'
import Link from 'next/link'
import type { Siswa, Profile } from '@/lib/types'

interface Props {
  siswa?: Siswa
  ortuList: Pick<Profile, 'id' | 'full_name' | 'phone'>[]
}

export default function SiswaFormClient({ siswa, ortuList }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const isEdit = Boolean(siswa)

  const [form, setForm] = useState({
    nama: siswa?.nama ?? '',
    kelas: siswa?.kelas ?? '',
    sekolah: siswa?.sekolah ?? '',
    tanggal_lahir: siswa?.tanggal_lahir ?? '',
    alamat: siswa?.alamat ?? '',
    ortu_id: siswa?.ortu_id ?? '',
    aktif: siswa?.aktif ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value, type } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const payload = {
      ...form,
      ortu_id: form.ortu_id || null,
      tanggal_lahir: form.tanggal_lahir || null,
    }

    let result
    if (isEdit && siswa) {
      result = await supabase.from('siswa').update(payload).eq('id', siswa.id)
    } else {
      result = await supabase.from('siswa').insert(payload)
    }

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
      return
    }

    router.push('/admin/siswa')
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-5">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/admin/siswa" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h2 className="text-base font-semibold text-gray-800">
          {isEdit ? 'Edit Data Siswa' : 'Data Siswa Baru'}
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl p-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label-base">Nama Lengkap *</label>
          <input name="nama" value={form.nama} onChange={handleChange}
            className="input-base" placeholder="Nama lengkap siswa" required />
        </div>

        <div>
          <label className="label-base">Kelas *</label>
          <select name="kelas" value={form.kelas} onChange={handleChange}
            className="input-base" required>
            <option value="">Pilih Kelas</option>
            {DAFTAR_KELAS.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </div>

        <div>
          <label className="label-base">Sekolah</label>
          <input name="sekolah" value={form.sekolah} onChange={handleChange}
            className="input-base" placeholder="Nama sekolah" />
        </div>

        <div>
          <label className="label-base">Tanggal Lahir</label>
          <input type="date" name="tanggal_lahir" value={form.tanggal_lahir}
            onChange={handleChange} className="input-base" />
        </div>

        <div>
          <label className="label-base">Orang Tua / Wali</label>
          <select name="ortu_id" value={form.ortu_id} onChange={handleChange}
            className="input-base">
            <option value="">-- Pilih Orang Tua --</option>
            {ortuList.map(o => (
              <option key={o.id} value={o.id}>{o.full_name}</option>
            ))}
          </select>
        </div>

        <div className="col-span-2">
          <label className="label-base">Alamat</label>
          <textarea name="alamat" value={form.alamat} onChange={handleChange}
            className="input-base" rows={3} placeholder="Alamat lengkap" />
        </div>

        {isEdit && (
          <div className="col-span-2 flex items-center gap-2">
            <input type="checkbox" id="aktif" name="aktif"
              checked={form.aktif}
              onChange={e => setForm(p => ({ ...p, aktif: e.target.checked }))}
              className="w-4 h-4 accent-green-500" />
            <label htmlFor="aktif" className="text-sm text-gray-600">Siswa Aktif</label>
          </div>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {isEdit ? 'Simpan Perubahan' : 'Tambah Siswa'}
        </button>
        <Link href="/admin/siswa" className="btn-outline">Batal</Link>
      </div>
    </form>
  )
}