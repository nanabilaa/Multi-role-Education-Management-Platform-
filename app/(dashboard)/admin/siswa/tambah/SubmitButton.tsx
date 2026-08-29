'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

export default function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl bg-[#0B513B] px-5 text-sm font-bold text-white transition-colors hover:bg-[#08442F] focus:outline-none focus:ring-2 focus:ring-[#0B513B]/20 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Menyimpan...
        </>
      ) : (
        'Simpan Siswa'
      )}
    </button>
  )
}
