<script setup lang="ts">
import * as z from 'zod'
import type { FormSubmitEvent } from '@nuxt/ui'
import type { LookupRef, PersonalityDetail, PersonalityFormState } from '~/types'

const route = useRoute()
const toast = useToast()

const id = computed(() => route.params.id as string)

const { data: personality, error, refresh } = await useFetch<PersonalityDetail>(
  () => `/api/personalities/${id.value}`
)

if (error.value) {
  throw createError({
    statusCode: error.value.statusCode ?? 500,
    statusMessage: error.value.statusCode === 404 ? 'Profile not found' : 'Could not load the profile',
    fatal: true
  })
}

useSeoMeta({
  title: () => personality.value?.full_name || 'Profile'
})

const schema = z.object({
  first_name: z.string().min(1, 'Required'),
  last_name: z.string().min(1, 'Required')
})

type Schema = z.output<typeof schema>

const form = useTemplateRef('form')
const loading = ref(false)

/** The writable subset, re-seeded whenever the record reloads. */
const state = ref<Partial<PersonalityFormState>>({})

watchEffect(() => {
  const record = personality.value
  if (!record) {
    return
  }

  state.value = {
    first_name: record.first_name,
    last_name: record.last_name,
    middle_name: record.middle_name ?? undefined,
    middle_initial: record.middle_initial ?? undefined,
    gender: record.gender,
    birth_year: record.birth_year ?? undefined,
    industry_id: record.industry_id ?? undefined,
    summary: record.summary ?? undefined,
    inferred_salary: record.inferred_salary ?? undefined,
    inferred_years_experience: record.inferred_years_experience ?? undefined
  }
})

async function onSubmit(_event: FormSubmitEvent<Schema>) {
  loading.value = true

  try {
    // PATCH rather than PUT: only the fields this form owns are sent, so the
    // ones it does not render keep their imported values.
    personality.value = await $fetch<PersonalityDetail>(`/api/personalities/${id.value}`, {
      method: 'PATCH',
      body: cleanInput(state.value)
    })

    toast.add({
      title: 'Profile updated',
      icon: 'i-lucide-check',
      color: 'success'
    })
  } catch (requestError) {
    const { errors, message } = parseApiError(requestError, PERSONALITY_FIELDS)

    form.value?.setErrors(errors)

    if (!errors.length) {
      toast.add({ title: 'Could not save the profile', description: message, color: 'error' })
    }
  } finally {
    loading.value = false
  }
}

/**
 * The lookup dimensions, each chip linking back to the search filtered by it —
 * the ids come back alongside the names precisely so this round-trips.
 */
const DIMENSION_SECTIONS = [
  { key: 'skills', label: 'Skills', param: 'skill_id', icon: 'i-lucide-wrench' },
  { key: 'companies', label: 'Companies', param: 'company_id', icon: 'i-lucide-building-2' },
  { key: 'occupation_roles', label: 'Roles', param: 'occupation_role_id', icon: 'i-lucide-briefcase' },
  { key: 'occupation_levels', label: 'Seniority', param: 'occupation_level_id', icon: 'i-lucide-trending-up' },
  { key: 'languages', label: 'Languages', param: 'language_id', icon: 'i-lucide-languages' },
  { key: 'certifications', label: 'Certifications', param: 'certification_id', icon: 'i-lucide-award' },
  { key: 'interests', label: 'Interests', param: 'interest_id', icon: 'i-lucide-heart' }
] as const

const dimensions = computed(() => personality.value
  ? DIMENSION_SECTIONS.map(section => ({
      ...section,
      items: (personality.value?.[section.key] ?? []) as LookupRef[]
    })).filter(section => section.items.length)
  : [])

const facts = computed(() => personality.value
  ? [
      { label: 'Profile ID', value: `#${personality.value.id}` },
      { label: 'Industry', value: personality.value.industry ? humanise(personality.value.industry) : '—' },
      { label: 'Import batch', value: personality.value.import_batch_id ? `#${personality.value.import_batch_id}` : '—' },
      { label: 'Birth date', value: personality.value.birth_date || '—' },
      { label: 'Location updated', value: personality.value.location_last_updated || '—' },
      { label: 'Added', value: formatDateTime(personality.value.created_at) },
      { label: 'Last updated', value: formatDateTime(personality.value.updated_at) }
    ]
  : [])
</script>

<template>
  <UDashboardPanel v-if="personality" id="personality">
    <template #header>
      <UDashboardNavbar :title="personality.full_name || 'Profile'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            to="/personalities"
          />
        </template>

        <template #trailing>
          <UBadge
            v-if="personality.deleted_at"
            color="error"
            variant="subtle"
            label="Deleted"
          />
        </template>

        <template #right>
          <PersonalitiesDeleteModal
            :personality="personality"
            @deleted="navigateTo('/personalities')"
          >
            <UButton
              label="Delete"
              color="error"
              variant="subtle"
              icon="i-lucide-trash"
            />
          </PersonalitiesDeleteModal>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid gap-4 lg:grid-cols-3">
        <UPageCard
          title="Details"
          description="Everything the importer recorded for this person."
          variant="subtle"
          class="lg:col-span-1 h-fit"
        >
          <dl class="flex flex-col gap-3 text-sm">
            <div
              v-for="fact in facts"
              :key="fact.label"
              class="flex items-center justify-between gap-4"
            >
              <dt class="text-muted">
                {{ fact.label }}
              </dt>
              <dd class="font-medium text-highlighted text-right">
                {{ fact.value }}
              </dd>
            </div>
          </dl>

          <template #footer>
            <UButton
              v-if="personality.import_batch_id"
              :to="`/imports/${personality.import_batch_id}`"
              label="View the import it came from"
              color="neutral"
              variant="subtle"
              icon="i-lucide-file-up"
              block
            />
          </template>
        </UPageCard>

        <div class="lg:col-span-2 flex flex-col gap-4">
          <UPageCard
            v-if="dimensions.length"
            title="Attributes"
            description="Everything this profile is indexed under. Select one to search for it."
            variant="subtle"
          >
            <div class="flex flex-col gap-4">
              <div v-for="section in dimensions" :key="section.key">
                <p class="text-xs text-muted uppercase tracking-wide flex items-center gap-1.5 mb-2">
                  <UIcon :name="section.icon" class="size-3.5" />
                  {{ section.label }}
                  <span class="text-dimmed normal-case tracking-normal">({{ section.items.length }})</span>
                </p>

                <div class="flex flex-wrap gap-1.5">
                  <UBadge
                    v-for="item in section.items"
                    :key="item.id"
                    :to="`/personalities?${section.param}=${item.id}`"
                    color="neutral"
                    variant="subtle"
                    class="max-w-64 hover:text-primary"
                    :title="item.name"
                  >
                    <span class="truncate">{{ humanise(item.name) }}</span>
                  </UBadge>
                </div>
              </div>
            </div>
          </UPageCard>

          <UForm
            ref="form"
            :schema="schema"
            :state="state"
            @submit="onSubmit"
          >
            <UPageCard
              title="Edit profile"
              description="Changes are saved straight to the search index."
              variant="subtle"
            >
              <PersonalitiesFields v-model="state" />

              <template #footer>
                <div class="flex justify-end gap-2">
                  <UButton
                    label="Reset"
                    color="neutral"
                    variant="subtle"
                    @click="refresh()"
                  />
                  <UButton
                    label="Save changes"
                    type="submit"
                    :loading="loading"
                  />
                </div>
              </template>
            </UPageCard>
          </UForm>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
