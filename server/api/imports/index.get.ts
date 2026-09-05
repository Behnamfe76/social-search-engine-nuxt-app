import type { ImportBatch, Paginated } from '~/types'

export default defineEventHandler(async (event) => {
  const query = validateQuery(event, paginationSchema)

  try {
    return await apiAuthed<Paginated<ImportBatch>>(event, '/imports/', { query })
  } catch (error) {
    apiError(error)
  }
})
