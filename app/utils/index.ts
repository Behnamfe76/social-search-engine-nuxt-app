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
