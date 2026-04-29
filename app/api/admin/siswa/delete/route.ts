// app/api/admin/siswa/delete/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const id = formData.get('id') as string

  const supabase = await createClient()

  // Cek role admin
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user!.id).single()

  if (profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  await supabase.from('siswa').delete().eq('id', id)

  return NextResponse.redirect(new URL('/admin/siswa', req.url))
}