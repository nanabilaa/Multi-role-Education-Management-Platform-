'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DeleteSesiButton({ sesiId }: { sesiId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    const ok = window.confirm('Hapus sesi ini?')
    if (!ok) return

    setLoading(true)

    try {
      const res = await fetch('/api/tentor/sesi/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sesiId }),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result?.error || 'Gagal menghapus sesi')
      }

      router.push('/tentor/sesi')
      router.refresh()
    } catch (err: any) {
      alert(err.message || 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={loading}
      className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60"
    >
      {loading ? 'Menghapus...' : 'Hapus Sesi'}
    </button>
  )
}