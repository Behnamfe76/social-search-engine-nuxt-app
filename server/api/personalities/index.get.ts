import * as z from 'zod'
import type { Paginated, Personality } from '~/types'

/**
 * The documented filters, coerced from strings because they arrive as query
 * params. Unknown keys are dropped rather than forwarded, so the API only ever
 * sees parameters it advertises.
 */
const querySchema = z.object({
  search: z.string().optional(),
  full_name: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  industry_id: z.coerce.number().int().positive().optional(),
  import_batch_id: z.coerce.number().int().positive().optional(),
  birth_year_min: z.coerce.number().int().optional(),
  birth_year_max: z.coerce.number().int().optional(),
  ordering: z.enum([
    'id', '-id',
    'full_name', '-full_name',
    'last_name', '-last_name',
    'created_at', '-created_at',
    'updated_at', '-updated_at'
  ]).optional(),
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional()
})

export default defineEventHandler(async (event) => {
  const query = validateQuery(event, querySchema)

  try {
    return await apiAuthed<Paginated<Personality>>(event, '/personalities/', { query })
  } catch (error) {
    apiError(error)
  }
})
