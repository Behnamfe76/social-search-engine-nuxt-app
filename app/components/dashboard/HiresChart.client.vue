<script setup lang="ts">
import { VisXYContainer, VisLine, VisAxis, VisArea, VisCrosshair, VisTooltip } from '@unovis/vue'
import type { DashboardStats } from '~/types'

const props = defineProps<{
  hires: DashboardStats['hires_by_year']
}>()

type Point = { year: number, count: number }

const cardRef = useTemplateRef<HTMLElement | null>('cardRef')
const { width } = useElementSize(cardRef)

// Sparse early years would otherwise stretch the axis over decades holding one
// or two hires each, flattening the part anyone reads.
const FROM_YEAR = 1990

const data = computed<Point[]>(() => props.hires.filter(point => point.year >= FROM_YEAR))

const x = (_: Point, i: number) => i
const y = (d: Point) => d.count

const peak = computed(() => data.value.reduce<Point | null>(
  (best, point) => !best || point.count > best.count ? point : best,
  null
))

const total = computed(() => data.value.reduce((sum, point) => sum + point.count, 0))
const dropped = computed(() => props.hires.length - data.value.length)

// Unovis picks its own tick positions, which land between data indices and
// render blank. Name the indices to label instead.
const tickValues = computed(() => data.value
  .map((point, index) => ({ point, index }))
  .filter(({ point, index }) => point.year % 5 === 0 || index === data.value.length - 1)
  .map(({ index }) => index))

const xTicks = (i: number) => {
  const point = data.value[Math.round(i)]

  return point ? String(point.year) : ''
}

const template = (d: Point) => `${d.year}: ${formatNumber(d.count)} started`
</script>

<template>
  <div ref="cardRef" class="flex flex-col gap-2">
    <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
      <p class="text-sm text-muted">
        {{ formatNumber(total) }} employment starts since {{ FROM_YEAR }}
        <span v-if="peak" class="text-dimmed">
          &middot; busiest year {{ peak.year }} ({{ peak.count }})
        </span>
      </p>
      <p v-if="dropped > 0" class="text-xs text-dimmed">
        {{ dropped }} earlier year{{ dropped === 1 ? '' : 's' }} hidden
      </p>
    </div>

    <VisXYContainer
      :data="data"
      :padding="{ top: 12 }"
      :margin="{ left: -5, right: -5 }"
      class="h-64"
      :width="width"
    >
      <VisArea
        :x="x"
        :y="y"
        color="var(--viz-mark)"
        :opacity="0.12"
      />
      <VisLine
        :x="x"
        :y="y"
        color="var(--viz-mark)"
        :line-width="2"
      />

      <VisAxis
        type="x"
        :x="x"
        :tick-values="tickValues"
        :tick-format="xTicks"
      />

      <VisCrosshair color="var(--viz-mark)" :template="template" />
      <VisTooltip />
    </VisXYContainer>
  </div>
</template>

<style scoped>
.unovis-xy-container {
  --vis-crosshair-line-stroke-color: var(--viz-mark);
  --vis-crosshair-circle-stroke-color: var(--ui-bg);

  --vis-axis-grid-color: var(--ui-border);
  --vis-axis-tick-color: var(--ui-border);
  --vis-axis-tick-label-color: var(--ui-text-dimmed);

  --vis-tooltip-background-color: var(--ui-bg);
  --vis-tooltip-border-color: var(--ui-border);
  --vis-tooltip-text-color: var(--ui-text-highlighted);
}
</style>
