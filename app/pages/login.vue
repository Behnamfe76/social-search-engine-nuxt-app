<script setup lang="ts">
import * as z from 'zod'
import type { AuthFormField, FormSubmitEvent } from '@nuxt/ui'

definePageMeta({
  layout: 'auth',
  auth: false,
  guestOnly: true
})

useSeoMeta({
  title: 'Sign in',
  description: 'Sign in to the Social Search Engine.'
})

const { login } = useAuth()
const route = useRoute()
const toast = useToast()

const form = useTemplateRef('form')
const loading = ref(false)

const fields: AuthFormField[] = [{
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
  placeholder: 'Enter your password',
  autocomplete: 'current-password',
  required: true
}]

const schema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password')
})

type Schema = z.output<typeof schema>

async function onSubmit(event: FormSubmitEvent<Schema>) {
  loading.value = true

  try {
    await login(event.data)

    const redirect = route.query.redirect
    await navigateTo(typeof redirect === 'string' && redirect.startsWith('/') ? redirect : '/')
  } catch (error) {
    const { errors, message } = parseApiError(error, fields.map(field => field.name))

    form.value?.formRef?.setErrors(errors)

    if (!errors.length) {
      toast.add({
        title: 'Could not sign you in',
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
    title="Welcome back"
    description="Sign in to search profiles and run imports."
    icon="i-lucide-lock"
    :submit="{ label: 'Sign in' }"
    @submit="onSubmit"
  >
    <template #footer>
      <p class="text-sm text-muted">
        Don't have an account?
        <ULink to="/register" class="font-medium text-primary">
          Create one
        </ULink>.
      </p>
    </template>
  </UAuthForm>
</template>
