import type { ImportBatch, Paginated } from '~/types'

/** How often a running batch is re-read while the page is open. */
const POLL_INTERVAL = 1500

/**
 * Poll an import while it is still running.
 *
 * `GET /imports/{id}/` is built for exactly this: the counters are updated by
 * the workers as each chunk commits, so progress advances without the request
 * touching the file. Polling stops the moment the batch reports `is_terminal`,
 * and never starts at all if it is already finished.
 */
export function useImportProgress(
  refresh: () => Promise<void>,
  isRunning: () => boolean
) {
  const { pause, resume, isActive } = useIntervalFn(async () => {
    await refresh()

    if (!isRunning()) {
      pause()
    }
  }, POLL_INTERVAL, { immediate: false })

  watchEffect(() => {
    if (isRunning()) {
      resume()
    } else {
      pause()
    }
  })

  // Nothing should keep ticking once the user has navigated away.
  onScopeDispose(pause)

  return { polling: isActive }
}

export function isBatchRunning(batch: ImportBatch | null | undefined): boolean {
  return !!batch && !batch.is_terminal
}

export function hasRunningBatch(page: Paginated<ImportBatch> | null | undefined): boolean {
  return !!page?.results.some(batch => !batch.is_terminal)
}
