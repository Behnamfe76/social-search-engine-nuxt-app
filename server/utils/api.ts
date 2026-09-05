import type { ApiErrorData } from '~/types'

/**
 * Nitro auto-imports `H3Event` as a value, not a type. Name the instance type
 * once here so the utils below can annotate the event they are handed.
 */
export type RequestEvent = InstanceType<typeof H3Event>

interface ApiFetchError {
  status?: number
  statusCode?: number
  statusText?: string
  data?: ApiErrorData
}

function isFetchError(error: unknown): error is ApiFetchError {
  return typeof error === 'object' && error !== null && ('status' in error || 'statusCode' in error)
}

/**
 * `$fetch` bound to the Django API. Server-side only: the base URL is private
 * runtime config, so the host never reaches the browser and CORS never comes
 * into play — the API serves no CORS headers of its own.
 */
export function useApi(event: RequestEvent) {
  return $fetch.create({
    baseURL: useRuntimeConfig(event).apiBase
  })
}

/**
 * Re-raise a Django error as an H3 error, keeping the status and the response
 * body so the client can map field errors back onto the form it came from.
 */
export function apiError(error: unknown): never {
  if (isFetchError(error)) {
    throw createError({
      statusCode: error.status ?? error.statusCode ?? 502,
      statusMessage: error.statusText || 'API request failed',
      data: error.data ?? { detail: 'The API returned an unexpected response.' }
    })
  }

  throw createError({
    statusCode: 502,
    statusMessage: 'Bad gateway',
    data: { detail: 'The API could not be reached.' } satisfies ApiErrorData
  })
}

/** The status of a thrown fetch/H3 error, or `0` when it is not one. */
export function errorStatus(error: unknown): number {
  return isFetchError(error) ? (error.status ?? error.statusCode ?? 0) : 0
}
