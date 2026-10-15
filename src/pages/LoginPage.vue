<template>
  <section class="login-v32">
    <div class="login-v32__agency" aria-label="DSWD and Bagong Pilipinas">
      <img :src="dswdLogo" alt="DSWD" class="login-v32__dswd" />
      <img :src="bagoLogo" alt="Bagong Pilipinas" class="login-v32__bagong" />
    </div>

    <header class="login-v32__heading">
      <h1>Welcome back</h1>
      <p class="login-v32__subtitle"><span aria-hidden="true">-</span><span>Sign in to your ONE ICTMS account.</span><span aria-hidden="true">-</span></p>
    </header>

    <q-form class="login-v32__form" @submit.prevent="submit">
      <div class="login-v32__field">
        <label for="ictms-username">Username or email</label>
        <q-input
          id="ictms-username"
          v-model.trim="login"
          outlined
          placeholder="Enter your username or email"
          autocomplete="username"
          class="login-v32__input"
          :rules="[required]"
          lazy-rules="ondemand"
          hide-bottom-space
          :disable="busy"
        >
          <template #prepend><q-icon name="person_outline" size="20px" /></template>
        </q-input>
      </div>

      <div class="login-v32__field">
        <label for="ictms-password">Password</label>
        <q-input
          id="ictms-password"
          v-model="password"
          outlined
          placeholder="Enter your password"
          autocomplete="current-password"
          class="login-v32__input"
          :type="show ? 'text' : 'password'"
          :rules="[required]"
          lazy-rules="ondemand"
          hide-bottom-space
          :disable="busy"
        >
          <template #prepend><q-icon name="lock_outline" size="20px" /></template>
          <template #append>
            <q-btn
              flat round dense
              :icon="show ? 'visibility_off' : 'visibility'"
              :aria-label="show ? 'Hide password' : 'Show password'"
              :disable="busy"
              @click="show = !show"
            />
          </template>
        </q-input>
      </div>

      <div class="login-v32__forgot">
        <router-link to="/forgot-password">Forgot password?</router-link>
      </div>

      <q-btn
        type="submit"
        unelevated
        no-caps
        class="login-v32__submit full-width"
        :loading="busy"
        :disable="busy"
      >
        <span>Sign in</span>
        <q-icon name="east" size="19px" class="login-v32__arrow q-ml-sm" />
        <template #loading>
          <q-spinner-dots color="white" size="22px" />
          <span class="q-ml-sm">Signing in...</span>
        </template>
      </q-btn>

      <div class="login-v32__separator"><span>or</span></div>
      <p class="login-v32__register">
        Don't have an account?
        <router-link to="/register">Create an account</router-link>
      </p>
    </q-form>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import dswdLogo from '@/assets/DSWD-Logo.png'
import bagoLogo from '@/assets/Bagong_Pilipinas_Logo.svg.webp'
import { authApi } from '@/services/auth-api'
import { errorMessage } from '@/services/http'

const router = useRouter()
const $q = useQuasar()
const login = ref('')
const password = ref('')
const show = ref(false)
const busy = ref(false)
const required = (v: string) => !!v?.trim() || 'Required'

async function submit() {
  if (busy.value) return
  busy.value = true
  try {
    const response = await authApi.login(login.value, password.value)
    const challengeId = response.data?.challenge_id
    if (!challengeId) throw new Error('Login OTP challenge ID missing. Check /login response mapping.')
    sessionStorage.setItem('ictms_login_challenge', challengeId)
    $q.notify({ type: 'positive', message: response.message || 'OTP sent to your email.' })
    await router.push('/login-otp')
  } catch (e) {
    $q.notify({ type: 'negative', message: errorMessage(e) })
  } finally {
    busy.value = false
  }
}
</script>

<style scoped lang="scss">
.login-v32 {
  position: relative;
  width: 100%;
  max-width: 430px;
  margin-inline: auto;
  padding: 8px 0 24px;
  color: #101f64;
  animation: loginRise .65s cubic-bezier(.2,.8,.2,1) both;
}
.login-v32__agency {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(12px, 2vw, 23px);
  height: 76px;
  margin-bottom: clamp(26px, 4vh, 39px);
}
.login-v32__agency img { display: block; object-fit: contain; max-width: 100%; height: auto; }
.login-v32__dswd { width: min(60%, 1000px); max-height: 200px; }
.login-v32__bagong { width: 100px; max-height: 100px;  margin-top: -25px; }
.login-v32__agency-divider { width: 1px; height: 44px; background: #e4e8f6; flex-shrink: 0; }
.login-v32__heading { margin-bottom: 32px; text-align: center; }
.login-v32__heading h1 {
  margin: 0;
  font-size: clamp(34px, 3vw, 49px);
  line-height: 1.13;
  font-weight: 800;
  letter-spacing: -.055em;
  color: #111f63;
}
/* Center the title and the dashed subtitle together. */
.login-v32__heading p.login-v32__subtitle {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: nowrap;
  gap: 9px;
  margin: 13px 0 0;
  color: #7887b3;
  font-size: clamp(11px, 1vw, 14px);
  line-height: 1.6;
  white-space: nowrap;
}
.login-v32__subtitle > span:first-child,
.login-v32__subtitle > span:last-child {
  color: #526caf;
  font-weight: 700;
}
.login-v32__form { display: flex; flex-direction: column; gap: 18px; }
.login-v32__field { display: grid; gap: 8px; }
.login-v32__field label { color: #223676; font-size: 13px; font-weight: 700; }
.login-v32__input { width: 100%; }
.login-v32__input :deep(.q-field__control) {
  height: 53px;
  min-height: 53px;
  border-radius: 11px;
  background: rgba(251,252,255,.92);
  transition: box-shadow .2s ease, background .2s ease;
}
.login-v32__input :deep(.q-field__control)::before { border: 1px solid #d7dff6; border-radius: 11px; }
.login-v32__input :deep(.q-field__control)::after { border: 2px solid #1645db; border-radius: 11px; }
.login-v32__input :deep(.q-field__native),
.login-v32__input :deep(.q-field__input) { height: 53px; min-height: 53px; padding-block:0!important; color: #263879; font-size: 14px; }
.login-v32__input :deep(.q-field__prepend),
.login-v32__input :deep(.q-field__append) { height: 53px; min-height:53px; align-items:center; color: #8594bb; }
.login-v32__input :deep(.q-field__bottom) { padding: 7px 11px 0; min-height:0; }
.login-v32__input:hover :deep(.q-field__control) { background: #fff; }
.login-v32__input.q-field--focused :deep(.q-field__control) { box-shadow:0 0 0 4px rgba(39,83,211,.08); }
.login-v32__forgot { display: flex; justify-content: flex-end; margin-top: -6px; }
.login-v32__forgot a, .login-v32__register a { font-weight: 700; text-decoration:none; color:#1747db; font-size:13px; }
.login-v32__forgot a:hover, .login-v32__register a:hover { text-decoration:underline; }
.login-v32__submit {
  margin-top: 7px;
  height: 55px;
  border-radius: 12px;
  color: white!important;
  font-size: 15px;
  font-weight: 750;
  background: linear-gradient(110deg,#073dd0,#0b30b5)!important;
  box-shadow:0 13px 25px rgba(14,48,162,.18);
  transition:transform .23s ease,box-shadow .23s ease;
}
.login-v32__submit:not(.disabled):hover { transform:translateY(-2px); box-shadow:0 17px 31px rgba(14,48,162,.25); }
.login-v32__arrow { transition:transform .2s ease; }
.login-v32__submit:hover .login-v32__arrow { transform:translateX(4px); }
.login-v32__separator { display:flex; align-items:center; gap:15px; color:#8a96b8; font-size:13px; }
.login-v32__separator::before,.login-v32__separator::after { content:'';height:1px;background:#e1e7f2;flex:1; }
.login-v32__register { margin: -3px 0 0; text-align:center; color:#7e8aab; font-size:13px; }
@keyframes loginRise { from {opacity:0;transform:translateY(14px)} to {opacity:1;transform:translateY(0)} }
@media(max-width:520px) {
  .login-v32 { padding-top: 0; }
  .login-v32__agency { height:65px; margin-bottom:23px; }
  .login-v32__dswd { width:min(60%,185px); }
  .login-v32__bagong { width:55px; }
  .login-v32__heading { margin-bottom:24px; }
  .login-v32__heading h1 {font-size:37px;}
  .login-v32__heading p.login-v32__subtitle { gap: 5px; font-size: 11px; }
}
@media(prefers-reduced-motion:reduce) {
 .login-v32 {animation:none;}
 .login-v32__submit,.login-v32__arrow,.login-v32__input :deep(.q-field__control) {transition:none;}
}
/* Keep the heading clean; the dashes are part of the subtitle. */
.login-v32__heading h1::after { content: none !important; display:none !important; }
.login-v32__heading p { margin-top: 12px; }
</style>
