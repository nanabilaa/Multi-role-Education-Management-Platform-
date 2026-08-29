'use client'

import { Camera, FileText, ZoomIn } from 'lucide-react'
import { useState } from 'react'

interface StudentWorkData {
  id: string
  catatan?: string | null
  soal_tugas_url?: string | null
  soal_tugas_path?: string | null
}

interface StudentWorkDisplayProps {
  studentName: string
  work: StudentWorkData | null
}

export default function StudentWorkDisplay({
  studentName,
  work,
}: StudentWorkDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!work || (!work.soal_tugas_url && !work.catatan)) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center">
        <FileText className="mx-auto h-5 w-5 text-slate-400" />
        <p className="mt-2 text-xs font-medium text-slate-500">
          Foto soal/tugas belum tersedia
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {/* Catatan */}
        {work.catatan && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold text-slate-500">
                Catatan Soal/Tugas
              </p>
            </div>
            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-6 text-slate-600">
              {work.catatan}
            </p>
          </div>
        )}

        {/* Foto */}
        {work.soal_tugas_url && (
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-slate-500" />
              <p className="text-xs font-semibold text-slate-500">
                Foto Soal/Tugas {studentName}
              </p>
            </div>
            <div className="mt-3 relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={work.soal_tugas_url}
                alt={`Soal/tugas ${studentName}`}
                className="max-h-[200px] w-full rounded-lg border border-slate-200 object-cover cursor-pointer"
                onClick={() => setIsModalOpen(true)}
              />
              <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/0 opacity-0 group-hover:bg-black/20 group-hover:opacity-100 transition-all">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal for full-screen image */}
      {isModalOpen && work.soal_tugas_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={work.soal_tugas_url}
              alt={`Soal/tugas ${studentName}`}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            />
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg hover:bg-slate-100"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
