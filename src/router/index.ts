import { defineRouter } from '#q-app'
import { createRouter, createWebHistory } from 'vue-router'
import routes from './routes'
import { useAuthStore } from '@/stores/auth'

export default defineRouter(({ store }) => {
  const router = createRouter({ history: createWebHistory(), routes })
  router.beforeEach(async (to) => {
    const auth = useAuthStore(store)
    await auth.ensureInitialized()
    if (to.meta.requiresAuth && !auth.authenticated) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }
    if (to.meta.guest && auth.authenticated) return '/dashboard'
    return true
  })
  return router
})
