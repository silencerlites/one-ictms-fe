import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/services/auth-api'
import type { User } from '@/types/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const authenticated = computed(() => user.value !== null)

  async function refresh() {
    loading.value = true
    try { user.value = await authApi.view() }
    catch { user.value = null }
    finally { loading.value = false; initialized.value = true }
  }

  async function ensureInitialized() {
    if (!initialized.value) await refresh()
  }

  async function verifyOtp(challengeId: string, otp: string) {
    await authApi.verifyLoginOtp(challengeId, otp)
    // Backend issued HttpOnly cookie: obtain identity through authenticated /view.
    await refresh()
    if (!user.value) throw new Error('Login verified, but authenticated user session could not be loaded. Check JWT cookie and /view route.')
  }

  async function logout() {
    try { await authApi.logout() }
    finally { user.value = null; initialized.value = true }
  }

  return { user, initialized, loading, authenticated, refresh, ensureInitialized, verifyOtp, logout }
})
