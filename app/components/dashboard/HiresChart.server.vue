<script setup lang="ts">
import type { DashboardStats } from '~/types'

// Unovis is client-only. This placeholder reserves the same height so the card
// does not jump when the real chart mounts.
defineProps<{
  hires: DashboardStats['hires_by_year']
}>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <p class="text-sm text-muted">
      {{ hires.length }} years of employment history
    </p>
    <div class="h-64" />
  </div>
</template>
