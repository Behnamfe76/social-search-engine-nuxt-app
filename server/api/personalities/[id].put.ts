import type { PersonalityDetail } from '~/types'

export default defineEventHandler(async (event) => {
  const id = routeId(event)
  const body = await validateBody(event, personalityInputSchema)

  try {
    return await apiAuthed<PersonalityDetail>(event, `/personalities/${id}/`, {
      method: 'PUT',
      body
    })
  } catch (error) {
    apiError(error)
  }
})
