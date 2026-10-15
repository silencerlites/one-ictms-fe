<template>
  <q-page padding class="workspace-page"><div class="text-h4 page-title q-mb-md">Change password</div>
    <q-card flat class="workspace-card q-pa-lg" style="max-width:540px"><q-form @submit.prevent="submit" class="q-gutter-md">
      <q-input v-model="current" outlined type="password" label="Current password" :rules="[required]" />
      <q-input v-model="password" outlined type="password" label="New password" :rules="[(v: string) => v.length >= 8 || 'At least 8 characters']" />
      <q-input v-model="confirmation" outlined type="password" label="Confirm password" :rules="[(v: string) => v === password || 'Passwords do not match']" />
      <q-btn type="submit" color="primary" label="Change password" :loading="busy" />
    </q-form></q-card>
  </q-page>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { authApi } from '@/services/auth-api'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'
const $q = useQuasar(); const router = useRouter(); const auth = useAuthStore()
const current = ref(''); const password = ref(''); const confirmation = ref(''); const busy = ref(false)
const required = (v: string) => !!v || 'Required'
async function submit() {
  busy.value = true
  try {
    const result = await authApi.changePassword({ current_password: current.value, password: password.value, password_confirmation: confirmation.value })
    $q.notify({ type: 'positive', message: result.message || 'Password changed. Sign in again.' })
    // Conservative security behavior: clear local state, re-authenticate after password change.
    await auth.logout(); await router.replace('/login')
  } catch (e) { $q.notify({ type: 'negative', message: errorMessage(e) }) }
  finally { busy.value = false }
}
</script>
