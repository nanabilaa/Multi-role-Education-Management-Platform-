import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const id = String(formData.get('id') || '').trim()

  if (!id) {
    return NextResponse.redirect(new URL('/admin/siswa?error=ID tidak valid', req.url))
  }

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const { error } = await supabase.from('siswa').delete().eq('id', id)

  if (error) {
    return NextResponse.redirect(
      new URL(`/admin/siswa?error=${encodeURIComponent(error.message)}`, req.url)
    )
  }

  return NextResponse.redirect(new URL('/admin/siswa?success=hapus', req.url))
}