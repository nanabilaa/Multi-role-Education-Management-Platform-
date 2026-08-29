'use client'

import { useState, useCallback, useRef } from 'react'
import { Camera, Upload, X, Loader2, AlertCircle, FileImage } from 'lucide-react'
import { compressImage, validateImageFile } from '@/lib/image-utils'
import { createClient } from '@/lib/supabase/client'

interface StudentWorkData {
  jurnalSiswaId?: string
  sesiSiswaId: string
  siswaId: string
  siswaName: string
  siswaKelas: string
  siswaSekolah: string
  catatan: string
  fotoUrl?: string
  fotoPath?: string
}

interface JurnalFormClientProps {
  sesiId: string
  isSelesai: boolean
  students: StudentWorkData[]
  existingJurnalId?: string
}

export default function JurnalFormClient({
  sesiId,
  isSelesai,
  students,
  existingJurnalId,
}: JurnalFormClientProps) {
  const [studentWorks, setStudentWorks] = useState<StudentWorkData[]>(students)
  const [uploadingStudents, setUploadingStudents] = useState<Set<string>>(new Set())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const formRef = useRef<HTMLFormElement>(null)
  const submittedRef = useRef(false)

  const handleCatatanChange = useCallback((sesiSiswaId: string, value: string) => {
    setStudentWorks((prev) =>
      prev.map((s) => (s.sesiSiswaId === sesiSiswaId ? { ...s, catatan: value } : s))
    )
  }, [])

  const handleFotoChange = useCallback(
    async (sesiSiswaId: string, siswaId: string, file: File) => {
      setErrors((prev) => ({ ...prev, [sesiSiswaId]: '' }))

      // Validate
      const validation = validateImageFile(file, 5)
      if (!validation.valid) {
        setErrors((prev) => ({ ...prev, [sesiSiswaId]: validation.error || 'File tidak valid' }))
        return
      }

      // Mark as uploading
      setUploadingStudents((prev) => new Set(prev).add(sesiSiswaId))

      try {
        // Compress image to ~500KB max
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8,
          maxSizeMB: 0.5,
        })

        // Upload to Supabase Storage
        const supabase = createClient()
        const ext = file.name.split('.').pop() || 'jpg'
        const path = `soal-tugas-siswa/${sesiId}/${siswaId}/${Date.now()}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('soal-tugas-siswa')
          .upload(path, compressed.blob, {
            contentType: 'image/jpeg',
            upsert: true,
          })

        if (uploadError) {
          throw new Error(uploadError.message)
        }

        const { data: urlData } = supabase.storage
          .from('soal-tugas-siswa')
          .getPublicUrl(path)

        // Update state with preview URL
        const previewUrl = URL.createObjectURL(compressed.blob)
        setStudentWorks((prev) =>
          prev.map((s) =>
            s.sesiSiswaId === sesiSiswaId
              ? { ...s, fotoUrl: previewUrl, fotoPath: path }
              : s
          )
        )
      } catch (err) {
        console.error('Upload failed:', err)
        setErrors((prev) => ({
          ...prev,
          [sesiSiswaId]: 'Gagal upload foto. Silakan coba lagi.',
        }))
      } finally {
        setUploadingStudents((prev) => {
          const next = new Set(prev)
          next.delete(sesiSiswaId)
          return next
        })
      }
    },
    [sesiId]
  )

  const handleRemoveFoto = useCallback((sesiSiswaId: string) => {
    setStudentWorks((prev) =>
      prev.map((s) =>
        s.sesiSiswaId === sesiSiswaId ? { ...s, fotoUrl: undefined, fotoPath: undefined } : s
      )
    )
    setErrors((prev) => {
      const next = { ...prev }
      delete next[sesiSiswaId]
      return next
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent, intent: 'save' | 'close') => {
      e.preventDefault()

      // Prevent double submit
      if (isSubmitting || submittedRef.current) return
      submittedRef.current = true
      setIsSubmitting(true)
      setSubmitStatus('idle')
      setSubmitMessage('')

      try {
        const formData = new FormData(formRef.current!)
        formData.set('intent', intent)

        // Add jurnal_siswa data
        for (const student of studentWorks) {
          const fotoFile = formData.get(`foto_${student.sesiSiswaId}`) as File | null
          if (fotoFile && fotoFile.size > 0) {
            // Handle new photo upload via API
            const response = await fetch('/api/tentor/jurnal-siswa', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sesiSiswaId: student.sesiSiswaId,
                siswaId: student.siswaId,
                sesiId,
                catatan: student.catatan,
                intent,
              }),
            })

            if (!response.ok) {
              const data = await response.json()
              throw new Error(data.error || 'Gagal menyimpan data')
            }
          }
        }

        // Submit main form
        const response = await fetch(`/api/tentor/sesi/${sesiId}/jurnal`, {
          method: 'POST',
          body: formData,
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Gagal menyimpan jurnal')
        }

        setSubmitStatus('success')
        setSubmitMessage(intent === 'close' ? 'Sesi berhasil ditutup' : 'Draft berhasil disimpan')

        if (intent === 'close') {
          window.location.href = '/tentor/jadwal?success=Sesi berhasil ditutup'
        } else {
          window.location.reload()
        }
      } catch (err) {
        setSubmitStatus('error')
        setSubmitMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
        submittedRef.current = false
      } finally {
        setIsSubmitting(false)
      }
    },
    [isSubmitting, studentWorks, sesiId]
  )

  return (
    <form
      ref={formRef}
      className="space-y-6"
      encType="multipart/form-data"
      onSubmit={(e) => handleSubmit(e, 'save')}
    >
      <input type="hidden" name="sesi_id" value={sesiId} />
      <input type="hidden" name="jurnal_id" value={existingJurnalId || ''} />

      {/* Status messages */}
      {submitStatus === 'error' && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {submitMessage}
        </div>
      )}

      {submitStatus === 'success' && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {submitMessage}
        </div>
      )}

      {/* Student Work Cards */}
      <div className="space-y-5">
        <h2 className="text-lg font-semibold text-slate-900">
          Soal/Tugas per Murid
        </h2>

        <div className="grid gap-5 lg:grid-cols-2">
          {studentWorks.map((student, index) => (
            <StudentWorkCardClient
              key={student.sesiSiswaId}
              student={student}
              index={index}
              disabled={isSelesai || uploadingStudents.has(student.sesiSiswaId)}
              onCatatanChange={handleCatatanChange}
              onFotoChange={handleFotoChange}
              onRemoveFoto={handleRemoveFoto}
              error={errors[student.sesiSiswaId]}
              isUploading={uploadingStudents.has(student.sesiSiswaId)}
            />
          ))}
        </div>
      </div>

      {/* Submit buttons */}
      {!isSelesai && (
        <div className="flex justify-end gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'save')}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan Draft'
            )}
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e as unknown as React.FormEvent, 'close')}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Menyimpan...
              </>
            ) : (
              'Simpan & Tutup Sesi'
            )}
          </button>
        </div>
      )}
    </form>
  )
}

interface StudentWorkCardClientProps {
  student: StudentWorkData
  index: number
  disabled: boolean
  onCatatanChange: (sesiSiswaId: string, value: string) => void
  onFotoChange: (sesiSiswaId: string, siswaId: string, file: File) => void
  onRemoveFoto: (sesiSiswaId: string) => void
  error?: string
  isUploading: boolean
}

function StudentWorkCardClient({
  student,
  index,
  disabled,
  onCatatanChange,
  onFotoChange,
  onRemoveFoto,
  error,
  isUploading,
}: StudentWorkCardClientProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        onFotoChange(student.sesiSiswaId, student.siswaId, file)
      }
    },
    [onFotoChange, student.sesiSiswaId, student.siswaId]
  )

  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition-colors ${
        student.fotoUrl ? 'border-[#BFD6CB]' : 'border-slate-200'
      }`}
    >
      {/* Hidden inputs */}
      <input type="hidden" name={`jurnal_siswa_id_${student.sesiSiswaId}`} value={student.jurnalSiswaId || ''} />
      <input type="hidden" name={`siswa_id_${student.sesiSiswaId}`} value={student.siswaId} />
      <input type="hidden" name={`foto_path_lama_${student.sesiSiswaId}`} value={student.fotoPath || ''} />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {student.siswaName || `Murid ${index + 1}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {student.siswaKelas || '-'} • {student.siswaSekolah || '-'}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <FileImage className="h-4 w-4" />
        </div>
      </div>

      {/* Catatan field */}
      <div className="mb-4">
        <label
          htmlFor={`catatan_${student.sesiSiswaId}`}
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Catatan Soal/Tugas
        </label>
        <textarea
          id={`catatan_${student.sesiSiswaId}`}
          name={`catatan_${student.sesiSiswaId}`}
          value={student.catatan}
          onChange={(e) => onCatatanChange(student.sesiSiswaId, e.target.value)}
          disabled={disabled}
          className="min-h-[80px] w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          placeholder="Contoh: Siswa mengerjakan soal halaman 45-46, 5 soal benarnya"
        />
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Photo upload */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Foto Soal/Tugas
        </label>

        {student.fotoUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={student.fotoUrl}
              alt={`Soal/tugas ${student.siswaName}`}
              className="max-h-[280px] w-full object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => onRemoveFoto(student.sesiSiswaId)}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              id={`foto_${student.sesiSiswaId}`}
              name={`foto_${student.sesiSiswaId}`}
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              disabled={disabled || isUploading}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
            />
            <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:border-[#063D27] hover:bg-slate-50/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                {isUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {isUploading ? 'Memproses foto...' : 'Upload foto soal/tugas'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tekan atau drag & drop
              </p>
            </div>
          </div>
        )}

        <p className="text-xs text-slate-400">
          Format: JPG, PNG, GIF, WebP. Maksimal 5MB.
        </p>
      </div>
    </div>
  )
}
