import * as z from 'zod'
import type { RequestEvent } from './api'

/** The writable fields on a personality, shared by create, update and patch. */
export const personalityInputSchema = z.object({
  first_name: z.string().min(1).max(255),
  last_name: z.string().min(1).max(255),
  import_batch_id: z.number().int().positive().nullish(),
  industry_id: z.number().int().positive().nullish(),
  middle_name: z.string().max(255).nullish(),
  middle_initial: z.string().max(1).nullish(),
  gender: z.enum(['male', 'female', 'other', 'unknown']).optional(),
  birth_date: z.string().nullish(),
  birth_year: z.number().int().min(-32768).max(32767).nullish(),
  summary: z.string().nullish(),
  inferred_salary: z.string().max(100).nullish(),
  inferred_years_experience: z.number().int().min(-32768).max(32767).nullish(),
  location_last_updated: z.string().nullish()
})

/** DRF's page-number pagination, as accepted by every list endpoint. */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  page_size: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  ordering: z.string().optional()
})

/**
 * Reshape a zod failure into the same `{ field: [messages] }` body Django
 * returns, so a rejection from this layer lands on the right input instead of
 * dumping a ZodError at the user.
 */
function badRequest(error: z.ZodError): never {
  const data: Record<string, string[]> = {}

  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'non_field_errors'
    ;(data[key] ??= []).push(issue.message)
  }

  throw createError({ statusCode: 400, statusMessage: 'Bad request', data })
}

/** `readValidatedBody`, but failing with a DRF-shaped body. */
export async function validateBody<T>(event: RequestEvent, schema: z.ZodType<T>): Promise<T> {
  const result = schema.safeParse(await readBody(event))

  return result.success ? result.data : badRequest(result.error)
}

/** `getValidatedQuery`, but failing with a DRF-shaped body. */
export function validateQuery<T>(event: RequestEvent, schema: z.ZodType<T>): T {
  const result = schema.safeParse(getQuery(event))

  return result.success ? result.data : badRequest(result.error)
}

/** The `id` segment of the route, rejected up front when it is not an id. */
export function routeId(event: RequestEvent): number {
  const id = Number(getRouterParam(event, 'id'))

  if (!Number.isInteger(id) || id < 1) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Bad request',
      data: { detail: 'Expected a numeric id.' }
    })
  }

  return id
}
