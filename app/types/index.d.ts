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

/** DRF's page-number pagination envelope. */
export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface HealthCheck {
  status: string
  service: string
}

export type Gender = 'male' | 'female' | 'other' | 'unknown'

/** The thin shape the list endpoint returns. */
export interface Personality {
  id: number
  industry_id: number | null
  full_name: string
  gender: Gender
  created_at: string
}

/** Everything the detail endpoint adds on top of the list shape. */
export interface PersonalityDetail {
  id: number
  import_batch_id: number | null
  industry_id: number | null
  first_name: string
  middle_name: string | null
  middle_initial: string | null
  last_name: string
  full_name: string
  gender: Gender
  birth_date: string | null
  birth_year: number | null
  summary: string | null
  inferred_salary: string | null
  inferred_years_experience: number | null
  version_status: unknown
  location_last_updated: string | null
  created_at: string
  updated_at: string
  deleted_at: string | null
}

/** The writable subset, shared by create and update. */
export interface PersonalityInput {
  first_name: string
  last_name: string
  import_batch_id?: number | null
  industry_id?: number | null
  middle_name?: string | null
  middle_initial?: string | null
  gender?: Gender
  birth_date?: string | null
  birth_year?: number | null
  summary?: string | null
  inferred_salary?: string | null
  inferred_years_experience?: number | null
  location_last_updated?: string | null
}

/**
 * The form's view of the writable fields. Inputs cannot hold `null`, so the
 * API's nulls are read as blanks on the way in and written back as nulls by
 * `cleanInput` on the way out.
 */
export type PersonalityFormState = {
  [K in keyof PersonalityInput]: Exclude<PersonalityInput[K], null>
}

/** One applied filter, as shown in the active-filters bar. */
export interface ActiveFilter {
  key: string
  label: string
  value: string
}

export interface PersonalityQuery {
  search?: string
  full_name?: string
  gender?: Gender
  industry_id?: number
  import_batch_id?: number
  birth_year_min?: number
  birth_year_max?: number
  ordering?: string
  page?: number
  page_size?: number
}

export type ImportStatus = 'pending' | 'planning' | 'processing' | 'finalising' | 'completed' | 'partial' | 'failed'

/** The shape the progress poller reads. */
export interface ImportBatch {
  id: number
  status: ImportStatus
  source: string
  filename: string
  file_size: number | null
  row_count: number | null
  total_chunks: number
  pending_chunks: number
  processed_rows: number
  created_rows: number
  updated_rows: number
  failed_rows: number
  progress: number
  duration_seconds: number | null
  is_terminal: boolean
  error: string | null
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface ImportRowError {
  id: number
  row_number: number
  message: string
  excerpt: string
  created_at: string
}

declare module '#app' {
  interface PageMeta {
    /** `false` opts a page out of the global auth guard. Defaults to `true`. */
    auth?: boolean
    /** Redirect to the dashboard when an authenticated user lands here. */
    guestOnly?: boolean
  }
}
