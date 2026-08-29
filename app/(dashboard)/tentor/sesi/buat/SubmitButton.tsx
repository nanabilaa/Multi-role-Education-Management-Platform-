'use client'

import { useFormStatus } from 'react-dom'
import { Loader2, Save } from 'lucide-react'

export default function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#063D27] px-5 text-sm font-black text-white transition hover:bg-[#0B5738] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Menyimpan...
        </>
      ) : (
        <>
          <Save className="h-4 w-4" />
          Simpan Sesi
        </>
      )}
    </button>
  )
}
