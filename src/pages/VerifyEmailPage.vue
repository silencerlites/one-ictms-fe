<template>
  <div class="verify-page">
    <auth-heading title="Verify email" subtitle="Enter the code sent to your email." />
    <q-form class="verify-form" @submit.prevent="submit">
      <div v-if="email" class="email-display">
        <q-icon name="mail_outline" size="20px" color="primary" />
        <div class="email-display__content">
          <span class="email-display__label">Verification code sent to</span>
          <span class="email-display__address">{{ email }}</span>
        </div>
      </div>
      <div v-else class="email-display email-display--missing" role="alert">
        <q-icon name="info_outline" size="20px" />
        <div class="email-display__content">
          <span class="email-display__address">Email address unavailable</span>
          <span class="email-display__label">Return to registration to verify your account.</span>
          <router-link to="/register">Back to registration</router-link>
        </div>
      </div>
      <OtpDigitInput v-model="otp" :length="otpLength" :disabled="busy" :error="otpError" />
      <p v-if="otpError" class="verify-error" role="alert">Enter the complete {{ otpLength }}-digit code.</p>
      <q-btn type="submit" unelevated no-caps label="Verify email" class="full-width auth-submit-btn verify-primary" :loading="busy" />
      <ResendCountdown :seconds-left="secondsLeft" :formatted="formatted" button-label="Resend verification code" :loading="resending" :disabled="!email.trim() || busy || resending" @resend="resend" />
      <div class="verify-back"><router-link to="/login">Back to sign in</router-link></div>
    </q-form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import AuthHeading from '@/components/AuthHeading.vue'
import OtpDigitInput from '@/components/OtpDigitInput.vue'
import ResendCountdown from '@/components/ResendCountdown.vue'
import { useResendCooldown } from '@/composables/useResendCooldown'
import { authApi } from '@/services/auth-api'
import { errorMessage } from '@/services/http'
const route = useRoute()
const router = useRouter()
const $q = useQuasar()
const otpLength = 6
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const otp = ref(typeof route.query.otp === 'string' ? route.query.otp.replace(/\D/g, '').slice(0, otpLength) : '')
const busy = ref(false)
const resending = ref(false)
const attempted = ref(false)
const otpError = computed(() => attempted.value && otp.value.length !== otpLength)
const { secondsLeft, formatted, start } = useResendCooldown(`ictms-verify-email-resend-${email.value.toLowerCase()}`)

async function submit() {
  attempted.value = true
  if (otp.value.length !== otpLength || !email.value.trim()) return
  busy.value = true
  try {
    const result = await authApi.verifyEmail(email.value, otp.value)
    $q.notify({ type: 'positive', message: result.message || 'Email verified.' })
    await router.replace('/login')
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) })
  } finally { busy.value = false }
}
async function resend() {
  if (secondsLeft.value > 0 || resending.value) return
  if (!email.value.trim()) { $q.notify({ type: 'warning', message: 'Enter your email.' }); return }
  resending.value = true
  try {
    const result = await authApi.resendVerification(email.value)
    otp.value = ''
    attempted.value = false
    start()
    $q.notify({ type: 'positive', message: result.message || 'Verification code resent.' })
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) })
  } finally { resending.value = false }
}
</script>

<style scoped lang="scss">
.verify-page { width: 100%; }
.verify-form { display: flex; flex-direction: column; gap: 16px; margin-top: 22px; }
.email-display {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f7f7fc;
}
.email-display__content {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}
.email-display__label {
  font-size: 12px;
  color: #7c86a0;
}
.email-display__address {
  font-size: 14px;
  font-weight: 600;
  color: #242766;
  overflow-wrap: anywhere;
}
.email-display--missing {
  background: #fff8f0;
  color: #9e571e;
}
.verify-primary, .verify-secondary { min-height: 54px; width: 100%; border-radius: 13px; margin: 0 !important; }
.verify-error { font-size: 12px; color: #ee1a24; margin: -4px 0 0; }
.verify-back { text-align: center; padding-top: 6px; }
</style>
