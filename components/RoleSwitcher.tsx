import { useRouter } from 'next/navigation'

export default function RoleSwitcher({ roles }: { roles: string[] }) {
  const router = useRouter()
  const switchRole = async (r: string) => {
    await fetch('/api/auth/set-active-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: r }),
    })
    router.push(`/${r}`)
  }
  return (
    <div className="relative group">
      <button className="rounded-xl bg-[#063D27] px-3 py-2 text-xs font-bold text-white">Ganti Peran</button>
      <div className="absolute right-0 top-full z-50 hidden w-40 rounded-xl border bg-white shadow-xl group-hover:block">
        {roles.map((r) => (
          <button key={r} onClick={() => switchRole(r)} className="block w-full px-4 py-2 text-left text-sm font-medium hover:bg-slate-50">{r}</button>
        ))}
      </div>
    </div>
  )
}
