<template>
  <auth-heading title="Forgot password" subtitle="We’ll email you a reset link." />
  <q-form @submit.prevent="submit" class="auth-form q-gutter-md">
    <q-input v-model.trim="email" outlined type="email" label="Email address" :rules="[(v: string) => !!v || 'Email is required']" />
    <q-btn type="submit" color="primary" label="Send reset instructions" :loading="busy" class="full-width auth-submit-btn" unelevated no-caps />
    <div class="text-center"><router-link to="/login">Back to login</router-link></div>
  </q-form>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import AuthHeading from '@/components/AuthHeading.vue'
import { authApi } from '@/services/auth-api'
import { errorMessage } from '@/services/http'
const $q = useQuasar(); const email = ref(''); const busy = ref(false)
async function submit() {
  busy.value = true
  try { const result = await authApi.forgotPassword(email.value); $q.notify({ type: 'positive', message: result.message || 'If your email exists, reset instructions have been sent.' }) }
  catch (e) { $q.notify({ type: 'negative', message: errorMessage(e) }) }
  finally { busy.value = false }
}
</script>
