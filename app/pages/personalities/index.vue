<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type { Gender, Paginated, Personality } from '~/types'

const UButton = resolveComponent('UButton')
const UBadge = resolveComponent('UBadge')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const NuxtLink = resolveComponent('NuxtLink')

useSeoMeta({
  title: 'Personalities',
  description: 'Search the profiles held in the Social Search Engine.'
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

function queryString(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

function queryNumber(key: string): number | undefined {
  const value = Number(route.query[key])
  return Number.isFinite(value) && value > 0 ? value : undefined
}

// Filters start from the URL so a search — and the "profiles from this batch"
// link on an import — can be shared and reloaded.
const search = ref(queryString('search'))
const gender = ref<Gender | 'all'>((queryString('gender') || 'all') as Gender | 'all')
const industryId = ref<number | undefined>(queryNumber('industry_id'))
const importBatchId = ref<number | undefined>(queryNumber('import_batch_id'))
const birthYearMin = ref<number | undefined>(queryNumber('birth_year_min'))
const birthYearMax = ref<number | undefined>(queryNumber('birth_year_max'))
const ordering = ref(queryString('ordering') || '-created_at')
const page = ref(queryNumber('page') || 1)
const pageSize = ref(20)

// Typing should not fire a request per keystroke.
const debouncedSearch = refDebounced(search, 300)

const filters = computed(() => ({
  search: debouncedSearch.value || undefined,
  gender: gender.value === 'all' ? undefined : gender.value,
  industry_id: industryId.value,
  import_batch_id: importBatchId.value,
  birth_year_min: birthYearMin.value,
  birth_year_max: birthYearMax.value,
  ordering: ordering.value
}))

const query = computed(() => ({
  ...filters.value,
  page: page.value,
  page_size: pageSize.value
}))

const { data, status, error, refresh } = await useFetch<Paginated<Personality>>('/api/personalities', {
  query,
  // The API paginates, so each page is its own request rather than one big
  // client-side table.
  default: () => ({ count: 0, next: null, previous: null, results: [] })
})

// Any filter change invalidates the page number.
watch(filters, () => {
  page.value = 1
})

watch(query, (value) => {
  router.replace({
    query: Object.fromEntries(
      Object.entries({ ...value, page_size: undefined, page: value.page === 1 ? undefined : value.page })
        .filter(([, entry]) => entry !== undefined && entry !== '')
    )
  })
})

const hasFilters = computed(() => !!search.value
  || gender.value !== 'all'
  || industryId.value !== undefined
  || importBatchId.value !== undefined
  || birthYearMin.value !== undefined
  || birthYearMax.value !== undefined)

function resetFilters() {
  search.value = ''
  gender.value = 'all'
  industryId.value = undefined
  importBatchId.value = undefined
  birthYearMin.value = undefined
  birthYearMax.value = undefined
}

function toggleOrdering(field: string) {
  ordering.value = ordering.value === field ? `-${field}` : field
}

function sortableHeader(field: string, label: string) {
  const active = ordering.value === field || ordering.value === `-${field}`

  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: active
      ? (ordering.value.startsWith('-') ? 'i-lucide-arrow-down-wide-narrow' : 'i-lucide-arrow-up-narrow-wide')
      : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    onClick: () => toggleOrdering(field)
  })
}

function getRowItems(row: Row<Personality>) {
  return [{
    type: 'label' as const,
    label: 'Actions'
  }, {
    label: 'View profile',
    icon: 'i-lucide-list',
    to: `/personalities/${row.original.id}`
  }, {
    label: 'Copy profile ID',
    icon: 'i-lucide-copy',
    onSelect() {
      navigator.clipboard.writeText(String(row.original.id))
      toast.add({ title: 'Copied to clipboard', description: `Profile ID ${row.original.id} copied.` })
    }
  }]
}

const columns: TableColumn<Personality>[] = [{
  accessorKey: 'id',
  header: () => sortableHeader('id', 'ID'),
  cell: ({ row }) => h('span', { class: 'text-muted' }, `#${row.original.id}`)
}, {
  accessorKey: 'full_name',
  header: () => sortableHeader('full_name', 'Name'),
  cell: ({ row }) => h(
    NuxtLink,
    { to: `/personalities/${row.original.id}`, class: 'font-medium text-highlighted hover:text-primary' },
    () => row.original.full_name || '—'
  )
}, {
  accessorKey: 'gender',
  header: 'Gender',
  cell: ({ row }) => h(UBadge, {
    variant: 'subtle',
    color: row.original.gender === 'unknown' ? 'neutral' : 'primary'
  }, () => genderLabel(row.original.gender))
}, {
  accessorKey: 'industry_id',
  header: 'Industry',
  // The list serialiser exposes the FK, not the name — there is no industries
  // endpoint to resolve it against.
  cell: ({ row }) => h('span', { class: 'text-muted' }, row.original.industry_id ? `#${row.original.industry_id}` : '—')
}, {
  accessorKey: 'created_at',
  header: () => sortableHeader('created_at', 'Added'),
  cell: ({ row }) => h('span', { class: 'text-muted' }, formatDateTime(row.original.created_at))
}, {
  id: 'actions',
  cell: ({ row }) => h('div', { class: 'text-right' }, h(UDropdownMenu, {
    content: { align: 'end' },
    items: getRowItems(row)
  }, () => h(UButton, {
    icon: 'i-lucide-ellipsis-vertical',
    color: 'neutral',
    variant: 'ghost',
    class: 'ml-auto'
  })))
}]
</script>

<template>
  <UDashboardPanel id="personalities">
    <template #header>
      <UDashboardNavbar title="Personalities">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <UBadge v-if="data?.count" variant="subtle" color="neutral">
            {{ formatNumber(data.count) }}
          </UBadge>
        </template>

        <template #right>
          <PersonalitiesAddModal @created="refresh()" />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-wrap items-center justify-between gap-1.5">
        <UInput
          v-model="search"
          class="max-w-sm"
          icon="i-lucide-search"
          placeholder="Search names..."
          :loading="status === 'pending'"
        />

        <div class="flex flex-wrap items-center gap-1.5">
          <USelect
            v-model="gender"
            :items="GENDER_OPTIONS"
            :ui="{ trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200' }"
            class="min-w-36"
          />

          <UPopover>
            <UButton
              label="More filters"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-sliders-horizontal"
            />

            <template #content>
              <div class="flex flex-col gap-3 p-4 w-72">
                <UFormField label="Industry ID">
                  <UInputNumber
                    v-model="industryId"
                    :min="1"
                    placeholder="Any"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Import batch ID" help="Scope results to one upload.">
                  <UInputNumber
                    v-model="importBatchId"
                    :min="1"
                    placeholder="Any"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Birth year">
                  <div class="flex items-center gap-2">
                    <UInputNumber v-model="birthYearMin" placeholder="From" class="w-full" />
                    <UInputNumber v-model="birthYearMax" placeholder="To" class="w-full" />
                  </div>
                </UFormField>
                <UButton
                  v-if="hasFilters"
                  label="Clear filters"
                  color="neutral"
                  variant="subtle"
                  block
                  @click="resetFilters"
                />
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Could not load profiles"
        :description="parseApiError(error).message"
        :actions="[{ label: 'Retry', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <UTable
        :data="data?.results"
        :columns="columns"
        :loading="status === 'pending'"
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
            icon="i-lucide-user-search"
            title="No profiles found"
            :description="hasFilters ? 'No profile matches these filters.' : 'Import a dataset to get started.'"
          />
        </template>
      </UTable>

      <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
        <div class="text-sm text-muted">
          {{ formatNumber(data?.count ?? 0) }} profile{{ data?.count === 1 ? '' : 's' }}
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
