<script setup lang="ts">
import type { BarItem } from '~/types'

const props = withDefaults(defineProps<{
  items: BarItem[]
  /** Shown after each value, e.g. "people". */
  unit?: string
  /** Scale bars against this instead of the largest value. */
  max?: number
  /** Also show each value as a share of the scale. */
  percent?: boolean
  emptyLabel?: string
}>(), {
  emptyLabel: 'No data'
})

// One series, one color, scaled against the largest bar — never a value-ramp,
// which would double-encode the magnitude the bar length already carries.
const scale = computed(() => props.max ?? Math.max(...props.items.map(item => item.value), 1))

function width(value: number): string {
  return `${Math.max((value / scale.value) * 100, value > 0 ? 1.5 : 0)}%`
}

/** Built in script so the number and its unit cannot lose their space. */
function valueLabel(item: BarItem): string {
  return props.unit ? `${formatNumber(item.value)} ${props.unit}` : formatNumber(item.value)
}

function asideLabel(item: BarItem): string | undefined {
  if (item.hint) {
    return item.hint
  }

  return props.percent ? `${((item.value / scale.value) * 100).toFixed(0)}%` : undefined
}
</script>

<template>
  <div v-if="!items.length" class="text-sm text-muted py-6 text-center">
    {{ emptyLabel }}
  </div>

  <div v-else class="flex flex-col gap-2.5">
    <div
      v-for="item in items"
      :key="item.name"
      class="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3 gap-y-1.5"
    >
      <span class="text-sm text-highlighted truncate" :title="item.name">{{ item.name }}</span>

      <!-- Direct label: every value is readable without hovering anything. -->
      <span class="text-sm text-muted tabular-nums whitespace-nowrap">
        {{ valueLabel(item) }}
        <span v-if="asideLabel(item)" class="text-dimmed">{{ asideLabel(item) }}</span>
      </span>

      <div class="col-span-2 h-1.5 rounded-full bg-accented/40 overflow-hidden">
        <div
          class="h-full rounded-full"
          :style="{ width: width(item.value), backgroundColor: 'var(--viz-mark)' }"
        />
      </div>
    </div>
  </div>
</template>
