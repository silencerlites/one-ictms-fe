<template>
  <q-page padding class="workspace-page account-page">
    <div class="text-h4 page-title q-mb-md">My account</div>

    <q-card flat class="workspace-card q-pa-md">
      <q-list separator>
        <q-item>
          <q-item-section>
            <q-item-label caption>Username</q-item-label>
            <q-item-label>{{ auth.user?.username || '—' }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Email</q-item-label>
            <q-item-label>{{ auth.user?.email || '—' }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Name</q-item-label>
            <q-item-label>{{ fullName }}</q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Position</q-item-label>
            <q-item-label>
              <q-skeleton v-if="isInitiallyLoading('positions')" type="text" width="180px" />
              <template v-else>{{ labelFor('positions', auth.user?.details?.position_id) }}</template>
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Department</q-item-label>
            <q-item-label>
              <q-skeleton v-if="isInitiallyLoading('departments')" type="text" width="220px" />
              <template v-else>{{ labelFor('departments', auth.user?.details?.department_id) }}</template>
            </q-item-label>
          </q-item-section>
        </q-item>
        <q-item>
          <q-item-section>
            <q-item-label caption>Division</q-item-label>
            <q-item-label>
              <q-skeleton v-if="isInitiallyLoading('divisions')" type="text" width="220px" />
              <template v-else>{{ labelFor('divisions', auth.user?.details?.division_id) }}</template>
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

      <q-banner v-if="loadError" rounded class="bg-orange-1 text-orange-10 q-mt-md">
        Some organization details couldn't be loaded. {{ loadError }}
        <template #action>
          <q-btn flat dense label="Retry" color="primary" :loading="loading" @click="loadLibrary" />
        </template>
      </q-banner>
    </q-card>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLibraryStore } from '@/stores/library'

const auth = useAuthStore()
const library = useLibraryStore()
const loading = computed(() => library.loading)
const isInitiallyLoading = (kind: 'departments' | 'divisions' | 'positions') =>
  library.pending[kind] && !library.updatedAt[kind]
const loadError = computed(() => library.loadError)

const fullName = computed(() =>
  [auth.user?.details?.first_name, auth.user?.details?.middle_name,
    auth.user?.details?.last_name, auth.user?.details?.ext_name]
    .filter(Boolean).join(' ') || '—'
)

function labelFor(kind: 'departments' | 'divisions' | 'positions', id: number | null | undefined): string {
  return library.labelFor(kind, id)
}

async function loadLibrary(): Promise<void> {
  try {
    // Retry any failed lookups, reuse recent successful cached lookups.
    await library.loadAll()
  } catch {
    // Per-request errors are available via library.loadError.
  }
}

onMounted(() => { void loadLibrary() })
</script>
