import type { ImportBatch } from '~/types'

export default defineEventHandler(async (event) => {
  const id = routeId(event)

  try {
    return await apiAuthed<ImportBatch>(event, `/imports/${id}/`)
  } catch (error) {
    apiError(error)
  }
})
