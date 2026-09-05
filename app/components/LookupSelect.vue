<script setup lang="ts">
import type { CursorPage, Lookup, LookupDimension, LookupRef } from '~/types'

const props = defineProps<{
  dimension: LookupDimension
  placeholder?: string
  /** Names can be enormous in this dataset, so cap what the trigger shows. */
  label?: string
}>()

const selected = defineModel<LookupRef[]>({ default: () => [] })

const searchTerm = ref('')
const debouncedSearch = refDebounced(searchTerm, 250)

const options = ref<Lookup[]>([])
const nextCursor = ref<string | null>(null)
const loading = ref(false)
const loadingMore = ref(false)
const loaded = ref(false)

async function fetchPage(cursor?: string) {
  const target = cursor ? loadingMore : loading
  target.value = true

  try {
    const page = await $fetch<CursorPage<Lookup>>(`/api/lookups/${props.dimension}`, {
      query: {
        search: debouncedSearch.value || undefined,
        cursor: cursor || undefined
      }
    })

    options.value = cursor ? [...options.value, ...page.results] : page.results
    nextCursor.value = page.nextCursor
  } catch {
    if (!cursor) {
      options.value = []
      nextCursor.value = null
    }
  } finally {
    target.value = false
  }
}

// The list is searched on the server: 1400 skills will not fit in the client.
watch(debouncedSearch, () => {
  if (loaded.value) {
    fetchPage()
  }
})

/**
 * Load on first open rather than on mount. Eight of these live on the page and
 * most are never opened, so mounting them should not cost eight requests.
 */
function onOpen(open: boolean) {
  if (open && !loaded.value) {
    loaded.value = true
    fetchPage()
  }
}

/**
 * Keep the chosen options in the list even when the current search does not
 * return them, so selections never vanish mid-edit.
 */
const items = computed<Lookup[]>(() => {
  const seen = new Set(options.value.map(option => option.id))
  const missing = selected.value
    .filter(item => !seen.has(item.id))
    .map(item => ({ ...item, count: 0 }))

  return [...missing, ...options.value]
})

const knownNames = computed(() => {
  const names = new Map<number, string>()

  for (const item of [...selected.value, ...options.value]) {
    names.set(item.id, item.name)
  }

  return names
})

/**
 * The menu binds ids, but the parent needs names for its filter chips, so the
 * id list is mapped back to `{ id, name }` on the way out.
 */
const selectedIds = computed<number[]>({
  get: () => selected.value.map(item => item.id),
  set: (ids) => {
    selected.value = ids.map(id => ({ id, name: knownNames.value.get(id) ?? `#${id}` }))
  }
})

function labelFor(item: LookupRef): string {
  const name = humanise(item.name)

  // Some names in this dataset run to hundreds of characters of stray JSON.
  return name.length > 60 ? `${name.slice(0, 60)}...` : name
}

const triggerLabel = computed(() => {
  if (!selected.value.length) {
    return props.placeholder ?? props.label
  }

  return selected.value.length === 1
    ? labelFor(selected.value[0]!)
    : `${props.label} (${selected.value.length})`
})
</script>

<template>
  <USelectMenu
    v-model="selectedIds"
    v-model:search-term="searchTerm"
    :items="items"
    :loading="loading"
    multiple
    ignore-filter
    value-key="id"
    label-key="name"
    :placeholder="triggerLabel"
    :search-input="{ placeholder: `Search ${label?.toLowerCase() ?? dimension}...` }"
    class="min-w-44"
    :ui="{ content: 'w-80' }"
    @update:open="onOpen"
  >
    <template #default>
      <span class="truncate">{{ triggerLabel }}</span>
    </template>

    <template #item-label="{ item }">
      <span class="truncate" :title="item.name">{{ labelFor(item) }}</span>
    </template>

    <template #item-trailing="{ item }">
      <span v-if="'count' in item" class="text-xs text-dimmed tabular-nums ms-auto">
        {{ formatNumber((item as Lookup).count) }}
      </span>
    </template>

    <template #empty>
      <span class="text-sm text-muted">
        {{ loading ? 'Searching...' : 'Nothing matches that search.' }}
      </span>
    </template>

    <!-- Cursor pagination: there is no total, only a next token. -->
    <template #content-bottom>
      <UButton
        v-if="nextCursor"
        :label="loadingMore ? 'Loading...' : 'Load more'"
        color="neutral"
        variant="ghost"
        size="xs"
        block
        :loading="loadingMore"
        @click="fetchPage(nextCursor)"
      />
    </template>
  </USelectMenu>
</template>
