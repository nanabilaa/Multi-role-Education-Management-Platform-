// lib/types.ts
export type UserRole = 'admin' | 'tentor' | 'ortu'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  phone?: string
  avatar_url?: string
  created_at: string
}

export interface Siswa {
  id: string
  nama: string
  kelas: string
  sekolah?: string
  tanggal_lahir?: string
  alamat?: string
  ortu_id?: string
  aktif: boolean
  created_at: string
  // joined
  ortu?: Profile
}

export interface Sesi {
  id: string
  tentor_id: string
  tanggal: string
  jam_mulai: string
  durasi: 60 | 70 | 90
  mapel: string
  status: 'terjadwal' | 'berlangsung' | 'selesai' | 'dibatalkan'
  created_at: string
  // joined
  tentor?: Profile
  sesi_siswa?: SesiSiswa[]
  jurnal?: Jurnal
}

export interface SesiSiswa {
  id: string
  sesi_id: string
  siswa_id: string
  hadir: boolean | null
  siswa?: Siswa
}

export interface Jurnal {
  id: string
  sesi_id: string
  materi: string
  catatan?: string
  foto_url?: string
  submitted_at: string
}

export interface Spp {
  id: string
  siswa_id: string
  bulan: number
  tahun: number
  nominal: number
  status: 'lunas' | 'belum'
  tanggal_bayar?: string
  keterangan?: string
  created_at: string
  // joined
  siswa?: Siswa
}

export interface DashboardStats {
  total_siswa: number
  sesi_hari_ini: number
  spp_lunas: number
  spp_belum: number
  jurnal_hari_ini: number
  jurnal_pending: number
}