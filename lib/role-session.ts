import { cookies } from 'next/headers'

export const ACTIVE_ROLE_COOKIE = 'active_role'

export function getActiveRole(): string | null {
  const cookieStore = cookies()
  return cookieStore.get(ACTIVE_ROLE_COOKIE)?.value ?? null
}

export function setActiveRole(role: string) {
  const cookieStore = cookies()
  cookieStore.set(ACTIVE_ROLE_COOKIE, role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
    path: '/',
  })
}
