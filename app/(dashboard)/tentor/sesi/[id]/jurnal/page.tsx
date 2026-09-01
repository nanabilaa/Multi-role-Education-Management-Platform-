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

  const jurnalRes = await supabase
    .from('jurnal')
    .select('id, catatan_umum, foto_validasi_url, foto_validasi_path')
    .eq('sesi_id', sesiId)
    .maybeSingle()

  // Fetch jurnal_siswa for the existing jurnal to prefill soal_tugas preview
  const jurnalSiswaMap = new Map<string, { soal_tugas_url: string | null; soal_tugas_path: string | null; catatan: string | null }>()
  if (jurnalRes.data?.id && relasiRows.length > 0) {
    const relasiIds = relasiRows.map((r) => r.id)
    const jurnalSiswaRes = await supabase
      .from('jurnal_siswa')
      .select('sesi_siswa_id, soal_tugas_url, soal_tugas_path, catatan')
      .eq('jurnal_id', jurnalRes.data.id)
      .in('sesi_siswa_id', relasiIds)

    if (jurnalSiswaRes.error) {
      console.error('[DEBUG LOAD JURNAL] jurnal_siswa error:', jurnalSiswaRes.error)
    } else {
      console.log('[DEBUG LOAD JURNAL] jurnal_siswa count:', jurnalSiswaRes.data?.length || 0)
      for (const row of jurnalSiswaRes.data ?? []) {
        if (typeof row.sesi_siswa_id === 'string') {
          jurnalSiswaMap.set(row.sesi_siswa_id, {
            soal_tugas_url: typeof row.soal_tugas_url === 'string' ? row.soal_tugas_url : null,
            soal_tugas_path: typeof row.soal_tugas_path === 'string' ? row.soal_tugas_path : null,
            catatan: typeof row.catatan === 'string' ? row.catatan : null,
          })
        }
      }
      console.log('[DEBUG LOAD JURNAL] jurnalSiswaMap size:', jurnalSiswaMap.size)
      if (jurnalSiswaMap.size > 0) {
        const sample = Array.from(jurnalSiswaMap.entries())[0]
        console.log('[DEBUG LOAD JURNAL] sample entry:', sample[0], '->', sample[1])
      }
    }
  }
  console.log('[DEBUG LOAD JURNAL] jurnal:', jurnalRes.data)

  const muridList = relasiRows.map((row, index) => {
    const existing = jurnalSiswaMap.get(row.id)
    return {
      key: row.id || `murid-${index}`,
      relasiId: row.id,
      materi: row.materi ?? '',
      deskripsi: row.deskripsi ?? '',
      siswa: row.siswa_id ? siswaMap.get(row.siswa_id) ?? null : null,
      existingSoalTugasUrl: existing?.soal_tugas_url ?? null,
      existingSoalTugasPath: existing?.soal_tugas_path ?? null,
      existingSoalCatatan: existing?.catatan ?? '',
    }
  })

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

    // DEBUG: Log all FormData keys
    const allKeys: string[] = []
    formData.forEach((value, key) => {
      const isFile = value instanceof File
      allKeys.push(`${key}${isFile ? ` (File: ${(value as File).name}, ${(value as File).size}b)` : `: ${String(value).substring(0, 50)}`}`)
    })
    console.log('[DEBUG saveJurnalAction] All form keys:', allKeys.length, allKeys)
    const soalFotoKeys = allKeys.filter(k => k.startsWith('soal_foto_'))
    const soalCatatanKeys = allKeys.filter(k => k.startsWith('soal_catatan_'))
    console.log('[DEBUG saveJurnalAction] soal_foto_ keys:', soalFotoKeys)
    console.log('[DEBUG saveJurnalAction] soal_catatan_ keys:', soalCatatanKeys)

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
    console.log('[DEBUG saveJurnalAction] Processing', validRows.length, 'student rows:', validRows.map(r => r.id))

    // First, find or create jurnal entry
    let jurnalUuid: string | null = null
    const jurnalCheck = await supabase
      .from('jurnal')
      .select('id')
      .eq('sesi_id', targetSesiId)
      .maybeSingle()

    if (jurnalCheck?.data) {
      jurnalUuid = jurnalCheck.data.id
    } else {
      const { data: newJurnal, error: jurnalError } = await supabase
        .from('jurnal')
        .insert({
          sesi_id: targetSesiId,
          tentor_id: userId,
          materi: '-',
        })
        .select('id')
        .single()

      if (jurnalError || !newJurnal) {
        redirectJurnalError(targetSesiId, 'Gagal membuat jurnal')
      }
      jurnalUuid = newJurnal.id
    }
    console.log('[DEBUG jurnal] jurnalUuid:', jurnalUuid)

    for (const row of validRows) {
      const materi = String(formData.get(`materi_${row.id}`) || '').trim()
      const deskripsi = String(formData.get(`deskripsi_${row.id}`) || '').trim()
      const soalCatatan = String(formData.get(`soal_catatan_${row.id}`) || '').trim()

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

      // Handle soal_foto per student - upload to soal-tugas-siswa bucket
      const soalFoto = formData.get(`soal_foto_${row.id}`)
      let soalFotoUrl: string | null = null
      let soalFotoPath: string | null = null

      console.log('[DEBUG jurnal] row.id:', row.id, 'soalFoto instanceof File:', soalFoto instanceof File, 'soalCatatan:', soalCatatan)

      if (soalFoto instanceof File && soalFoto.size > 0) {
        if (!soalFoto.type.startsWith('image/')) {
          redirectJurnalError(targetSesiId, 'File soal foto harus berupa gambar')
        }

        if (soalFoto.size > 5 * 1024 * 1024) {
          redirectJurnalError(targetSesiId, 'Ukuran foto soal maksimal 5MB')
        }

        const ext = soalFoto.name.split('.').pop() || 'jpg'
        // FIX: Object path must NOT include the bucket name
        const path = `${userId}/${targetSesiId}/${row.id}/${Date.now()}.${ext}`
        const fileBuffer = await soalFoto.arrayBuffer()

        console.log('[DEBUG jurnal] uploading to path:', path)
        const uploadRes = await supabase.storage
          .from('soal-tugas-siswa')
          .upload(path, fileBuffer, {
            contentType: soalFoto.type,
            upsert: true,
          })

        if (uploadRes.error) {
          console.error('[DEBUG jurnal] upload error:', uploadRes.error)
          redirectJurnalError(
            targetSesiId,
            `Upload foto soal gagal: ${uploadRes.error.message}`
          )
        }

        const publicUrlRes = supabase.storage
          .from('soal-tugas-siswa')
          .getPublicUrl(path)

        soalFotoUrl = publicUrlRes.data.publicUrl
        soalFotoPath = path
        console.log('[DEBUG jurnal] soalFotoUrl:', soalFotoUrl)
      }

      // ALWAYS upsert jurnal_siswa for every student
      // This ensures row exists even without photo/catatan
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'unknown'
      const hostname = (() => {
        try { return new URL(supabaseUrl).hostname } catch { return 'parse-error' }
      })()
      console.log('[DEBUG jurnal] BEFORE upsert:', {
        hostname,
        nodeEnv: process.env.NODE_ENV,
        jurnalUuid,
        sesi_siswa_id: row.id,
        has_soalFotoUrl: !!soalFotoUrl,
      })
      const { data: upsertData, error: jurnalSiswaError } = await supabase
        .from('jurnal_siswa')
        .upsert(
          {
            sesi_siswa_id: row.id,
            jurnal_id: jurnalUuid,
            soal_tugas_url: soalFotoUrl,
            soal_tugas_path: soalFotoPath,
            catatan: soalCatatan || null,
          },
          { onConflict: 'sesi_siswa_id,jurnal_id' }
        )
        .select()

      console.log('[DEBUG jurnal] upsert result:', upsertData, 'error:', jurnalSiswaError)

      if (jurnalSiswaError) {
        console.error('jurnal_siswa error:', jurnalSiswaError)
        redirectJurnalError(targetSesiId, 'Gagal menyimpan soal/tugas murid')
      }

      // VERIFY: Immediately read back to confirm insert worked
      const verify = await supabase
        .from('jurnal_siswa')
        .select('*')
        .eq('jurnal_id', jurnalUuid)
        .eq('sesi_siswa_id', row.id)
        .maybeSingle()
      console.log('[DEBUG verify after upsert]', {
        found: !!verify.data,
        data: verify.data,
        error: verify.error,
      })
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

                    {/* Soal/Tugas Section - New Feature */}
                    <div className="border-t border-slate-200 pt-4">
                      <p className="mb-3 text-sm font-semibold text-slate-700">
                        📷 Soal/Tugas yang Dikerjakan
                      </p>
                      
                      <div className="grid gap-4 lg:grid-cols-2">
                        <div>
                          <label
                            htmlFor={`soal_catatan_${item.relasiId}`}
                            className="mb-2 block text-xs font-medium text-slate-500"
                          >
                            Catatan Soal/Tugas
                          </label>
                          <input
                            id={`soal_catatan_${item.relasiId}`}
                            name={`soal_catatan_${item.relasiId}`}
                            type="text"
                            defaultValue={item.existingSoalCatatan}
                            disabled={isSelesai}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                            placeholder="Contoh: Hal 45-46, 5 soal"
                          />
                        </div>

                        <div>
                          <label
                            htmlFor={`soal_foto_${item.relasiId}`}
                            className="mb-2 block text-xs font-medium text-slate-500"
                          >
                            Foto Soal/Tugas
                          </label>
                          <input
                            id={`soal_foto_${item.relasiId}`}
                            name={`soal_foto_${item.relasiId}`}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            disabled={isSelesai}
                            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                          />
                          <p className="mt-1 text-xs text-slate-400">
                            Format: JPG, PNG. Maksimal 5MB. Foto akan dikompresi otomatis.
                          </p>
                          {item.existingSoalTugasUrl ? (
                            <div className="mt-2">
                              <p className="text-xs font-medium text-slate-500">Foto tersimpan:</p>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={item.existingSoalTugasUrl}
                                alt="Foto soal tersimpan"
                                className="mt-1 max-h-32 rounded-lg border border-slate-200"
                              />
                            </div>
                          ) : null}
                          <input
                            type="hidden"
                            name={`soal_tugas_lama_url_${item.relasiId}`}
                            value={item.existingSoalTugasUrl ?? ''}
                          />
                          <input
                            type="hidden"
                            name={`soal_tugas_lama_path_${item.relasiId}`}
                            value={item.existingSoalTugasPath ?? ''}
                          />
                        </div>
                      </div>
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
