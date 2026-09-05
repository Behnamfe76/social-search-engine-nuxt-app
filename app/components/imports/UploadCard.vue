<script setup lang="ts">
import type { ImportBatch } from '~/types'

const emit = defineEmits<{ uploaded: [batch: ImportBatch] }>()

const toast = useToast()

const file = ref<File | null>(null)
const source = ref('people-data-labs')
const uploading = ref(false)

async function onUpload() {
  if (!file.value) {
    return
  }

  uploading.value = true

  const body = new FormData()
  body.append('file', file.value)
  body.append('source', source.value)

  try {
    // 202 comes back immediately — nothing is parsed in the request, so this
    // returns as soon as the upload is stored and the planner is queued.
    const batch = await $fetch<ImportBatch>('/api/imports', { method: 'POST', body })

    toast.add({
      title: 'Import queued',
      description: `${batch.filename} is being planned. Progress will appear below.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    file.value = null
    emit('uploaded', batch)
  } catch (error) {
    toast.add({
      title: 'Upload failed',
      description: parseApiError(error, ['file', 'source']).message,
      icon: 'i-lucide-circle-alert',
      color: 'error'
    })
  } finally {
    uploading.value = false
  }
}
</script>

<template>
  <UPageCard
    title="Import a dataset"
    description="The upload is stored and queued straight away — parsing happens on the workers, not in this request."
    variant="subtle"
  >
    <div class="flex flex-col gap-4">
      <UFileUpload
        v-model="file"
        accept=".csv,text/csv"
        icon="i-lucide-file-spreadsheet"
        label="Drop a CSV export here"
        description="Re-uploading the same file updates the existing profiles rather than duplicating them."
        class="w-full min-h-40"
      />

      <div class="flex flex-wrap items-end justify-between gap-3">
        <UFormField label="Source" help="Recorded on the batch for provenance.">
          <UInput v-model="source" class="w-56" />
        </UFormField>

        <UButton
          label="Start import"
          icon="i-lucide-upload"
          :disabled="!file"
          :loading="uploading"
          @click="onUpload"
        />
      </div>
    </div>
  </UPageCard>
</template>
