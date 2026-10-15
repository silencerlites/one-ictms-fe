<template>
  <auth-heading title="Reset password" subtitle="Set a new password for your account." />
  <q-form @submit.prevent="submit" class="auth-form q-gutter-md">
    <q-input v-model.trim="email" outlined label="Email" type="email" :rules="[required]" />
    <q-input v-model.trim="token" outlined label="Reset token" :rules="[required]" />
    <q-input v-model="password" outlined type="password" label="New password" :rules="[(v: string) => v.length >= 8 || 'At least 8 characters']" />
    <q-input v-model="confirmation" outlined type="password" label="Confirm new password" :rules="[(v: string) => v === password || 'Passwords do not match']" />
    <q-btn type="submit" color="primary" label="Reset password" class="full-width auth-submit-btn" unelevated no-caps :loading="busy" />
  </q-form>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import AuthHeading from '@/components/AuthHeading.vue'
import { authApi } from '@/services/auth-api'
import { errorMessage } from '@/services/http'
const route = useRoute(); const router = useRouter(); const $q = useQuasar()
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const password = ref(''); const confirmation = ref(''); const busy = ref(false)
const required = (v: string) => !!v?.trim() || 'Required'
async function submit() {
  busy.value = true
  try {
    const result = await authApi.resetPassword({ email: email.value, token: token.value, password: password.value, password_confirmation: confirmation.value })
    $q.notify({ type: 'positive', message: result.message || 'Password reset successful.' }); await router.replace('/login')
  } catch (e) { $q.notify({ type: 'negative', message: errorMessage(e) }) }
  finally { busy.value = false }
}
</script>
