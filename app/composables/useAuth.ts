import type { AuthUser, LoginPayload, RegisterPayload, SessionResponse } from '~/types'

/**
 * The signed-in user, shared across the app.
 *
 * `undefined` means the session has not been read yet, `null` means nobody is
 * signed in — the guard in `middleware/auth.global.ts` relies on the difference
 * so it only hits the server once per page load.
 */
export function useAuth() {
  const user = useState<AuthUser | null | undefined>('auth.user', () => undefined)

  const loggedIn = computed(() => !!user.value)

  async function fetchSession(): Promise<AuthUser | null> {
    // `useRequestFetch` forwards the incoming cookies, so the session resolves
    // during SSR too and the first paint is not a flash of the login page.
    const requestFetch = useRequestFetch()

    try {
      const { user: current } = await requestFetch<SessionResponse>('/api/auth/session')
      user.value = current
    } catch {
      user.value = null
    }

    return user.value
  }

  async function login(credentials: LoginPayload): Promise<AuthUser | null> {
    const { user: current } = await $fetch<SessionResponse>('/api/auth/login', {
      method: 'POST',
      body: credentials
    })

    user.value = current

    return current
  }

  async function register(payload: RegisterPayload): Promise<AuthUser | null> {
    const { user: current } = await $fetch<SessionResponse>('/api/auth/register', {
      method: 'POST',
      body: payload
    })

    user.value = current

    return current
  }

  async function logout(): Promise<void> {
    try {
      await $fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      user.value = null
      await navigateTo('/login')
    }
  }

  return {
    user,
    loggedIn,
    fetchSession,
    login,
    register,
    logout
  }
}
