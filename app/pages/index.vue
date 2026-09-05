<script setup lang="ts">
import type { BarItem, DashboardStats, NamedCount } from '~/types'

useSeoMeta({
  title: 'Dashboard',
  description: 'What the Social Search Engine holds, and how it got there.'
})

const { data, status, error, refresh } = await useFetch<DashboardStats>('/api/dashboard')

function toBars(items: NamedCount[]): BarItem[] {
  return items.map(item => ({ name: humanise(item.name), value: item.count }))
}

/** The headline row. Keyed off `totals`, which the API may grow over time. */
const TILES: { key: string, label: string, icon: string }[] = [
  { key: 'personalities', label: 'Profiles', icon: 'i-lucide-users' },
  { key: 'employments', label: 'Employments', icon: 'i-lucide-briefcase' },
  { key: 'companies', label: 'Companies', icon: 'i-lucide-building-2' },
  { key: 'skills', label: 'Distinct skills', icon: 'i-lucide-wrench' },
  { key: 'social_profiles', label: 'Social profiles', icon: 'i-lucide-at-sign' },
  { key: 'import_batches', label: 'Import batches', icon: 'i-lucide-file-up' }
]

const tiles = computed(() => TILES
  .filter(tile => data.value?.totals?.[tile.key] !== undefined)
  .map(tile => ({ ...tile, value: data.value!.totals[tile.key]! })))

/** Skills, interests, languages and certifications share one shape and one card. */
const attributeTabs = computed(() => data.value
  ? [
      { label: 'Skills', slot: 'panel' as const, value: 'skills', items: toBars(data.value.top_skills) },
      { label: 'Interests', slot: 'panel' as const, value: 'interests', items: toBars(data.value.top_interests) },
      { label: 'Languages', slot: 'panel' as const, value: 'languages', items: toBars(data.value.top_languages) },
      { label: 'Certifications', slot: 'panel' as const, value: 'certifications', items: toBars(data.value.top_certifications) }
    ]
  : [])

const genderBars = computed<BarItem[]>(() => (data.value?.gender ?? []).map(item => ({
  name: genderLabel(item.name as never),
  value: item.count
})))

const employmentsPerPerson = computed<BarItem[]>(() => (data.value?.employments_per_person ?? []).map(row => ({
  name: row.employments === 1 ? '1 employment' : `${row.employments} employments`,
  value: row.people
})))

const platformReach = computed<BarItem[]>(() => (data.value?.platform_reach ?? []).map(row => ({
  name: row.platforms === 1 ? 'On 1 platform' : `On ${row.platforms} platforms`,
  value: row.people
})))

const coverageBars = computed<BarItem[]>(() => (data.value?.coverage ?? [])
  .slice()
  .sort((a, b) => b.percent - a.percent)
  .map(field => ({
    name: humanise(field.name),
    value: field.filled,
    hint: `${field.percent}%`
  })))

const coverageTotal = computed(() => data.value?.coverage?.[0]?.total ?? 0)

const employment = computed(() => {
  const rows = data.value?.employment_status ?? []

  return {
    current: rows.find(row => row.name === 'current')?.count ?? 0,
    past: rows.find(row => row.name === 'past')?.count ?? 0
  }
})

const hiresView = ref<'chart' | 'table'>('chart')

const recentHires = computed(() => (data.value?.hires_by_year ?? []).slice().reverse())
</script>

<template>
  <UDashboardPanel id="home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            label="Refresh"
            color="neutral"
            variant="outline"
            icon="i-lucide-refresh-cw"
            :loading="status === 'pending'"
            @click="refresh()"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UAlert
        v-if="error"
        color="error"
        variant="subtle"
        icon="i-lucide-circle-alert"
        title="Could not load the dashboard"
        :description="parseApiError(error).message"
        :actions="[{ label: 'Retry', color: 'error', variant: 'outline', onClick: () => refresh() }]"
      />

      <template v-if="data">
        <!-- KPI row: headline numbers are tiles, not a chart. -->
        <div class="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
          <DashboardStatTile
            v-for="tile in tiles"
            :key="tile.key"
            :label="tile.label"
            :value="tile.value"
            :icon="tile.icon"
          />
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <UPageCard
            title="Employment starts by year"
            description="When the people in the index began the jobs on their profiles."
            variant="subtle"
            class="lg:col-span-2"
          >
            <template #footer>
              <div class="flex items-center justify-between gap-3">
                <UFieldGroup size="xs">
                  <UButton
                    label="Chart"
                    :color="hiresView === 'chart' ? 'primary' : 'neutral'"
                    :variant="hiresView === 'chart' ? 'solid' : 'outline'"
                    @click="hiresView = 'chart'"
                  />
                  <UButton
                    label="Table"
                    :color="hiresView === 'table' ? 'primary' : 'neutral'"
                    :variant="hiresView === 'table' ? 'solid' : 'outline'"
                    @click="hiresView = 'table'"
                  />
                </UFieldGroup>
                <span class="text-xs text-dimmed">Every value is also in the table view</span>
              </div>
            </template>

            <DashboardHiresChart v-if="hiresView === 'chart'" :hires="data.hires_by_year" />

            <div v-else class="max-h-72 overflow-y-auto">
              <table class="w-full text-sm">
                <thead class="text-xs text-muted">
                  <tr>
                    <th class="text-left font-normal py-1">
                      Year
                    </th>
                    <th class="text-right font-normal py-1">
                      Starts
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in recentHires" :key="row.year" class="border-t border-default">
                    <td class="py-1 text-highlighted tabular-nums">
                      {{ row.year }}
                    </td>
                    <td class="py-1 text-right text-muted tabular-nums">
                      {{ formatNumber(row.count) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </UPageCard>

          <UPageCard
            title="Tenure"
            :description="`Across ${formatNumber(data.tenure.sample_size)} employments with both dates.`"
            variant="subtle"
          >
            <div class="flex flex-col gap-4">
              <div class="grid grid-cols-2 gap-3">
                <DashboardStatTile label="Mean" :value="data.tenure.mean_years" hint="years" />
                <DashboardStatTile label="Median" :value="data.tenure.median_years" hint="years" />
              </div>

              <DashboardBarList :items="toBars(data.tenure.buckets)" unit="jobs" />
            </div>
          </UPageCard>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <UPageCard
            title="Most common attributes"
            description="The top ten values the importer extracted for each attribute."
            variant="subtle"
          >
            <UTabs
              :items="attributeTabs"
              :default-value="attributeTabs[0]?.value"
              variant="link"
              class="w-full"
            >
              <template #panel="{ item }">
                <DashboardBarList :items="(item as { items: BarItem[] }).items" unit="people" class="pt-2" />
              </template>
            </UTabs>
          </UPageCard>

          <UPageCard
            title="Top employers"
            description="Companies appearing most often across employment records."
            variant="subtle"
          >
            <DashboardBarList :items="toBars(data.top_companies)" unit="people" />
          </UPageCard>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <UPageCard
            title="Occupation roles"
            description="The top level of the occupation taxonomy."
            variant="subtle"
          >
            <DashboardBarList :items="toBars(data.occupation_roles)" unit="people" />
          </UPageCard>

          <UPageCard
            title="Seniority"
            description="Levels inferred from job titles."
            variant="subtle"
          >
            <DashboardBarList :items="toBars(data.seniority_levels)" unit="people" />
          </UPageCard>
        </div>

        <UPageCard
          title="Seniority by role"
          description="Where the levels sit across the busiest roles."
          variant="subtle"
        >
          <DashboardHeatmap :cells="data.seniority_by_role" />
        </UPageCard>

        <div class="grid gap-4 lg:grid-cols-2">
          <UPageCard
            title="Employer size"
            description="How large the companies in the index are."
            variant="subtle"
          >
            <DashboardBarList :items="toBars(data.company_sizes)" unit="companies" />
          </UPageCard>

          <UPageCard
            title="Employments per person"
            :description="`${formatNumber(employment.current)} current and ${formatNumber(employment.past)} past roles.`"
            variant="subtle"
          >
            <div class="max-h-80 overflow-y-auto pe-1">
              <DashboardBarList :items="employmentsPerPerson" unit="people" />
            </div>
          </UPageCard>
        </div>

        <div class="grid gap-4 lg:grid-cols-2">
          <UPageCard
            title="Social platforms"
            description="Profiles held per platform, and how many people they belong to."
            variant="subtle"
          >
            <div class="flex flex-col gap-6">
              <DashboardPlatformChart :platforms="data.social_platforms" />
              <div>
                <p class="text-sm font-medium text-highlighted mb-3">
                  Platforms per person
                </p>
                <DashboardBarList :items="platformReach" unit="people" />
              </div>
            </div>
          </UPageCard>

          <UPageCard
            title="Field coverage"
            :description="`How much of each field is actually populated across ${formatNumber(coverageTotal)} profiles.`"
            variant="subtle"
          >
            <div class="flex flex-col gap-6">
              <DashboardBarList
                :items="coverageBars"
                :max="coverageTotal"
                percent
                unit="filled"
              />

              <div>
                <p class="text-sm font-medium text-highlighted mb-3">
                  Gender
                </p>
                <DashboardBarList :items="genderBars" unit="people" />
              </div>
            </div>
          </UPageCard>
        </div>

        <UPageCard
          title="Ingestion"
          description="What the import pipeline has done across every batch."
          variant="subtle"
        >
          <div class="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <DashboardStatTile
              label="Rows processed"
              :value="data.imports.processed_rows"
              icon="i-lucide-list"
            />
            <DashboardStatTile
              label="Created"
              :value="data.imports.created_rows"
              icon="i-lucide-user-plus"
            />
            <DashboardStatTile
              label="Updated"
              :value="data.imports.updated_rows"
              icon="i-lucide-refresh-cw"
            />
            <DashboardStatTile
              label="Rejected"
              :value="data.imports.failed_rows"
              icon="i-lucide-circle-alert"
            />
          </div>

          <template #footer>
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div class="flex flex-wrap items-center gap-1.5">
                <UBadge
                  v-for="batch in data.imports.batches"
                  :key="batch.name"
                  :color="importStatusColor(batch.name as never)"
                  variant="subtle"
                >
                  {{ batch.count }} {{ importStatusLabel(batch.name as never).toLowerCase() }}
                </UBadge>
              </div>

              <UButton
                to="/imports"
                label="View imports"
                color="neutral"
                variant="subtle"
                icon="i-lucide-file-up"
              />
            </div>
          </template>
        </UPageCard>
      </template>
    </template>
  </UDashboardPanel>
</template>
