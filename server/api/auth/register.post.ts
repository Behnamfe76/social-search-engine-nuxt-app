import * as z from 'zod'
import type { AuthUser, SessionResponse, TokenPair } from '~/types'

const bodySchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8)
})

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const payload = await readValidatedBody(event, bodySchema.parse)
  const api = useApi(event)

  try {
    // Registration returns the account, not a token pair, so sign the new user
    // in with the credentials they just gave us rather than sending them to the
    // login page to retype them.
    await api<AuthUser>('/auth/register/', { method: 'POST', body: payload })

    const { user, ...tokens } = await api<TokenPair & { user: AuthUser }>('/auth/login/', {
      method: 'POST',
      body: { email: payload.email, password: payload.password }
    })

    setTokens(event, tokens)

    return { user }
  } catch (error) {
    clearTokens(event)
    apiError(error)
  }
})
