import type { DashboardStats } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    return await apiAuthed<DashboardStats>(event, '/dashboard/')
  } catch (error) {
    apiError(error)
  }
})
