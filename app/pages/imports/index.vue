<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { ImportBatch, Paginated } from '~/types'

const UBadge = resolveComponent('UBadge')
const UProgress = resolveComponent('UProgress')

useSeoMeta({
  title: 'Imports',
  description: 'Upload a dataset and watch the workers chew through it.'
})

const NuxtLink = resolveComponent('NuxtLink')

const page = ref(1)
const pageSize = 20

const { data, status, error, refresh } = await useFetch<Paginated<ImportBatch>>('/api/imports', {
  query: computed(() => ({ page: page.value, page_size: pageSize })),
  default: () => ({ count: 0, next: null, previous: null, results: [] })
})

// Keep the list live while anything is still being planned or processed.
const { polling } = useImportProgress(
  async () => { await refresh() },
  () => hasRunningBatch(data.value)
)

const columns: TableColumn<ImportBatch>[] = [{
  accessorKey: 'id',
  header: 'ID',
  cell: ({ row }) => h('span', { class: 'text-muted' }, `#${row.original.id}`)
}, {
  accessorKey: 'filename',
  header: 'File',
  cell: ({ row }) => h('div', undefined, [
    h(NuxtLink, {
      to: `/imports/${row.original.id}`,
      class: 'font-medium text-highlighted hover:text-primary'
    }, () => row.original.filename),
    h('p', { class: 'text-muted' }, formatBytes(row.original.file_size))
  ])
}, {
  accessorKey: 'status',
  header: 'Status',
  cell: ({ row }) => h(UBadge, {
    variant: 'subtle',
    color: importStatusColor(row.original.status)
  }, () => importStatusLabel(row.original.status))
}, {
  accessorKey: 'progress',
  header: 'Progress',
  cell: ({ row }) => h('div', { class: 'flex flex-col gap-1 min-w-32' }, [
    h(UProgress, {
      modelValue: row.original.progress,
      max: 100,
      size: 'sm',
      color: importStatusColor(row.original.status),
      // An indeterminate bar while planning: the row count is not known yet.
      animation: 'carousel'
    }),
    h('p', { class: 'text-muted text-xs' }, `${row.original.processed_rows} / ${row.original.row_count ?? '?'} rows`)
  ])
}, {
  id: 'rows',
  header: 'Result',
  cell: ({ row }) => h('div', { class: 'text-xs flex flex-col gap-0.5' }, [
    h('span', { class: 'text-highlighted' }, `${formatNumber(row.original.created_rows)} created`),
    h('span', { class: 'text-muted' }, `${formatNumber(row.original.updated_rows)} updated`),
    row.original.failed_rows
      ? h('span', { class: 'text-error' }, `${formatNumber(row.original.failed_rows)} rejected`)
      : null
  ])
}, {
  accessorKey: 'created_at',
  header: 'Started',
  cell: ({ row }) => h('span', { class: 'text-muted' }, formatDateTime(row.original.created_at))
}]
</script>

<template>
  <UDashboardPanel id="imports">
    <template #header>
      <UDashboardNavbar title="Imports">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
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
            label="Refresh"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="status === 'pending'"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <ImportsUploadCard @uploaded="refresh()" />

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Could not load imports"
        :description="parseApiError(error).message"
        :actions="[{ label: 'Retry', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <UTable
        :data="data?.results"
        :columns="columns"
        :loading="status === 'pending' && !data?.results.length"
        class="shrink-0"
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
            icon="i-lucide-file-up"
            title="No imports yet"
            description="Upload a CSV export above to populate the search index."
          />
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ formatNumber(data?.count ?? 0) }} batch{{ data?.count === 1 ? '' : 'es' }}
        </div>

        <UPagination
          v-model:page="page"
          :items-per-page="pageSize"
          :total="data?.count ?? 0"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
