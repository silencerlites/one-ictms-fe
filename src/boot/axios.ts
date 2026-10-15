import { defineBoot } from '#q-app'
import type { AxiosInstance } from 'axios'
import { http } from '@/services/http'

declare module 'vue' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance
  }
}

export default defineBoot(({ app }) => {
  // Only needed for Options API (this.$axios). With <script setup>, import { http } directly.
  app.config.globalProperties.$axios = http
})

export { http }
