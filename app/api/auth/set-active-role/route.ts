import { NextResponse } from 'next/server'
import { setActiveRole } from '@/lib/role-session'

export async function POST(req: Request) {
  const { role } = await req.json()
  if (!role) return NextResponse.json({ error: 'Role required' }, { status: 400 })
  setActiveRole(role)
  return NextResponse.json({ success: true, role })
}
