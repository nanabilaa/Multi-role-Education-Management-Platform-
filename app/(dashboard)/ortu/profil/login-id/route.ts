import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const INTERNAL_EMAIL_DOMAIN = 'example.com'

function getSupabaseConfig() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

  const adminKey = (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )?.trim()

  if (!supabaseUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL belum tersedia.'
    )
  }

  if (!anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY belum tersedia.'
    )
  }

  if (!adminKey) {
    throw new Error(
      'SUPABASE_SECRET_KEY atau SUPABASE_SERVICE_ROLE_KEY belum tersedia.'
    )
  }

  // Validasi URL supaya tidak keluar error
  // "The string did not match the expected pattern"
  try {
    const parsed = new URL(supabaseUrl)

    if (
      parsed.protocol !== 'https:' &&
      parsed.protocol !== 'http:'
    ) {
      throw new Error('Protocol URL tidak valid.')
    }
  } catch {
    throw new Error(
      `NEXT_PUBLIC_SUPABASE_URL tidak valid: ${supabaseUrl}`
    )
  }

  return {
    supabaseUrl,
    anonKey,
    adminKey,
  }
}

function normalizeLoginId(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
}

function isValidLoginId(loginId: string) {
  return /^[a-z0-9._-]{4,30}$/.test(loginId)
}

export async function PATCH(
  request: NextRequest
) {
  try {
    const {
      supabaseUrl,
      anonKey,
      adminKey,
    } = getSupabaseConfig()

    const authorization =
      request.headers.get('authorization')

    if (
      !authorization ||
      !authorization.startsWith('Bearer ')
    ) {
      return NextResponse.json(
        {
          error:
            'Sesi login tidak ditemukan.',
        },
        {
          status: 401,
        }
      )
    }

    const accessToken = authorization
      .slice(7)
      .trim()

    if (!accessToken) {
      return NextResponse.json(
        {
          error:
            'Token login tidak ditemukan.',
        },
        {
          status: 401,
        }
      )
    }

    /*
     * Client untuk memverifikasi token user.
     */
    const supabaseAuth = createClient(
      supabaseUrl,
      anonKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    /*
     * Client admin.
     * Secret/service role hanya digunakan di server.
     */
    const supabaseAdmin = createClient(
      supabaseUrl,
      adminKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      }
    )

    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser(
      accessToken
    )

    if (userError || !user) {
      console.error(
        'GET USER ERROR:',
        userError
      )

      return NextResponse.json(
        {
          error:
            'Sesi login tidak valid. Silakan login ulang.',
        },
        {
          status: 401,
        }
      )
    }

    /*
     * Pastikan akun adalah ortu.
     */
    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from('profiles')
      .select('id, role')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error(
        'PROFILE ERROR:',
        profileError
      )

      return NextResponse.json(
        {
          error:
            'Gagal membaca data profil.',
        },
        {
          status: 500,
        }
      )
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            'Profil tidak ditemukan.',
        },
        {
          status: 404,
        }
      )
    }

    if (profile.role !== 'ortu') {
      return NextResponse.json(
        {
          error:
            'Fitur ini hanya untuk akun orang tua.',
        },
        {
          status: 403,
        }
      )
    }

    let body: {
      loginId?: unknown
    }

    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        {
          error:
            'Data permintaan tidak valid.',
        },
        {
          status: 400,
        }
      )
    }

    const loginId = normalizeLoginId(
      body.loginId
    )

    if (!loginId) {
      return NextResponse.json(
        {
          error:
            'ID Login wajib diisi.',
        },
        {
          status: 400,
        }
      )
    }

    if (loginId.length < 4) {
      return NextResponse.json(
        {
          error:
            'ID Login minimal 4 karakter.',
        },
        {
          status: 400,
        }
      )
    }

    if (loginId.length > 30) {
      return NextResponse.json(
        {
          error:
            'ID Login maksimal 30 karakter.',
        },
        {
          status: 400,
        }
      )
    }

    if (!isValidLoginId(loginId)) {
      return NextResponse.json(
        {
          error:
            'ID Login hanya boleh berisi huruf kecil, angka, titik, underscore, dan tanda hubung.',
        },
        {
          status: 400,
        }
      )
    }

    const newEmail =
      `${loginId}@${INTERNAL_EMAIL_DOMAIN}`

    if (
      user.email?.toLowerCase() ===
      newEmail.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            'ID Login baru masih sama.',
        },
        {
          status: 400,
        }
      )
    }

    /*
     * Ubah email internal Auth.
     */
    const {
      data: updated,
      error: updateError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          email: newEmail,
          email_confirm: true,
        }
      )

    if (updateError) {
      console.error(
        'UPDATE USER ERROR:',
        updateError
      )

      const message =
        updateError.message.toLowerCase()

      if (
        message.includes('already') ||
        message.includes('registered') ||
        message.includes('duplicate') ||
        message.includes('exists')
      ) {
        return NextResponse.json(
          {
            error:
              'ID Login sudah digunakan. Gunakan ID Login lain.',
          },
          {
            status: 409,
          }
        )
      }

      return NextResponse.json(
        {
          error:
            updateError.message ||
            'Gagal mengubah ID Login.',
        },
        {
          status: 500,
        }
      )
    }

    if (!updated.user) {
      return NextResponse.json(
        {
          error:
            'Akun gagal diperbarui.',
        },
        {
          status: 500,
        }
      )
    }

    return NextResponse.json({
      success: true,
      loginId,
      message:
        'ID Login berhasil diperbarui.',
    })
  } catch (error) {
    console.error(
      'LOGIN ID ROUTE ERROR:',
      error
    )

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Terjadi kesalahan server.',
      },
      {
        status: 500,
      }
    )
  }
}