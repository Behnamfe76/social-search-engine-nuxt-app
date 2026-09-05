import type { RequestEvent } from './api'
import type { TokenPair } from '~/types'

export const ACCESS_COOKIE = 'sse_access'
export const REFRESH_COOKIE = 'sse_refresh'

/** Seconds of slack: treat a token expiring within this window as already gone. */
const EXPIRY_LEEWAY = 15

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: !import.meta.dev,
    sameSite: 'lax' as const,
    path: '/',
    maxAge
  }
}

/**
 * Read the `exp` claim without verifying the signature. Only Django validates
 * tokens; here it is used to decide when to refresh and how long to keep the
 * cookie, so the lifetimes follow `JWT_ACCESS_MINUTES` / `JWT_REFRESH_DAYS`
 * rather than being duplicated in this app.
 */
export function tokenExpiry(token: string): number | null {
  const payload = token.split('.')[1]
  if (!payload) {
    return null
  }

  try {
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(payload.length / 4) * 4, '=')
    // Claims can hold non-ASCII (the token carries the user's name), so decode
    // the bytes rather than trusting `atob`'s one-byte-per-char string.
    const bytes = Uint8Array.from(atob(base64), char => char.charCodeAt(0))
    const exp = (JSON.parse(new TextDecoder().decode(bytes)) as { exp?: number }).exp

    return typeof exp === 'number' ? exp : null
  } catch {
    return null
  }
}

export function isExpired(token: string): boolean {
  const exp = tokenExpiry(token)
  // A token we cannot read is not one we should send.
  return exp === null || exp - EXPIRY_LEEWAY <= Math.floor(Date.now() / 1000)
}

/** Remaining lifetime in seconds, floored at zero. */
function maxAgeFor(token: string): number {
  const exp = tokenExpiry(token)
  return exp === null ? 0 : Math.max(0, exp - Math.floor(Date.now() / 1000))
}

export function setTokens(event: RequestEvent, tokens: TokenPair): void {
  setCookie(event, ACCESS_COOKIE, tokens.access, cookieOptions(maxAgeFor(tokens.access)))
  setCookie(event, REFRESH_COOKIE, tokens.refresh, cookieOptions(maxAgeFor(tokens.refresh)))
}

export function getTokens(event: RequestEvent): Partial<TokenPair> {
  return {
    access: getCookie(event, ACCESS_COOKIE),
    refresh: getCookie(event, REFRESH_COOKIE)
  }
}

export function clearTokens(event: RequestEvent): void {
  deleteCookie(event, ACCESS_COOKIE, { path: '/' })
  deleteCookie(event, REFRESH_COOKIE, { path: '/' })
}
