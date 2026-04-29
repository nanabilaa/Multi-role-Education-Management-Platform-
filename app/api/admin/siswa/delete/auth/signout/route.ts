// app/api/admin/siswa/delete/route.ts
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const formData = await request.formData()
  const id = formData.get('id')?.toString()

  if (!id) {
    redirect('/admin/siswa')
  }

  const supabase = await createClient()

  const { error } = await supabase
    .from('siswa')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Gagal hapus siswa:', error.message)
  }

  revalidatePath('/admin/siswa')
  redirect('/admin/siswa')
}