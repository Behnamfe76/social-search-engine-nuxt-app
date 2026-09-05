<template>
  <div class="min-h-svh flex flex-col items-center justify-center gap-6 bg-elevated/25 p-4">
    <NuxtLink to="/" class="flex items-center gap-2 text-lg font-bold text-highlighted">
      <UIcon name="i-lucide-radar" class="size-6 shrink-0 text-primary" />
      Social Search Engine
    </NuxtLink>

    <UPageCard class="w-full max-w-sm" variant="subtle">
      <slot />
    </UPageCard>
  </div>
</template>
