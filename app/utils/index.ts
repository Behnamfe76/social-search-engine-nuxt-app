import type { FormError } from '@nuxt/ui'
import type { ApiErrorData } from '~/types'

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFrom<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!
}

/**
 * Turn a rejected API call into something a form can show.
 *
 * Django hands back either `{ detail: '...' }`, `{ non_field_errors: [...] }`
 * or a map of field name to messages. Field errors go on the inputs they
 * belong to; anything else — including errors for fields this form does not
 * render — is returned as a single message for a toast, because `setErrors`
 * silently drops names it cannot match to an input.
 */
export function parseApiError(
  error: unknown,
  fields: string[] = []
): { errors: FormError[], message: string } {
  const body = apiErrorBody(error)
  const errors: FormError[] = []
  const messages: string[] = []

  for (const [key, value] of Object.entries(body)) {
    const text = (Array.isArray(value) ? value.join(' ') : String(value ?? '')).trim()

    if (!text) {
      continue
    }

    if (fields.includes(key)) {
      errors.push({ name: key, message: text })
    } else {
      messages.push(text)
    }
  }

  return {
    errors,
    message: messages.join(' ') || 'Something went wrong. Please try again.'
  }
}

/**
 * Dig the Django body out of the error. Nitro wraps whatever `createError`
 * was given under `data`, so the payload sits one level deeper than the
 * response body the browser received.
 */
function apiErrorBody(error: unknown): ApiErrorData {
  if (typeof error !== 'object' || error === null || !('data' in error)) {
    return {}
  }

  const data = (error as { data?: { data?: ApiErrorData } & ApiErrorData }).data

  if (typeof data !== 'object' || data === null) {
    return {}
  }

  return typeof data.data === 'object' && data.data !== null ? data.data : data
}

/** The writable personality fields, in the order the form shows them. */
export const PERSONALITY_FIELDS = [
  'first_name',
  'last_name',
  'middle_name',
  'middle_initial',
  'gender',
  'birth_date',
  'birth_year',
  'industry_id',
  'import_batch_id',
  'summary',
  'inferred_salary',
  'inferred_years_experience',
  'location_last_updated'
]

/**
 * Drop the keys the user never filled in. An empty `UInput` yields `''`, which
 * DRF rejects on a nullable integer, so blanks are sent as `null` and untouched
 * fields are left out of the request entirely.
 */
export function cleanInput<T extends Record<string, unknown>>(state: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(state)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === '' ? null : value])
  ) as Partial<T>
}
