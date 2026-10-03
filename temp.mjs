import { createClient } from '@supabase/supabase-js'
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data, error, count } = await supabase.from('sesi').delete({count: 'exact'}).neq('status', 'selesai')
console.log('Deleted:', count, 'Error:', error)
