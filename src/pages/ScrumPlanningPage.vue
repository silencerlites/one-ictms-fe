<template>
  <q-page class="scrum-page q-pa-lg">
    <header class="scrum-heading">
      <div>
        <div class="scrum-eyebrow">ONE ICTMS / PROJECT DELIVERY</div>
        <h1>Scrum Planning</h1>
        <p>Review story-linked implementation tasks and organize approved work into sprints.</p>
      </div>
      <q-badge outline color="indigo-8" class="q-pa-sm">Local draft workspace · No AI API connected</q-badge>
    </header>

    <q-banner rounded class="bg-indigo-1 text-indigo-10 q-mb-lg">
      <template #avatar><q-icon name="account_tree" /></template>
      User Stories → Acceptance Criteria → Module → Task → Task Details → Task Dependencies
    </q-banner>

    <q-card flat bordered class="scrum-card q-mb-lg">
      <q-card-section>
        <div class="row items-center justify-between q-mb-md"><div class="text-h6 text-weight-bold">Create story-based task drafts</div><q-chip dense color="grey-2" text-color="grey-8">Local template generation</q-chip></div>
        <div class="row q-col-gutter-md">
          <div class="col-12 col-md-5"><q-input v-model="story" outlined dense label="User story" hint="Example: As an employee, I want to sign in securely." /></div>
          <div class="col-12 col-md-3"><q-input v-model="moduleName" outlined dense label="Module" hint="Example: Authentication" /></div>
          <div class="col-12 col-md-4"><q-input v-model="criteriaText" outlined dense type="textarea" autogrow label="Acceptance criteria (one per line)" hint="Each criterion stays linked to its tasks." /></div>
        </div>
        <div class="row items-center q-mt-md q-gutter-sm">
          <q-btn unelevated color="indigo-8" icon="auto_awesome" label="Generate draft tasks" :disable="!canGenerate" @click="generateDrafts" />
          <q-btn outline color="indigo-8" label="Clear drafts" :disable="!tasks.length" @click="clearDrafts" />
          <span class="text-caption text-grey-7">Templates only; connect an AI/backend service for actual AI-generated tasks.</span>
        </div>
      </q-card-section>
    </q-card>

    <div class="scrum-columns">
      <section class="scrum-column">
        <div class="row items-center justify-between q-mb-md">
          <div><h2>Sprint Plan</h2><p>Assign reviewed tasks to a sprint.</p></div>
          <q-chip dense outline color="indigo-8">{{ assignedCount }} assigned</q-chip>
        </div>
        <q-card v-for="sprint in sprints" :key="sprint.id" flat bordered class="scrum-card q-mb-md" @dragover.prevent @drop.prevent="dropTask($event, sprint.id)">
          <q-card-section>
            <div class="row items-center justify-between"><div class="text-subtitle1 text-weight-bold">{{ sprint.name }}</div><q-badge color="grey-2" text-color="grey-8">{{ sprintTasks(sprint.id).length }} tasks</q-badge></div>
            <div v-if="!sprintTasks(sprint.id).length" class="drop-zone q-mt-md">Drop an approved task here, or assign it from the task card.</div>
            <div v-for="task in sprintTasks(sprint.id)" :key="task.id" class="sprint-task q-mt-sm">
              <div class="row items-center justify-between no-wrap"><div class="text-weight-medium">{{ task.title }}</div><q-btn dense flat round icon="close" size="sm" aria-label="Remove from sprint" @click="task.sprintId = null" /></div>
              <div class="text-caption text-grey-7">{{ task.id }} · {{ task.category }} · {{ task.module }}</div>
            </div>
          </q-card-section>
        </q-card>
      </section>

      <section class="scrum-column">
        <div class="row items-center justify-between q-mb-md">
          <div><h2>Generated Tasks</h2><p>Review tasks by implementation discipline.</p></div>
          <q-chip dense outline color="indigo-8">{{ tasks.length }} drafts</q-chip>
        </div>
        <div class="category-filters q-mb-md">
          <q-btn v-for="category in categories" :key="category" no-caps dense :unelevated="activeCategory === category" :outline="activeCategory !== category" color="indigo-8" :label="category" @click="activeCategory = category" />
        </div>
        <q-banner v-if="!filteredTasks.length" rounded class="bg-grey-2 text-grey-7">No tasks in this category yet. Enter a user story and acceptance criteria to create a draft.</q-banner>
        <q-card v-for="task in filteredTasks" :key="task.id" flat bordered class="scrum-card q-mb-md task-card" :draggable="task.approved" @dragstart="startDrag($event, task)">
          <q-card-section>
            <div class="row items-start justify-between q-mb-sm">
              <div class="row items-center q-gutter-xs"><q-chip dense square :color="categoryColor(task.category)" text-color="white">{{ task.category }}</q-chip><span class="text-caption text-grey-7">{{ task.id }}</span></div>
              <q-badge :color="task.approved ? 'positive' : 'warning'" :text-color="task.approved ? 'white' : 'black'">{{ task.approved ? 'Reviewed' : 'Needs review' }}</q-badge>
            </div>
            <div class="text-subtitle1 text-weight-bold">{{ task.title }}</div>
            <div class="hierarchy-line"><strong>User story:</strong> {{ task.story }}</div>
            <div class="hierarchy-line"><strong>Acceptance criteria:</strong> {{ task.criterion }}</div>
            <div class="hierarchy-line"><strong>Module:</strong> {{ task.module }}</div>
            <q-expansion-item dense dense-toggle icon="description" label="Task details & dependencies" class="q-mt-sm">
              <div class="q-pa-sm text-body2"><strong>Task details:</strong> {{ task.details }}</div>
              <div class="q-px-sm q-pb-sm text-body2"><strong>Task dependencies:</strong> {{ task.dependencies.length ? task.dependencies.join(', ') : 'None' }}</div>
            </q-expansion-item>
            <q-separator class="q-my-sm" />
            <div class="row items-center q-gutter-sm">
              <q-checkbox v-model="task.approved" dense label="Reviewed / approved" />
              <q-space />
              <q-select :model-value="task.sprintId" :options="sprintOptions" emit-value map-options dense outlined clearable style="min-width: 145px" label="Assign sprint" :disable="!task.approved" @update:model-value="(value) => assignSprint(task, value)" />
            </div>
          </q-card-section>
        </q-card>
      </section>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuasar } from 'quasar'

type Category = 'UI/UX' | 'Frontend' | 'Backend' | 'DB'
type Task = { id: string; story: string; criterion: string; module: string; category: Category; title: string; details: string; dependencies: string[]; approved: boolean; sprintId: number | null }
const $q = useQuasar()
const storageKey = 'one-ictms-scrum-drafts-v1'
const story = ref('')
const moduleName = ref('')
const criteriaText = ref('')
const categories = ['All', 'Frontend', 'Backend', 'DB', 'UI/UX'] as const
const activeCategory = ref<(typeof categories)[number]>('All')
const sprints = [{ id: 1, name: 'Sprint 1' }, { id: 2, name: 'Sprint 2' }, { id: 3, name: 'Sprint 3' }]
const sprintOptions = sprints.map((sprint) => ({ label: sprint.name, value: sprint.id }))
function loadDrafts(): Task[] {
  try {
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) as Task[] : []
  } catch { return [] }
}
const tasks = ref<Task[]>(loadDrafts())
watch(tasks, (value) => { try { localStorage.setItem(storageKey, JSON.stringify(value)) } catch { /* browser storage unavailable */ } }, { deep: true })
const canGenerate = computed(() => Boolean(story.value.trim() && moduleName.value.trim() && criteriaText.value.trim()))
const assignedCount = computed(() => tasks.value.filter((task) => task.sprintId !== null).length)
const filteredTasks = computed(() => tasks.value.filter((task) => activeCategory.value === 'All' || task.category === activeCategory.value))
const sprintTasks = (id: number) => tasks.value.filter((task) => task.sprintId === id)
const categoryColor = (category: Category) => ({ 'UI/UX': 'purple-6', Frontend: 'blue-7', Backend: 'teal-7', DB: 'orange-8' })[category]
function generateDrafts() {
  if (!canGenerate.value) return
  const criteria = criteriaText.value.split(/\r?\n/).map((item) => item.trim()).filter(Boolean)
  if (!criteria.length) return
  const module = moduleName.value.trim()
  const userStory = story.value.trim()
  const specs: { category: Category; title: string; details: string; dependsOn: Category[] }[] = [
    { category: 'UI/UX', title: `Design ${module} experience`, details: 'Define the user flow, wireframes, states, accessibility, and responsive layout for the acceptance criterion.', dependsOn: [] },
    { category: 'DB', title: `Review ${module} data model`, details: 'Assess data requirements; define necessary schemas, relations, migrations, and data integrity constraints. Mark as not applicable during review if no data changes are needed.', dependsOn: [] },
    { category: 'Backend', title: `Implement ${module} business logic`, details: 'Implement applicable endpoints, validation, authorization, error handling, and tests for the acceptance criterion. Mark as not applicable during review if no server changes are needed.', dependsOn: ['DB'] },
    { category: 'Frontend', title: `Implement ${module} interface`, details: 'Build components, input validation, loading and error states, accessibility, responsive behavior, and API integration where required.', dependsOn: ['UI/UX', 'Backend'] },
  ]
  let next = Math.max(0, ...tasks.value.map((task) => Number(task.id.replace('TASK-', '')) || 0)) + 1
  for (const criterion of criteria) {
    const ids = {} as Record<Category, string>
    specs.forEach((spec) => { ids[spec.category] = `TASK-${String(next++).padStart(4, '0')}` })
    for (const spec of specs) tasks.value.push({
      id: ids[spec.category], story: userStory, criterion, module, category: spec.category,
      title: spec.title, details: spec.details, dependencies: spec.dependsOn.map((category) => ids[category]), approved: false, sprintId: null,
    })
  }
  $q.notify({ type: 'positive', message: `${criteria.length * specs.length} template task drafts created. Review applicability and dependencies before assigning.` })
}
function clearDrafts() {
  $q.dialog({ title: 'Clear task drafts?', message: 'This removes locally saved tasks and sprint assignments.', cancel: true, persistent: true }).onOk(() => { tasks.value = [] })
}
function assignSprint(task: Task, sprintId: number | null) {
  if (!task.approved && sprintId !== null) return
  task.sprintId = sprintId
}
function startDrag(event: DragEvent, task: Task) {
  if (!task.approved) { event.preventDefault(); return }
  event.dataTransfer?.setData('text/plain', task.id)
}
function dropTask(event: DragEvent, sprintId: number) {
  const task = tasks.value.find((item) => item.id === event.dataTransfer?.getData('text/plain'))
  if (task?.approved) task.sprintId = sprintId
}
</script>

<style scoped lang="scss">
.scrum-page { max-width: 1600px; margin: 0 auto; color: #242c49; }
.scrum-heading { display: flex; justify-content: space-between; align-items: start; gap: 16px; margin-bottom: 22px; flex-wrap: wrap; }
.scrum-eyebrow { font-size: 11px; font-weight: 800; letter-spacing: .13em; color: #555eae; }
h1 { font-size: clamp(2rem, 3vw, 2.8rem); font-weight: 800; letter-spacing: -.04em; line-height: 1.2; margin: 8px 0; }
h2 { font-size: 19px; font-weight: 800; margin: 0 0 5px; }
p { color: #758096; margin: 0; }
.scrum-card { border-radius: 17px; border-color: #e1e5f0; box-shadow: 0 6px 20px rgba(31, 37, 86, .025); }
.scrum-columns { display: grid; grid-template-columns: minmax(290px, .85fr) minmax(410px, 1.35fr); gap: 22px; align-items: start; }
.scrum-column { min-width: 0; }
.category-filters { display: flex; flex-wrap: wrap; gap: 8px; }
.drop-zone { border: 1.5px dashed #c7cde6; background: #f9faff; border-radius: 12px; padding: 23px 14px; text-align: center; color: #7c84a0; font-size: 13px; }
.sprint-task { background: #f5f6fc; border: 1px solid #e5e7f2; border-radius: 10px; padding: 10px; }
.hierarchy-line { margin-top: 8px; color: #555f76; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.task-card[draggable="true"] { cursor: grab; }
@media(max-width: 950px) { .scrum-columns { grid-template-columns: 1fr; } }
@media(max-width: 600px) { .scrum-page { padding: 16px; } }
</style>
