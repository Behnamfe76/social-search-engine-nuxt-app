<script setup lang="ts">
import { upperFirst } from 'scule'
import type { TableColumn } from '@nuxt/ui'
import type { Row } from '@tanstack/table-core'
import type { ActiveFilter, Gender, LookupDimension, LookupRef, Paginated, Personality } from '~/types'

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
const table = useTemplateRef('table')

const columnVisibility = ref()

/** Column ids are the API's field names, so they need real labels. */
const COLUMN_LABELS: Record<string, string> = {
  id: 'ID',
  full_name: 'Name',
  gender: 'Gender',
  industry: 'Industry',
  skills: 'Skills',
  companies: 'Companies',
  occupation_roles: 'Roles',
  occupation_levels: 'Seniority',
  languages: 'Languages',
  certifications: 'Certifications',
  interests: 'Interests',
  created_at: 'Added'
}

/**
 * Every dimension filter, in one table: the query param the API takes, the
 * lookup endpoint behind the picker, and the label used on chips and menus.
 */
const DIMENSIONS = [
  { key: 'industry_id', dimension: 'industries', label: 'Industry' },
  { key: 'skill_id', dimension: 'skills', label: 'Skill' },
  { key: 'company_id', dimension: 'companies', label: 'Company' },
  { key: 'occupation_role_id', dimension: 'occupation-roles', label: 'Role' },
  { key: 'occupation_level_id', dimension: 'occupation-levels', label: 'Seniority' },
  { key: 'language_id', dimension: 'languages', label: 'Language' },
  { key: 'certification_id', dimension: 'certifications', label: 'Certification' },
  { key: 'interest_id', dimension: 'interests', label: 'Interest' }
] as const satisfies readonly { key: string, dimension: LookupDimension, label: string }[]

type DimensionKey = typeof DIMENSIONS[number]['key']

function queryString(key: string): string {
  const value = route.query[key]
  return typeof value === 'string' ? value : ''
}

function queryNumber(key: string): number | undefined {
  const value = Number(route.query[key])
  return Number.isFinite(value) && value > 0 ? value : undefined
}

/** A repeated param arrives as an array, a single one as a string. */
function queryIds(key: string): number[] {
  const value = route.query[key]
  const raw = Array.isArray(value) ? value : [value]

  return raw.map(Number).filter(id => Number.isInteger(id) && id > 0)
}

// Filters start from the URL so a search — and the "profiles from this batch"
// link on an import — can be shared and reloaded.
const search = ref(queryString('search'))
const gender = ref<Gender | 'all'>((queryString('gender') || 'all') as Gender | 'all')
const importBatchId = ref<number | undefined>(queryNumber('import_batch_id'))
const birthYearMin = ref<number | undefined>(queryNumber('birth_year_min'))
const birthYearMax = ref<number | undefined>(queryNumber('birth_year_max'))
const ordering = ref(queryString('ordering') || '-created_at')
const page = ref(queryNumber('page') || 1)
const pageSize = ref(20)

/** The chosen options per dimension, held as `{ id, name }` so chips read as words. */
const picked = reactive(Object.fromEntries(
  DIMENSIONS.map(entry => [entry.key, queryIds(entry.key).map(id => ({ id, name: `#${id}` }))])
) as Record<DimensionKey, LookupRef[]>)

// Ids from a shared URL start out nameless. Swap in the real names once.
onMounted(async () => {
  await Promise.all(DIMENSIONS.map(async (entry) => {
    const ids = picked[entry.key].map(item => item.id)

    if (!ids.length) {
      return
    }

    try {
      picked[entry.key] = await $fetch<LookupRef[]>(`/api/lookups/${entry.dimension}/resolve`, {
        query: { ids: ids.join(',') }
      })
    } catch {
      // Keep the numeric placeholders rather than dropping the filter.
    }
  }))
})

// Typing should not fire a request per keystroke.
const debouncedSearch = refDebounced(search, 300)

const filters = computed(() => ({
  search: debouncedSearch.value || undefined,
  gender: gender.value === 'all' ? undefined : gender.value,
  import_batch_id: importBatchId.value,
  birth_year_min: birthYearMin.value,
  birth_year_max: birthYearMax.value,
  ...Object.fromEntries(DIMENSIONS.map(entry => [
    entry.key,
    picked[entry.key].length ? picked[entry.key].map(item => item.id) : undefined
  ])),
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

/** Clearing one chip and clearing everything share these setters. */
const FILTER_RESETTERS: Record<string, () => void> = {
  search: () => { search.value = '' },
  gender: () => { gender.value = 'all' },
  import_batch_id: () => { importBatchId.value = undefined },
  birth_year_min: () => { birthYearMin.value = undefined },
  birth_year_max: () => { birthYearMax.value = undefined },
  ...Object.fromEntries(DIMENSIONS.map(entry => [
    entry.key,
    () => { picked[entry.key] = [] }
  ]))
}

function clearFilter(key: string) {
  // A dimension chip carries the one option it stands for, e.g. `skill_id:81`.
  const [dimensionKey, id] = key.split(':')

  if (id && dimensionKey && dimensionKey in picked) {
    const target = dimensionKey as DimensionKey
    picked[target] = picked[target].filter(item => item.id !== Number(id))
    return
  }

  FILTER_RESETTERS[key]?.()
}

function resetFilters() {
  Object.values(FILTER_RESETTERS).forEach(reset => reset())
}

const activeFilters = computed<ActiveFilter[]>(() => {
  const applied: ActiveFilter[] = []

  if (search.value) {
    applied.push({ key: 'search', label: 'Search', value: search.value })
  }
  if (gender.value !== 'all') {
    applied.push({ key: 'gender', label: 'Gender', value: genderLabel(gender.value) })
  }

  // One chip per chosen option, so any single one can be removed on its own.
  for (const entry of DIMENSIONS) {
    for (const item of picked[entry.key]) {
      applied.push({ key: `${entry.key}:${item.id}`, label: entry.label, value: humanise(item.name) })
    }
  }

  if (importBatchId.value !== undefined) {
    applied.push({ key: 'import_batch_id', label: 'Import batch', value: `#${importBatchId.value}` })
  }
  if (birthYearMin.value !== undefined) {
    applied.push({ key: 'birth_year_min', label: 'Born from', value: String(birthYearMin.value) })
  }
  if (birthYearMax.value !== undefined) {
    applied.push({ key: 'birth_year_max', label: 'Born to', value: String(birthYearMax.value) })
  }

  return applied
})

const hasFilters = computed(() => activeFilters.value.length > 0)

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

/**
 * Render a dimension as chips. Each one filters the list down to itself, which
 * is the whole point of the API returning ids alongside the names.
 */
function refCell(refs: LookupRef[], filterKey: DimensionKey) {
  if (!refs.length) {
    return h('span', { class: 'text-dimmed' }, '—')
  }

  const shown = refs.slice(0, 2)
  const rest = refs.length - shown.length

  return h('div', { class: 'flex flex-wrap items-center gap-1' }, [
    ...shown.map(item => h(UBadge, {
      key: item.id,
      variant: 'subtle',
      color: 'neutral',
      class: 'max-w-40 cursor-pointer hover:text-primary',
      title: item.name,
      onClick: () => {
        if (!picked[filterKey].some(chosen => chosen.id === item.id)) {
          picked[filterKey] = [...picked[filterKey], item]
        }
      }
    }, () => h('span', { class: 'truncate' }, item.name))
    ),
    rest > 0 ? h('span', { class: 'text-xs text-dimmed' }, `+${rest}`) : null
  ])
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
  accessorKey: 'industry',
  header: 'Industry',
  cell: ({ row }) => h('span', {
    class: 'text-muted truncate block max-w-48',
    title: row.original.industry ?? undefined
  }, row.original.industry ? humanise(row.original.industry) : '—')
}, {
  accessorKey: 'skills',
  header: 'Skills',
  cell: ({ row }) => refCell(row.original.skills, 'skill_id')
}, {
  accessorKey: 'companies',
  header: 'Companies',
  cell: ({ row }) => refCell(row.original.companies, 'company_id')
}, {
  accessorKey: 'occupation_roles',
  header: 'Roles',
  cell: ({ row }) => refCell(row.original.occupation_roles, 'occupation_role_id')
}, {
  accessorKey: 'occupation_levels',
  header: 'Seniority',
  cell: ({ row }) => refCell(row.original.occupation_levels, 'occupation_level_id')
}, {
  accessorKey: 'languages',
  header: 'Languages',
  cell: ({ row }) => refCell(row.original.languages, 'language_id')
}, {
  accessorKey: 'certifications',
  header: 'Certifications',
  cell: ({ row }) => refCell(row.original.certifications, 'certification_id')
}, {
  accessorKey: 'interests',
  header: 'Interests',
  cell: ({ row }) => refCell(row.original.interests, 'interest_id')
}, {
  accessorKey: 'created_at',
  header: () => sortableHeader('created_at', 'Added'),
  cell: ({ row }) => h('span', { class: 'text-muted' }, formatDateTime(row.original.created_at))
}, {
  id: 'actions',
  // Hiding the row menu is never what someone means by "Display".
  enableHiding: false,
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

// Eleven data columns will not fit at once; start on the ones that carry the
// story and leave the rest to the Display menu.
const columnVisibilityDefaults = {
  languages: false,
  certifications: false,
  interests: false,
  occupation_levels: false
}

columnVisibility.value = { ...columnVisibilityDefaults }
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

          <LookupSelect
            v-model="picked.skill_id"
            dimension="skills"
            label="Skill"
            placeholder="Skills"
          />

          <LookupSelect
            v-model="picked.industry_id"
            dimension="industries"
            label="Industry"
            placeholder="Industries"
          />

          <UDropdownMenu
            :items="table?.tableApi
              ?.getAllColumns()
              .filter((column: any) => column.getCanHide())
              .map((column: any) => ({
                label: COLUMN_LABELS[column.id] ?? upperFirst(column.id),
                type: 'checkbox' as const,
                checked: column.getIsVisible(),
                onUpdateChecked(checked: boolean) {
                  table?.tableApi?.getColumn(column.id)?.toggleVisibility(!!checked)
                },
                onSelect(e?: Event) {
                  e?.preventDefault()
                }
              }))"
            :content="{ align: 'end' }"
          >
            <UButton
              label="Display"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-settings-2"
            />
          </UDropdownMenu>

          <UPopover>
            <UButton
              label="More filters"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-sliders-horizontal"
            />

            <template #content>
              <div class="flex flex-col gap-3 p-4 w-80">
                <UFormField
                  v-for="entry in DIMENSIONS.filter(d => !['skill_id', 'industry_id'].includes(d.key))"
                  :key="entry.key"
                  :label="entry.label"
                >
                  <LookupSelect
                    v-model="picked[entry.key]"
                    :dimension="entry.dimension"
                    :label="entry.label"
                    :placeholder="`Any ${entry.label.toLowerCase()}`"
                    class="w-full"
                  />
                </UFormField>

                <USeparator />

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
                    <UInputNumber
                      v-model="birthYearMin"
                      placeholder="From"
                      class="w-full"
                    />
                    <UInputNumber
                      v-model="birthYearMax"
                      placeholder="To"
                      class="w-full"
                    />
                  </div>
                </UFormField>
              </div>
            </template>
          </UPopover>
        </div>
      </div>

      <PersonalitiesActiveFilters
        :filters="activeFilters"
        :count="data?.count"
        @clear="clearFilter"
        @clear-all="resetFilters"
      />

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
        ref="table"
        v-model:column-visibility="columnVisibility"
        :data="data?.results"
        :columns="columns"
        :loading="status === 'pending'"
        class="shrink-0"
        :ui="{
          base: 'border-separate border-spacing-0',
          thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default align-top',
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
