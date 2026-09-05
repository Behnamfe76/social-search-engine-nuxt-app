import type { SessionResponse } from '~/types'

export default defineEventHandler(async (event): Promise<SessionResponse> => {
  const { access, refresh } = getTokens(event)

  if (!access && !refresh) {
    return { user: null }
  }

  try {
    return { user: await currentUser(event) }
  } catch (error) {
    // An expired or rejected session is not an error to the caller, it just
    // means nobody is signed in. Anything else is worth surfacing.
    if (errorStatus(error) === 401) {
      clearTokens(event)
      return { user: null }
    }

    apiError(error)
  }
})
