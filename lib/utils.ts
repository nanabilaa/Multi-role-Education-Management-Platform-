// lib/utils.ts
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

// Format tanggal Indonesia: 24 Apr 2025
export function formatTanggal(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'dd MMM yyyy', { locale: id })
}

// Format tanggal panjang: Senin, 24 April 2025
export function formatTanggalPanjang(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'EEEE, dd MMMM yyyy', { locale: id })
}

// Format uang Indonesia: Rp 500.000
export function formatRupiah(nominal: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(nominal)
}

// Nama bulan Indonesia
export const NAMA_BULAN = [
  '', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// Daftar mata pelajaran
export const DAFTAR_MAPEL = [
  'Matematika', 'Fisika', 'Kimia', 'Biologi',
  'Bahasa Indonesia', 'Bahasa Inggris', 'Sejarah',
  'Geografi', 'Ekonomi', 'Sosiologi', 'IPA', 'IPS'
]

// Daftar kelas
export const DAFTAR_KELAS = [
  'Kelas 7', 'Kelas 8', 'Kelas 9',
  'Kelas 10', 'Kelas 11', 'Kelas 12',
  'SD Kelas 1', 'SD Kelas 2', 'SD Kelas 3',
  'SD Kelas 4', 'SD Kelas 5', 'SD Kelas 6'
]

// Class names helper
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

// Get initials dari nama
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
}