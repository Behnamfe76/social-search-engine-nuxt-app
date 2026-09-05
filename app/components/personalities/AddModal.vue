<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { PersonalityDetail, PersonalityFormState } from '~/types'

const emit = defineEmits<{ created: [personality: PersonalityDetail] }>()

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required')
})

type Schema = z.output<typeof schema>

const open = ref(false)
const loading = ref(false)
const form = useTemplateRef('form')
const toast = useToast()

const state = ref<Partial<PersonalityFormState>>({ gender: 'unknown' })

function reset() {
  state.value = { gender: 'unknown' }
}

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  loading.value = true

  try {
    const personality = await $fetch<PersonalityDetail>('/api/personalities', {
      method: 'POST',
      body: cleanInput(state.value)
    })

    toast.add({
      title: 'Profile created',
      description: `${personality.full_name} has been added.`,
      icon: 'i-lucide-check',
      color: 'success'
    })

    open.value = false
    reset()
    emit('created', personality)
  } catch (error) {
    const { errors, message } = parseApiError(error, PERSONALITY_FIELDS)

    form.value?.setErrors(errors)

    if (!errors.length) {
      toast.add({ title: 'Could not create the profile', description: message, color: 'error' })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="New profile"
    description="Add a person to the search index."
  >
    <UButton label="New profile" icon="i-lucide-plus" />

    <template #body>
      <UForm
        ref="form"
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <PersonalitiesFields v-model="state" />

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="subtle"
            @click="open = false"
          />
          <UButton
            label="Create"
            type="submit"
            :loading="loading"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>
