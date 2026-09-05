import type { RequestEvent } from './api'
import type { AuthUser, TokenPair } from '~/types'

type ApiOptions = NonNullable<Parameters<ReturnType<typeof useApi>>[1]>

function unauthorised(): never {
  throw createError({
    statusCode: 401,
    statusMessage: 'Unauthorized',
    data: { detail: 'Authentication required.' }
  })
}

/**
 * Trade the refresh token for a new pair. Django runs with
 * `ROTATE_REFRESH_TOKENS`, so the response carries a new refresh token too and
 * the old one must not be kept. Any failure clears the session outright: a
 * refresh token that Django rejects will not start working later.
 */
async function refreshTokens(event: RequestEvent): Promise<string> {
  const { refresh } = getTokens(event)

  if (!refresh || isExpired(refresh)) {
    clearTokens(event)
    unauthorised()
  }

  try {
    const pair = await useApi(event)<Partial<TokenPair>>('/auth/refresh/', {
      method: 'POST',
      body: { refresh }
    })

    if (!pair.access) {
      throw new Error('The refresh response carried no access token.')
    }

    const tokens: TokenPair = { access: pair.access, refresh: pair.refresh ?? refresh }
    setTokens(event, tokens)

    return tokens.access
  } catch {
    clearTokens(event)
    unauthorised()
  }
}

/** A usable access token, refreshed first if the current one has run out. */
export async function accessToken(event: RequestEvent): Promise<string> {
  const { access } = getTokens(event)

  return access && !isExpired(access) ? access : refreshTokens(event)
}

/**
 * Call the API as the signed-in user. Every protected route goes through here,
 * so refreshing stays in one place instead of being repeated per endpoint.
 */
export async function apiAuthed<T>(event: RequestEvent, request: string, options: ApiOptions = {}): Promise<T> {
  const api = useApi(event)

  // `request` is always an absolute API path, never one of this app's own
  // routes, so the internal-response wrapper TS infers is just `T`.
  const call = (bearer: string) => api<T>(request, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string> | undefined),
      Authorization: `Bearer ${bearer}`
    }
  }) as Promise<T>

  try {
    return await call(await accessToken(event))
  } catch (error) {
    if (errorStatus(error) !== 401) {
      throw error
    }

    // The token read as valid but Django refused it — blacklisted, or signed
    // with a key that has since changed. One refresh, one retry, then give up.
    return await call(await refreshTokens(event))
  }
}

/** The signed-in user, or a 401. */
export function currentUser(event: RequestEvent): Promise<AuthUser> {
  return apiAuthed<AuthUser>(event, '/auth/me/')
}
