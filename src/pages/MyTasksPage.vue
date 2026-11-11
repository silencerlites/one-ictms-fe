<template>
  <q-page class="my-tasks-page">
    <header class="my-tasks-header">
      <div class="my-tasks-header__icon"><q-icon name="assignment_ind" size="30px" /></div>
      <div class="my-tasks-header__copy">
        <div class="my-tasks-eyebrow">ONE ICTMS / MY WORKSPACE</div>
        <h1>My Tasks</h1>
        <p>Track development tasks assigned to you across registered systems and sprints.</p>
      </div>
      <div class="my-tasks-header__performance" role="img" :aria-label="`Task status: ${performanceSummary.label}`">
        <span class="my-tasks-performance-emoji" :class="{ 'my-tasks-performance-emoji--wiggle': performanceSummary.label === 'No data' }" aria-hidden="true">{{ performanceSummary.emoji }}</span>
      </div>
    </header>

    <div class="my-tasks-stats">
      <q-card v-for="metric in metrics" :key="metric.label" flat bordered class="my-tasks-stat">
        <q-icon :name="metric.icon" size="23px" color="indigo-8" />
        <div><strong>{{ metric.value }}</strong><small>{{ metric.label }}</small></div>
      </q-card>
    </div>

    <q-card flat bordered class="my-tasks-panel">
      <div class="my-tasks-toolbar">
        <q-input v-model="search" outlined dense clearable placeholder="Search task, code, module, or system" class="my-tasks-search">
          <template #prepend><q-icon name="search" /></template>
        </q-input>
        <q-select v-model="statusFilter" outlined dense :options="statusOptions" label="Status" class="my-tasks-filter" />
        <q-select v-model="categoryFilter" outlined dense :options="categoryOptions" label="Category" class="my-tasks-filter" />
        <q-select v-model="sprintFilter" outlined dense :options="sprintOptions" label="Sprint" class="my-tasks-filter" />
        <q-btn flat round icon="refresh" color="indigo-8" aria-label="Refresh assigned tasks" @click="loadTasks"><q-tooltip>Refresh tasks</q-tooltip></q-btn>
      </div>
      <div class="my-tasks-list-header">
        <div class="my-tasks-list-heading"><strong>Assigned to me</strong><span>{{ filteredTasks.length }} {{ filteredTasks.length === 1 ? 'task' : 'tasks' }}</span></div>

      </div>
      <div v-if="!tasks.length" class="my-tasks-empty">
        <q-icon name="assignment_ind" size="50px" color="blue-grey-4" />
        <h2>No assigned tasks yet</h2>
        <p>Tasks assigned to your account in Scrum Planning will appear here during this browser session.</p>
        <q-btn unelevated no-caps color="indigo-8" label="Go to Scrum Planning" to="/scrum-planning" />
      </div>
      <div v-else-if="!filteredTasks.length" class="my-tasks-empty">
        <q-icon name="filter_alt_off" size="42px" color="blue-grey-4" />
        <h2>No matching tasks</h2><p>Try another search or filter.</p>
        <q-btn flat color="indigo-8" label="Clear filters" @click="clearFilters" />
      </div>
      <div v-else class="my-tasks-list">
        <article v-for="task in filteredTasks" :key="`${task.systemId}:${task.id}`" class="my-task-row">
          <div class="my-task-head">
            <q-chip dense square :color="statusColor(task.status)" text-color="white" class="my-task-status">
              <q-icon name="circle" size="8px" class="q-mr-xs" />{{ statusLabel(task.status) }}
            </q-chip>
            <q-badge color="indigo-1" text-color="indigo-9">{{ task.id }}</q-badge>
            <q-chip dense square color="blue-grey-1" text-color="blue-grey-9">{{ task.category }}</q-chip>
            <q-space />
          </div>
          <h3>{{ task.title }}</h3>
          <p v-if="task.description">{{ task.description }}</p>
          <div class="my-task-meta">
            <span><q-icon name="dns" /> {{ task.systemName }}</span>
            <span><q-icon name="layers" /> {{ task.module }}</span>
            <span><q-icon name="event" /> {{ task.sprintName }}</span>
            <span><q-icon name="flag" /> {{ task.priority }}</span>
            <span><q-icon name="insights" /> {{ task.points }} pts</span>
            <span><q-icon name="schedule" /> {{ task.estimatedHours > 0 ? `${task.estimatedHours} hrs` : 'Not estimated' }}</span>
          </div>
          <div class="my-task-foot">
            <span v-if="task.startDate || task.endDate" class="my-task-date"><q-icon name="date_range" /> {{ formatDate(task.startDate) }} – {{ formatDate(task.endDate) }}</span>
            <span v-else class="my-task-date">Sprint dates not set</span>
            <q-btn flat no-caps dense color="indigo-8" icon-right="arrow_forward" label="View Task" icon="visibility" @click="openTaskPreview(task)" />
          </div>
        </article>
      </div>
    </q-card>
    <q-dialog v-model="taskPreviewOpen" transition-show="scale" transition-hide="scale" class="my-task-preview-dialog">
      <q-card class="my-task-full-preview" v-if="selectedTask" role="dialog" aria-label="Task Preview">
        <header class="my-task-preview-top">
          <div>
            <div class="my-task-preview-title"><q-icon name="fact_check" color="indigo-8" size="24px" /><div><h2>Task Preview</h2><p>Task information and linked requirement traceability</p></div></div>
          </div>
          <q-btn flat round icon="close" aria-label="Close task preview" @click="taskPreviewOpen = false" />
        </header>
        <div class="my-task-preview-columns">
          <section class="my-task-preview-pane">
            <div class="my-task-preview-summary">
              <div class="row items-center q-gutter-sm">
                <q-badge color="deep-purple-1" text-color="indigo-10" class="my-task-id">{{ selectedTask.id }}</q-badge>
                <q-chip square dense color="blue-1" text-color="indigo-9">{{ selectedTask.category }}</q-chip>
                <q-chip square dense :color="statusColor(selectedTask.status)" text-color="white">{{ statusLabel(selectedTask.status) }}</q-chip>
                <q-chip square dense color="red-1" text-color="red-9">{{ selectedTask.priority }}</q-chip>
              </div>
              <h3>{{ selectedTask.title }}</h3>
              <p>{{ selectedTask.description || 'No description provided.' }}</p>
            </div>
            <q-tabs v-model="previewTab" dense align="left" narrow-indicator active-color="indigo-9" indicator-color="indigo-8" class="my-task-detail-tabs" mobile-arrows outside-arrows>
              <q-tab name="details" icon="list_alt" label="Task Details" no-caps />
              <q-tab name="technical" icon="computer" label="Technical Details" no-caps />
              <q-tab name="dependencies" icon="link" :label="`Dependencies (${selectedTask.dependencies?.length || 0})`" no-caps />
              <q-tab name="comments" icon="chat_bubble_outline" label="Comments" no-caps />
              <q-tab name="attachments" icon="attach_file" label="Attachments" no-caps />
              <q-tab name="activity" icon="history" label="Activity" no-caps />
            </q-tabs>
            <div class="my-task-preview-tab-content">
              <template v-if="previewTab === 'details'">
                <div class="my-task-details-table">
                  <div v-for="row in selectedTaskDetails" :key="row.label" class="my-task-details-row"><strong>{{ row.label }}</strong><span>{{ row.value }}</span></div>
                </div>
              </template>
              <template v-else-if="previewTab === 'technical'">
                <div class="my-task-details-table">
                  <div v-for="row in technicalDetails" :key="row.label" class="my-task-details-row"><strong>{{ row.label }}</strong><span>{{ row.value }}</span></div>
                </div>
              </template>
              <template v-else-if="previewTab === 'dependencies'">
                <div v-if="!selectedTask.dependencies?.length" class="my-task-preview-empty">No task dependencies.</div>
                <div v-for="dependency in dependencyTasks" :key="dependency.id" class="my-task-dependency-row">
                  <q-icon name="account_tree" size="20px" color="indigo-8" />
                  <div class="col"><strong>{{ dependency.id }}</strong><div>{{ dependency.title }}</div></div>
                  <q-badge v-if="dependency.task" :color="statusColor(dependency.task.status)">{{ statusLabel(dependency.task.status) }}</q-badge>
                  <q-badge v-else color="grey-4" text-color="grey-9">Status unavailable</q-badge>
                  <q-btn v-if="dependency.task" flat dense round icon="visibility" color="indigo-8" @click="openTaskPreview(dependency.task)"><q-tooltip>View dependent task</q-tooltip></q-btn>
                </div>
              </template>
              <div v-else class="my-task-preview-empty">
                <q-icon :name="previewTab === 'comments' ? 'chat_bubble_outline' : previewTab === 'attachments' ? 'attach_file' : 'history'" size="32px" color="blue-grey-4" />
                <p>{{ previewTab === 'comments' ? 'Comments are not included in the My Tasks assignment snapshot.' : previewTab === 'attachments' ? 'Attachments are not included in the My Tasks assignment snapshot.' : 'Activity history is not included in the My Tasks assignment snapshot.' }}</p>
                <small>Connect task records and related data to the backend to show shared information here.</small>
              </div>
            </div>
          </section>
          <section class="my-task-preview-pane my-task-traceability">
            <div class="my-task-traceability-heading"><q-icon name="track_changes" size="20px" color="indigo-8" /><strong>Requirement Traceability</strong><q-space /><span>Task → Module → User Story → Acceptance Criteria</span></div>
            <div class="my-task-traceability-flow">
              <div class="my-task-trace-step is-module">
                <div class="my-task-trace-marker"><q-icon name="layers" /></div>
                <div class="my-task-trace-content"><div class="my-task-trace-label">Module</div><div class="my-task-trace-box"><strong>{{ selectedTask.module || 'Not linked' }}</strong><p>Module containing this development task.</p></div></div>
              </div>
              <div class="my-task-trace-step is-story">
                <div class="my-task-trace-marker"><q-icon name="menu_book" /></div>
                <div class="my-task-trace-content"><div class="my-task-trace-label">User Story</div><div class="my-task-trace-box"><strong>{{ selectedTask.userStory || 'Not linked' }}</strong></div></div>
              </div>
              <div class="my-task-trace-step is-criterion">
                <div class="my-task-trace-marker"><q-icon name="fact_check" /></div>
                <div class="my-task-trace-content"><div class="my-task-trace-label">Acceptance Criteria</div><div class="my-task-trace-box"><div class="my-task-criterion"><q-icon name="check_circle" color="positive" size="18px" /><span>{{ selectedTask.acceptanceCriteria || 'No acceptance criterion linked to this task.' }}</span></div><small>Only the criterion linked to this task is available in My Tasks.</small></div></div>
              </div>
            </div>
          </section>
        </div>
      </q-card>
    </q-dialog>
    <p class="my-tasks-note"><q-icon name="info_outline" /> Preview data is scoped to your account and this browser session. Task previews use the available assignment snapshot; saved tasks and cross-device synchronization need backend integration.</p>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useQuasar } from 'quasar'
import { useAuthStore } from '@/stores/auth'

type TaskStatus = 'todo' | 'progress' | 'review' | 'done'
type AssignedTask = {
  id: string; title: string; description: string; module: string
  category: string; priority: string; points: number; estimatedHours: number
  dependencies: string[]; userStory: string; acceptanceCriteria: string
  sprintId: number; sprintName: string; startDate: string; endDate: string
  status: TaskStatus; systemId: number; systemName: string
}
type TaskSnapshot = { systemId: number; systemName: string; tasks: AssignedTask[] }

const auth = useAuthStore()
const $q = useQuasar()
const selectedTask = ref<AssignedTask | null>(null)
const previewTab = ref('details')
function openTaskPreview(task: AssignedTask): void { selectedTask.value = task; previewTab.value = 'details' }
const selectedTaskDetails = computed(() => {
  const t = selectedTask.value
  if (!t) return []
  return [
    { label: 'Task ID', value: t.id }, { label: 'Task Type', value: t.category },
    { label: 'Priority', value: t.priority }, { label: 'Kanban Status', value: statusLabel(t.status) },
    { label: 'System', value: t.systemName }, { label: 'Module', value: t.module },
    { label: 'Story Points', value: String(t.points) },
    { label: 'Estimated Hours', value: t.estimatedHours > 0 ? `${t.estimatedHours} hrs` : 'Not estimated' },
    { label: 'Sprint', value: t.sprintName },
    { label: 'Sprint Dates', value: `${formatDate(t.startDate)} – ${formatDate(t.endDate)}` },
    { label: 'Description', value: t.description || 'Not provided' },
  ]
})
const technicalDetails = computed(() => {
  const t = selectedTask.value
  if (!t) return []
  return [{ label: 'Discipline', value: t.category }, { label: 'Module', value: t.module }, { label: 'Implementation Details', value: t.description || 'Not provided' }]
})
const dependencyTasks = computed(() => {
  const t = selectedTask.value
  if (!t) return []
  return (t.dependencies || []).map(id => {
    const match = tasks.value.find(item => item.id === id && item.systemId === t.systemId)
    return { id, title: match?.title || 'Task details unavailable', task: match || null }
  })
})
const taskPreviewOpen = computed({
  get: () => selectedTask.value !== null,
  set: (open: boolean) => { if (!open) selectedTask.value = null },
})
const tasks = ref<AssignedTask[]>([])
const search = ref('')
const statusFilter = ref('All Statuses')
const categoryFilter = ref('All Categories')
const sprintFilter = ref('All Sprints')
const statusOptions = ['All Statuses', 'To Do', 'In Progress', 'In Review', 'Done']
const categoryOptions = ['All Categories', 'Frontend', 'Backend', 'DB', 'UI/UX']
const sprintOptions = computed(() => ['All Sprints', ...new Set(tasks.value.map(task => task.sprintName))])
const statusLabels: Record<TaskStatus, string> = { todo: 'To Do', progress: 'In Progress', review: 'In Review', done: 'Done' }
function statusLabel(status: TaskStatus): string { return statusLabels[status] || 'To Do' }
function statusColor(status: TaskStatus): string {
  return { todo: 'blue-grey-6', progress: 'indigo-7', review: 'orange-8', done: 'positive' }[status] || 'blue-grey-6'
}
function formatDate(value: string): string {
  if (!value) return 'Not set'
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? 'Not set' : date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}
function loadTasks(): void {
  const userId = Number(auth.user?.id)
  if (!Number.isSafeInteger(userId) || userId <= 0) { tasks.value = []; return }
  const result: AssignedTask[] = []
  const prefix = `one-ictms-my-tasks-v1:${userId}:`
  try {
    for (let index = 0; index < sessionStorage.length; index++) {
      const key = sessionStorage.key(index)
      if (!key?.startsWith(prefix)) continue
      const raw = sessionStorage.getItem(key)
      if (!raw) continue
      const parsed: TaskSnapshot = JSON.parse(raw) as TaskSnapshot
      if (!Number.isSafeInteger(parsed.systemId) || !Array.isArray(parsed.tasks)) continue
      for (const task of parsed.tasks) {
        if (!task?.id || task.sprintId == null) continue
        result.push({ ...task, systemId: parsed.systemId, systemName: parsed.systemName })
      }
    }
  } catch { tasks.value = []; return }
  tasks.value = result.sort((a, b) => a.systemName.localeCompare(b.systemName) || a.id.localeCompare(b.id))
}
const filteredTasks = computed(() => tasks.value.filter(task => {
  const query = search.value?.trim().toLowerCase() || ''
  return (!query || [task.id, task.title, task.module, task.systemName, task.sprintName].some(value => value.toLowerCase().includes(query)))
    && (statusFilter.value === 'All Statuses' || statusLabel(task.status) === statusFilter.value)
    && (categoryFilter.value === 'All Categories' || task.category === categoryFilter.value)
    && (sprintFilter.value === 'All Sprints' || task.sprintName === sprintFilter.value)
}))
const performance = computed(() => {
  const all = tasks.value
  const total = all.length
  const completed = all.filter(task => task.status === 'done').length
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const parseSprintEnd = (value: string): Date | null => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return null
    const date = new Date(`${value}T00:00:00`)
    return Number.isNaN(date.getTime()) ? null : date
  }
  const open = all.filter(task => task.status !== 'done')
  const overdueCount = open.filter(task => {
    const end = parseSprintEnd(task.endDate)
    return end !== null && end < today
  }).length
  const dueSoonCount = open.filter(task => {
    const end = parseSprintEnd(task.endDate)
    if (!end) return false
    const days = (end.getTime() - today.getTime()) / 86400000
    return days >= 0 && days <= 7
  }).length
  return { total, completed, overdueCount, dueSoonCount }
})
// A workload health indicator, not an employee productivity or performance rating.
const performanceSummary = computed(() => {
  if (!performance.value.total) return { label: 'No data', color: 'blue-grey-1', textColor: 'blue-grey-8', emoji: '😶' }
  if (performance.value.overdueCount > 0) return { label: 'Needs attention', color: 'orange-1', textColor: 'orange-10', emoji: '😟' }
  if (performance.value.dueSoonCount > 0) return { label: 'Due soon', color: 'amber-1', textColor: 'orange-10', emoji: '😐' }
  return { label: 'Good', color: 'green-1', textColor: 'green-9', emoji: '😊' }
})
const metrics = computed(() => [
  { icon: 'assignment', label: 'Total tasks', value: tasks.value.length },
  { icon: 'radio_button_unchecked', label: 'To Do', value: tasks.value.filter(task => task.status === 'todo').length },
  { icon: 'pending_actions', label: 'In progress', value: tasks.value.filter(task => task.status === 'progress').length },
  { icon: 'task_alt', label: 'Completed', value: tasks.value.filter(task => task.status === 'done').length },
])
function clearFilters(): void { search.value = ''; statusFilter.value = 'All Statuses'; categoryFilter.value = 'All Categories'; sprintFilter.value = 'All Sprints' }
onMounted(() => { loadTasks(); window.addEventListener('one-ictms-my-tasks-updated', loadTasks) })
onUnmounted(() => { window.removeEventListener('one-ictms-my-tasks-updated', loadTasks) })
</script>

<style scoped lang="scss">
.my-tasks-page { padding: 28px 32px 42px; background: #f5f7fe; min-height: 100%; color: #202f58; }
.my-tasks-eyebrow { color: #3344a4; letter-spacing: 1.5px; font-size: 11px; font-weight: 800; }
.my-tasks-header h1 { font-size: 32px; line-height: 1.3; margin: 10px 0 3px; font-weight: 800; }
.my-tasks-header p { margin: 0 0 24px; color: #6b7895; }
.my-tasks-stats { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 12px; margin-bottom: 22px; }
.my-tasks-stat { display: flex; align-items: center; gap: 12px; padding: 15px; border-radius: 12px; }
.my-tasks-stat strong { display: block; font-size: 23px; line-height: 1; }
.my-tasks-stat small { display: block; color: #6c7891; margin-top: 6px; }
.my-tasks-panel { border-radius: 14px; overflow: hidden; }
.my-tasks-toolbar { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; padding: 16px; }
.my-tasks-search { flex: 1 1 260px; min-width: 180px; }
.my-tasks-filter { flex: 0 1 175px; min-width: 140px; }
.my-tasks-list-header { padding: 13px 18px; background: #f8faff; border-top: 1px solid #e2e7f5; border-bottom: 1px solid #e2e7f5; display: flex; justify-content: space-between; }
.my-tasks-list-header span { color: #73809c; }
.my-tasks-list { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 13px; padding: 16px; }
.my-task-row { border: 1px solid #dce3f4; background: #fff; border-radius: 12px; padding: 15px; min-width: 0; }
.my-task-head { display: flex; align-items: center; gap: 6px; }
.my-task-row h3 { font-size: 15px; font-weight: 800; line-height: 1.45; margin: 12px 0 5px; }
.my-task-row p { font-size: 13px; color: #586782; margin: 0 0 12px; }
.my-task-meta { display: flex; flex-wrap: wrap; gap: 8px 14px; color: #61718d; font-size: 12px; }
.my-task-meta span { display: inline-flex; align-items: center; gap: 4px; }
.my-task-foot { border-top: 1px solid #e9edf6; margin-top: 14px; padding-top: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.my-task-date { color: #7b86a0; font-size: 12px; }
.my-tasks-empty { padding: 52px 15px; text-align: center; color: #6d7996; }
.my-tasks-empty h2 { color: #293a68; font-size: 19px; margin: 10px 0 4px; }
.my-tasks-empty p { margin: 0 auto 18px; max-width: 420px; }
.my-tasks-note { margin: 14px 0 0; color: #8090ad; font-size: 12px; }
@media(max-width: 900px) { .my-tasks-stats {grid-template-columns:repeat(2,minmax(0,1fr))} .my-tasks-list {grid-template-columns:1fr} }
@media(max-width: 580px) { .my-tasks-page {padding:18px 14px} .my-tasks-toolbar {align-items:stretch} .my-tasks-filter {flex:1 1 145px} }

/* System Registry design alignment */
.my-tasks-page { background:#f4f7fe; padding:28px 32px 44px; max-width:1920px; margin:auto; color:#142c61; }
.my-tasks-header { position:relative; display:flex; align-items:center; gap:18px; background:linear-gradient(111deg,#fff 0%,#f3f7ff 57%,#dbe9ff 100%); border:1px solid #d7e3fa; border-radius:17px; padding:23px 26px; margin-bottom:18px; overflow:hidden; }
.my-tasks-header::after { content:''; position:absolute; width:320px; height:140px; border-radius:50%; background:#d0e1fc66; right:-55px; bottom:-105px; pointer-events:none; }
.my-tasks-header__icon { flex:none; width:51px; height:51px; border:1px solid #dbe5f6; border-radius:13px; display:grid; place-items:center; background:white; color:#1643a0; box-shadow:0 3px 8px #13377113; }
.my-tasks-header__copy { position:relative; z-index:1; }
.my-tasks-header h1 { margin:5px 0 3px; font-size:29px; color:#10295e; letter-spacing:-.7px; }
.my-tasks-header p { margin:0; font-size:12px; color:#627698; }
.my-tasks-stats { gap:12px; margin-bottom:16px; }
.my-tasks-stat { min-height:91px; padding:17px; border:1px solid #dce5f5; border-left:3px solid #2152af; background:white; box-shadow:0 2px 6px #22396a08; }
.my-tasks-stat:nth-child(2) { border-left-color:#8396bb; }
.my-tasks-stat:nth-child(3) { border-left-color:#2384d1; }
.my-tasks-stat:nth-child(4) { border-left-color:#18a264; }
.my-tasks-stat strong { font-size:24px; color:#142f6a; }
.my-tasks-panel { border:1px solid #dce5f5; border-radius:15px; background:#fff; box-shadow:0 2px 10px #1c438009; }
.my-tasks-toolbar { gap:11px; padding:18px 18px 16px; }
.my-tasks-list-header { color:#18356a; background:#edf3ff; padding:13px 18px; }
.my-task-row { border-color:#dbe5f6; border-radius:11px; transition:transform .15s,box-shadow .15s; }
.my-task-row:hover { transform:translateY(-2px); box-shadow:0 8px 20px #163a7410; }
.my-tasks-empty { padding:62px 18px; }
@media(max-width:620px){ .my-tasks-page{padding:16px}.my-tasks-header{padding:18px 16px;gap:12px}.my-tasks-header h1{font-size:25px}.my-tasks-header__icon{width:44px;height:44px} }


.my-tasks-list-header { align-items:center; flex-wrap:wrap; gap:8px 16px; }
.my-tasks-list-heading, .my-tasks-health { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
.my-tasks-health { font-size:12px; color:#677997; }
.my-tasks-health .q-chip { font-weight:700; }
.my-task-status { margin-left:0; font-size:11px; font-weight:700; }
.my-task-head { flex-wrap:wrap; }


/* Keep performance visible in the header without overlapping the heading. */
.my-tasks-header__performance { position:relative; z-index:1; margin-left:auto; display:flex; flex-direction:column; align-items:flex-end; justify-content:center; gap:4px; white-space:nowrap; }
.my-tasks-header__performance .q-chip { font-weight:700; }
@media (max-width:720px) { .my-tasks-header { flex-wrap:wrap; } .my-tasks-header__performance { margin-left:0; width:100%; align-items:flex-start; } }

/* Unframed smiley status in the header; accessible label stays on the wrapper. */
/* Gentle status emoji animation; no extra cards or labels. */
.my-tasks-performance-emoji {
  display:inline-flex;
  align-items:center;
  justify-content:center;
  font-size:44px;
  line-height:1;
  transform-origin:50% 75%;
  animation:my-tasks-smiley-float 3.2s ease-in-out infinite;
  will-change:transform;
}
.my-tasks-performance-emoji--wiggle {
  animation:my-tasks-smiley-wiggle 1.8s ease-in-out infinite;
  transform-origin:50% 70%;
}
@keyframes my-tasks-smiley-wiggle {
  0%, 100% { transform:translateX(0) rotate(0deg); }
  15% { transform:translateX(-4px) rotate(-11deg); }
  30% { transform:translateX(4px) rotate(11deg); }
  45% { transform:translateX(-3px) rotate(-8deg); }
  60% { transform:translateX(3px) rotate(8deg); }
  75%, 95% { transform:translateX(0) rotate(0deg); }
}
@keyframes my-tasks-smiley-float {
  0%, 100% { transform:translateY(0) rotate(0deg) scale(1); }
  25% { transform:translateY(-5px) rotate(-5deg) scale(1.04); }
  50% { transform:translateY(-7px) rotate(0deg) scale(1.06); }
  75% { transform:translateY(-3px) rotate(5deg) scale(1.03); }
}
@media (prefers-reduced-motion:reduce) {
  .my-tasks-performance-emoji { animation:none; will-change:auto; }
}
</style>

<style scoped lang="scss">
.my-task-full-preview { width:min(1440px, 96vw); max-width:96vw !important; height:min(850px, 92vh); max-height:92vh !important; display:flex; flex-direction:column; color:#182d5b; background:#f5f7fd; overflow:hidden; border-radius:16px; }
.my-task-preview-top { flex:none; background:#fff; padding:13px 22px 16px; border-bottom:1px solid #dce4f5; display:flex; align-items:flex-start; justify-content:space-between; }
.my-task-preview-title { display:flex; align-items:center; gap:12px; margin-top:0; }
.my-task-preview-title h2 { font-size:23px; font-weight:800; margin:0; line-height:1.35; }
.my-task-preview-title p { margin:5px 0 0; font-size:12px; color:#6579a0; }
.my-task-preview-columns { display:grid; grid-template-columns:1fr 1fr; gap:14px; flex:1; padding:14px; min-height:0; overflow:auto; }
.my-task-preview-pane { min-height:0; display:flex; flex-direction:column; background:white; border:1px solid #d8e3f7; border-radius:12px; overflow:hidden; }
.my-task-preview-summary { padding:20px 20px 12px; }
.my-task-id { font-size:14px; font-weight:800; padding:9px; }
.my-task-preview-summary h3 { font-size:19px; margin:12px 0 5px; font-weight:800; line-height:1.35; }
.my-task-preview-summary p { margin:0; font-size:13px; color:#566f99; }
.my-task-detail-tabs { flex:none; border-bottom:1px solid #d9e4f5; }
.my-task-detail-tabs :deep(.q-tab) { font-size:11px; min-height:62px; padding:5px 8px; }
.my-task-preview-tab-content { flex:1; min-height:0; overflow:auto; padding:16px 20px; }
.my-task-details-table { border:1px solid #d9e4f5; border-radius:9px; padding:8px 14px; }
.my-task-details-row { display:grid; grid-template-columns:140px minmax(0,1fr); border-bottom:1px solid #e1e8f4; gap:14px; align-items:start; padding:12px 0; font-size:12px; overflow-wrap:anywhere; }
.my-task-details-row:last-child { border:0; }
.my-task-details-row strong { font-weight:700; }
.my-task-preview-empty { text-align:center; padding:45px 16px; color:#7886a0; font-size:13px; }
.my-task-preview-empty p { margin:10px 0; }
.my-task-dependency-row { display:flex; align-items:center; gap:14px; border:1px solid #dce5f6; border-radius:9px; margin-bottom:9px; padding:13px; font-size:12px; }
.my-task-traceability-heading { display:flex; align-items:center; gap:10px; padding:17px; border-bottom:1px solid #dce5f5; font-size:13px; }
.my-task-traceability-heading span { color:#6a5bb0; background:#f1eaff; font-size:10px; padding:7px; border-radius:7px; }
.my-task-traceability-flow { padding:20px 22px 32px; overflow:auto; }
.my-task-trace-step { display:grid; grid-template-columns:38px minmax(0,1fr); position:relative; gap:12px; padding-bottom:22px; }
.my-task-trace-step:not(:last-child)::before { position:absolute; content:''; width:2px; top:35px; bottom:-7px; left:18px; background:#bdc9e4; }
.my-task-trace-marker { width:36px; height:36px; border-radius:50%; display:grid; place-items:center; color:white; background:#1671d1; box-shadow:0 2px 6px #17367322; z-index:1; }
.my-task-trace-content { min-width:0; }
.my-task-trace-label { display:inline-block; font-weight:750; font-size:12px; border-radius:7px; margin-bottom:6px; padding:5px 9px; }
.my-task-trace-box { border:1px solid; border-radius:8px; padding:13px; font-size:13px; overflow-wrap:anywhere; }
.my-task-trace-box p { font-size:12px; margin:5px 0 0; }
.my-task-trace-box small { font-size:10px; color:#6b809e; }
.is-module .my-task-trace-label { background:#d6eaff; color:#1656a8; }
.is-module .my-task-trace-box { border-color:#b9d3fc; background:#f0f6ff; }
.is-story .my-task-trace-marker { background:#8744df; }
.is-story .my-task-trace-label { background:#eadcff; color:#6829b2; }
.is-story .my-task-trace-box { border-color:#d3baff; background:#f8f3ff; }
.is-criterion .my-task-trace-marker { background:#efa100; }
.is-criterion .my-task-trace-label { background:#ffedc5; color:#895500; }
.is-criterion .my-task-trace-box { border-color:#ffd58d; background:#fff9ec; }
.my-task-criterion { display:flex; align-items:start; justify-content:space-between; flex-direction:row-reverse; gap:10px; border:1px solid #d3eac0; background:white; border-radius:5px; padding:10px; font-size:12px; margin-bottom:9px; }
@media(max-width:900px){ .my-task-full-preview { width:96vw; height:92vh; } .my-task-preview-columns { grid-template-columns:1fr; overflow:auto; } .my-task-preview-pane { min-height:420px; } .my-task-traceability-heading span { display:none; } }
@media(max-width:560px){ .my-task-full-preview { width:100vw; max-width:100vw !important; height:100dvh; max-height:100dvh !important; border-radius:0; } .my-task-details-row { grid-template-columns:105px minmax(0,1fr); gap:6px; } .my-task-preview-columns { padding:8px; gap:8px; } .my-task-preview-top { padding:10px; } }
</style>
