import type { PersonalityDetail } from '~/types'

export default defineEventHandler(async (event) => {
  const id = routeId(event)

  try {
    return await apiAuthed<PersonalityDetail>(event, `/personalities/${id}/`)
  } catch (error) {
    apiError(error)
  }
})
