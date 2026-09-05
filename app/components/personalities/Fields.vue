<script setup lang="ts">
import type { PersonalityFormState } from '~/types'

/**
 * The writable fields, shared by the create modal and the edit form so the two
 * cannot drift apart.
 */
const state = defineModel<Partial<PersonalityFormState>>({ required: true })

const genders = GENDER_OPTIONS.filter(option => (option as { value: string }).value !== 'all')
</script>

<template>
  <div class="grid gap-4 sm:grid-cols-2">
    <UFormField label="First name" name="first_name" required>
      <UInput v-model="state.first_name" class="w-full" />
    </UFormField>

    <UFormField label="Last name" name="last_name" required>
      <UInput v-model="state.last_name" class="w-full" />
    </UFormField>

    <UFormField label="Middle name" name="middle_name">
      <UInput v-model="state.middle_name" class="w-full" />
    </UFormField>

    <UFormField label="Middle initial" name="middle_initial">
      <UInput v-model="state.middle_initial" :maxlength="1" class="w-full" />
    </UFormField>

    <UFormField label="Gender" name="gender">
      <USelect v-model="state.gender" :items="genders" class="w-full" />
    </UFormField>

    <UFormField label="Birth year" name="birth_year">
      <UInputNumber
        v-model="state.birth_year"
        :min="1900"
        :max="2100"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Industry ID" name="industry_id">
      <UInputNumber v-model="state.industry_id" :min="1" class="w-full" />
    </UFormField>

    <UFormField label="Years of experience" name="inferred_years_experience">
      <UInputNumber v-model="state.inferred_years_experience" :min="0" class="w-full" />
    </UFormField>

    <UFormField label="Inferred salary" name="inferred_salary" class="sm:col-span-2">
      <UInput v-model="state.inferred_salary" class="w-full" />
    </UFormField>

    <UFormField label="Summary" name="summary" class="sm:col-span-2">
      <UTextarea
        v-model="state.summary"
        :rows="4"
        autoresize
        class="w-full"
      />
    </UFormField>
  </div>
</template>
