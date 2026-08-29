// components/admin/siswa/DeleteButton.tsx
'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function DeleteButton({
  id,
  nama,
}: {
  id: string
  nama: string
}) {
  const [isDeleting, setIsDeleting] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const yakin = confirm(`Hapus siswa "${nama}"?`)

    if (!yakin) {
      e.preventDefault()
      return
    }

    setIsDeleting(true)
  }

  return (
    <form action="/api/admin/siswa/delete" method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="id" value={id} />

      <button
        type="submit"
        disabled={isDeleting}
        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-red-500 transition-colors hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isDeleting ? (
          <>
            <Loader2 className="h-3 w-3 animate-spin" />
            Menghapus...
          </>
        ) : (
          'Hapus'
        )}
      </button>
    </form>
  )
}