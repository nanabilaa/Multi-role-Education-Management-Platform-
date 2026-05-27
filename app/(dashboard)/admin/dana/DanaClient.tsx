'use client'

import React, { useState } from 'react'
import { Transaksi, Siswa, Tentor, DanaForm } from '@/lib/types'

interface DanaClientProps {
  transaksiList: Transaksi[]
  siswaList: Siswa[]
  tentorList: Tentor[]
}

const kategoriOptions = [
  'SPP Siswa SD','SPP Siswa SMP','SPP Siswa SMA','Biaya FC dan Print',
  'Biaya Air, Listrik, wifi','Biaya Perlengkapan','Honor Tentor','Honor Admin',
  'Bonus Admin','Konsumsi Briefing','Biaya Lain-lain','Honor Pimpinan',
  'Bonus Pimpinan','Biaya Pengembalian Modal','Tabungan Pengembangan'
]

export default function DanaClient({ transaksiList, siswaList, tentorList }: DanaClientProps) {
  const [filterJenis, setFilterJenis] = useState('')
  const [filterKategori, setFilterKategori] = useState('')
  const [filterSiswa, setFilterSiswa] = useState('')
  const [filterTentor, setFilterTentor] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<DanaForm>({
    jenis: '',
    kategori: '',
    nominal: 0,
    siswa_id: '',
    tentor_id: '',
    deskripsi: '',
    tanggal: ''
  })

  const filtered = transaksiList.filter(t =>
    (!filterJenis || t.jenis === filterJenis) &&
    (!filterKategori || t.kategori === filterKategori) &&
    (!filterSiswa || t.siswa?.id === filterSiswa) &&
    (!filterTentor || t.tentor?.id === filterTentor)
  )

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const res = await fetch('/api/admin/dana/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    const data = await res.json()
    if (res.ok) window.location.reload()
    else alert('Error: ' + data.error)
  }

  return (
    <div className="bg-white rounded-3xl shadow p-4">
      {/* Modal & Filter omitted for brevity */}
      <table>
        <thead>
          <tr>
            <th>Tanggal</th>
            <th>Jenis</th>
            <th>Kategori</th>
            <th>Nominal</th>
            <th>Siswa</th>
            <th>Tentor</th>
            <th>Deskripsi</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(t => (
            <tr key={t.id}>
              <td>{new Date(t.tanggal).toLocaleDateString('id-ID')}</td>
              <td>{t.jenis}</td>
              <td>{t.kategori}</td>
              <td>{t.nominal}</td>
              <td>{t.siswa?.nama ?? '-'}</td>
              <td>{t.tentor?.full_name ?? '-'}</td>
              <td>{t.deskripsi}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}