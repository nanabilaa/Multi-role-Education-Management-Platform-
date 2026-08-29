'use client'

import { useState, useCallback } from 'react'
import { Camera, Upload, X, Loader2, AlertCircle } from 'lucide-react'
import { compressImage, validateImageFile } from '@/lib/image-utils'

interface StudentWorkCardProps {
  sesiSiswaId: string
  siswaId: string
  siswaName: string
  siswaKelas: string
  siswaSekolah: string
  existingWork?: {
    id: string
    soal_tugas_url?: string
    soal_tugas_path?: string
    catatan?: string
  }
  disabled?: boolean
  index: number
}

export default function StudentWorkCard({
  sesiSiswaId,
  siswaId,
  siswaName,
  siswaKelas,
  siswaSekolah,
  existingWork,
  disabled = false,
  index,
}: StudentWorkCardProps) {
  const [catatan, setCatatan] = useState(existingWork?.catatan || '')
  const [fotoPreview, setFotoPreview] = useState<string | null>(
    existingWork?.soal_tugas_url || null
  )
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFotoChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      setError(null)

      // Validate file
      const validation = validateImageFile(file, 5)
      if (!validation.valid) {
        setError(validation.error || 'File tidak valid')
        return
      }

      // Compress image
      setIsCompressing(true)
      try {
        const compressed = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.85,
          maxSizeMB: 1,
        })

        // Create preview URL
        const previewUrl = URL.createObjectURL(compressed.blob)
        setFotoPreview(previewUrl)
        setFotoFile(new File([compressed.blob], file.name, { type: 'image/jpeg' }))
      } catch (err) {
        console.error('Compression failed:', err)
        // Fallback: use original file
        setFotoPreview(URL.createObjectURL(file))
        setFotoFile(file)
      } finally {
        setIsCompressing(false)
      }
    },
    []
  )

  const handleRemoveFoto = useCallback(() => {
    setFotoPreview(null)
    setFotoFile(null)
    setError(null)
  }, [])

  const isDisabled = disabled || isUploading

  return (
    <div
      className={`rounded-2xl border bg-white p-5 transition-colors ${
        fotoPreview
          ? 'border-[#BFD6CB]'
          : 'border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {siswaName || `Murid ${index + 1}`}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {siswaKelas || '-'} • {siswaSekolah || '-'}
          </p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
          <Camera className="h-4 w-4" />
        </div>
      </div>

      {/* Hidden inputs for form submission */}
      <input type="hidden" name={`jurnal_siswa_id_${sesiSiswaId}`} value={existingWork?.id || ''} />
      <input type="hidden" name={`siswa_id_${sesiSiswaId}`} value={siswaId} />
      <input type="hidden" name={`foto_path_lama_${sesiSiswaId}`} value={existingWork?.soal_tugas_path || ''} />

      {/* Catatan field */}
      <div className="mb-4">
        <label
          htmlFor={`catatan_${sesiSiswaId}`}
          className="mb-2 block text-sm font-semibold text-slate-700"
        >
          Catatan Soal/Tugas
        </label>
        <textarea
          id={`catatan_${sesiSiswaId}`}
          name={`catatan_${sesiSiswaId}`}
          value={catatan}
          onChange={(e) => setCatatan(e.target.value)}
          disabled={isDisabled}
          className="min-h-[80px] w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-[#063D27] focus:ring-2 focus:ring-[#063D27]/10 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
          placeholder="Contoh: Siswa mengerjakan soal halaman 45-46, 5 soal benarnya"
        />
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Photo upload area */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Foto Soal/Tugas
        </label>

        {fotoPreview ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={fotoPreview}
              alt={`Soal/tugas ${siswaName}`}
              className="max-h-[280px] w-full object-cover"
            />
            {!isDisabled && (
              <button
                type="button"
                onClick={handleRemoveFoto}
                className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 text-slate-600 shadow-sm hover:bg-white hover:text-red-500"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              id={`foto_${sesiSiswaId}`}
              name={`foto_${sesiSiswaId}`}
              accept="image/*"
              capture="environment"
              onChange={handleFotoChange}
              disabled={isDisabled}
              className="absolute inset-0 z-10 cursor-pointer opacity-0"
            />
            <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center transition-colors hover:border-[#063D27] hover:bg-slate-50/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm">
                <Upload className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-600">
                {isCompressing ? 'Memproses foto...' : 'Upload foto soal/tugas'}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Tekan atau drag & drop
              </p>
            </div>
          </div>
        )}

        {/* Upload progress indicator */}
        {(isCompressing || isUploading) && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>{isCompressing ? 'Memproses foto...' : 'Mengupload...'}</span>
          </div>
        )}

        <p className="text-xs text-slate-400">
          Format: JPG, PNG, GIF, WebP. Maksimal 5MB.
        </p>
      </div>
    </div>
  )
}
