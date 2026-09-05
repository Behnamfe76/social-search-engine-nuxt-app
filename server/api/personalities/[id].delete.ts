export default defineEventHandler(async (event) => {
  const id = routeId(event)

  try {
    // The API soft-deletes: the row keeps its `deleted_at` and drops out of the
    // read selector. There is no 204 body to pass back.
    await apiAuthed(event, `/personalities/${id}/`, { method: 'DELETE' })

    return { ok: true }
  } catch (error) {
    apiError(error)
  }
})
