import * as z from 'zod'
import type { LookupRef } from '~/types'

const querySchema = z.object({
  // Comma-separated so a restored URL resolves its chips in one request.
  ids: z.string().transform(value => [...new Set(
    value.split(',').map(Number).filter(id => Number.isInteger(id) && id > 0)
  )].slice(0, 50))
})

export default defineEventHandler(async (event): Promise<LookupRef[]> => {
  const path = lookupPath(event)
  const { ids } = validateQuery(event, querySchema)

  // Names for ids that arrived in the URL, so filter chips read as words rather
  // than numbers. An id that no longer exists is dropped, not an error.
  const resolved = await Promise.all(ids.map(async (id) => {
    try {
      return await apiAuthed<LookupRef>(event, `${path}${id}/`)
    } catch {
      return null
    }
  }))

  return resolved.filter((item): item is LookupRef => item !== null)
})
