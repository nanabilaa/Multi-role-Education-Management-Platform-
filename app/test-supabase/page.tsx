// app/test-supabase/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestSupabasePage() {
  const [result, setResult] = useState('Testing...')

  useEffect(() => {
    async function test() {
      const supabase = createClient()

      const { data, error } = await supabase.auth.getSession()

      console.log('TEST SESSION DATA:', data)
      console.log('TEST SESSION ERROR:', error)

      if (error) {
        setResult(error.message)
        return
      }

      setResult('Supabase client berhasil dibuat. Session: ' + String(!!data.session))
    }

    test()
  }, [])

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold">Test Supabase</h1>
      <p className="mt-4">{result}</p>
    </main>
  )
}
