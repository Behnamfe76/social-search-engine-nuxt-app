import type { CursorPage, Lookup } from '~/types'

export default defineEventHandler(async (event): Promise<CursorPage<Lookup>> => {
  const path = lookupPath(event)
  const query = validateQuery(event, lookupQuerySchema)

  try {
    const page = await apiAuthed<{ next: string | null, results: Lookup[] }>(event, path, { query })

    return { results: page.results, nextCursor: cursorFrom(page.next) }
  } catch (error) {
    apiError(error)
  }
})
