/**
 * Container liveness. Deliberately local: `/api/health` proxies the Django
 * health endpoint, so using it here would report this container unhealthy
 * whenever the API is down — which is the API's problem, not ours.
 */
export default defineEventHandler(() => ({
  status: 'ok',
  service: 'nuxt-app'
}))
