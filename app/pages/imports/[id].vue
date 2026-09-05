<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ImportBatch, ImportRowError, Paginated } from '~/types'

const route = useRoute()

const id = computed(() => route.params.id as string)

const { data: batch, error, refresh } = await useFetch<ImportBatch>(() => `/api/imports/${id.value}`)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusCode === 404 ? 'Import not found' : 'Could not load the import',
    fatal: true
  })
}

useSeoMeta({
  title: () => batch.value ? `Import #${batch.value.id}` : 'Import'
})

const { polling } = useImportProgress(
  async () => { await refresh() },
  () => isBatchRunning(batch.value)
)

const errorPage = ref(1)
const errorPageSize = 20

const { data: rowErrors, status: errorStatus } = await useFetch<Paginated<ImportRowError>>(
  () => `/api/imports/${id.value}/errors`,
  {
    query: computed(() => ({ page: errorPage.value, page_size: errorPageSize })),
    default: () => ({ count: 0, next: null, previous: null, results: [] })
  }
)

const stats = computed(() => batch.value
  ? [
      { label: 'Rows found', value: formatNumber(batch.value.row_count), icon: 'i-lucide-list' },
      { label: 'Processed', value: formatNumber(batch.value.processed_rows), icon: 'i-lucide-check-check' },
      { label: 'Created', value: formatNumber(batch.value.created_rows), icon: 'i-lucide-user-plus' },
      { label: 'Updated', value: formatNumber(batch.value.updated_rows), icon: 'i-lucide-refresh-cw' },
      { label: 'Rejected', value: formatNumber(batch.value.failed_rows), icon: 'i-lucide-circle-alert' },
      { label: 'Chunks left', value: `${batch.value.pending_chunks} / ${batch.value.total_chunks}`, icon: 'i-lucide-boxes' }
    ]
  : [])

const facts = computed(() => batch.value
  ? [
      { label: 'File', value: batch.value.filename },
      { label: 'Size', value: formatBytes(batch.value.file_size) },
      { label: 'Source', value: batch.value.source },
      { label: 'Started', value: formatDateTime(batch.value.started_at) },
      { label: 'Finished', value: formatDateTime(batch.value.finished_at) },
      { label: 'Duration', value: formatDuration(batch.value.duration_seconds) }
    ]
  : [])

const columns: TableColumn<ImportRowError>[] = [{
  accessorKey: 'row_number',
  header: 'Row',
  cell: ({ row }) => h('span', { class: 'text-muted tabular-nums' }, row.original.row_number)
}, {
  accessorKey: 'message',
  header: 'Why it was rejected',
  cell: ({ row }) => h('span', { class: 'text-highlighted' }, row.original.message)
}, {
  accessorKey: 'excerpt',
  header: 'Excerpt',
  cell: ({ row }) => h('code', {
    class: 'text-xs text-muted line-clamp-2 break-all',
    title: row.original.excerpt
  }, row.original.excerpt)
}]
</script>

<template>
  <UDashboardPanel v-if="batch" id="import">
    <template #header>
      <UDashboardNavbar :title="`Import #${batch.id}`">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/imports"
          />
        </template>

        <template #trailing>
          <UBadge :color="importStatusColor(batch.status)" variant="subtle">
            {{ importStatusLabel(batch.status) }}
          </UBadge>
          <UBadge
            v-if="polling"
            variant="subtle"
            color="info"
            icon="i-lucide-loader-circle"
            label="Live"
            :ui="{ leadingIcon: 'animate-spin' }"
          />
        </template>

        <template #right>
          <UButton
            :to="`/personalities?import_batch_id=${batch.id}`"
            label="View profiles"
            color="neutral"
            variant="outline"
            icon="i-lucide-users"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="batch.error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="The batch failed"
        :description="batch.error"
      />

      <UPageCard variant="subtle">
        <div class="flex flex-col gap-4">
          <div class="flex items-end justify-between gap-4">
            <div>
              <p class="text-2xl font-semibold text-highlighted">
                {{ batch.progress.toFixed(1) }}%
              </p>
              <p class="text-sm text-muted">
                {{ formatNumber(batch.processed_rows) }} of {{ batch.row_count ?? '?' }} rows processed
              </p>
            </div>
            <p class="text-sm text-muted">
              {{ formatDuration(batch.duration_seconds) }}
            </p>
          </div>

          <UProgress
            :model-value="batch.progress"
            :max="100"
            :color="importStatusColor(batch.status)"
          />

          <div class="grid gap-4 sm:grid-cols-3 lg:grid-cols-6 pt-2">
            <div
              v-for="stat in stats"
              :key="stat.label"
              class="flex flex-col gap-1"
            >
              <span class="text-xs text-muted flex items-center gap-1.5">
                <UIcon :name="stat.icon" class="size-3.5" />
                {{ stat.label }}
              </span>
              <span class="text-lg font-medium text-highlighted">{{ stat.value }}</span>
            </div>
          </div>
        </div>
      </UPageCard>

      <div class="grid gap-4 lg:grid-cols-3">
        <UPageCard title="File" variant="subtle" class="h-fit">
          <dl class="flex flex-col gap-3 text-sm">
            <div
              v-for="fact in facts"
              :key="fact.label"
              class="flex items-center justify-between gap-4"
            >
              <dt class="text-muted">
                {{ fact.label }}
              </dt>
              <dd class="font-medium text-highlighted text-right truncate">
                {{ fact.value }}
              </dd>
            </div>
          </dl>
        </UPageCard>

        <UPageCard
          :title="`Rejected rows (${formatNumber(rowErrors?.count ?? 0)})`"
          description="Rows the importer could not read. The rest of the batch was imported regardless."
          variant="subtle"
          class="lg:col-span-2"
        >
          <UTable
            :data="rowErrors?.results"
            :columns="columns"
            :loading="errorStatus === 'pending'"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default',
              separator: 'h-0'
            }"
          >
            <template #empty>
              <UEmpty
                icon="i-lucide-check-check"
                title="No rejected rows"
                description="Every row in this file imported cleanly."
              />
            </template>
          </UTable>

          <template v-if="(rowErrors?.count ?? 0) > errorPageSize" #footer>
            <UPagination
              v-model:page="errorPage"
              :items-per-page="errorPageSize"
              :total="rowErrors?.count ?? 0"
              class="justify-end"
            />
          </template>
        </UPageCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
