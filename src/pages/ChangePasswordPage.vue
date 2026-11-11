<template>
  <q-page class="workspace-page security-aligned-page">
    <header class="security-aligned-header">
      <div class="security-aligned-icon"><q-icon name="lock" size="28px" /></div>
      <div>
        <div class="security-aligned-kicker">ONE ICTMS / ACCOUNT SECURITY</div>
        <h1>Change password</h1>
        <p>Keep your account secure by updating your password.</p>
      </div>
    </header>
    <q-card flat bordered class="workspace-card security-aligned-card q-pa-lg">
      <div class="security-aligned-card-title"><q-icon name="shield" size="21px" /> Password settings</div>
      <q-form @submit.prevent="submit" class="q-gutter-md">
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

<style scoped lang="scss">
.security-aligned-page{padding:28px 32px 44px;background:#f4f7fe;min-height:100%;color:#142c61;max-width:1920px;margin:auto}
.security-aligned-header{display:flex;align-items:center;gap:18px;padding:23px 26px;margin-bottom:18px;border:1px solid #d7e3fa;border-radius:17px;background:linear-gradient(112deg,#fff 0%,#f3f7ff 55%,#dbe9ff 100%)}
.security-aligned-icon{display:grid;place-items:center;flex:none;width:52px;height:52px;border:1px solid #dbe5f6;border-radius:13px;background:#fff;color:#1643a0;box-shadow:0 3px 8px #13377113}
.security-aligned-kicker{letter-spacing:1.4px;font-size:10px;font-weight:800;color:#3154aa}
.security-aligned-header h1{font-size:29px;font-weight:800;line-height:1.2;letter-spacing:-.7px;margin:5px 0 4px;color:#10295e}
.security-aligned-header p{color:#627698;font-size:12px;margin:0}
.security-aligned-card{border-radius:15px;border-color:#dbe5f5;box-shadow:0 3px 12px #153a7409;max-width:680px;padding:24px!important}
.security-aligned-card-title{display:flex;align-items:center;gap:10px;font-size:15px;font-weight:800;color:#15316d;padding-bottom:16px;margin-bottom:20px;border-bottom:1px solid #e7edf8}
.security-aligned-card .q-btn[type=submit]{min-height:40px;border-radius:8px;font-weight:700}
@media(max-width:650px){.security-aligned-page{padding:16px}.security-aligned-header{padding:18px 16px;gap:12px}.security-aligned-header h1{font-size:24px}.security-aligned-icon{width:44px;height:44px}}
</style>
