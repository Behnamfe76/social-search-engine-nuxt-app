<script setup lang="ts">
import type { DashboardStats } from '~/types'

const props = defineProps<{
  platforms: DashboardStats['social_platforms']
}>()

// Two series of the same unit on one scale — never a second axis.
const scale = computed(() => Math.max(...props.platforms.flatMap(p => [p.profiles, p.people]), 1))

function width(value: number): string {
  return `${Math.max((value / scale.value) * 100, value > 0 ? 1.5 : 0)}%`
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <!-- A legend is always present for two or more series. -->
    <div class="flex items-center gap-4 text-xs text-muted">
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-full" :style="{ backgroundColor: 'var(--viz-series-1)' }" />
        Profiles
      </span>
      <span class="flex items-center gap-1.5">
        <span class="size-2.5 rounded-full" :style="{ backgroundColor: 'var(--viz-series-2)' }" />
        People
      </span>
      <span class="ms-auto text-dimmed">More profiles than people means duplicates</span>
    </div>

    <div class="flex flex-col gap-3">
      <div v-for="platform in platforms" :key="platform.name" class="flex flex-col gap-1">
        <div class="flex items-center justify-between gap-3">
          <span class="text-sm text-highlighted capitalize">{{ platform.name }}</span>
          <span class="text-sm text-muted tabular-nums">
            {{ formatNumber(platform.profiles) }} / {{ formatNumber(platform.people) }}
          </span>
        </div>

        <!-- 2px surface gap between the paired bars, no borders. -->
        <div class="flex flex-col gap-0.5">
          <div class="h-1.5 rounded-full bg-accented/40 overflow-hidden">
            <div
              class="h-full rounded-full"
              :style="{ width: width(platform.profiles), backgroundColor: 'var(--viz-series-1)' }"
            />
          </div>
          <div class="h-1.5 rounded-full bg-accented/40 overflow-hidden">
            <div
              class="h-full rounded-full"
              :style="{ width: width(platform.people), backgroundColor: 'var(--viz-series-2)' }"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
