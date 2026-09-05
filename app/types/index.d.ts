import type { AvatarProps } from '@nuxt/ui'

export type UserStatus = 'subscribed' | 'unsubscribed' | 'bounced'
export type SaleStatus = 'paid' | 'failed' | 'refunded'

export interface User {
  id: number
  name: string
  email: string
  avatar?: AvatarProps
  status: UserStatus
  location: string
}

export interface Mail {
  id: number
  unread?: boolean
  from: User
  subject: string
  body: string
  date: string
}

export interface Member {
  name: string
  username: string
  role: 'member' | 'owner'
  avatar: AvatarProps
}

export interface Stat {
  title: string
  icon: string
  value: number | string
  variation: number
  formatter?: (value: number) => string
}

export interface Sale {
  id: string
  date: string
  status: SaleStatus
  email: string
  amount: number
}

export interface Notification {
  id: number
  unread?: boolean
  sender: User
  body: string
  date: string
}

export type Period = 'daily' | 'weekly' | 'monthly'

export interface Range {
  start: Date
  end: Date
}

// -- Social Search Engine API -------------------------------------------------

export interface AuthUser {
  id: number
  name: string
  email: string
  personality_id: number | null
  is_staff: boolean
  created_at: string
}

export interface TokenPair {
  access: string
  refresh: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

/** What `/api/auth/session`, `/api/auth/login` and `/api/auth/register` return. */
export interface SessionResponse {
  user: AuthUser | null
}

/**
 * DRF error bodies are either `{ detail: '...' }` or `{ field: ['...'] }`, and
 * `non_field_errors` covers validators that are not tied to a single field.
 */
export interface ApiErrorData {
  detail?: string
  non_field_errors?: string[]
  [field: string]: string | string[] | undefined
}

declare module '#app' {
  interface PageMeta {
    /** `false` opts a page out of the global auth guard. Defaults to `true`. */
    auth?: boolean
    /** Redirect to the dashboard when an authenticated user lands here. */
    guestOnly?: boolean
  }
}
