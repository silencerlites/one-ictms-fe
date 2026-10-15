import { defineStore } from '#q-app'
import { createPinia } from 'pinia'

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia()
  // pinia.use(SomePiniaPlugin)
  return pinia
})
