import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RolePicker from '@/components/RolePicker'

export default async function RolePickerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: rolesData } = await supabase.from('user_roles').select('role').eq('user_id', user.id)
  const roles = (rolesData || []).map((r: any) => r.role)
  if (roles.length <= 1) redirect('/login')
  return <RolePicker roles={roles} userId={user.id} />
}
