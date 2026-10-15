import { computed, onMounted, onUnmounted, ref } from 'vue'

/** Client-side UX cooldown only. Laravel remains responsible for real resend rate limits. */
export function useResendCooldown(storageKey: string, durationSeconds = 60) {
  const secondsLeft = ref(0)
  let interval: ReturnType<typeof setInterval> | undefined

  function refresh() {
    const expiry = Number(sessionStorage.getItem(storageKey) || 0)
    secondsLeft.value = Math.max(0, Math.ceil((expiry - Date.now()) / 1000))
    if (!secondsLeft.value && expiry) sessionStorage.removeItem(storageKey)
  }

  function start() {
    sessionStorage.setItem(storageKey, String(Date.now() + durationSeconds * 1000))
    refresh()
  }

  onMounted(() => {
    refresh()
    // Show the wait immediately upon reaching either verification screen.
    if (secondsLeft.value === 0) start()
    interval = setInterval(refresh, 1000)
  })
  onUnmounted(() => { if (interval) clearInterval(interval) })

  const formatted = computed(() => {
    const m = Math.floor(secondsLeft.value / 60).toString().padStart(2, '0')
    const s = (secondsLeft.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })

  return { secondsLeft, formatted, start }
}
