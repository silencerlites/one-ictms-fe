<template>
  <q-page class="workspace-page account-page profile-aligned-page">
    <header class="profile-aligned-header">
      <div class="profile-aligned-icon"><q-icon name="account_circle" size="30px" /></div>
      <div>
        <div class="profile-aligned-kicker">ONE ICTMS / MY WORKSPACE</div>
        <h1>My account</h1>
        <p>View your profile and organizational information.</p>
      </div>
    </header>
    <q-card flat bordered class="workspace-card profile-aligned-card q-pa-md">
      <div class="profile-aligned-card-title"><q-icon name="badge" size="20px" /> Account information</div>
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

<style scoped lang="scss">
.profile-aligned-page{padding:28px 32px 44px;background:#f4f7fe;min-height:100%;color:#142c61;max-width:1920px;margin:auto}
.profile-aligned-header{display:flex;align-items:center;gap:18px;padding:23px 26px;margin-bottom:18px;border:1px solid #d7e3fa;border-radius:17px;background:linear-gradient(112deg,#fff 0%,#f3f7ff 55%,#dbe9ff 100%)}
.profile-aligned-icon{display:grid;place-items:center;flex:none;width:52px;height:52px;border:1px solid #dbe5f6;border-radius:13px;background:#fff;color:#1643a0;box-shadow:0 3px 8px #13377113}
.profile-aligned-kicker{letter-spacing:1.4px;font-size:10px;font-weight:800;color:#3154aa}
.profile-aligned-header h1{font-size:29px;font-weight:800;line-height:1.2;letter-spacing:-.7px;margin:5px 0 4px;color:#10295e}
.profile-aligned-header p{color:#627698;font-size:12px;margin:0}
.profile-aligned-card{border-radius:15px;border-color:#dbe5f5;box-shadow:0 3px 12px #153a7409;max-width:1180px;padding:22px!important}
.profile-aligned-card-title{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;color:#15316d;padding:0 0 15px;border-bottom:1px solid #e7edf8}
.profile-aligned-card .q-list .q-item{padding:12px 7px;min-height:60px}
.profile-aligned-card .q-item__label--caption{color:#71809d;font-size:11px;margin-bottom:4px}
.profile-aligned-card .q-item__label:not(.q-item__label--caption){color:#203b72;font-weight:600}
@media(max-width:650px){.profile-aligned-page{padding:16px}.profile-aligned-header{padding:18px 16px;gap:12px}.profile-aligned-header h1{font-size:24px}.profile-aligned-icon{width:44px;height:44px}}
</style>
