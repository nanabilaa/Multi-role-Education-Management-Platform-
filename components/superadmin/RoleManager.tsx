import { useState, useEffect } from 'react'

export default function RoleManager({ userId, currentRoles }: { userId: string; currentRoles: string[] }) {
  const [roles, setRoles] = useState<string[]>(currentRoles)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/superadmin/user-roles?userId=${userId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.roles && data.roles.length > 0) setRoles(data.roles)
      })
  }, [userId])

  const toggle = (r: string) => {
    setRoles((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]))
  }

  const save = async () => {
    setSaving(true)
    await fetch('/api/superadmin/user-roles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, roles }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const all = ['superadmin', 'admin', 'tentor', 'ortu']
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="font-bold text-slate-900">Atur Role Akun</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {all.map((r) => (
          <button
            key={r}
            onClick={() => toggle(r)}
            className={`rounded-full px-3 py-1 text-xs font-bold ${roles.includes(r) ? 'bg-[#063D27] text-white' : 'bg-slate-800 text-white'}`}
          >
            {r}
          </button>
        ))}
      </div>
      <button onClick={save} disabled={saving} className="mt-4 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700">Simpan</button>
      {saved && <span className="ml-3 text-xs font-bold text-emerald-600">✓ Tersimpan</span>}
    </div>
  )
}
