'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'

type Props = {
  sesiId: string
  initialStatus: string
  hasJurnal: boolean
}

export default function SesiDetailClient({
  sesiId,
  initialStatus,
  hasJurnal,
}: Props) {
  const router = useRouter()
  const [status, setStatus] = useState(initialStatus)
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState('')

  async function handleSave() {
    setMessage('')

    startTransition(async () => {
      try {
        const res = await fetch(`/api/tentor/sesi/${sesiId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        })

        const result = await res.json()

        if (!res.ok) {
          throw new Error(result?.error || 'Gagal menyimpan perubahan')
        }

        setMessage('Perubahan berhasil disimpan')
        router.refresh()
      } catch (err: any) {
        setMessage(err.message || 'Terjadi kesalahan')
      }
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Aksi Sesi</h2>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status Sesi</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#063D27]"
          >
            <option value="terjadwal">Terjadwal</option>
            <option value="berlangsung">Berlangsung</option>
            <option value="selesai">Selesai</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">Status Jurnal</label>
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {hasJurnal ? 'Sudah ada jurnal' : 'Belum ada jurnal'}
          </div>
        </div>
      </div>

      {message ? <p className="mt-4 text-sm text-slate-600">{message}</p> : null}

      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-[#063D27] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0B5738] disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {isPending ? 'Menyimpan...' : 'Simpan'}
        </button>
      </div>
    </div>
  )
}