import { format, formatDistanceToNow, isToday } from 'date-fns'
import type { BadgeProps, SelectItem } from '@nuxt/ui'
import type { Gender, ImportStatus } from '~/types'

export const GENDER_OPTIONS: SelectItem[] = [
  { label: 'All genders', value: 'all' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Unknown', value: 'unknown' }
]

/**
 * The taxonomy stores snake_case slugs (`human_resources`), so underscores are
 * always a slug artifact in this data. Display only — ids are what get sent.
 */
export function humanise(value: string): string {
  return value.replace(/_/g, ' ')
}

export function genderLabel(gender: Gender): string {
  return gender.charAt(0).toUpperCase() + gender.slice(1)
}

/** `partial` is a success with caveats, which is why it is warning and not error. */
const IMPORT_STATUS_COLORS: Record<ImportStatus, BadgeProps['color']> = {
  pending: 'neutral',
  planning: 'info',
  processing: 'info',
  finalising: 'info',
  completed: 'success',
  partial: 'warning',
  failed: 'error'
}

const IMPORT_STATUS_LABELS: Record<ImportStatus, string> = {
  pending: 'Pending',
  planning: 'Planning',
  processing: 'Processing',
  finalising: 'Finalising',
  completed: 'Completed',
  partial: 'Completed with errors',
  failed: 'Failed'
}

export function importStatusColor(status: ImportStatus): BadgeProps['color'] {
  return IMPORT_STATUS_COLORS[status] ?? 'neutral'
}

export function importStatusLabel(status: ImportStatus): string {
  return IMPORT_STATUS_LABELS[status] ?? status
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) {
    return '—'
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const exponent = bytes === 0 ? 0 : Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent

  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`
}

export function formatDuration(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined) {
    return '—'
  }

  if (seconds < 60) {
    return `${seconds.toFixed(1)}s`
  }

  const minutes = Math.floor(seconds / 60)

  return `${minutes}m ${Math.round(seconds % 60)}s`
}

/** Times today, dates otherwise — the same rule the inbox list uses. */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return '—'
  }

  const date = new Date(value)

  return isToday(date) ? format(date, 'HH:mm') : format(date, 'dd MMM yyyy')
}

export function formatRelative(value: string | null | undefined): string {
  return value ? `${formatDistanceToNow(new Date(value))} ago` : '—'
}

export function formatNumber(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : value.toLocaleString('en-US')
}
