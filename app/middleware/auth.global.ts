export default defineNuxtRouteMiddleware(async (to) => {
  const { user, fetchSession } = useAuth()

  // Read the session once per page load; client-side navigation reuses it.
  if (user.value === undefined) {
    await fetchSession()
  }

  if (to.meta.auth !== false && !user.value) {
    return navigateTo({
      path: '/login',
      // Come back to where they were headed once they are signed in.
      query: to.fullPath === '/' ? undefined : { redirect: to.fullPath }
    })
  }

  if (to.meta.guestOnly && user.value) {
    return navigateTo('/')
  }
})
