'use client'

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  BookOpen,
  Camera,
  CheckCircle2,
  ChevronDown,
  ImageIcon,
  Loader2,
  Lock,
  UserRound,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type StudentInfo = {
  id: string
  nama: string
  kelas: string | null
  sekolah: string | null
}

type JurnalInfo = {
  id: string
  materi: string | null
  catatan: string | null
  foto_url: string | null
  foto_validasi_url: string | null
  foto_validasi_path: string | null
  submitted_at: string | null
}

type SessionStudentRow = {
  id: string
  hadir: boolean | null
  materi: string | null
  deskripsi: string | null
  siswa: StudentInfo | StudentInfo[] | null
}

type SessionRow = {
  id: string
  tentor_id: string
  tanggal: string
  jam_mulai: string | null
  durasi: number | null
  mapel: string | null
  status: string | null
  jurnal: JurnalInfo | JurnalInfo[] | null
  sesi_siswa: SessionStudentRow[] | null
}

type StudentForm = {
  hadir: boolean
  catatan: string
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null
  return Array.isArray(value) ? value[0] ?? null : value
}

function formatTanggal(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(value))
}

function statusBadge(status: string | null) {
  const value = status || 'terjadwal'

  if (value === 'selesai') {
    return 'border-[#DDE9DB] bg-[#F3F8F1] text-[#063D27]'
  }

  if (value === 'dibatalkan') {
    return 'border-red-100 bg-red-50 text-red-700'
  }

  if (value === 'berlangsung') {
    return 'border-[#F5B82E]/30 bg-[#FFF8E6] text-[#8A5C00]'
  }

  return 'border-[#DDE9DB] bg-white text-[#52645A]'
}

export default function TentorJurnalPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [forms, setForms] = useState<Record<string, StudentForm>>({})
  const [foto, setFoto] = useState<File | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function loadData() {
    setLoading(true)
    setError('')
    setSuccess('')

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Sesi login tidak ditemukan. Silakan login ulang.')
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('sesi')
      .select(
        `
        id,
        tentor_id,
        tanggal,
        jam_mulai,
        durasi,
        mapel,
        status,
        jurnal (
          id,
          materi,
          catatan,
          foto_url,
          foto_validasi_url,
          foto_validasi_path,
          submitted_at
        ),
        sesi_siswa (
          id,
          hadir,
          materi,
          deskripsi,
          siswa (
            id,
            nama,
            kelas,
            sekolah
          )
        )
      `
      )
      .eq('tentor_id', user.id)
      .order('tanggal', { ascending: false })
      .order('jam_mulai', { ascending: false })

    if (fetchError) {
      console.log(fetchError)
      setError(fetchError.message)
      setLoading(false)
      return
    }

    const rows = (data || []) as SessionRow[]
    setSessions(rows)

    if (!selectedId && rows.length > 0) {
      const firstUnlocked = rows.find((row) => !one(row.jurnal)?.id)
      setSelectedId(firstUnlocked?.id || rows[0].id)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedSession = useMemo(() => {
    return sessions.find((item) => item.id === selectedId) || null
  }, [sessions, selectedId])

  const selectedJurnal = one(selectedSession?.jurnal)
  const locked = Boolean(selectedJurnal?.id)
  const selectedStudents = selectedSession?.sesi_siswa || []
  const fotoLama = selectedJurnal?.foto_validasi_url || selectedJurnal?.foto_url || null

  useEffect(() => {
    if (!selectedSession) return

    setFoto(null)

    const nextForms: Record<string, StudentForm> = {}

    for (const row of selectedSession.sesi_siswa || []) {
      nextForms[row.id] = {
        hadir: row.hadir ?? true,
        catatan: row.deskripsi || '',
      }
    }

    setForms(nextForms)
  }, [selectedSession])

  function updateForm(rowId: string, key: keyof StudentForm, value: string | boolean) {
    setForms((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [key]: value,
      },
    }))
  }

  function handleFotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] || null
    setFoto(file)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError('')
    setSuccess('')

    if (!selectedSession) {
      setError('Pilih sesi dulu ya.')
      return
    }

    if (locked) {
      setError('Jurnal sudah tersimpan dan tidak bisa diedit lagi.')
      return
    }

    if (selectedStudents.length === 0) {
      setError('Sesi ini belum punya murid.')
      return
    }

    if (!foto) {
      setError('Foto kelas wajib diunggah.')
      return
    }

    for (const row of selectedStudents) {
      const siswa = one(row.siswa)
      const form = forms[row.id]

      if (!form?.catatan?.trim()) {
        setError(`Catatan untuk ${siswa?.nama || 'murid'} belum diisi.`)
        return
      }
    }

    setSaving(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setError('Sesi login tidak ditemukan. Silakan login ulang.')
      setSaving(false)
      return
    }

    const safeName = foto.name.replace(/[^a-zA-Z0-9._-]/g, '-')
    const fotoPath = `${user.id}/${selectedSession.id}/${Date.now()}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from('jurnal')
      .upload(fotoPath, foto, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.log(uploadError)
      setError(uploadError.message)
      setSaving(false)
      return
    }

    const { data: publicUrlData } = supabase.storage.from('jurnal').getPublicUrl(fotoPath)
    const fotoUrl = publicUrlData.publicUrl

    for (const row of selectedStudents) {
      const form = forms[row.id]

      const { error: updateError } = await supabase
        .from('sesi_siswa')
        .update({
          hadir: form.hadir,
          materi: selectedSession.mapel || 'Sesi belajar',
          deskripsi: form.catatan.trim(),
        })
        .eq('id', row.id)
        .eq('sesi_id', selectedSession.id)

      if (updateError) {
        console.log(updateError)
        setError(updateError.message)
        setSaving(false)
        return
      }
    }

    const materiGabungan = selectedStudents
      .map((row) => {
        const siswa = one(row.siswa)
        const form = forms[row.id]
        return `${siswa?.nama || 'Murid'}: ${form.catatan}`
      })
      .join('\n\n')

    const { error: jurnalError } = await supabase.from('jurnal').insert({
      sesi_id: selectedSession.id,
      tentor_id: user.id,
      materi: materiGabungan,
      catatan: null,
      foto_url: fotoUrl,
      foto_validasi_url: fotoUrl,
      foto_validasi_path: fotoPath,
      submitted_at: new Date().toISOString(),
    })

    if (jurnalError) {
      console.log(jurnalError)
      setError(jurnalError.message)
      setSaving(false)
      return
    }

    await supabase.from('sesi').update({ status: 'selesai' }).eq('id', selectedSession.id)

    setSuccess('Jurnal berhasil disimpan.')
    setSaving(false)

    await loadData()
  }

  return (
    <main className="min-h-screen bg-[#F8FAF7] px-4 py-5 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-[32px] border border-[#DDE9DB] bg-white p-6 sm:p-7">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0B5738]/70">
              Jurnal Tentor
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-[#063D27] sm:text-3xl">
              Validasi murid
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#52645A]">
              Pilih sesi, upload foto, lalu isi catatan tiap anak.
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-3 rounded-[24px] border border-red-100 bg-red-50 p-4 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-start gap-3 rounded-[24px] border border-[#DDE9DB] bg-[#F3F8F1] p-4 text-sm text-[#063D27]">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="font-semibold">{success}</p>
          </div>
        )}

        {loading ? (
          <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-8 text-center text-sm font-semibold text-[#52645A]">
            Memuat data...
          </div>
        ) : sessions.length === 0 ? (
          <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-8 text-center">
            <BookOpen className="mx-auto h-9 w-9 text-[#0B5738]" />
            <h2 className="mt-3 text-lg font-black text-[#063D27]">Belum ada sesi</h2>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[340px_1fr]">
            <aside className="space-y-4">
              <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                <label className="text-sm font-black text-[#063D27]">Pilih sesi</label>

                <select
                  value={selectedId}
                  onChange={(event) => setSelectedId(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm font-semibold text-[#063D27] outline-none focus:border-[#063D27]"
                >
                  {sessions.map((session) => {
                    const jurnalAda = Boolean(one(session.jurnal)?.id)

                    return (
                      <option key={session.id} value={session.id}>
                        {formatTanggal(session.tanggal)} {jurnalAda ? ' - terkunci' : ''}
                      </option>
                    )
                  })}
                </select>
              </div>

              {selectedSession && (
                <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#0B5738]/70">
                        Sesi
                      </p>
                      <h2 className="mt-2 text-lg font-black text-[#063D27]">
                        {selectedSession.mapel || 'Sesi belajar'}
                      </h2>
                    </div>

                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black ${statusBadge(
                        selectedSession.status
                      )}`}
                    >
                      {selectedSession.status || 'terjadwal'}
                    </span>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-[#52645A]">
                    <p>
                      <span className="font-black text-[#063D27]">Tanggal:</span>{' '}
                      {formatTanggal(selectedSession.tanggal)}
                    </p>
                    <p>
                      <span className="font-black text-[#063D27]">Jam:</span>{' '}
                      {selectedSession.jam_mulai?.slice(0, 5) || '-'}
                    </p>
                    <p>
                      <span className="font-black text-[#063D27]">Durasi:</span>{' '}
                      {selectedSession.durasi || '-'} menit
                    </p>
                    <p>
                      <span className="font-black text-[#063D27]">Murid:</span>{' '}
                      {selectedStudents.length} anak
                    </p>
                  </div>

                  {locked && (
                    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-[#DDE9DB] bg-[#F3F8F1] p-4 text-sm text-[#063D27]">
                      <Lock className="mt-0.5 h-5 w-5 shrink-0" />
                      <p className="font-black">Jurnal sudah terkunci</p>
                    </div>
                  )}
                </div>
              )}
            </aside>

            <section className="space-y-5">
              {selectedSession && (
                <>
                  <div className="rounded-[28px] border border-[#DDE9DB] bg-white p-5">
                    <div className="flex items-center gap-3">
                      <Camera className="h-5 w-5 text-[#0B5738]" />
                      <h2 className="text-base font-black text-[#063D27]">Foto kelas</h2>
                    </div>

                    {fotoLama ? (
                      <div className="mt-4 overflow-hidden rounded-[22px] border border-[#DDE9DB] bg-[#F8FAF7]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={fotoLama}
                          alt="Foto kelas"
                          className="max-h-[360px] w-full object-cover"
                        />
                      </div>
                    ) : (
                      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[24px] border border-dashed border-[#BFD2BE] bg-[#F8FAF7] px-5 py-8 text-center">
                        <ImageIcon className="h-8 w-8 text-[#0B5738]" />
                        <p className="mt-3 text-sm font-black text-[#063D27]">
                          Upload foto
                        </p>

                        <input
                          type="file"
                          accept="image/*"
                          disabled={locked || saving}
                          onChange={handleFotoChange}
                          className="hidden"
                        />

                        {foto && (
                          <span className="mt-3 rounded-full bg-[#FFF8E6] px-3 py-1 text-xs font-black text-[#8A5C00]">
                            {foto.name}
                          </span>
                        )}
                      </label>
                    )}
                  </div>

                  <div className="space-y-4">
                    {selectedStudents.map((row, index) => {
                      const siswa = one(row.siswa)
                      const form = forms[row.id]

                      return (
                        <details
                          key={row.id}
                          open={index === 0}
                          className="rounded-[28px] border border-[#DDE9DB] bg-white p-5"
                        >
                          <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F3F8F1] text-[#063D27]">
                                <UserRound className="h-5 w-5" />
                              </div>

                              <div>
                                <h3 className="font-black text-[#063D27]">
                                  {siswa?.nama || 'Murid'}
                                </h3>
                                <p className="text-xs font-semibold text-[#52645A]">
                                  {siswa?.kelas || '-'} · {siswa?.sekolah || '-'}
                                </p>
                              </div>
                            </div>

                            <ChevronDown className="h-5 w-5 text-[#52645A]" />
                          </summary>

                          <div className="mt-5 space-y-4">
                            <label className="flex items-center gap-3 rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm font-black text-[#063D27]">
                              <input
                                type="checkbox"
                                checked={form?.hadir ?? true}
                                disabled={locked || saving}
                                onChange={(event) =>
                                  updateForm(row.id, 'hadir', event.target.checked)
                                }
                                className="h-4 w-4 accent-[#063D27]"
                              />
                              Hadir
                            </label>

                            <div>
                              <label className="text-sm font-black text-[#063D27]">
                                Catatan
                              </label>

                              <textarea
                                value={form?.catatan || ''}
                                onChange={(event) =>
                                  updateForm(row.id, 'catatan', event.target.value)
                                }
                                disabled={locked || saving}
                                rows={6}
                                placeholder="Contoh: Hari ini anak belajar pecahan. Anak sudah cukup paham saat menyamakan penyebut, tetapi masih perlu latihan pada soal cerita."
                                className="mt-2 w-full rounded-2xl border border-[#DDE9DB] bg-[#F8FAF7] px-4 py-3 text-sm leading-6 text-[#063D27] outline-none focus:border-[#063D27] disabled:cursor-not-allowed disabled:opacity-70"
                              />
                            </div>
                          </div>
                        </details>
                      )
                    })}
                  </div>

                  <div className="sticky bottom-4 rounded-[28px] border border-[#DDE9DB] bg-white/95 p-4 shadow-sm backdrop-blur">
                    <button
                      type="submit"
                      disabled={locked || saving}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:bg-[#B8C9B8]"
                    >
                      {saving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Menyimpan...
                        </>
                      ) : locked ? (
                        <>
                          <Lock className="h-4 w-4" />
                          Terkunci
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Simpan
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </section>
          </form>
        )}
      </section>
    </main>
  )
}