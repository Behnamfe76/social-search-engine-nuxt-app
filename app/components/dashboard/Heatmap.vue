<script setup lang="ts">
import type { DashboardStats } from '~/types'

const props = defineProps<{
  cells: DashboardStats['seniority_by_role']
  /** Cap the grid so it stays readable; the tail folds away rather than shrinking. */
  maxRoles?: number
}>()

function totalsBy(key: 'role' | 'level'): string[] {
  const totals = new Map<string, number>()

  for (const cell of props.cells) {
    totals.set(cell[key], (totals.get(cell[key]) ?? 0) + cell.count)
  }

  return [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
}

const roles = computed(() => totalsBy('role').slice(0, props.maxRoles ?? 8))
const levels = computed(() => totalsBy('level'))

const lookup = computed(() => {
  const map = new Map<string, number>()

  for (const cell of props.cells) {
    map.set(`${cell.role}|${cell.level}`, cell.count)
  }

  return map
})

const max = computed(() => Math.max(...props.cells.map(cell => cell.count), 1))

function countFor(role: string, level: string): number {
  return lookup.value.get(`${role}|${level}`) ?? 0
}

/**
 * Sequential encoding: one hue, mixed toward the surface by magnitude. The low
 * end is allowed to recede into the surface because this is a continuous scale,
 * not an ordinal ramp.
 */
function intensity(count: number): number {
  return 12 + (count / max.value) * 88
}

function cellStyle(count: number) {
  return count
    ? { backgroundColor: `color-mix(in oklab, var(--viz-mark) ${intensity(count)}%, transparent)` }
    : { backgroundColor: 'transparent' }
}

const legendStops = [0.15, 0.35, 0.6, 0.8, 1]

/** The taxonomy stores snake_case slugs; show them the way people read them. */
function humanise(value: string): string {
  return value.replace(/_/g, ' ')
}
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="overflow-x-auto">
      <table class="w-full border-separate border-spacing-0.5 text-sm">
        <thead>
          <tr>
            <th class="text-left font-normal text-muted text-xs p-1">
              Role
            </th>
            <th
              v-for="level in levels"
              :key="level"
              class="font-normal text-muted text-xs p-1 capitalize whitespace-nowrap"
            >
              {{ humanise(level) }}
            </th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="role in roles" :key="role">
            <td class="text-highlighted text-xs p-1 pe-3 whitespace-nowrap">
              {{ humanise(role) }}
            </td>
            <td
              v-for="level in levels"
              :key="level"
              class="text-center rounded-sm p-1.5 tabular-nums"
              :style="cellStyle(countFor(role, level))"
              :title="`${humanise(role)} / ${humanise(level)}: ${countFor(role, level)}`"
            >
              <!-- The number is always rendered, so the scale is never colour-only. -->
              <span :class="countFor(role, level) ? 'text-highlighted' : 'text-dimmed'">
                {{ countFor(role, level) || '&mdash;' }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="flex flex-wrap items-center gap-2 text-xs text-muted">
      <span>Fewer</span>
      <span
        v-for="stop in legendStops"
        :key="stop"
        class="size-3 rounded-sm"
        :style="{ backgroundColor: `color-mix(in oklab, var(--viz-mark) ${12 + stop * 88}%, transparent)` }"
      />
      <span>More</span>
      <span class="ms-auto">Top {{ roles.length }} roles by headcount</span>
    </div>
  </div>
</template>
