<template>
  <q-page class="overview-dashboard">
    <div class="overview-dashboard__heading">
      <div class="overview-dashboard__heading-icon"><q-icon name="dashboard" size="29px" /></div>
      <div class="overview-dashboard__heading-copy">
        <div class="section-kicker">WORKSPACE / OVERVIEW</div>
        <h1>Welcome back, {{ displayName }}.</h1>
        <p>Stay on top of your projects, sprint tasks, and schedule.</p>
      </div>
    </div>


    <div class="overview-dashboard__main">
      <section class="overview-dashboard__calendar-card" aria-label="Calendar">
        <div class="overview-dashboard__panel-heading">
          <div class="row items-center q-gutter-sm">
            <div class="overview-dashboard__panel-icon"><q-icon name="calendar_month" size="24px" /></div>
            <div><h2>Calendar</h2><p>Plan sprint meetings and review your schedule</p></div>
          </div>
          <div class="row items-center q-gutter-xs">
            <q-btn flat dense no-caps label="Today" class="overview-dashboard__today-btn" @click="goToday" />
            <q-btn round flat dense icon="chevron_left" aria-label="Previous month" @click="moveMonth(-1)" />
            <q-btn round flat dense icon="chevron_right" aria-label="Next month" @click="moveMonth(1)" />
          </div>
        </div>
        <div class="overview-dashboard__calendar-meta">
          <h3>{{ monthLabel }}</h3>
          <span><q-icon name="info_outline" /> Google events are not synced yet</span>
        </div>
        <div class="overview-dashboard__calendar-grid" role="grid" :aria-label="monthLabel">
          <div v-for="day in weekdays" :key="day" class="overview-dashboard__weekday" role="columnheader">{{ day }}</div>
          <button
            v-for="date in calendarDates"
            :key="date.iso"
            type="button"
            class="overview-dashboard__day"
            :class="{
              'overview-dashboard__day--outside': !date.inMonth,
              'overview-dashboard__day--today': date.iso === todayIso,
              'overview-dashboard__day--selected': date.iso === selectedDate
            }"
            :aria-label="date.fullLabel"
            :aria-pressed="date.iso === selectedDate"
            @click="selectedDate = date.iso"
          >
            <span>{{ date.day }}</span>
          </button>
        </div>
        <div class="overview-dashboard__calendar-footer">
          <span><q-icon name="open_in_new" size="16px" /> Open your events in Google Calendar</span>
          <q-btn outline no-caps color="primary" icon-right="open_in_new" label="Go to Calendar" @click="openGoogleCalendar" />
        </div>
      </section>

      <aside class="overview-dashboard__side">
        <section class="overview-dashboard__side-card overview-dashboard__priority-card" aria-label="Top five priority tasks">
          <div class="overview-dashboard__side-heading overview-dashboard__priority-heading">
            <span class="overview-dashboard__side-icon"><q-icon name="priority_high" size="22px" /></span>
            <div><h2>Priority tasks</h2><p>High priority and approaching sprint deadlines · Top 5</p></div>
            <q-btn flat round dense color="indigo-8" icon="refresh" aria-label="Refresh priority tasks" @click="loadPriorityTasks"><q-tooltip>Refresh assigned tasks</q-tooltip></q-btn>
          </div>
          <div v-if="!topPriorityTasks.length" class="overview-dashboard__priority-empty">
            <q-icon name="task_alt" size="30px" />
            <strong>No priority tasks available</strong>
            <span>Assigned, unfinished tasks from Scrum Planning will appear here.</span>
          </div>
          <div v-else class="overview-dashboard__priority-list">
            <router-link
              v-for="(task, index) in topPriorityTasks"
              :key="`${task.systemId}:${task.id}`"
              class="overview-dashboard__priority-task"
              :to="{ path: '/system-registry', query: { projectDelivery: String(task.systemId), deliveryStage: 'kanban' } }"
            >
              <span class="overview-dashboard__priority-rank">{{ index + 1 }}</span>
              <div class="overview-dashboard__priority-copy">
                <div class="overview-dashboard__priority-topline"><strong>{{ task.id }} · {{ task.title }}</strong><span :class="['overview-dashboard__priority-badge', { 'overview-dashboard__priority-badge--high': priorityRank(task.priority) === 0 }]">{{ task.priority || 'Normal' }}</span></div>
                <div class="overview-dashboard__priority-meta">{{ task.systemName }} · {{ task.sprintName }}</div>
                <div class="overview-dashboard__priority-deadline" :class="{ 'overview-dashboard__priority-deadline--urgent': daysUntilSprintEnd(task.endDate) !== null && daysUntilSprintEnd(task.endDate)! <= 3 }">
                  <q-icon name="event" size="15px" /> Sprint ends: {{ formatPriorityDate(task.endDate) }}
                  <span v-if="daysUntilSprintEnd(task.endDate) !== null"> · {{ deadlineLabel(task.endDate) }}</span>
                </div>
              </div>
              <q-icon name="chevron_right" color="blue-grey-6" size="18px" />
            </router-link>
          </div>
          <router-link to="/my-tasks" class="overview-dashboard__priority-more">View all my tasks <q-icon name="arrow_forward" size="17px" /></router-link>
          <p class="overview-dashboard__priority-note">Dates shown are sprint end dates, not individual task due dates. Local session data only.</p>
        </section>
        <section class="overview-dashboard__side-card">
          <div class="overview-dashboard__side-heading">
            <span class="overview-dashboard__side-icon"><q-icon name="event_available" size="22px" /></span>
            <h2>Selected day</h2>
          </div>
          <strong class="overview-dashboard__selected-date">{{ selectedDateLabel }}</strong>
          <p>View your scheduled meetings and events in Google Calendar.</p>
          <div class="overview-dashboard__empty-events">
            <q-icon name="event_note" size="31px" />
            <strong>No events loaded</strong>
            <span>Private Google Calendar events require account authorization.</span>
          </div>
          <q-btn unelevated color="primary" no-caps icon="add" label="Create Google Calendar event" class="full-width" @click="createCalendarEvent" />
        </section>
      </aside>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
type PriorityTask = {
  id: string; title: string; systemId: number; systemName: string; sprintName: string
  endDate: string; priority: string; status: string
}
const priorityTasks = ref<PriorityTask[]>([])
function priorityRank(priority: string): number {
  const normalized = (priority || '').trim().toLowerCase()
  return normalized === 'critical' || normalized === 'urgent' ? -1 : normalized === 'high' ? 0 : normalized === 'medium' ? 1 : 2
}
function dayNumber(date: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null
  const parsed = new Date(`${date}T00:00:00`)
  return Number.isNaN(parsed.getTime()) ? null : Math.floor(parsed.getTime() / 86400000)
}
function daysUntilSprintEnd(date: string): number | null {
  const due = dayNumber(date)
  const today = dayNumber(todayIso)
  return due === null || today === null ? null : due - today
}
function formatPriorityDate(date: string): string {
  if (dayNumber(date) === null) return 'Not set'
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function deadlineLabel(date: string): string {
  const days = daysUntilSprintEnd(date)
  if (days === null) return ''
  if (days < 0) return `${Math.abs(days)}d overdue`
  if (days === 0) return 'Today'
  return `${days}d left`
}
function loadPriorityTasks(): void {
  const userId = Number(auth.user?.id)
  if (!Number.isSafeInteger(userId) || userId <= 0) { priorityTasks.value = []; return }
  const prefix = `one-ictms-my-tasks-v1:${userId}:`
  const found: PriorityTask[] = []
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i)
      if (!key?.startsWith(prefix)) continue
      const raw = sessionStorage.getItem(key)
      if (!raw) continue
      const snapshot = JSON.parse(raw) as { systemId?: number; systemName?: string; tasks?: PriorityTask[] }
      if (!Number.isSafeInteger(snapshot.systemId) || !Array.isArray(snapshot.tasks)) continue
      for (const task of snapshot.tasks) {
        if (!task?.id || task.status === 'done') continue
        found.push({ ...task, systemId: snapshot.systemId!, systemName: snapshot.systemName || '' })
      }
    }
    priorityTasks.value = found
  } catch { priorityTasks.value = [] }
}
const topPriorityTasks = computed(() => [...priorityTasks.value].sort((a, b) => {
  const aDays = daysUntilSprintEnd(a.endDate)
  const bDays = daysUntilSprintEnd(b.endDate)
  // Overdue or coming within seven days takes precedence; priority breaks ties.
  const urgency = (days: number | null) => days === null ? 2 : days <= 7 ? 0 : 1
  const urgencyDelta = urgency(aDays) - urgency(bDays)
  if (urgencyDelta) return urgencyDelta
  const priorityDelta = priorityRank(a.priority) - priorityRank(b.priority)
  if (priorityDelta) return priorityDelta
  if (aDays !== null && bDays !== null && aDays !== bDays) return aDays - bDays
  if (aDays !== null && bDays === null) return -1
  if (aDays === null && bDays !== null) return 1
  return a.title.localeCompare(b.title)
}).slice(0, 5))
onMounted(() => { loadPriorityTasks(); window.addEventListener('one-ictms-my-tasks-updated', loadPriorityTasks) })
onUnmounted(() => window.removeEventListener('one-ictms-my-tasks-updated', loadPriorityTasks))
const displayName = computed(() => auth.user?.details?.first_name || auth.user?.username || 'there')
const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const pad2 = (number: number) => String(number).padStart(2, '0')
const toLocalIso = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`
const todayIso = toLocalIso(new Date())
const selectedDate = ref(todayIso)
const displayMonth = ref(new Date(new Date().getFullYear(), new Date().getMonth(), 1))
const monthLabel = computed(() => displayMonth.value.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }))
const selectedDateLabel = computed(() => {
  const [year, month, day] = selectedDate.value.split('-').map(Number)
  return new Date(year || 2000, (month || 1) - 1, day || 1).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  })
})
const calendarDates = computed(() => {
  const year = displayMonth.value.getFullYear()
  const month = displayMonth.value.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  return Array.from({ length: cellCount }, (_, index) => {
    const date = new Date(year, month, index - firstWeekday + 1)
    return {
      iso: toLocalIso(date),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
      fullLabel: date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    }
  })
})
function moveMonth(delta: number) {
  displayMonth.value = new Date(displayMonth.value.getFullYear(), displayMonth.value.getMonth() + delta, 1)
}
function goToday() {
  const now = new Date()
  displayMonth.value = new Date(now.getFullYear(), now.getMonth(), 1)
  selectedDate.value = toLocalIso(now)
}
function openGoogleCalendar() {
  window.open('https://calendar.google.com/calendar/u/0/r/month', '_blank', 'noopener,noreferrer')
}
function createCalendarEvent() {
  const date = selectedDate.value.replace(/-/g, '')
  const start = `${date}T090000`
  const end = `${date}T100000`
  const params = new URLSearchParams({ action: 'TEMPLATE', text: 'ONE ICTMS - Sprint Planning', dates: `${start}/${end}`, details: 'Sprint planning and task coordination meeting.' })
  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer')
}
</script>

<style scoped lang="scss">
.overview-dashboard { padding: clamp(18px, 3vw, 44px); color: #172b58; max-width: 1720px; margin: 0 auto; }
.overview-dashboard__heading { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 20px; margin-bottom: 27px; }
.overview-dashboard__heading h1 { font-size: clamp(26px, 3vw, 39px); font-weight: 800; letter-spacing: -.045em; margin: 8px 0 4px; line-height: 1.15; }
.overview-dashboard__heading p { margin: 0; color: #7989a7; font-size: 14px; }
.overview-dashboard__main { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(285px, .85fr); align-items: start; gap: 18px; }
.overview-dashboard__calendar-card, .overview-dashboard__side-card { background: #fff; border: 1px solid #dce5f5; border-radius: 17px; overflow: hidden; }
.overview-dashboard__calendar-card { padding: 22px; }
.overview-dashboard__panel-heading, .overview-dashboard__calendar-meta, .overview-dashboard__calendar-footer { display: flex; justify-content: space-between; align-items: center; gap: 14px; }
.overview-dashboard__panel-heading h2, .overview-dashboard__side-heading h2 { font-size: 17px; font-weight: 750; margin: 0; line-height: 1.3; }
.overview-dashboard__panel-heading p { color: #8897b1; font-size: 12px; margin: 3px 0 0; }
.overview-dashboard__panel-icon, .overview-dashboard__side-icon { width: 44px; height: 44px; border-radius: 11px; background: #eaf0ff; color: #3355bd; display: grid; place-items: center; flex: none; }
.overview-dashboard__today-btn { color: #3455a9; }
.overview-dashboard__calendar-meta { margin: 27px 0 15px; }
.overview-dashboard__calendar-meta h3 { font-size: 21px; font-weight: 800; margin: 0; }
.overview-dashboard__calendar-meta span { font-size: 11px; color: #8897b1; }
.overview-dashboard__calendar-grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); border-top: 1px solid #e8edf7; border-left: 1px solid #e8edf7; }
.overview-dashboard__weekday { padding: 13px 2px; text-align: center; color: #7182a0; font-size: 12px; font-weight: 650; border-bottom: 1px solid #e8edf7; border-right: 1px solid #e8edf7; }
.overview-dashboard__day { border: 0; background: #fff; color: #253c70; min-height: 77px; padding: 9px; text-align: left; border-right: 1px solid #e8edf7; border-bottom: 1px solid #e8edf7; cursor: pointer; transition: background .12s; }
.overview-dashboard__day:hover { background: #eef3ff; }
.overview-dashboard__day--outside { color: #bdc6d6; background: #fbfcff; }
.overview-dashboard__day span { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 50%; font-size: 13px; }
.overview-dashboard__day--today span { background: #ecedff; font-weight: 800; color: #343eac; }
.overview-dashboard__day--selected { background: #eff3ff; }
.overview-dashboard__day--selected span { background: #2948a8; color: white; }
.overview-dashboard__calendar-footer { border-top: 1px solid #e8edf7; margin-top: 20px; padding-top: 18px; }
.overview-dashboard__calendar-footer span { color: #8392ad; font-size: 12px; display: flex; align-items: center; gap: 7px; }
.overview-dashboard__side { display: grid; gap: 17px; }
.overview-dashboard__side-card { padding: 22px; }
.overview-dashboard__side-heading { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.overview-dashboard__selected-date { font-size: 18px; display: block; margin-bottom: 5px; }
.overview-dashboard__side-card p { color: #8492aa; font-size: 12px; line-height: 1.55; }
.overview-dashboard__empty-events { background: #f7f9ff; border: 1px dashed #d5def2; border-radius: 12px; margin: 22px 0; padding: 27px 16px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; color: #8593ae; }
.overview-dashboard__empty-events strong { color: #3c4d70; font-size: 13px; }
.overview-dashboard__empty-events span { font-size: 12px; max-width: 205px; }
.overview-dashboard__priority-heading { margin-bottom: 12px; }
.overview-dashboard__priority-heading > div { flex: 1; }
.overview-dashboard__priority-heading p { margin: 3px 0 0; font-size: 11px; color: #8190aa; }
.overview-dashboard__priority-list { display: grid; gap: 8px; }
.overview-dashboard__priority-task { text-decoration: none; color: inherit; border: 1px solid #e0e7f5; border-radius: 10px; padding: 11px 10px; display: flex; align-items: flex-start; gap: 9px; transition: background .15s; }
.overview-dashboard__priority-task:hover { background: #f6f8ff; }
.overview-dashboard__priority-rank { flex: none; border-radius: 7px; background: #ebefff; color: #324db1; display: grid; place-items: center; width: 24px; height: 24px; font-weight: 800; font-size: 12px; }
.overview-dashboard__priority-copy { flex: 1; min-width: 0; }
.overview-dashboard__priority-topline { display: flex; align-items: start; flex-wrap: wrap; gap: 6px; justify-content: space-between; }
.overview-dashboard__priority-topline strong { font-size: 12px; line-height: 1.45; flex: 1; min-width: 120px; overflow-wrap: anywhere; }
.overview-dashboard__priority-badge { background: #f1f3f8; padding: 2px 7px; border-radius: 7px; font-size: 10px; color: #65738b; }
.overview-dashboard__priority-badge--high { color: #aa3b36; background: #ffebea; }
.overview-dashboard__priority-meta, .overview-dashboard__priority-deadline { font-size: 11px; color: #7f8ea8; margin-top: 5px; }
.overview-dashboard__priority-deadline { display: flex; align-items: center; gap: 3px; flex-wrap: wrap; }
.overview-dashboard__priority-deadline--urgent { color: #b45326; font-weight: 650; }
.overview-dashboard__priority-more { display: flex; align-items: center; justify-content: center; gap: 6px; padding-top: 14px; color: #3154bd; font-size: 12px; font-weight: 700; text-decoration: none; }
.overview-dashboard__priority-note { font-size: 10px !important; color: #91a0b8 !important; margin: 9px 0 0 !important; }
.overview-dashboard__priority-empty { display: flex; flex-direction: column; align-items: center; gap: 7px; text-align: center; padding: 20px; color: #8b9bb4; }
.overview-dashboard__priority-empty strong { color: #536582; font-size: 12px; }
.overview-dashboard__priority-empty span { font-size: 11px; }
@media (max-width: 1100px) { .overview-dashboard__main { grid-template-columns: 1fr; } .overview-dashboard__side { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 750px) { .overview-dashboard__side { grid-template-columns: 1fr; } .overview-dashboard__calendar-card { padding: 12px; } .overview-dashboard__panel-heading { flex-wrap: wrap; } .overview-dashboard__day { min-height: 52px; padding: 3px; } .overview-dashboard__calendar-footer { flex-wrap: wrap; } .overview-dashboard__calendar-meta { flex-wrap: wrap; } }

/* System Registry design alignment */
.overview-dashboard { padding:28px 32px 44px; max-width:1920px; color:#142c61; }
.overview-dashboard__heading { display:flex; align-items:center; justify-content:flex-start; gap:18px; background:linear-gradient(112deg,#fff 0%,#f3f7ff 55%,#dbe9ff 100%); border:1px solid #d7e3fa; border-radius:17px; padding:23px 26px; margin-bottom:18px; position:relative; overflow:hidden; }
.overview-dashboard__heading::after { content:''; position:absolute; width:320px; height:135px; right:-60px; bottom:-103px; border-radius:50%; background:#d0e1fc66; pointer-events:none; }
.overview-dashboard__heading-icon { width:52px; height:52px; flex:none; display:grid; place-items:center; color:#1643a0; background:#fff; border:1px solid #dbe5f6; border-radius:13px; box-shadow:0 3px 8px #13377113; z-index:1; }
.overview-dashboard__heading-copy { z-index:1; }
.overview-dashboard__heading h1 { font-size:29px; color:#10295e; letter-spacing:-.7px; margin:5px 0 4px; }
.overview-dashboard__heading p { font-size:12px; color:#627698; }
.overview-dashboard__calendar-card,.overview-dashboard__side-card { border-color:#dbe5f5; border-radius:15px; box-shadow:0 3px 12px #153a7409; }
.overview-dashboard__calendar-card { padding:21px; }
.overview-dashboard__panel-heading h2,.overview-dashboard__side-heading h2 { color:#15316d; font-weight:800; }
.overview-dashboard__day { min-height:70px; }
@media(max-width:750px){.overview-dashboard{padding:16px}.overview-dashboard__heading{padding:18px 16px;gap:12px}.overview-dashboard__heading h1{font-size:24px}.overview-dashboard__heading-icon{width:44px;height:44px}.overview-dashboard__day{min-height:52px}}

</style>
