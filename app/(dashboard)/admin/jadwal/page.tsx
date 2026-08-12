// app/(dashboard)/admin/jadwal/page.tsx

import { createClient } from '@/lib/supabase/server'
import type { Profile, Siswa } from '@/lib/types'
import JadwalClient from './JadwalClient'

type TentorOption = Pick<Profile, 'id' | 'full_name'>
type SiswaOption = Pick<Siswa, 'id' | 'nama' | 'kelas'>

export default async function JadwalPage() {
  const supabase = await createClient()

  const [tentorResult, siswaResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name')
      .eq('role', 'tentor')
      .order('full_name', { ascending: true }),

    supabase
      .from('siswa')
      .select('id, nama, kelas')
      .order('nama', { ascending: true }),
  ])

  const tentorError = tentorResult.error
  const siswaError = siswaResult.error

  if (tentorError || siswaError) {
    const error = tentorError ?? siswaError

    console.error('Gagal mengambil data jadwal:', {
      tentorError,
      siswaError,
    })

    return (
      <div className="px-6 pb-6 mt-4">
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h1 className="text-lg font-semibold text-red-600">
            Gagal mengambil data jadwal
          </h1>

          <p className="mt-2 text-sm text-red-500">
            {error?.message ??
              'Terjadi kesalahan saat mengambil data tentor dan siswa.'}
          </p>
        </div>
      </div>
    )
  }

  const tentorList: TentorOption[] = (tentorResult.data ?? []).map(
    (tentor) => ({
      id: tentor.id,
      full_name: tentor.full_name,
    })
  )

  const siswaList: SiswaOption[] = (siswaResult.data ?? []).map(
    (siswa) => ({
      id: siswa.id,
      nama: siswa.nama,
      kelas: siswa.kelas,
    })
  )

  return (
    <JadwalClient
      tentorList={tentorList}
      siswaList={siswaList}
    />
  )
}