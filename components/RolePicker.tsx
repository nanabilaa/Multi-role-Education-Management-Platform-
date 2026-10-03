import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RolePicker({ roles, userId }: { roles: string[]; userId: string }) {
  const router = useRouter()
  const [selected, setSelected] = useState<string>(roles[0])

  const handleConfirm = async () => {
    await fetch('/api/auth/set-active-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: selected, userId }),
    })
    router.push(`/${selected}`)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#063D27] p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl">
        <h2 className="text-2xl font-black text-slate-900">Pilih Peran</h2>
        <p className="mt-2 text-sm text-slate-500">Akun ini memiliki beberapa peran.</p>
        <div className="mt-6 space-y-3">
          {roles.map((r) => (
            <button
              key={r}
              onClick={() => setSelected(r)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-sm font-bold transition ${
                selected === r ? 'border-[#063D27] bg-[#063D27]/5 text-[#063D27]' : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              {r === 'superadmin' ? 'Superadmin' : r === 'admin' ? 'Admin' : r === 'tentor' ? 'Tentor' : 'Ortu'}
            </button>
          ))}
        </div>
        <button onClick={handleConfirm} className="mt-6 w-full rounded-xl bg-[#063D27] py-3 text-sm font-bold text-white hover:bg-[#0B5738]">Masuk sebagai {selected}</button>
      </div>
    </div>
  )
}
