import type { ImportRowError, Paginated } from '~/types'

export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const query = validateQuery(event, paginationSchema)

  try {
    return await apiAuthed<Paginated<ImportRowError>>(event, `/imports/${id}/errors/`, { query })
  } catch (error) {
    apiError(error)
  }
})
