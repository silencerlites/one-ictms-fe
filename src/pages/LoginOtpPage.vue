<template>
  <div class="otp-page">
    <auth-heading title="Check your inbox" subtitle="Enter the code we sent to your email." />
    <q-banner v-if="!challengeId" rounded class="bg-orange-1 q-mb-lg">Your login request has expired. Please sign in again.</q-banner>
    <q-form class="otp-form otp-form--balanced" @submit.prevent="submit">
      <OtpDigitInput v-model="otp" :length="otpLength" :disabled="busy || !challengeId" :error="otpError" />
      <p v-if="otpError" class="otp-error" role="alert">Enter the complete {{ otpLength }}-digit code.</p>
      <q-btn type="submit" unelevated no-caps class="full-width auth-submit-btn otp-primary-action" label="Verify and continue" :loading="busy" :disable="!challengeId" />
      <ResendCountdown :seconds-left="secondsLeft" :formatted="formatted" button-label="Resend code" :loading="resending" :disabled="!challengeId || busy || resending" @resend="resend" />
      <div class="otp-back-link"><router-link to="/login">Back to sign in</router-link></div>
    </q-form>
  </div>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import AuthHeading from '@/components/AuthHeading.vue'
import OtpDigitInput from '@/components/OtpDigitInput.vue'
import ResendCountdown from '@/components/ResendCountdown.vue'
import { useResendCooldown } from '@/composables/useResendCooldown'
import { authApi } from '@/services/auth-api'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/services/http'
const $q = useQuasar()
const router = useRouter()
const auth = useAuthStore()
const otpLength = 6
const challengeId = ref(sessionStorage.getItem('ictms_login_challenge') || '')
const otp = ref('')
const busy = ref(false)
const resending = ref(false)
const otpError = computed(() => otp.value.length > 0 && otp.value.length !== otpLength && attempted.value)
const attempted = ref(false)
const { secondsLeft, formatted, start } = useResendCooldown(`ictms-login-resend-${challengeId.value}`)
async function submit() {
  if (!challengeId.value) return
  if (otp.value.length !== otpLength) { attempted.value = true; return }
  busy.value = true
  try {
    await auth.verifyOtp(challengeId.value, otp.value)
    sessionStorage.removeItem('ictms_login_challenge')
    $q.notify({ type: 'positive', message: 'Signed in successfully.' })
    await router.replace('/dashboard')
  } catch (e) { $q.notify({ type: 'negative', message: errorMessage(e) }) }
  finally { busy.value = false }
}
async function resend() {
  if (!challengeId.value || secondsLeft.value > 0 || resending.value) return
  resending.value = true
  try {
    const result = await authApi.resendLoginOtp(challengeId.value)
    otp.value = ''
    attempted.value = false
    start()
    $q.notify({ type: 'positive', message: result.message || 'Code sent.' })
  } catch (e) { $q.notify({ type: 'negative', message: errorMessage(e) }) }
  finally { resending.value = false }
}
</script>

<style scoped lang="scss">
.otp-form--balanced { display: flex; flex-direction: column; gap: 15px; }
.otp-primary-action, .otp-secondary-action { width: 100%; min-height: 54px; border-radius: 13px; margin: 0 !important; }
.otp-error { margin: 0; color: #ee1a24; font-size: 12px; }
.otp-back-link { text-align: center; padding-top: 8px; }
</style>
