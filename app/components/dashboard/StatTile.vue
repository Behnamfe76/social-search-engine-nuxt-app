<script setup lang="ts">
defineProps<{
  label: string
  value: number
  icon?: string
  hint?: string
}>()
</script>

<template>
  <div class="flex flex-col gap-1 p-4 rounded-lg border border-default bg-elevated/25">
    <span class="text-xs text-muted uppercase tracking-wide flex items-center gap-1.5">
      <UIcon v-if="icon" :name="icon" class="size-3.5 shrink-0" />
      {{ label }}
    </span>

    <!-- Proportional figures: tabular-nums makes standalone numbers look loose. -->
    <span class="text-2xl font-semibold text-highlighted">{{ formatNumber(value) }}</span>

    <span v-if="hint" class="text-xs text-muted">{{ hint }}</span>
  </div>
</template>
