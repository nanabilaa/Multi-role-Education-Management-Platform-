'use client'

import { useFormStatus } from 'react-dom'
import { Loader2 } from 'lucide-react'

interface SubmitButtonProps {
  label: string
  variant?: 'secondary' | 'primary'
}

export default function SubmitButton({ label, variant = 'secondary' }: SubmitButtonProps) {
  const { pending } = useFormStatus()

  const baseClass = variant === 'primary'
    ? 'rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 active:scale-[0.98]'
    : 'rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98]'

  return (
    <button
      type="submit"
      disabled={pending}
      className={`${baseClass} inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60`}
    >
      {pending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Menyimpan...
        </>
      ) : (
        label
      )}
    </button>
  )
}
