import * as z from 'zod'
import type { RequestEvent } from './api'

/**
 * The lookup dimensions, mapped to their API path. Acting as a whitelist keeps
 * the dynamic route segment from reaching the API as an arbitrary path.
 */
export const LOOKUP_PATHS = {
  'industries': '/industries/',
  'skills': '/skills/',
  'interests': '/interests/',
  'languages': '/languages/',
  'certifications': '/certifications/',
  'companies': '/companies/',
  'occupation-roles': '/occupation-roles/',
  'occupation-levels': '/occupation-levels/'
} as const

export const lookupQuerySchema = z.object({
  search: z.string().optional(),
  cursor: z.string().optional()
})

/** Resolve the `dimension` route segment, or 404. */
export function lookupPath(event: RequestEvent): string {
  const dimension = getRouterParam(event, 'dimension') ?? ''

  if (!Object.hasOwn(LOOKUP_PATHS, dimension)) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Not found',
      data: { detail: `Unknown lookup dimension "${dimension}".` }
    })
  }

  return LOOKUP_PATHS[dimension as keyof typeof LOOKUP_PATHS]
}

/**
 * The API's `next` is an absolute URL pointing at the Django host. Hand the
 * client the cursor alone, so the upstream host never leaves the server.
 */
export function cursorFrom(next: string | null | undefined): string | null {
  if (!next) {
    return null
  }

  try {
    return new URL(next).searchParams.get('cursor')
  } catch {
    return null
  }
}
