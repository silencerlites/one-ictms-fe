<template>
  <div class="register-page">
    <header class="register-header">
      <h1>Create account</h1>
      <p>Enter your details to get started.</p>
    </header>

    <q-form class="register-form" @submit.prevent="submit">
      <div class="register-grid">
        <div class="register-field register-field--full">
          <q-input
            v-model.trim="form.username"
            outlined
            hide-bottom-space
            lazy-rules="ondemand"
            autocomplete="username"
            label="Username"
            :rules="[required]"
          >
            <template #prepend><q-icon name="person_outline" /></template>
          </q-input>
        </div>

        <div class="register-field register-field--full">
          <q-input
            v-model.trim="form.email"
            outlined
            hide-bottom-space
            lazy-rules="ondemand"
            autocomplete="email"
            type="email"
            label="Email address"
            :rules="[required, emailRule]"
          >
            <template #prepend><q-icon name="alternate_email" /></template>
          </q-input>
        </div>

        <div class="register-field">
          <q-input
            v-model.trim="form.first_name"
            outlined
            hide-bottom-space
            lazy-rules="ondemand"
            autocomplete="given-name"
            label="First name"
            :rules="[required]"
          />
        </div>

        <div class="register-field">
          <q-input
            v-model.trim="form.last_name"
            outlined
            hide-bottom-space
            lazy-rules="ondemand"
            autocomplete="family-name"
            label="Last name"
            :rules="[required]"
          />
        </div>

        <div class="register-field">
          <q-input
            v-model.trim="form.middle_name"
            outlined
            hide-bottom-space
            label="Middle name (optional)"
          />
        </div>

        <div class="register-field">
          <q-input
            v-model.trim="form.ext_name"
            outlined
            hide-bottom-space
            label="Extension (optional)"
          />
        </div>

        <div class="register-field">
          <q-select
            v-model="form.sex"
            outlined
            hide-bottom-space
            clearable
            emit-value
            map-options
            :options="sexOptions"
            label="Sex (optional)"
            dropdown-icon="expand_more"
          />
        </div>

        <div class="register-field">
          <q-select
            v-model="form.position_id"
            outlined
            clearable
            use-input
            input-debounce="0"
            emit-value
            map-options
            hide-bottom-space
            :options="filteredPositions"
            :loading="positionLoading"
            :disable="positionLoading"
            option-label="label"
            option-value="value"
            label="Position (optional)"
            dropdown-icon="expand_more"
            @filter="filterPositions"
          >
            <template #no-option>
              <q-item><q-item-section class="text-grey-7">No positions found</q-item-section></q-item>
            </template>
          </q-select>
        </div>

        <div class="register-field">
          <q-select
            v-model="form.department_id"
            outlined
            clearable
            use-input
            input-debounce="0"
            emit-value
            map-options
            hide-bottom-space
            :options="filteredDepartments"
            :loading="departmentLoading"
            :disable="departmentLoading"
            label="Department (optional)"
            dropdown-icon="expand_more"
            @filter="filterDepartments"
            @update:model-value="onDepartmentChange"
          >
            <template #no-option>
              <q-item><q-item-section class="text-grey-7">No departments found</q-item-section></q-item>
            </template>
          </q-select>
        </div>

        <div class="register-field">
          <q-select
            v-model="form.division_id"
            outlined
            clearable
            use-input
            input-debounce="0"
            emit-value
            map-options
            hide-bottom-space
            :options="filteredDivisions"
            :loading="divisionLoading"
            :disable="divisionLoading || !form.department_id"
            :label="form.department_id ? 'Division (optional)' : 'Select department first'"
            dropdown-icon="expand_more"
            @filter="filterDivisions"
          >
            <template #no-option>
              <q-item><q-item-section class="text-grey-7">No divisions in this department</q-item-section></q-item>
            </template>
          </q-select>
        </div>

        <div class="register-field register-field--full">
          <q-input
            v-model="form.password"
            outlined
            hide-bottom-space
            lazy-rules="ondemand"
            autocomplete="new-password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            :rules="[required, minPassword]"
          >
            <template #prepend><q-icon name="lock_outline" /></template>
            <template #append>
              <q-btn
                type="button"
                flat
                round
                dense
                :icon="showPassword ? 'visibility_off' : 'visibility'"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
        </div>

        <div class="register-field register-field--full">
          <q-input
            v-model="form.password_confirmation"
            outlined
            hide-bottom-space
            lazy-rules="ondemand"
            autocomplete="new-password"
            label="Confirm password"
            :type="showConfirmation ? 'text' : 'password'"
            :rules="[required, passwordsMatch]"
          >
            <template #prepend><q-icon name="verified_user" /></template>
            <template #append>
              <q-btn
                type="button"
                flat
                round
                dense
                :icon="showConfirmation ? 'visibility_off' : 'visibility'"
                :aria-label="showConfirmation ? 'Hide confirmation' : 'Show confirmation'"
                @click="showConfirmation = !showConfirmation"
              />
            </template>
          </q-input>
        </div>
      </div>

      <q-btn
        type="submit"
        no-caps
        unelevated
        class="register-submit full-width"
        label="Create account"
        icon-right="arrow_forward"
        :loading="busy"
        :disable="busy"
      />

      <div class="register-sign-in">
        Already have an account?
        <router-link to="/login">Sign in</router-link>
      </div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { authApi } from '@/services/auth-api'
import { useLibraryStore } from '@/stores/library'
import type { LibraryOption } from '@/services/library-api'
import { errorMessage } from '@/services/http'
import type { RegisterPayload } from '@/types/auth'

const router = useRouter()
const $q = useQuasar()
const busy = ref(false)
const showPassword = ref(false)
const showConfirmation = ref(false)

// Dropdowns use the public Library list endpoints; IDs are only sent in the JSON body.
interface SelectOption { label: string; value: number }
const library = useLibraryStore()
const departments = computed(() => library.departments)
const divisions = computed(() => library.divisions)
const positions = computed(() => library.positions)
// Avoid blocking cached dropdowns during background refreshes.
const departmentLoading = computed(() => library.pending.departments && !library.updatedAt.departments)
const divisionLoading = computed(() => library.pending.divisions && !library.updatedAt.divisions)
const positionLoading = computed(() => library.pending.positions && !library.updatedAt.positions)
const departmentSearch = ref('')
const divisionSearch = ref('')
const positionSearch = ref('')

const makeOptions = (records: LibraryOption[]): SelectOption[] => records.map((item) => ({
  value: item.id,
  label: item.alias ? `${item.name} (${item.alias})` : item.name,
}))
const searchOptions = (records: SelectOption[], term: string) =>
  records.filter((record) => record.label.toLowerCase().includes(term.toLowerCase()))

const filteredDepartments = computed(() => searchOptions(makeOptions(departments.value), departmentSearch.value))
const filteredPositions = computed(() => searchOptions(makeOptions(positions.value), positionSearch.value))
const filteredDivisions = computed(() => {
  if (!form.department_id) return []
  const matching = divisions.value.filter((item) =>
    Number(item.department_id ?? item.department?.id) === form.department_id,
  )
  return searchOptions(makeOptions(matching), divisionSearch.value)
})

type FilterUpdate = (callback: () => void) => void
function filterDepartments(value: string, update: FilterUpdate) {
  update(() => { departmentSearch.value = value })
}
function filterDivisions(value: string, update: FilterUpdate) {
  update(() => { divisionSearch.value = value })
}
function filterPositions(value: string, update: FilterUpdate) {
  update(() => { positionSearch.value = value })
}
function onDepartmentChange() {
  form.division_id = null
  divisionSearch.value = ''
}

async function loadLibrary() {
  try {
    // The store skips still-fresh cache entries automatically.
    // Previously loaded options are not hidden when a refresh is needed.
    await library.loadAll()
    if (library.loadError) {
      $q.notify({ type: 'warning', message: `Some registration options could not load: ${library.loadError}` })
    }
  } catch (error) {
    $q.notify({ type: 'negative', message: `Unable to load registration dropdowns: ${errorMessage(error)}` })
  }
}
onMounted(() => { void loadLibrary() })

const sexOptions = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
]

const form = reactive<RegisterPayload>({
  username: '',
  email: '',
  first_name: '',
  middle_name: '',
  last_name: '',
  ext_name: '',
  sex: '',
  position_id: null,
  department_id: null,
  division_id: null,
  password: '',
  password_confirmation: '',
})

const required = (value: string) => !!value?.trim() || 'This field is required'
const emailRule = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || 'Enter a valid email address'
const minPassword = (value: string) => value.length >= 8 || 'Use at least 8 characters'
const passwordsMatch = (value: string) => value === form.password || 'Passwords do not match'

async function submit() {
  if (busy.value) return
  busy.value = true
  try {
    const response = await authApi.register({ ...form })
    $q.notify({
      type: 'positive',
      message: response.message || 'Check your email for verification.',
    })
    await router.push({ path: '/verify-email', query: { email: form.email } })
  } catch (error) {
    $q.notify({ type: 'negative', message: errorMessage(error) })
  } finally {
    busy.value = false
  }
}
</script>

<style scoped lang="scss">
.register-page { width:100%; max-width:545px; animation:registerEnter .5s ease both; }
.register-header { margin-bottom:27px; }
.register-header h1 { margin:0; color:#172c48; font-size:clamp(2.4rem,3.25vw,3.75rem); font-weight:750; letter-spacing:-.06em; line-height:1.12; }
.register-header p { margin:10px 0 0; color:#77879b; font-size:15px; }
.register-form { display:flex; flex-direction:column; gap:20px; }
.register-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; align-items:start; }
.register-field { min-width:0; }
.register-field--full { grid-column:1/-1; }
.register-field :deep(.q-field__control) { height:58px; min-height:58px; border-radius:14px; background:#fafbfd; box-shadow:none!important; }
.register-field :deep(.q-field__control::before) { border:1px solid #e0e7ef; border-radius:14px; }
.register-field :deep(.q-field__control::after) { border:1.5px solid #548bc1; border-radius:14px; }
.register-field :deep(.q-field__native), .register-field :deep(.q-field__input) {font-size:14px;color:#172c48;}
.register-field :deep(.q-field__prepend), .register-field :deep(.q-field__append) {height:58px;color:#8494a7;}
.register-field :deep(.q-field__bottom) {padding:6px 5px 0;min-height:0;}
.register-field :deep(.q-field--error .q-field__control::before), .register-field :deep(.q-field--error .q-field__control::after) {border-color:#d34d62;}
.register-submit {height:54px;border-radius:13px;background:#1c4f89!important;color:#fff!important;font-weight:700;box-shadow:0 9px 22px rgba(21,73,125,.13);transition:transform .22s,box-shadow .22s;}
.register-submit:hover {transform:translateY(-2px);box-shadow:0 15px 28px rgba(21,73,125,.17);}
.register-sign-in {text-align:center;font-size:13px;color:#77879b;}
@keyframes registerEnter {from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:600px){.register-grid{grid-template-columns:1fr}.register-field--full{grid-column:auto}}
</style>
