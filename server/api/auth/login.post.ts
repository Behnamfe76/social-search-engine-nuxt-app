import * as z from 'zod'
import type { AuthUser, SessionResponse, TokenPair } from '~/types'

const bodySchema = z.object({
  email: z.email(),
  password: z.string().min(1)
})

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const credentials = await validateBody(event, bodySchema)

  try {
    const { user, ...tokens } = await useApi(event)<TokenPair & { user: AuthUser }>('/auth/login/', {
      method: 'POST',
      body: credentials
    })

    setTokens(event, tokens)

    return { user }
  } catch (error) {
    // Never leave a half-signed-in state behind a failed attempt.
    clearTokens(event)
    apiError(error)
  }
})
