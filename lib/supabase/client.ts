// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  console.log('SUPABASE URL:', supabaseUrl)
  console.log('SUPABASE KEY EXISTS:', !!supabaseAnonKey)

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL kosong / tidak terbaca')
  }

  if (!supabaseAnonKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY kosong / tidak terbaca')
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}