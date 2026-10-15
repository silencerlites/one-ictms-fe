<template>
  <q-page class="registry-page workspace-page">
    <header class="registry-heading">
      <div class="section-kicker">WORKSPACE / SYSTEM REGISTRY</div>
      <h1>System Registry</h1>
      <p>View and manage all registered systems in ONE ICTMS.</p>
    </header>

    <section class="registry-stats" aria-label="System status summary">
      <article v-for="stat in statistics" :key="stat.label" class="registry-stat" :class="`registry-stat--${stat.theme}`">
        <div class="registry-stat__top"><span>{{ stat.label }}</span><q-icon name="north_east" size="21px" /></div>
        <div class="registry-stat__body"><div class="registry-stat__icon"><q-icon :name="stat.icon" size="29px" /></div><div><strong>{{ stat.count }}</strong><p>{{ stat.description }}</p></div></div>
      </article>
    </section>

    <section class="registry-panel">
      <div class="registry-panel__heading">
        <div><h2>Registered Systems</h2><p>A list of all systems registered in ONE ICTMS.</p></div>
        <div class="registry-actions">
          <q-input v-model="search" dense outlined clearable placeholder="Search systems..." class="registry-search" aria-label="Search registered systems"><template #prepend><q-icon name="search" color="indigo-8" /></template></q-input>
          <q-btn outline no-caps icon="filter_list" label="Filter" class="registry-filter"><q-menu><div class="q-pa-md" style="width:240px"><div class="text-weight-bold q-mb-md">Filter systems</div><q-select v-model="statusFilter" dense outlined :options="statusOptions" label="Status" class="q-mb-sm" /><q-select v-model="categoryFilter" dense outlined :options="categoryOptions" label="Category" /><q-btn flat no-caps label="Reset filters" color="primary" class="q-mt-sm full-width" @click="resetFilters" /></div></q-menu></q-btn>
          <q-btn unelevated no-caps icon="add" label="Add System" class="registry-add" @click="openCreate" />
        </div>
      </div>
      <q-table :rows="filteredSystems" :columns="columns" row-key="id" flat :rows-per-page-options="[5,10,20,0]" :pagination="pagination" class="registry-table" no-data-label="No registered systems match your filters.">
        <template #body-cell-name="props"><q-td :props="props"><div class="registry-system-cell"><span class="registry-system-icon" :style="{ background: props.row.iconColor }"><q-icon name="dns" size="19px" color="white" /></span><div><strong>{{ props.row.name }}</strong><small>{{ props.row.acronym }}</small></div></div></q-td></template>
        <template #body-cell-category="props"><q-td :props="props"><span class="registry-pill registry-pill--category" :class="categoryClass(props.row.category)">{{ props.row.category }}</span></q-td></template>
        <template #body-cell-status="props"><q-td :props="props"><span class="registry-pill registry-pill--status" :class="statusClass(props.row.status)"><span class="registry-pill__dot" />{{ props.row.status }}</span></q-td></template>
        <template #body-cell-updated="props"><q-td :props="props"><div class="registry-updated">{{ formatDate(props.row.updatedAt) }}<small>by {{ props.row.updatedBy }}</small></div></q-td></template>
        <template #body-cell-actions="props"><q-td :props="props"><q-btn round flat dense color="indigo-9" icon="more_horiz" aria-label="System actions"><q-menu auto-close><q-list dense style="min-width:148px"><q-item clickable @click="openView(props.row)"><q-item-section avatar><q-icon name="visibility" /></q-item-section><q-item-section>View details</q-item-section></q-item><q-item clickable @click="openEdit(props.row)"><q-item-section avatar><q-icon name="edit" /></q-item-section><q-item-section>Edit system</q-item-section></q-item><q-item clickable @click="confirmArchive(props.row)"><q-item-section avatar><q-icon :name="props.row.status === 'Archived' ? 'unarchive' : 'archive'" /></q-item-section><q-item-section>{{ props.row.status === 'Archived' ? 'Restore' : 'Archive' }}</q-item-section></q-item></q-list></q-menu></q-btn></q-td></template>
      </q-table>
    </section>

    <q-dialog v-model="formOpen" persistent><q-card class="registry-dialog"><q-card-section class="row items-center justify-between"><div><div class="text-h6 text-weight-bold">{{ editingId === null ? 'Register New System' : 'Edit System' }}</div><div class="text-caption text-grey-7">System profile and ownership</div></div><q-btn flat round icon="close" v-close-popup /></q-card-section><q-separator /><q-form @submit.prevent="saveSystem"><q-card-section class="registry-form">
      <q-input v-model.trim="form.name" outlined label="Full system name *" :rules="[v => !!v || 'System name is required']" />
      <div class="registry-form__grid"><q-input v-model.trim="form.acronym" outlined label="System acronym *" :rules="[v => !!v || 'Acronym is required']" /><q-select v-model="form.status" outlined label="Health / lifecycle status" :options="editableStatuses" /></div>
      <q-input v-model.trim="form.department" outlined label="Managing office / department *" :rules="[v => !!v || 'Managing office is required']" />
      <q-select v-model="form.category" outlined label="System category" :options="categories" />
      <q-input v-model.trim="form.description" outlined type="textarea" autogrow label="Description" />
      <div class="registry-form__grid"><q-input v-model.trim="form.businessOwner" outlined label="Business owner" /><q-input v-model.trim="form.techStack" outlined label="Technology stack" /></div>
      <div class="text-caption text-grey-7">Documents, technical architecture and monitoring can be connected to the registry API later.</div>
    </q-card-section><q-separator /><q-card-actions align="right" class="q-pa-md"><q-btn flat no-caps label="Cancel" v-close-popup /><q-btn unelevated no-caps type="submit" color="indigo-9" :label="editingId === null ? 'Register System' : 'Save Changes'" /></q-card-actions></q-form></q-card></q-dialog>

    <q-dialog v-model="viewOpen"><q-card class="registry-dialog"><q-card-section class="row justify-between items-center"><div class="text-h6 text-weight-bold">System Profile</div><q-btn flat round icon="close" v-close-popup /></q-card-section><q-separator /><q-card-section v-if="selected" class="registry-details"><h3>{{ selected.name }}</h3><p>{{ selected.description || 'No description provided.' }}</p><dl><dt>Acronym</dt><dd>{{ selected.acronym }}</dd><dt>Managing office</dt><dd>{{ selected.department }}</dd><dt>Category</dt><dd>{{ selected.category }}</dd><dt>Status</dt><dd>{{ selected.status }}</dd><dt>Business owner</dt><dd>{{ selected.businessOwner || '—' }}</dd><dt>Technology stack</dt><dd>{{ selected.techStack || '—' }}</dd><dt>Last updated</dt><dd>{{ formatDate(selected.updatedAt) }}</dd></dl></q-card-section><q-card-actions align="right"><q-btn no-caps flat label="Close" v-close-popup /></q-card-actions></q-card></q-dialog>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuasar, type QTableColumn } from 'quasar'
import { useAuthStore } from '@/stores/auth'

type SystemStatus = 'Active' | 'Under Review' | 'Archived'
type RegisteredSystem = { id: number; name: string; acronym: string; department: string; category: string; status: SystemStatus; description: string; businessOwner: string; techStack: string; iconColor: string; updatedAt: string; updatedBy: string }
type SystemDraft = Pick<RegisteredSystem, 'name' | 'acronym' | 'department' | 'category' | 'status' | 'description' | 'businessOwner' | 'techStack'>
const storageKey = 'one-ictms-registry-demo-v1'
const demoSystems: RegisteredSystem[] = [
  { id: 1, name: 'DSWD Assistance Management System', acronym: 'AIMS', department: 'Programs Group', category: 'Program Delivery', status: 'Active', description: 'Manages DSWD assistance programs and records.', businessOwner: 'Programs Group', techStack: '', iconColor: '#5b68ee', updatedAt: '2025-06-12', updatedBy: 'coliera2' },
  { id: 2, name: 'Human Resource Information System', acronym: 'HRIS', department: 'Administrative Service', category: 'Human Resource', status: 'Active', description: 'Human resources information and administration.', businessOwner: 'Administrative Service', techStack: '', iconColor: '#ee4252', updatedAt: '2025-06-10', updatedBy: 'alfonso.m' },
  { id: 3, name: 'Financial Management Information System', acronym: 'FMIS', department: 'Finance Service', category: 'Finance', status: 'Under Review', description: 'Financial management and reporting.', businessOwner: 'Finance Service', techStack: '', iconColor: '#ffbd12', updatedAt: '2025-06-05', updatedBy: 'dela.cruz' },
  { id: 4, name: 'Procurement Management System', acronym: 'PMS', department: 'Administrative Service', category: 'Procurement', status: 'Active', description: 'Procurement requests and processing.', businessOwner: 'Administrative Service', techStack: '', iconColor: '#7957c9', updatedAt: '2025-05-28', updatedBy: 'santos.j' },
  { id: 5, name: 'ICT Asset Management System', acronym: 'IAMS', department: 'ICT Management Service', category: 'Asset Management', status: 'Archived', description: 'ICT equipment and asset registry.', businessOwner: 'ICT Management Service', techStack: '', iconColor: '#8d9ab5', updatedAt: '2025-04-14', updatedBy: 'navarez.c' },
]
function readSaved(): RegisteredSystem[] {
  try { const raw = localStorage.getItem(storageKey); if (raw !== null) { const parsed: unknown = JSON.parse(raw); if (Array.isArray(parsed)) return parsed as RegisteredSystem[] } } catch { /* demo data fallback */ }
  return demoSystems.map(s => ({ ...s }))
}
const systems = ref<RegisteredSystem[]>(readSaved())
watch(systems, next => { try { localStorage.setItem(storageKey, JSON.stringify(next)) } catch { /* storage unavailable */ } }, { deep: true })
const $q = useQuasar()
const auth = useAuthStore()
const search = ref('')
const statusFilter = ref('All Statuses')
const categoryFilter = ref('All Categories')
const statusOptions = ['All Statuses', 'Active', 'Under Review', 'Archived']
const editableStatuses: SystemStatus[] = ['Active', 'Under Review', 'Archived']
const categories = ['Program Delivery', 'Human Resource', 'Finance', 'Procurement', 'Asset Management', 'Others']
const categoryOptions = ['All Categories', ...categories]
const pagination = ref({ page: 1, rowsPerPage: 10 })
const filteredSystems = computed(() => systems.value.filter(s => {
  const term = search.value.toLocaleLowerCase().trim()
  return (!term || [s.name, s.acronym, s.department, s.description].some(value => value.toLocaleLowerCase().includes(term))) && (statusFilter.value === 'All Statuses' || s.status === statusFilter.value) && (categoryFilter.value === 'All Categories' || s.category === categoryFilter.value)
}))
const statistics = computed(() => [
  { label: 'TOTAL SYSTEMS', count: systems.value.length, description: 'All registered systems', icon: 'dns', theme: 'total' },
  { label: 'ACTIVE SYSTEMS', count: systems.value.filter(s => s.status === 'Active').length, description: 'Systems currently in operation', icon: 'check_circle', theme: 'active' },
  { label: 'UNDER REVIEW', count: systems.value.filter(s => s.status === 'Under Review').length, description: 'Systems for evaluation', icon: 'schedule', theme: 'review' },
  { label: 'ARCHIVED SYSTEMS', count: systems.value.filter(s => s.status === 'Archived').length, description: 'Inactive or retired systems', icon: 'inventory_2', theme: 'archived' },
])
const columns: QTableColumn<RegisteredSystem>[] = [
  { name: 'name', label: 'SYSTEM NAME', field: 'name', align: 'left', sortable: true, style: 'min-width:260px' },
  { name: 'department', label: 'OWNER DEPARTMENT', field: 'department', align: 'left', sortable: true },
  { name: 'category', label: 'CATEGORY', field: 'category', align: 'left', sortable: true },
  { name: 'status', label: 'STATUS', field: 'status', align: 'left', sortable: true },
  { name: 'updated', label: 'LAST UPDATED', field: 'updatedAt', align: 'left', sortable: true },
  { name: 'actions', label: 'ACTIONS', field: 'id', align: 'center' },
]
const formOpen = ref(false)
const viewOpen = ref(false)
const editingId = ref<number | null>(null)
const selected = ref<RegisteredSystem | null>(null)
const blankDraft = (): SystemDraft => ({ name: '', acronym: '', department: '', category: 'Others', status: 'Under Review', description: '', businessOwner: '', techStack: '' })
const form = ref<SystemDraft>(blankDraft())
function resetFilters() { statusFilter.value = 'All Statuses'; categoryFilter.value = 'All Categories'; search.value = '' }
function openCreate() { editingId.value = null; form.value = blankDraft(); formOpen.value = true }
function openEdit(s: RegisteredSystem) { editingId.value = s.id; form.value = { name: s.name, acronym: s.acronym, department: s.department, category: s.category, status: s.status, description: s.description, businessOwner: s.businessOwner, techStack: s.techStack }; formOpen.value = true }
function openView(s: RegisteredSystem) { selected.value = s; viewOpen.value = true }
function saveSystem() {
  const now = new Date().toISOString()
  const currentUser = auth.user?.username || 'current.user'
  if (editingId.value !== null) systems.value = systems.value.map(s => s.id === editingId.value ? { ...s, ...form.value, updatedAt: now, updatedBy: currentUser } : s)
  else systems.value = [{ id: Math.max(0, ...systems.value.map(s => s.id)) + 1, ...form.value, iconColor: '#4857d3', updatedAt: now, updatedBy: currentUser }, ...systems.value]
  formOpen.value = false
  $q.notify({ type: 'positive', message: editingId.value === null ? 'System registered (local demo).' : 'System updated (local demo).' })
}
function confirmArchive(s: RegisteredSystem) {
  const restoring = s.status === 'Archived'
  $q.dialog({ title: restoring ? 'Restore system?' : 'Archive system?', message: `${restoring ? 'Restore' : 'Archive'} ${s.name}?`, cancel: true, persistent: true }).onOk(() => {
    systems.value = systems.value.map(item => item.id === s.id ? { ...item, status: restoring ? 'Active' : 'Archived', updatedAt: new Date().toISOString(), updatedBy: auth.user?.username || 'current.user' } : item)
    $q.notify({ type: 'positive', message: restoring ? 'System restored (local demo).' : 'System archived (local demo).' })
  })
}
function formatDate(raw: string) { return new Intl.DateTimeFormat('en-PH', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date(raw)) }
function statusClass(status: SystemStatus) { return status === 'Active' ? 'is-active' : status === 'Under Review' ? 'is-review' : 'is-archived' }
function categoryClass(category: string) { return category === 'Human Resource' ? 'is-hr' : category === 'Finance' ? 'is-finance' : category === 'Procurement' ? 'is-procurement' : category === 'Asset Management' ? 'is-assets' : 'is-general' }
</script>

<style scoped lang="scss">
.registry-page{color:#202558;max-width:1600px;margin:0 auto;padding-top:48px;padding-bottom:55px}.registry-heading{margin-bottom:26px}.registry-heading h1{font-size:clamp(2.2rem,3.3vw,3.35rem);line-height:1.08;font-weight:850;letter-spacing:-.055em;margin:13px 0 8px;color:#222560}.registry-heading p,.registry-panel__heading p{color:#8493b6;font-size:15px;margin:0}.registry-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:26px}.registry-stat{background:#fff;border:1px solid #dfe4f1;border-radius:18px;padding:21px 22px;min-width:0;min-height:160px;box-shadow:0 8px 22px rgba(36,48,101,.025)}.registry-stat__top{display:flex;justify-content:space-between;align-items:center;font-size:12px;font-weight:850;letter-spacing:.095em;color:#3432af}.registry-stat__body{display:flex;align-items:center;gap:19px;margin-top:19px}.registry-stat__icon{display:grid;place-items:center;flex-shrink:0;width:66px;height:66px;border-radius:20px;background:#eef0ff;color:#3236c4}.registry-stat strong{font-size:37px;line-height:1;font-weight:850;color:#20245f;letter-spacing:-.06em}.registry-stat p{color:#8b9abc;margin:5px 0 0;font-size:12px;line-height:1.35}.registry-stat--active .registry-stat__top,.registry-stat--active .registry-stat__icon{color:#009a65}.registry-stat--active .registry-stat__icon{background:#e5f8f0}.registry-stat--review .registry-stat__top,.registry-stat--review .registry-stat__icon{color:#cb7800}.registry-stat--review .registry-stat__icon{background:#fff5db}.registry-stat--archived .registry-stat__top,.registry-stat--archived .registry-stat__icon{color:#d21d37}.registry-stat--archived .registry-stat__icon{background:#fff0f2}.registry-panel{background:white;border:1px solid #dfe5f2;border-radius:19px;padding:20px;box-shadow:0 12px 35px rgba(30,46,100,.03)}.registry-panel__heading{display:flex;gap:20px;justify-content:space-between;align-items:center;margin-bottom:18px}.registry-panel__heading h2{color:#1c225b;font-size:24px;line-height:1.2;font-weight:850;letter-spacing:-.045em;margin:0 0 5px}.registry-actions{display:flex;align-items:center;gap:12px}.registry-search{width:290px;max-width:32vw}.registry-filter{color:#262d82;border-color:#e2e6f0;height:40px;padding-inline:12px}.registry-add{background:#2d2bb0;color:#fff;border-radius:9px;height:40px;padding:0 18px;font-weight:750}.registry-table{color:#3b4c7f}.registry-table :deep(thead tr){background:#f0f3f9}.registry-table :deep(th){color:#60749e;font-weight:850;font-size:10px;letter-spacing:.09em;white-space:nowrap;padding-top:15px;padding-bottom:15px}.registry-table :deep(td){border-color:#edf0f6;padding-top:10px;padding-bottom:10px;font-size:12px}.registry-system-cell{display:flex;align-items:center;gap:14px;min-width:260px;text-align:left}.registry-system-icon{height:40px;width:40px;flex-shrink:0;border-radius:9px;display:grid;place-items:center}.registry-system-cell strong{display:block;font-size:12px;color:#171c59;font-weight:800;white-space:normal}.registry-system-cell small,.registry-updated small{display:block;color:#8498bc;font-size:11px;margin-top:3px}.registry-pill{display:inline-flex;align-items:center;white-space:nowrap;border-radius:9px;font-size:11px;padding:6px 10px}.registry-pill--category{background:#eaf0ff;color:#3245c5}.registry-pill--category.is-hr{background:#ffebee;color:#c92a43}.registry-pill--category.is-finance{background:#fff4df;color:#b77900}.registry-pill--category.is-procurement{background:#efebff;color:#6842ca}.registry-pill--category.is-assets{background:#e9edf3;color:#657590}.registry-pill--status{gap:9px;background:#e7f7ef;color:#09865e}.registry-pill--status.is-review{background:#fff5dd;color:#c17900}.registry-pill--status.is-archived{background:#ffecf0;color:#c62743}.registry-pill__dot{height:9px;width:9px;border-radius:50%;background:currentColor}.registry-updated{font-size:12px;color:#364b7d;white-space:nowrap}.registry-dialog{width:min(700px,96vw);max-width:700px;border-radius:19px}.registry-form{display:flex;flex-direction:column;gap:8px;padding-top:24px}.registry-form__grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.registry-details h3{font-size:21px;font-weight:800;margin:0 0 10px}.registry-details p{color:#687797}.registry-details dl{display:grid;grid-template-columns:140px 1fr;gap:12px;margin:20px 0}.registry-details dt{color:#8793b2}.registry-details dd{margin:0;font-weight:600;overflow-wrap:anywhere}
@media(max-width:1200px){.registry-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.registry-panel__heading{align-items:flex-start;flex-direction:column}.registry-search{width:300px;max-width:100%}}
@media(max-width:700px){.registry-page{padding-top:26px}.registry-stats{gap:10px}.registry-stat{padding:14px;min-height:132px}.registry-stat__body{gap:10px}.registry-stat__icon{height:46px;width:46px;border-radius:13px}.registry-stat strong{font-size:30px}.registry-stat__top{font-size:10px}.registry-stat p{font-size:11px}.registry-panel{padding:12px}.registry-actions{width:100%;flex-wrap:wrap}.registry-search{width:100%;max-width:none;flex:1 1 100%}.registry-form__grid{grid-template-columns:1fr}}
</style>
