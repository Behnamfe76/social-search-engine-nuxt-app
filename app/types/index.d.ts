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

/** The dimensions the lookup endpoints expose, as used in the proxy path. */
export type LookupDimension
  = 'industries' | 'skills' | 'interests' | 'languages'
    | 'certifications' | 'companies' | 'occupation-roles' | 'occupation-levels'

/** A filter option: `id` goes back as the filter value, `name` is shown. */
export interface Lookup {
  id: number
  name: string
  count: number
}

/** The same pair embedded in a profile, minus the count. */
export interface LookupRef {
  id: number
  name: string
}

/**
 * Cursor pages carry no total. The proxy hands back an opaque cursor rather
 * than the API's absolute `next` URL, so the Django host stays server-side.
 */
export interface CursorPage<T> {
  results: T[]
  nextCursor: string | null
}

/** The dimensions a profile belongs to, as returned by list and retrieve. */
export interface PersonalityDimensions {
  skills: LookupRef[]
  interests: LookupRef[]
  languages: LookupRef[]
  certifications: LookupRef[]
  companies: LookupRef[]
  occupation_roles: LookupRef[]
  occupation_levels: LookupRef[]
}

/** The shape the list endpoint returns. `industry` is the name, not the id. */
export interface Personality extends PersonalityDimensions {
  id: number
  industry: string | null
  full_name: string
  gender: Gender
  created_at: string
}

/** Everything the detail endpoint adds on top of the list shape. */
export interface PersonalityDetail extends PersonalityDimensions {
  id: number
  import_batch_id: number | null
  industry_id: number | null
  industry: string | null
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
  industry_id?: number[]
  skill_id?: number[]
  interest_id?: number[]
  language_id?: number[]
  certification_id?: number[]
  company_id?: number[]
  occupation_role_id?: number[]
  occupation_level_id?: number[]
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

export interface NamedCount {
  name: string
  count: number
}

export interface DashboardStats {
  /** Open-ended: keyed row counts. Treated as data, not a fixed shape. */
  totals: Record<string, number>
  gender: NamedCount[]
  top_skills: NamedCount[]
  top_interests: NamedCount[]
  top_languages: NamedCount[]
  top_certifications: NamedCount[]
  top_companies: NamedCount[]
  company_sizes: NamedCount[]
  occupation_roles: NamedCount[]
  seniority_levels: NamedCount[]
  seniority_by_role: { role: string, level: string, count: number }[]
  tenure: {
    sample_size: number
    mean_years: number
    median_years: number
    buckets: NamedCount[]
  }
  employment_status: NamedCount[]
  employments_per_person: { employments: number, people: number }[]
  hires_by_year: { year: number, count: number }[]
  social_platforms: { name: string, profiles: number, people: number }[]
  platform_reach: { platforms: number, people: number }[]
  coverage: { name: string, filled: number, total: number, percent: number }[]
  imports: {
    batches: NamedCount[]
    processed_rows: number
    created_rows: number
    updated_rows: number
    failed_rows: number
  }
}

/** One row of a bar list: a label, a magnitude, and an optional aside. */
export interface BarItem {
  name: string
  value: number
  hint?: string
}

declare module '#app' {
  interface PageMeta {
    /** `false` opts a page out of the global auth guard. Defaults to `true`. */
    auth?: boolean
    /** Redirect to the dashboard when an authenticated user lands here. */
    guestOnly?: boolean
  }
}
