'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ImageIcon,
  Loader2,
  LockKeyhole,
  Save,
  UsersRound,
} from 'lucide-react'

type SiswaRow = {
  id: string
  nama: string | null
  kelas: string | null
  sekolah: string | null
}

type RelasiSiswaRow = {
  id: string
  hadir: boolean | null
  materi: string | null
  deskripsi: string | null
  siswa: SiswaRow | SiswaRow[] | null
}

type JurnalRow = {
  id: string
  materi: string | null
  catatan: string | null
  ringkasan: string | null
  foto_url: string | null
  foto_validasi_url: string | null
  foto_validasi_path?: string | null
  submitted_at: string | null
}

type SesiRow = {
  id: string
  tanggal: string
  jam_mulai: string
  durasi: number
  mapel: string
  status: string
  sesi_siswa: RelasiSiswaRow[]
  jurnal: JurnalRow[]
}

function getSiswaName(siswa: SiswaRow | SiswaRow[] | null) {
  if (!siswa) return '-'
  if (Array.isArray(siswa)) return siswa[0]?.nama ?? '-'
  return siswa.nama ?? '-'
}

function getSiswaKelas(siswa: SiswaRow | SiswaRow[] | null) {
  if (!siswa) return '-'
  if (Array.isArray(siswa)) return siswa[0]?.kelas ?? '-'
  return siswa.kelas ?? '-'
}

function formatTanggalSimple(value?: string | null) {
  if (!value) return '-'

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export default function TentorJurnalPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loadingPage, setLoadingPage] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [sesiList, setSesiList] = useState<SesiRow[]>([])
  const [selectedSesiId, setSelectedSesiId] = useState('')
  const [materi, setMateri] = useState('')
  const [catatan, setCatatan] = useState('')
  const [ringkasan, setRingkasan] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [hadirIds, setHadirIds] = useState<string[]>([])

  const selectedSesi = useMemo(() => {
    return sesiList.find((sesi) => sesi.id === selectedSesiId) ?? null
  }, [sesiList, selectedSesiId])

  const selectedJurnal = selectedSesi?.jurnal?.[0] ?? null
  const isJurnalLocked = !!selectedJurnal

  const sesiSelesai = sesiList.filter((sesi) => sesi.status === 'selesai')
  const sudahJurnal = sesiList.filter((sesi) => sesi.jurnal?.length > 0)
  const belumJurnal = sesiSelesai.filter(
    (sesi) => !sesi.jurnal || sesi.jurnal.length === 0
  )

  async function loadData() {
    setLoadingPage(true)
    setError('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      window.location.href = '/login'
      return
    }

    const { data, error: sesiError } = await supabase
      .from('sesi')
      .select(
        `
        id,
        tanggal,
        jam_mulai,
        durasi,
        mapel,
        status,
        sesi_siswa(
          id,
          hadir,
          materi,
          deskripsi,
          siswa:siswa(
            id,
            nama,
            kelas,
            sekolah
          )
        ),
        jurnal(
          id,
          materi,
          catatan,
          ringkasan,
          foto_url,
          foto_validasi_url,
          foto_validasi_path,
          submitted_at
        )
      `
      )
      .eq('tentor_id', user.id)
      .order('tanggal', { ascending: false })
      .order('jam_mulai', { ascending: false })

    if (sesiError) {
      setError('Gagal mengambil data jurnal: ' + sesiError.message)
      setLoadingPage(false)
      return
    }

    setSesiList((data ?? []) as unknown as SesiRow[])
    setLoadingPage(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleSelectSesi(sesiId: string) {
    setSelectedSesiId(sesiId)
    setSuccess('')
    setError('')
    setFoto(null)

    const sesi = sesiList.find((item) => item.id === sesiId)

    if (!sesi) {
      setMateri('')
      setCatatan('')
      setRingkasan('')
      setHadirIds([])
      return
    }

    const jurnal = sesi.jurnal?.[0]

    setMateri(jurnal?.materi ?? '')
    setCatatan(jurnal?.catatan ?? '')
    setRingkasan(jurnal?.ringkasan ?? '')

    const defaultHadirIds = (sesi.sesi_siswa ?? [])
      .filter((relasi) => relasi.hadir === true)
      .map((relasi) => relasi.id)

    setHadirIds(defaultHadirIds)

    if (jurnal?.id) {
      setError('Jurnal sesi ini sudah tersimpan dan tidak bisa diedit lagi.')
    }
  }

  function toggleHadir(relasiId: string) {
    if (isJurnalLocked) return

    setHadirIds((prev) => {
      if (prev.includes(relasiId)) {
        return prev.filter((id) => id !== relasiId)
      }

      return [...prev, relasiId]
    })
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()

    setError('')
    setSuccess('')

    if (!selectedSesiId) {
      setError('Pilih sesi dulu ya.')
      return
    }

    if (isJurnalLocked) {
      setError('Jurnal sudah tersimpan dan tidak bisa diedit lagi.')
      return
    }

    if (!materi.trim()) {
      setError('Materi wajib diisi.')
      return
    }

    setSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setSaving(false)
      setError('Sesi login habis. Silakan login ulang.')
      return
    }

    const { data: sesiCek, error: sesiCekError } = await supabase
      .from('sesi')
      .select('id, tentor_id')
      .eq('id', selectedSesiId)
      .eq('tentor_id', user.id)
      .single()

    if (sesiCekError || !sesiCek) {
      setSaving(false)
      setError('Sesi tidak ditemukan atau bukan milik akun tentor ini.')
      return
    }

    const { data: jurnalLama, error: jurnalLamaError } = await supabase
      .from('jurnal')
      .select('id')
      .eq('sesi_id', selectedSesiId)
      .maybeSingle()

    if (jurnalLamaError) {
      setSaving(false)
      setError('Gagal cek jurnal lama: ' + jurnalLamaError.message)
      return
    }

    if (jurnalLama?.id) {
      setSaving(false)
      setError('Jurnal sudah tersimpan dan tidak bisa diedit lagi.')
      return
    }

    let fotoUrl: string | null = null
    let fotoPath: string | null = null

    if (foto && foto.size > 0) {
      const ext = foto.name.split('.').pop() || 'jpg'
      const fileName = `${user.id}/${selectedSesiId}-${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('jurnal')
        .upload(fileName, foto, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        setSaving(false)
        setError(
          'Gagal upload foto. Pastikan bucket storage bernama "jurnal" sudah dibuat. Detail: ' +
            uploadError.message
        )
        return
      }

      const { data: publicUrlData } = supabase.storage
        .from('jurnal')
        .getPublicUrl(fileName)

      fotoUrl = publicUrlData.publicUrl
      fotoPath = fileName
    }

    const { error: insertError } = await supabase.from('jurnal').insert({
      sesi_id: selectedSesiId,
      materi: materi.trim(),
      catatan: catatan.trim() || null,
      ringkasan: ringkasan.trim() || null,
      foto_url: fotoUrl,
      foto_validasi_url: fotoUrl,
      foto_validasi_path: fotoPath,
      tentor_id: user.id,
    })

    if (insertError) {
      setSaving(false)
      setError('Gagal menyimpan jurnal: ' + insertError.message)
      return
    }

    const relasiIds = selectedSesi?.sesi_siswa?.map((relasi) => relasi.id) ?? []

    for (const relasiId of relasiIds) {
      const { error: relasiError } = await supabase
        .from('sesi_siswa')
        .update({
          hadir: hadirIds.includes(relasiId),
          materi: materi.trim(),
          deskripsi: catatan.trim() || ringkasan.trim() || null,
        })
        .eq('id', relasiId)

      if (relasiError) {
        setSaving(false)
        setError(
          'Jurnal tersimpan, tapi gagal update kehadiran: ' +
            relasiError.message
        )
        return
      }
    }

    const { error: sesiUpdateError } = await supabase
      .from('sesi')
      .update({
        status: 'selesai',
      })
      .eq('id', selectedSesiId)

    if (sesiUpdateError) {
      setSaving(false)
      setError(
        'Jurnal tersimpan, tapi gagal update status sesi: ' +
          sesiUpdateError.message
      )
      return
    }

    setSaving(false)
    setSuccess('Jurnal berhasil disimpan dan sekarang sudah terkunci.')
    setFoto(null)

    await loadData()
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-5">
        <section className="rounded-[32px] border border-[#DDE9DB] bg-white p-6 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F8F1] px-4 py-2 text-xs font-bold text-[#063D27]">
                <BookOpenCheck className="h-4 w-4" />
                Portal Tentor
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-[#063D27] sm:text-4xl">
                Jurnal Mengajar
              </h1>

              <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Isi materi, catatan, kehadiran, dan foto validasi pembelajaran.
                Setelah disimpan, jurnal akan dikunci.
              </p>
            </div>

            <Link
              href="/tentor/sesi"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-[#DDE9DB] bg-[#F3F8F1] px-5 text-sm font-black text-[#063D27] transition hover:bg-[#EAF3E8]"
            >
              <CalendarDays className="h-4 w-4" />
              Lihat Sesi
            </Link>
          </div>
        </section>

        {error && (
          <div className="rounded-[24px] border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-600">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-bold leading-6 text-emerald-700">
            {success}
          </div>
        )}

        <section className="grid gap-3 sm:grid-cols-3">
          <SmallCard
            title="Sesi Selesai"
            value={`${sesiSelesai.length}`}
            desc="Siap dibuat jurnal"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />

          <SmallCard
            title="Sudah Jurnal"
            value={`${sudahJurnal.length}`}
            desc="Terkunci"
            icon={<LockKeyhole className="h-5 w-5" />}
          />

          <SmallCard
            title="Belum Jurnal"
            value={`${belumJurnal.length}`}
            desc="Perlu diisi"
            icon={<Clock3 className="h-5 w-5" />}
          />
        </section>

        {loadingPage ? (
          <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-10 text-center">
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-[#063D27]" />
            <p className="mt-3 text-sm font-bold text-slate-400">
              Memuat data jurnal...
            </p>
          </section>
        ) : (
          <section className="grid gap-5 lg:grid-cols-[1fr_360px]">
            <form
              onSubmit={handleSubmit}
              className="rounded-[28px] border border-[#DDE9DB] bg-white p-5 sm:p-6"
            >
              <div className="mb-6 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[#F3F8F1] text-[#063D27]">
                  <BookOpenCheck className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-black text-[#063D27]">
                    Form Jurnal
                  </h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                    Pilih satu sesi dulu, lalu isi jurnalnya.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label
                    htmlFor="sesi_id"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Pilih Sesi
                  </label>

                  <select
                    id="sesi_id"
                    value={selectedSesiId}
                    onChange={(e) => handleSelectSesi(e.target.value)}
                    className="h-12 w-full rounded-full border border-[#DDE9DB] bg-[#FAFCF9] px-4 text-sm font-bold text-slate-700 outline-none transition focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10"
                  >
                    <option value="">Pilih sesi</option>

                    {sesiList.map((sesi) => {
                      const jurnalAda = sesi.jurnal?.length > 0

                      return (
                        <option key={sesi.id} value={sesi.id}>
                          {sesi.mapel} · {formatTanggalSimple(sesi.tanggal)} ·{' '}
                          {sesi.jam_mulai?.slice(0, 5) ?? '-'}
                          {jurnalAda ? ' · terkunci' : ''}
                        </option>
                      )
                    })}
                  </select>
                </div>

                {selectedSesi && (
                  <div className="rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#063D27]">
                        {selectedSesi.mapel}
                      </p>

                      {isJurnalLocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                          <LockKeyhole className="h-3.5 w-3.5" />
                          Terkunci
                        </span>
                      ) : (
                        <span className="rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-black text-[#7A5C00]">
                          Belum Jurnal
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatTanggalSimple(selectedSesi.tanggal)} ·{' '}
                      {selectedSesi.jam_mulai?.slice(0, 5) ?? '-'} ·{' '}
                      {selectedSesi.durasi} menit
                    </p>
                  </div>
                )}

                {isJurnalLocked && (
                  <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                    Jurnal untuk sesi ini sudah tersimpan. Data dikunci supaya
                    tidak berubah setelah diterima admin dan orang tua.
                  </div>
                )}

                <div>
                  <label
                    htmlFor="materi"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Materi
                  </label>

                  <textarea
                    id="materi"
                    value={materi}
                    onChange={(e) => setMateri(e.target.value)}
                    rows={4}
                    disabled={isJurnalLocked}
                    placeholder="Contoh: Pembahasan persamaan linear dan latihan soal."
                    className="w-full resize-none rounded-[24px] border border-[#DDE9DB] bg-[#FAFCF9] px-4 py-3 text-sm font-bold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="catatan"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Catatan Tentor
                  </label>

                  <textarea
                    id="catatan"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    rows={4}
                    disabled={isJurnalLocked}
                    placeholder="Contoh: Siswa sudah memahami materi dasar."
                    className="w-full resize-none rounded-[24px] border border-[#DDE9DB] bg-[#FAFCF9] px-4 py-3 text-sm font-bold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="ringkasan"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Ringkasan untuk Orang Tua
                  </label>

                  <textarea
                    id="ringkasan"
                    value={ringkasan}
                    onChange={(e) => setRingkasan(e.target.value)}
                    rows={3}
                    disabled={isJurnalLocked}
                    placeholder="Ringkasan singkat yang mudah dipahami orang tua."
                    className="w-full resize-none rounded-[24px] border border-[#DDE9DB] bg-[#FAFCF9] px-4 py-3 text-sm font-bold leading-6 text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#063D27] focus:bg-white focus:ring-4 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="foto"
                    className="mb-2 block text-xs font-black uppercase tracking-[0.14em] text-slate-400"
                  >
                    Foto Validasi
                  </label>

                  <div className="rounded-[24px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-[#063D27]">
                        <ImageIcon className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <input
                          id="foto"
                          type="file"
                          accept="image/*"
                          disabled={isJurnalLocked}
                          onChange={(e) =>
                            setFoto(e.target.files?.[0] ?? null)
                          }
                          className="block w-full text-sm font-semibold text-slate-500 file:mr-3 file:rounded-full file:border-0 file:bg-[#063D27] file:px-4 file:py-2 file:text-sm file:font-black file:text-white disabled:cursor-not-allowed disabled:opacity-50"
                        />

                        <p className="mt-2 text-xs font-semibold leading-5 text-slate-400">
                          Opsional. Kalau diisi, foto akan muncul di akun orang
                          tua.
                        </p>

                        {selectedJurnal?.foto_validasi_url ||
                        selectedJurnal?.foto_url ? (
                          <div className="mt-3 overflow-hidden rounded-[18px] border border-[#EEF3EC] bg-white">
                            <img
                              src={
                                selectedJurnal.foto_validasi_url ||
                                selectedJurnal.foto_url ||
                                ''
                              }
                              alt="Foto validasi jurnal"
                              className="max-h-[280px] w-full object-contain"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>

                <details
                  open={!!selectedSesi}
                  className="rounded-[24px] border border-[#DDE9DB] bg-[#FAFCF9]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-4 text-sm font-black text-[#063D27]">
                    <span className="inline-flex items-center gap-2">
                      <UsersRound className="h-4 w-4" />
                      Kehadiran Siswa
                    </span>

                    <span className="text-xs font-bold text-slate-400">
                      {selectedSesi?.sesi_siswa?.length ?? 0} siswa
                    </span>
                  </summary>

                  <div className="space-y-2 border-t border-[#EEF3EC] p-4">
                    {!selectedSesi ? (
                      <p className="text-sm font-bold text-slate-400">
                        Pilih sesi dulu.
                      </p>
                    ) : selectedSesi.sesi_siswa.length === 0 ? (
                      <p className="text-sm font-bold text-slate-400">
                        Tidak ada siswa di sesi ini.
                      </p>
                    ) : (
                      selectedSesi.sesi_siswa.map((relasi) => (
                        <label
                          key={relasi.id}
                          className={`flex items-center gap-3 rounded-2xl bg-white px-3 py-2 ${
                            isJurnalLocked
                              ? 'cursor-not-allowed opacity-70'
                              : 'cursor-pointer'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={hadirIds.includes(relasi.id)}
                            disabled={isJurnalLocked}
                            onChange={() => toggleHadir(relasi.id)}
                            className="h-4 w-4 rounded border-slate-300 accent-[#063D27] disabled:cursor-not-allowed"
                          />

                          <div>
                            <p className="text-sm font-bold text-[#063D27]">
                              {getSiswaName(relasi.siswa)}
                            </p>

                            <p className="text-xs font-semibold text-slate-400">
                              {getSiswaKelas(relasi.siswa)}
                            </p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </details>

                <div className="border-t border-[#EEF3EC] pt-5">
                  <button
                    type="submit"
                    disabled={saving || isJurnalLocked}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Menyimpan...
                      </>
                    ) : isJurnalLocked ? (
                      <>
                        <LockKeyhole className="h-4 w-4" />
                        Jurnal Sudah Terkunci
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Simpan Jurnal
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            <aside className="space-y-4">
              <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                <h2 className="text-lg font-black text-[#063D27]">
                  Jurnal Tersimpan
                </h2>

                <p className="mt-1 text-sm font-semibold leading-6 text-slate-400">
                  Sesi yang sudah punya jurnal dan terkunci.
                </p>

                <div className="mt-4 space-y-2">
                  {sudahJurnal.length === 0 ? (
                    <EmptyState text="Belum ada jurnal tersimpan." />
                  ) : (
                    sudahJurnal.slice(0, 8).map((sesi) => {
                      const jurnal = sesi.jurnal?.[0]

                      return (
                        <button
                          key={sesi.id}
                          type="button"
                          onClick={() => handleSelectSesi(sesi.id)}
                          className="w-full rounded-[22px] border border-[#EEF3EC] bg-[#FAFCF9] p-4 text-left transition hover:bg-white"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#ECFDF3] text-[#027A48]">
                              <LockKeyhole className="h-5 w-5" />
                            </div>

                            <div className="min-w-0">
                              <p className="font-black text-[#063D27]">
                                {sesi.mapel}
                              </p>

                              <p className="mt-1 text-xs font-semibold text-slate-400">
                                {formatTanggalSimple(sesi.tanggal)} ·{' '}
                                {sesi.jam_mulai?.slice(0, 5) ?? '-'}
                              </p>

                              <p className="mt-2 line-clamp-2 text-xs font-semibold leading-5 text-slate-500">
                                {jurnal?.ringkasan ||
                                  jurnal?.catatan ||
                                  jurnal?.materi ||
                                  'Jurnal sudah tersimpan.'}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </section>

              <section className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                <h2 className="text-lg font-black text-[#063D27]">
                  Catatan
                </h2>

                <p className="mt-2 text-sm font-semibold leading-7 text-slate-500">
                  Tentor hanya bisa menyimpan jurnal satu kali. Setelah
                  tersimpan, jurnal dikunci agar data yang diterima admin dan
                  orang tua tidak berubah.
                </p>
              </section>
            </aside>
          </section>
        )}
      </div>
    </main>
  )
}

function SmallCard({
  title,
  value,
  desc,
  icon,
}: {
  title: string
  value: string
  desc: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-[26px] border border-[#DDE9DB] bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-3xl font-black text-[#063D27]">{value}</p>

          <p className="mt-1 text-sm font-semibold text-slate-400">{desc}</p>
        </div>

        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
          {icon}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#DDE9DB] bg-[#FAFCF9] px-5 py-8 text-center">
      <p className="text-sm font-bold text-slate-400">{text}</p>
    </div>
  )
}