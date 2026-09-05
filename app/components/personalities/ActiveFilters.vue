<script setup lang="ts">
import type { ActiveFilter } from '~/types'

const props = defineProps<{
  filters: ActiveFilter[]
  /** Total matches, so the summary can say what the filters actually did. */
  count?: number
}>()

const emit = defineEmits<{
  clear: [key: string]
  clearAll: []
}>()

// Opens itself the first time a filter is applied, but a deliberate collapse
// survives further changes.
const open = ref(true)

watch(() => props.filters.length, (length, previous) => {
  if (length && !previous) {
    open.value = true
  }
})
</script>

<template>
  <UCollapsible
    v-if="filters.length"
    v-model:open="open"
    class="border border-default rounded-lg bg-elevated/25"
  >
    <div class="flex items-center justify-between gap-2 p-2 ps-3">
      <UButton
        color="neutral"
        variant="ghost"
        size="sm"
        class="-ms-1.5"
        :icon="open ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
        :label="`${filters.length} active filter${filters.length === 1 ? '' : 's'}`"
      />

      <div class="flex items-center gap-2">
        <span v-if="count !== undefined" class="text-sm text-muted">
          {{ formatNumber(count) }} match{{ count === 1 ? '' : 'es' }}
        </span>

        <UButton
          label="Clear all"
          color="neutral"
          variant="subtle"
          size="xs"
          icon="i-lucide-filter-x"
          @click="emit('clearAll')"
        />
      </div>
    </div>

    <template #content>
      <div class="flex flex-wrap gap-1.5 p-3 pt-0">
        <UBadge
          v-for="filter in filters"
          :key="filter.key"
          color="neutral"
          variant="subtle"
          size="lg"
          :ui="{ base: 'gap-1.5 pe-1' }"
        >
          <span class="text-muted">{{ filter.label }}:</span>
          <span class="font-medium text-highlighted">{{ filter.value }}</span>

          <UButton
            icon="i-lucide-x"
            color="neutral"
            variant="ghost"
            size="xs"
            :aria-label="`Clear ${filter.label} filter`"
            @click="emit('clear', filter.key)"
          />
        </UBadge>
      </div>
    </template>
  </UCollapsible>
</template>
