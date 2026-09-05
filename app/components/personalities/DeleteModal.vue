<script setup lang="ts">
import type { PersonalityDetail } from '~/types'

const props = defineProps<{ personality: PersonalityDetail }>()
const emit = defineEmits<{ deleted: [] }>()

const open = ref(false)
const toast = useToast()

async function onConfirm() {
  try {
    await $fetch(`/api/personalities/${props.personality.id}`, { method: 'DELETE' })

    toast.add({
      title: 'Profile deleted',
      description: `${props.personality.full_name} has been removed from the index.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    open.value = false
    emit('deleted')
  } catch (error) {
    toast.add({
      title: 'Could not delete the profile',
      description: parseApiError(error).message,
      color: 'error'
    })
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="`Delete ${personality.full_name}`"
    description="The record is soft-deleted: it drops out of search but stays in the database, and re-importing the source row will bring it back."
  >
    <slot />

    <template #body>
      <div class="flex justify-end gap-2">
        <UButton
          label="Cancel"
          color="neutral"
          variant="subtle"
          @click="open = false"
        />
        <UButton
          label="Delete"
          color="error"
          loading-auto
          @click="onConfirm"
        />
      </div>
    </template>
  </UModal>
</template>
