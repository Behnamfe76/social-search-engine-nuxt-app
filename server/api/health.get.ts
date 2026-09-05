import type { HealthCheck } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    // Liveness is an exempt route on the API, so no token is attached.
    return await useApi(event)<HealthCheck>('/health/')
  } catch (error) {
    apiError(error)
  }
})
