import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import SubmitButton from './SubmitButton'

type PageProps = {
  params: {
    id: string
  }
  searchParams?: {
    error?: string
    success?: string
  }
}

type SesiRow = {
  id: string
  tentor_id: string | null
  tanggal: string | null
  jam_mulai: string | null
  durasi: number | null
  status: string | null
  mapel: string | null
}

type RelasiRow = {
  id: string
  siswa_id: string | null
  materi: string | null
  deskripsi: string | null
}

type SiswaRow = {
  id: string
  nama: string | null
  kelas: string | null
  sekolah: string | null
}

type JurnalRow = {
  id: string
  catatan_umum: string | null
  foto_validasi_url: string | null
  foto_validasi_path: string | null
}

function formatTanggal(value: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

function redirectJurnalError(sesiId: string, message: string): never {
  redirect(`/tentor/sesi/${sesiId}/jurnal?error=${encodeURIComponent(message)}`)
}

export default async function JurnalSesiPage({
  params,
  searchParams,
}: PageProps) {
  const sesiId = params.id
  const supabase = await createClient()

  const authRes = await supabase.auth.getUser()
  const user = authRes.data.user

  if (!user) {
    redirect('/login')
  }

  const sesiRes = await supabase
    .from('sesi')
    .select('id, tentor_id, tanggal, jam_mulai, durasi, status, mapel')
    .eq('id', sesiId)
    .maybeSingle()

  if (sesiRes.error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">
          Gagal mengambil sesi
        </h1>
        <p className="mt-2 text-sm text-slate-600">{sesiRes.error.message}</p>
      </div>
    )
  }

  const sesiRaw = sesiRes.data

  if (!sesiRaw || typeof sesiRaw.id !== 'string') {
    notFound()
  }

  const sesi: SesiRow = {
    id: sesiRaw.id,
    tentor_id: typeof sesiRaw.tentor_id === 'string' ? sesiRaw.tentor_id : null,
    tanggal: typeof sesiRaw.tanggal === 'string' ? sesiRaw.tanggal : null,
    jam_mulai: typeof sesiRaw.jam_mulai === 'string' ? sesiRaw.jam_mulai : null,
    durasi: typeof sesiRaw.durasi === 'number' ? sesiRaw.durasi : null,
    status: typeof sesiRaw.status === 'string' ? sesiRaw.status : null,
    mapel: typeof sesiRaw.mapel === 'string' ? sesiRaw.mapel : null,
  }

  const isSelesai = (sesi.status ?? '').toLowerCase() === 'selesai'

  if (sesi.tentor_id !== user.id) {
    redirect('/tentor/sesi')
  }

  const relasiRes = await supabase
    .from('sesi_siswa')
    .select('id, siswa_id, materi, deskripsi')
    .eq('sesi_id', sesiId)

  if (relasiRes.error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">
          Gagal mengambil murid sesi
        </h1>
        <p className="mt-2 text-sm text-slate-600">{relasiRes.error.message}</p>
      </div>
    )
  }

  const relasiRows: RelasiRow[] = []

  for (const raw of relasiRes.data ?? []) {
    if (!raw) continue
    if (typeof raw.id !== 'string') continue

    relasiRows.push({
      id: raw.id,
      siswa_id: typeof raw.siswa_id === 'string' ? raw.siswa_id : null,
      materi: typeof raw.materi === 'string' ? raw.materi : null,
      deskripsi: typeof raw.deskripsi === 'string' ? raw.deskripsi : null,
    })
  }

  const siswaIds: string[] = []

  for (const row of relasiRows) {
    if (row.siswa_id) {
      siswaIds.push(row.siswa_id)
    }
  }

  const siswaRows: SiswaRow[] = []

  if (siswaIds.length > 0) {
    const siswaRes = await supabase
      .from('siswa')
      .select('id, nama, kelas, sekolah')
      .in('id', siswaIds)

    if (siswaRes.error) {
      return (
        <div className="p-6">
          <h1 className="text-xl font-semibold text-red-500">
            Gagal mengambil data siswa
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {siswaRes.error.message}
          </p>
        </div>
      )
    }

    for (const raw of siswaRes.data ?? []) {
      if (!raw) continue
      if (typeof raw.id !== 'string') continue

      siswaRows.push({
        id: raw.id,
        nama: typeof raw.nama === 'string' ? raw.nama : null,
        kelas: typeof raw.kelas === 'string' ? raw.kelas : null,
        sekolah: typeof raw.sekolah === 'string' ? raw.sekolah : null,
      })
    }
  }

  const siswaMap = new Map<string, SiswaRow>()

  for (const row of siswaRows) {
    siswaMap.set(row.id, row)
  }

  const muridList = relasiRows.map((row, index) => ({
    key: row.id || `murid-${index}`,
    relasiId: row.id,
    materi: row.materi ?? '',
    deskripsi: row.deskripsi ?? '',
    siswa: row.siswa_id ? siswaMap.get(row.siswa_id) ?? null : null,
  }))

  const jurnalRes = await supabase
    .from('jurnal')
    .select('id, catatan_umum, foto_validasi_url, foto_validasi_path')
    .eq('sesi_id', sesiId)
    .maybeSingle()

  if (jurnalRes.error) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-500">
          Gagal mengambil jurnal
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {jurnalRes.error.message}
        </p>
      </div>
    )
  }

  const jurnalRaw = jurnalRes.data

  const jurnal: JurnalRow | null =
    jurnalRaw && typeof jurnalRaw.id === 'string'
      ? {
          id: jurnalRaw.id,
          catatan_umum:
            typeof jurnalRaw.catatan_umum === 'string'
              ? jurnalRaw.catatan_umum
              : null,
          foto_validasi_url:
            typeof jurnalRaw.foto_validasi_url === 'string'
              ? jurnalRaw.foto_validasi_url
              : null,
          foto_validasi_path:
            typeof jurnalRaw.foto_validasi_path === 'string'
              ? jurnalRaw.foto_validasi_path
              : null,
        }
      : null

  async function saveJurnalAction(formData: FormData) {
    'use server'

    const supabase = await createClient()

    const targetSesiId = String(formData.get('sesi_id') || sesiId || '')
    const intent = String(formData.get('intent') || 'save')
    const catatanUmum = String(formData.get('catatan_umum') || '').trim()

    const fotoLamaUrl = String(formData.get('foto_validasi_lama_url') || '')
    const fotoLamaPath = String(formData.get('foto_validasi_lama_path') || '')

    const foto = formData.get('foto_validasi')

    if (!targetSesiId) {
      redirect('/tentor/sesi?error=Sesi tidak ditemukan')
    }

    const authRes = await supabase.auth.getUser()
    const userId = authRes.data.user?.id ?? null

    if (!userId) {
      redirect('/login')
    }

    const sesiCheckRes = await supabase
      .from('sesi')
      .select('id, tentor_id, status')
      .eq('id', targetSesiId)
      .eq('tentor_id', userId)
      .maybeSingle()

    if (sesiCheckRes.error) {
      redirectJurnalError(targetSesiId, sesiCheckRes.error.message)
    }

    if (!sesiCheckRes.data) {
      redirectJurnalError(
        targetSesiId,
        'Sesi tidak ditemukan atau kamu tidak punya akses'
      )
    }

    const statusSesi = String(sesiCheckRes.data.status || '').toLowerCase()

    if (statusSesi === 'selesai') {
      redirectJurnalError(
        targetSesiId,
        'Sesi sudah ditutup. Jurnal tidak bisa diedit lagi.'
      )
    }

    const relasiCheckRes = await supabase
      .from('sesi_siswa')
      .select('id')
      .eq('sesi_id', targetSesiId)

    if (relasiCheckRes.error) {
      redirectJurnalError(targetSesiId, relasiCheckRes.error.message)
    }

    const validRows: Array<{ id: string }> = []

    for (const raw of relasiCheckRes.data ?? []) {
      if (!raw) continue
      if (typeof raw.id !== 'string') continue

      validRows.push({ id: raw.id })
    }

    if (validRows.length === 0) {
      redirectJurnalError(targetSesiId, 'Belum ada murid pada sesi ini')
    }

    for (const row of validRows) {
      const materi = String(formData.get(`materi_${row.id}`) || '').trim()
      const deskripsi = String(formData.get(`deskripsi_${row.id}`) || '').trim()

      if (intent === 'close' && (!materi || !deskripsi)) {
        redirectJurnalError(
          targetSesiId,
          'Semua murid wajib diisi materi dan deskripsinya sebelum sesi ditutup'
        )
      }

      const updateRes = await supabase
        .from('sesi_siswa')
        .update({
          materi: materi || null,
          deskripsi: deskripsi || null,
        })
        .eq('id', row.id)

      if (updateRes.error) {
        redirectJurnalError(targetSesiId, updateRes.error.message)
      }
    }

    let fotoUrl = fotoLamaUrl || null
    let fotoPath = fotoLamaPath || null

    if (foto instanceof File && foto.size > 0) {
      if (!foto.type.startsWith('image/')) {
        redirectJurnalError(targetSesiId, 'File validasi harus berupa gambar')
      }

      if (foto.size > 5 * 1024 * 1024) {
        redirectJurnalError(targetSesiId, 'Ukuran foto maksimal 5MB')
      }

      const ext = foto.name.split('.').pop() || 'jpg'
      const path = `${userId}/${targetSesiId}-${Date.now()}.${ext}`
      const fileBuffer = await foto.arrayBuffer()

      const uploadRes = await supabase.storage
        .from('validasi-sesi')
        .upload(path, fileBuffer, {
          contentType: foto.type,
          upsert: true,
        })

      if (uploadRes.error) {
        redirectJurnalError(
          targetSesiId,
          `Upload foto gagal: ${uploadRes.error.message}`
        )
      }

      const publicUrlRes = supabase.storage
        .from('validasi-sesi')
        .getPublicUrl(path)

      fotoUrl = publicUrlRes.data.publicUrl
      fotoPath = path
    }

    if (intent === 'close' && !fotoUrl) {
      redirectJurnalError(
        targetSesiId,
        'Foto validasi wajib diupload sebelum menutup sesi'
      )
    }

    const upsertRes = await supabase
      .from('jurnal')
      .upsert(
        [
          {
            sesi_id: targetSesiId,
            tentor_id: userId,
            materi: catatanUmum || '-',
            catatan_umum: catatanUmum || null,
            foto_validasi_url: fotoUrl,
            foto_validasi_path: fotoPath,
          },
        ],
        { onConflict: 'sesi_id' }
      )

    if (upsertRes.error) {
      redirectJurnalError(targetSesiId, upsertRes.error.message)
    }

    if (intent === 'close') {
      const closeRes = await supabase
        .from('sesi')
        .update({ status: 'selesai' })
        .eq('id', targetSesiId)
        .eq('tentor_id', userId)
        .select('id, status')
        .maybeSingle()

      if (closeRes.error) {
        redirectJurnalError(targetSesiId, closeRes.error.message)
      }

      if (!closeRes.data || closeRes.data.status !== 'selesai') {
        redirectJurnalError(targetSesiId, 'Sesi gagal berubah menjadi selesai')
      }

      revalidatePath('/tentor/jadwal')
      revalidatePath('/tentor/sesi')
      revalidatePath(`/tentor/sesi/${targetSesiId}`)
      revalidatePath(`/tentor/sesi/${targetSesiId}/masuk`)
      revalidatePath(`/tentor/sesi/${targetSesiId}/jurnal`)

      redirect('/tentor/jadwal?success=Sesi berhasil ditutup')
    }

    revalidatePath('/tentor/jadwal')
    revalidatePath('/tentor/sesi')
    revalidatePath(`/tentor/sesi/${targetSesiId}`)
    revalidatePath(`/tentor/sesi/${targetSesiId}/masuk`)
    revalidatePath(`/tentor/sesi/${targetSesiId}/jurnal`)

    redirect(
      `/tentor/sesi/${targetSesiId}/jurnal?success=${encodeURIComponent(
        'Draft berhasil disimpan'
      )}`
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <Link
            href="/tentor/sesi"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft size={16} />
            Kembali ke Sesi
          </Link>

          <h1 className="text-2xl font-bold text-slate-900">Jurnal Sesi</h1>

          <p className="mt-1 text-sm text-slate-500">
            {sesi.mapel ?? '-'} • {formatTanggal(sesi.tanggal)}
          </p>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/tentor/sesi/${sesiId}`}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Detail
          </Link>

          <Link
            href={`/tentor/sesi/${sesiId}/masuk`}
            className="rounded-xl bg-[#063D27] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B5738]"
          >
            Masuk Sesi
          </Link>
        </div>
      </div>

      {searchParams?.error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {searchParams.error}
        </div>
      ) : null}

      {searchParams?.success ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {searchParams.success}
        </div>
      ) : null}

      {isSelesai ? (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          Sesi sudah ditutup. Jurnal hanya bisa dilihat dan tidak bisa diedit lagi.
        </div>
      ) : null}

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-900">Tanggal:</span>{' '}
            {formatTanggal(sesi.tanggal)}
          </p>

          <p>
            <span className="font-semibold text-slate-900">Jam Mulai:</span>{' '}
            {sesi.jam_mulai?.slice(0, 5) || '-'}
          </p>

          <p>
            <span className="font-semibold text-slate-900">Durasi:</span>{' '}
            {sesi.durasi ?? 0} menit
          </p>

          <p>
            <span className="font-semibold text-slate-900">Status:</span>{' '}
            {sesi.status ?? '-'}
          </p>
        </div>
      </div>

      <form
        id="jurnal-form"
        action={saveJurnalAction}
        className="space-y-6"
        encType="multipart/form-data"
      >
        <input type="hidden" name="sesi_id" value={sesiId} />

        <input
          type="hidden"
          name="foto_validasi_lama_url"
          value={jurnal?.foto_validasi_url ?? ''}
        />

        <input
          type="hidden"
          name="foto_validasi_lama_path"
          value={jurnal?.foto_validasi_path ?? ''}
        />

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Isi Progres per Murid
          </h2>

          <div className="mt-4 space-y-5">
            {muridList.length > 0 ? (
              muridList.map((item, index) => (
                <div
                  key={item.key}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {item.siswa?.nama ?? `Murid ${index + 1}`}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {item.siswa?.kelas ?? '-'} •{' '}
                      {item.siswa?.sekolah ?? '-'}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-4">
                    <div>
                      <label
                        htmlFor={`materi_${item.relasiId}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Materi Anak Ini
                      </label>

                      <input
                        id={`materi_${item.relasiId}`}
                        name={`materi_${item.relasiId}`}
                        type="text"
                        defaultValue={item.materi}
                        disabled={isSelesai}
                        className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="Contoh: Pecahan desimal"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor={`deskripsi_${item.relasiId}`}
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Sudah Ngerjain Apa / Deskripsi
                      </label>

                      <textarea
                        id={`deskripsi_${item.relasiId}`}
                        name={`deskripsi_${item.relasiId}`}
                        defaultValue={item.deskripsi}
                        disabled={isSelesai}
                        className="min-h-[110px] w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                        placeholder="Contoh: Sudah mengerjakan latihan 1-10, masih perlu dibimbing di soal cerita"
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                Belum ada murid di sesi ini.
              </div>
            )}
          </div>
        </div>

        <div className="relative z-50 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm pointer-events-auto">
          <h2 className="text-lg font-semibold text-slate-900">
            Validasi Kelas
          </h2>

          <div className="mt-4 space-y-4">
            <div>
              <label
                htmlFor="catatan_umum"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Catatan Umum
              </label>

              <textarea
                id="catatan_umum"
                name="catatan_umum"
                defaultValue={jurnal?.catatan_umum ?? ''}
                disabled={isSelesai}
                className="min-h-[120px] w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Catatan umum untuk sesi hari ini"
              />
            </div>

            <div>
              <label
                htmlFor="foto_validasi"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Foto Validasi
              </label>

              <input
                id="foto_validasi"
                name="foto_validasi"
                type="file"
                accept="image/*"
                disabled={isSelesai}
                className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />

              <p className="mt-1 text-xs text-slate-500">
                Foto wajib saat klik Simpan & Tutup Sesi. Kalau sudah ada foto
                saat ini, tidak perlu upload ulang.
              </p>

              {jurnal?.foto_validasi_url ? (
                <div className="mt-3">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    Foto saat ini
                  </p>

                  <img
                    src={jurnal.foto_validasi_url}
                    alt="Foto validasi"
                    className="max-h-64 rounded-xl border border-slate-200 object-cover"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {isSelesai ? (
            <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
              Sesi sudah ditutup. Tombol simpan dinonaktifkan.
            </div>
          ) : (
            <div className="relative z-[999] mt-6 flex justify-end gap-3 pointer-events-auto">
              <SubmitButton label="Simpan Draft" variant="secondary" />

              <button
                type="submit"
                form="jurnal-form"
                name="intent"
                value="close"
                disabled={false}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98]"
              >
                Simpan & Tutup Sesi
              </button>
            </div>
          )}
        </div>
      </form>
    </div>
  )
}
