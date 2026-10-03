import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

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
