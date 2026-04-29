// app/(dashboard)/admin/siswa/page.tsx
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import Header from '@/components/admin/Header'
import { formatTanggal } from '@/lib/utils'
import DeleteButton from '@/components/admin/siswa/DeleteButton'

interface SearchParams {
  search?: string
  kelas?: string
  status?: string
}

export default async function SiswaPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = await createClient()

  let query = supabase
    .from('siswa')
    .select('*, ortu:profiles(full_name, phone)')
    .order('nama', { ascending: true })

  if (searchParams.search) {
    query = query.ilike('nama', `%${searchParams.search}%`)
  }

  if (searchParams.kelas) {
    query = query.eq('kelas', searchParams.kelas)
  }

  if (searchParams.status === 'aktif') {
    query = query.eq('aktif', true)
  }

  if (searchParams.status === 'nonaktif') {
    query = query.eq('aktif', false)
  }

  const { data: siswaList, error } = await query

  if (error) {
    return (
      <>
        <Header
          title="Kelola Siswa"
          subtitle="Tambah, edit, dan hapus data siswa"
        />

        <div className="px-6 pb-6 pt-4">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
            <h2 className="font-semibold text-red-700">
              Gagal mengambil data siswa
            </h2>
            <p className="mt-2 text-sm text-red-600">{error.message}</p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Kelola Siswa"
        subtitle="Tambah, edit, dan hapus data siswa"
        actions={
          <Link href="/admin/siswa/tambah" className="btn-primary">
            <Plus className="h-3.5 w-3.5" />
            Tambah Siswa
          </Link>
        }
      />

      <div className="space-y-4 px-4 pb-6 pt-4 sm:px-6">
        <div className="card">
          <form className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label className="label-base">Cari Nama</label>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />

                <input
                  name="search"
                  defaultValue={searchParams.search ?? ''}
                  placeholder="Cari nama siswa..."
                  className="input-base pl-8"
                />
              </div>
            </div>

            <div className="w-full lg:w-40">
              <label className="label-base">Kelas</label>

              <select
                name="kelas"
                defaultValue={searchParams.kelas ?? ''}
                className="input-base"
              >
                <option value="">Semua Kelas</option>
                {[
                  'Kelas 7',
                  'Kelas 8',
                  'Kelas 9',
                  'Kelas 10',
                  'Kelas 11',
                  'Kelas 12',
                ].map((kelas) => (
                  <option key={kelas} value={kelas}>
                    {kelas}
                  </option>
                ))}
              </select>
            </div>

            <div className="w-full lg:w-36">
              <label className="label-base">Status</label>

              <select
                name="status"
                defaultValue={searchParams.status ?? ''}
                className="input-base"
              >
                <option value="">Semua</option>
                <option value="aktif">Aktif</option>
                <option value="nonaktif">Nonaktif</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                Filter
              </button>

              <Link href="/admin/siswa" className="btn-outline">
                Reset
              </Link>
            </div>
          </form>
        </div>

        <div className="card overflow-hidden">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Menampilkan{' '}
              <strong className="text-gray-800">
                {siswaList?.length ?? 0}
              </strong>{' '}
              siswa
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400">
                    Nama
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400">
                    Kelas
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400">
                    Sekolah
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400">
                    Orang Tua
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400">
                    Tgl Daftar
                  </th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-400">
                    Status
                  </th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {(siswaList ?? []).map((siswa) => {
                  const initials = siswa.nama
                    ?.split(' ')
                    .slice(0, 2)
                    .map((n: string) => n[0])
                    .join('')
                    .toUpperCase()

                  return (
                    <tr
                      key={siswa.id}
                      className="border-b border-gray-50 transition-colors hover:bg-gray-50"
                    >
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#FFF8E6] text-xs font-bold text-[#063D27]">
                            {initials || '?'}
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-800">
                              {siswa.nama}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 pr-4 text-xs text-gray-600">
                        {siswa.kelas ?? '-'}
                      </td>

                      <td className="py-3 pr-4 text-xs text-gray-500">
                        {siswa.sekolah ?? '-'}
                      </td>

                      <td className="py-3 pr-4 text-xs text-gray-600">
                        {siswa.ortu?.full_name ?? '-'}
                      </td>

                      <td className="py-3 pr-4 text-xs text-gray-500">
                        {siswa.created_at ? formatTanggal(siswa.created_at) : '-'}
                      </td>

                      <td className="py-3 pr-4">
                        {siswa.aktif ? (
                          <span className="badge-lunas">Aktif</span>
                        ) : (
                          <span className="badge-belum">Nonaktif</span>
                        )}
                      </td>

                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/siswa/${siswa.id}`}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-[#063D27] transition-colors hover:bg-[#FFF8E6]"
                          >
                            Edit
                          </Link>

                          <DeleteButton id={siswa.id} nama={siswa.nama} />
                        </div>
                      </td>
                    </tr>
                  )
                })}

                {(!siswaList || siswaList.length === 0) && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-10 text-center text-sm text-gray-400"
                    >
                      Belum ada data siswa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  )
}