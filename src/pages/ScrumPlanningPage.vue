<template>
  <q-page class="delivery-workspace">
    <header class="delivery-heading">
      <div class="delivery-heading__icon"><q-icon name="view_kanban" size="29px" /></div>
      <div class="delivery-heading__copy">
        <div class="delivery-eyebrow">ONE ICTMS / PROJECT DELIVERY</div>
        <h1>Scrum Planning</h1>
        <p>Track each registered system’s delivery progress and continue its workflow.</p>
      </div>
    </header>


    <q-card flat bordered class="delivery-registry">
      <q-card-section class="delivery-toolbar">
        <q-input v-model="search" outlined dense clearable label="Search system name, alias, or description" class="delivery-search">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-btn flat round color="indigo-8" icon="refresh" :loading="loading" aria-label="Reload systems" @click="void loadSystems()"><q-tooltip>Reload systems</q-tooltip></q-btn>
      </q-card-section>
      <q-card-section v-if="error" class="q-pt-none">
        <q-banner rounded class="bg-red-1 text-negative">{{ error }} <q-btn flat label="Retry" color="negative" @click="void loadSystems()" /></q-banner>
      </q-card-section>
      <q-card-section v-if="loading && !systems.length" class="text-center q-py-xl"><q-spinner-dots size="40px" color="indigo-8" /> <div class="q-mt-sm text-grey-7">Loading registered systems…</div></q-card-section>
      <q-card-section v-else-if="!filteredSystems.length" class="delivery-empty">
        <q-icon name="inventory_2" size="40px" color="blue-grey-4" />
        <h3>{{ systems.length ? 'No systems match your search' : 'No registered systems available' }}</h3>
        <p>{{ systems.length ? 'Try a different search term.' : 'Register an information system first to begin project delivery.' }}</p>
        <q-btn v-if="!systems.length" outline no-caps color="indigo-8" to="/system-registry" label="Go to System Registry" />
      </q-card-section>
      <q-card-section v-else class="delivery-grid">
        <article v-for="system in filteredSystems" :key="system.id" class="delivery-system">
          <div class="delivery-system__identity"><q-avatar rounded color="indigo-1" text-color="indigo-9" icon="dns" />
            <div class="delivery-system__identity-copy">
              <h3>{{ system.system_name }}</h3>
              <p v-if="system.description?.trim()" class="delivery-system__description">{{ system.description }}</p>
            </div>
          </div>
          <div class="delivery-system__progress">
            <div class="delivery-system__progress-head">
              <strong>Delivery progress</strong>
              <span>{{ progressFor(system.id)?.overall ?? 0 }}%</span>
            </div>
            <q-linear-progress :value="(progressFor(system.id)?.overall ?? 0) / 100" size="7px" rounded color="indigo-7" track-color="blue-grey-1" />
            <div v-if="progressFor(system.id)" class="delivery-system__milestones">
              <div v-for="item in progressStages(system.id)" :key="item.label" class="delivery-system__milestone">
                <span><q-icon :name="item.icon" size="15px" />{{ item.label }}</span>
                <strong>{{ item.done }}/{{ item.total }}</strong>
              </div>
            </div>
            <p v-else class="delivery-system__not-started">No local progress yet. Open the workflow to begin reviewing tasks.</p>
          </div>
          <div class="delivery-system__bottom">
            <span><q-icon name="groups" /> {{ system.stakeholders?.length ?? 0 }} stakeholder(s)</span>
            <div class="delivery-system__actions" aria-label="Open project delivery stage">
              <q-btn v-for="stage in deliveryActions" :key="stage.value" outline dense no-caps
                color="indigo-9" :icon="stage.icon" :label="stage.label"
                :to="{ path: '/system-registry', query: { projectDelivery: String(system.id), deliveryStage: stage.value } }">
                <q-tooltip>{{ `Open ${stage.label} for ${system.system_name}` }}</q-tooltip>
              </q-btn>
            </div>
          </div>
        </article>
      </q-card-section>
    </q-card>

    <q-banner rounded class="delivery-note">
      <template #avatar><q-icon name="info_outline" /></template>
      Progress is captured from the existing system-linked review, module, sprint and Kanban interface during this browser session. It is not official project progress and is not saved to the Registry API.
    </q-banner>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { registryApi } from '@/services/registry-api'
import { errorMessage } from '@/services/http'
import type { RegistryRecord } from '@/types/registry'

type DeliveryProgress = {
  storiesDone: number; storiesTotal: number
  modulesDone: number; modulesTotal: number
  planned: number; tasksTotal: number
  kanbanDone: number; kanbanTotal: number
  overall: number
}
const deliveryActions = [
  { value: 'stories', label: 'User Stories', icon: 'menu_book' },
  { value: 'modules', label: 'Modules', icon: 'layers' },
  { value: 'planning', label: 'Scrum Planning', icon: 'view_kanban' },
  { value: 'kanban', label: 'Kanban', icon: 'dashboard' },
] as const
const progressSnapshots = ref<Record<string, DeliveryProgress>>({})
function progressFor(id: number): DeliveryProgress | undefined { return progressSnapshots.value[String(id)] }
function progressStages(id: number) {
  const progress = progressFor(id)
  if (!progress) return []
  return [
    { label: 'User Stories', icon: 'menu_book', done: progress.storiesDone, total: progress.storiesTotal },
    { label: 'Modules', icon: 'layers', done: progress.modulesDone, total: progress.modulesTotal },
    { label: 'Sprint Plan', icon: 'view_kanban', done: progress.planned, total: progress.tasksTotal },
    { label: 'Kanban Done', icon: 'dashboard', done: progress.kanbanDone, total: progress.kanbanTotal },
  ]
}
function refreshProgress(): void {
  const entries: Record<string, DeliveryProgress> = {}
  for (const system of systems.value) {
    try {
      const raw = sessionStorage.getItem(`one-ictms-progress-v1:${system.id}`)
      if (!raw) continue
      const data: unknown = JSON.parse(raw)
      if (!data || typeof data !== 'object') continue
      const candidate = data as Partial<DeliveryProgress>
      const fields: (keyof DeliveryProgress)[] = ['storiesDone','storiesTotal','modulesDone','modulesTotal','planned','tasksTotal','kanbanDone','kanbanTotal','overall']
      if (fields.every(field => typeof candidate[field] === 'number' && Number.isFinite(candidate[field]) && Number(candidate[field]) >= 0)) {
        entries[String(system.id)] = candidate as DeliveryProgress
      }
    } catch { /* Ignore invalid or unavailable local progress */ }
  }
  progressSnapshots.value = entries
}
const search = ref('')
const loading = ref(false)
const error = ref('')
const systems = ref<RegistryRecord[]>([])
const filteredSystems = computed(() => {
  const keyword = search.value.trim().toLocaleLowerCase()
  if (!keyword) return systems.value
  return systems.value.filter(system => [system.system_name, system.alias, system.description]
    .some(value => String(value ?? '').toLocaleLowerCase().includes(keyword)))
})
async function loadSystems(): Promise<void> {
  loading.value = true
  error.value = ''
  try {
    const response = await registryApi.list()
    if (!response.success || !Array.isArray(response.data)) throw new Error(response.message || 'Unable to load registered systems')
    systems.value = response.data
    refreshProgress()
  } catch (cause) {
    error.value = errorMessage(cause)
  } finally { loading.value = false }
}
onMounted(() => { void loadSystems(); window.addEventListener('focus', refreshProgress) })
onUnmounted(() => { window.removeEventListener('focus', refreshProgress) })
</script>

<style scoped lang="scss">
.delivery-workspace{padding:26px 30px 40px;background:#f5f7fd;min-height:100%;color:#1c2c50}
.delivery-heading{display:flex;align-items:center;justify-content:flex-start;gap:20px;margin-bottom:22px}
.delivery-eyebrow{font-size:11px;letter-spacing:1.4px;color:#3b52aa;font-weight:800;margin-bottom:8px}
.delivery-heading h1{font-weight:800;font-size:32px;line-height:1.2;margin:0 0 6px}
.delivery-heading p{margin:0;color:#64748b;font-size:13px}
.delivery-step h3{font-size:14px;font-weight:800;margin:0 0 6px;line-height:1.35}
.delivery-step p{font-size:12px;color:#6b7892;margin:0;line-height:1.5}
.delivery-registry{border-color:#dbe4f5;border-radius:16px;background:white}
.delivery-toolbar{display:flex;align-items:center;gap:10px;padding:22px 22px 18px}
.delivery-search{flex:1}
.delivery-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:0 22px 22px}
.delivery-system{display:flex;flex-direction:column;gap:12px;border:1px solid #dfe6f5;border-radius:12px;padding:17px;min-width:0}
.delivery-system__identity{display:flex;align-items:center;gap:12px}
.delivery-system__identity h3{font-size:15px;font-weight:800;margin:0;line-height:1.4}
.delivery-system__identity-copy{min-width:0;flex:1}
.delivery-system__description{margin:3px 0 0;font-size:12px;line-height:1.45;color:#77839b;overflow-wrap:anywhere}
.delivery-system__identity span{font-size:12px;color:#77839b}
.delivery-system__progress{border-top:1px solid #edf0f7;padding-top:12px;margin-top:0}
.delivery-system__progress-head{display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-bottom:8px}
.delivery-system__progress-head strong{font-weight:800}
.delivery-system__progress-head span{font-weight:800;color:#2e46a1}
.delivery-system__milestones{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 12px;margin-top:12px}
.delivery-system__milestone{display:flex;justify-content:space-between;gap:4px;min-width:0;font-size:11px;color:#637089}
.delivery-system__milestone span{display:flex;align-items:center;gap:4px;min-width:0}
.delivery-system__milestone strong{font-size:11px;color:#263c75;white-space:nowrap}
.delivery-system__not-started{margin:9px 0 0;color:#78859b;font-size:11px}
.delivery-system__bottom{display:flex;align-items:center;justify-content:space-between;gap:10px}
.delivery-system__bottom>span{font-size:12px;color:#697891}
.delivery-system__actions{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;min-width:0}
.delivery-system__actions .q-btn{font-size:11px;min-height:32px;padding:0 9px}
@media(max-width:650px){.delivery-system__actions{width:100%;justify-content:flex-start}.delivery-system__actions .q-btn{flex:1 1 42%}}
.delivery-empty{text-align:center;padding:40px 16px}
.delivery-empty h3{font-size:16px;font-weight:750;margin:12px 0 4px}
.delivery-empty p{color:#66758c}
.delivery-note{margin-top:16px;background:#eaf0fc;color:#344e8c;font-size:12px}
@media(max-width:1020px){.delivery-grid{grid-template-columns:1fr}}
@media(max-width:600px){.delivery-workspace{padding:16px}.delivery-heading,.delivery-system__bottom{flex-wrap:wrap}.delivery-heading h1{font-size:27px}.delivery-system__actions .q-btn{min-width:0}}

/* System Registry design alignment */
.delivery-workspace{padding:28px 32px 44px;background:#f4f7fe;max-width:1920px;margin:0 auto}
.delivery-heading{display:flex;align-items:center;justify-content:flex-start;gap:18px;background:linear-gradient(112deg,#fff 0%,#f3f7ff 55%,#dbe9ff 100%);border:1px solid #d7e3fa;border-radius:17px;padding:23px 26px;margin-bottom:17px;position:relative;overflow:hidden}
.delivery-heading::after{content:'';position:absolute;width:320px;height:130px;border-radius:50%;background:#d0e1fc66;right:-60px;bottom:-100px;pointer-events:none}
.delivery-heading__icon{background:#fff;border:1px solid #dbe5f6;border-radius:13px;width:52px;height:52px;display:grid;place-items:center;color:#1643a0;box-shadow:0 3px 8px #13377113;flex:none;z-index:1}
.delivery-heading__copy{z-index:1;flex:1;min-width:0;text-align:left}
.delivery-heading h1{font-size:29px;color:#10295e;letter-spacing:-.7px;margin:4px 0 4px}
.delivery-heading p{font-size:12px;color:#627698}
.delivery-registry{border-radius:15px;box-shadow:0 3px 12px #153a7409}
.delivery-toolbar{padding:18px 20px 16px}
.delivery-grid{gap:14px;padding:0 20px 20px}
.delivery-system{border-color:#dbe5f5;border-radius:12px;padding:18px;transition:transform .15s,box-shadow .15s}
.delivery-system:hover{transform:translateY(-2px);box-shadow:0 8px 20px #163a7411}
.delivery-system__identity h3{color:#15316d;font-size:15px}
.delivery-system__progress{border-top-color:#e7edf8}
.delivery-system__actions .q-btn{min-height:31px;border-radius:7px}
@media(max-width:650px){.delivery-workspace{padding:16px}.delivery-heading{padding:18px 16px;gap:12px}.delivery-heading h1{font-size:25px}.delivery-heading__icon{width:44px;height:44px}}

</style>
