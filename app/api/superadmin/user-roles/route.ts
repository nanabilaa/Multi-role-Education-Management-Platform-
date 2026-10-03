import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })
  const supabase = createAdminClient()
  const { data } = await supabase.from('user_roles').select('role').eq('user_id', userId)
  const roles = (data || []).map((d: any) => d.role)
  return NextResponse.json({ roles })
}

export async function POST(req: Request) {
  const { userId, roles } = await req.json()
  const supabase = createAdminClient()
  await supabase.from('user_roles').delete().eq('user_id', userId)
  if (roles && roles.length > 0) {
    const inserts = roles.map((r: string) => ({ user_id: userId, role: r }))
    await supabase.from('user_roles').insert(inserts)
  }
  return NextResponse.json({ success: true })
}
