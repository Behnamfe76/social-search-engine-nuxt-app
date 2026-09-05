export default defineEventHandler((event) => {
  // The API has no revocation endpoint, so dropping the cookies is the whole
  // job — the access token simply runs out on its own.
  clearTokens(event)

  return { ok: true }
})
