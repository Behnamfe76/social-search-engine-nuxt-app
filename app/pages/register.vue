<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  auth: false,
  guestOnly: true
})

useSeoMeta({
  title: 'Create an account',
  description: 'Create a Social Search Engine account.'
})

const { register } = useAuth()
const toast = useToast()

const form = useTemplateRef('form')
const loading = ref(false)

const fields: AuthFormField[] = [{
  name: 'name',
  type: 'text',
  label: 'Name',
  placeholder: 'Ada Lovelace',
  autocomplete: 'name',
  required: true
}, {
  name: 'email',
  type: 'text',
  label: 'Email',
  placeholder: 'you@example.com',
  autocomplete: 'email',
  required: true
}, {
  name: 'password',
  type: 'password',
  label: 'Password',
  placeholder: 'At least 8 characters',
  autocomplete: 'new-password',
  required: true
}]

const schema = z.object({
  name: z.string().min(1, 'Enter your name'),
  email: z.email('Enter a valid email address'),
  password: z.string().min(8, 'Must be at least 8 characters')
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true

  try {
    await register(event.data)

    toast.add({
      title: 'Welcome aboard',
      description: 'Your account is ready.',
      icon: 'i-lucide-check',
      color: 'success'
    })

    await navigateTo('/')
  } catch (error) {
    const { errors, message } = parseApiError(error, fields.map(field => field.name))

    form.value?.formRef?.setErrors(errors)

    if (!errors.length) {
      toast.add({
        title: 'Could not create your account',
        description: message,
        icon: 'i-lucide-circle-alert',
        color: 'error'
      })
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <UAuthForm
    ref="form"
    :fields="fields"
    :schema="schema"
    :loading="loading"
    title="Create an account"
    description="Sign up to search profiles and run imports."
    icon="i-lucide-user-plus"
    :submit="{ label: 'Create account' }"
    @submit="onSubmit"
  >
    <template #footer>
      <p class="text-sm text-muted">
        Already have an account?
        <ULink to="/login" class="font-medium text-primary">
          Sign in
        </ULink>.
      </p>
    </template>
  </UAuthForm>
</template>
