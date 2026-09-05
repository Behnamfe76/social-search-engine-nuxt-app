import type { PersonalityDetail } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await validateBody(event, personalityInputSchema)

  try {
    return await apiAuthed<PersonalityDetail>(event, '/personalities/', {
      method: 'POST',
      body
    })
  } catch (error) {
    apiError(error)
  }
})
