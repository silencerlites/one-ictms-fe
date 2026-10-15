import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { libraryApi } from '@/services/library-api'
import type { LibraryOption } from '@/services/library-api'
import { clearLibraryCache, readLibraryCache, writeLibraryCache } from '@/services/library-cache'
import { errorMessage } from '@/services/http'

export type LibraryKind = 'departments' | 'divisions' | 'positions'
const CACHE_MS = 5 * 60 * 1000
const KINDS: readonly LibraryKind[] = ['departments', 'divisions', 'positions']

export const useLibraryStore = defineStore('library', () => {
  const departments = ref<LibraryOption[]>([])
  const divisions = ref<LibraryOption[]>([])
  const positions = ref<LibraryOption[]>([])
  const updatedAt = ref<Record<LibraryKind, number>>({ departments: 0, divisions: 0, positions: 0 })
  const errors = ref<Partial<Record<LibraryKind, string>>>({})
  const pending = ref<Record<LibraryKind, boolean>>({ departments: false, divisions: false, positions: false })
  const inFlight: Partial<Record<LibraryKind, Promise<void>>> = {}
  const generation: Record<LibraryKind, number> = { departments: 0, divisions: 0, positions: 0 }

  function assign(kind: LibraryKind, items: LibraryOption[]): void {
    if (kind === 'departments') departments.value = items
    else if (kind === 'divisions') divisions.value = items
    else positions.value = items
  }

  async function load(kind: LibraryKind, force = false): Promise<void> {
    if (inFlight[kind]) return inFlight[kind]
    if (!force && updatedAt.value[kind] && Date.now() - updatedAt.value[kind] < CACHE_MS) return

    pending.value[kind] = true
    delete errors.value[kind]
    const currentGeneration = generation[kind]
    const promise = (async () => {
      try {
        // Restore encrypted, unexpired data after browser refresh.
        // Force-refresh bypasses persisted cache entirely.
        if (!force && !updatedAt.value[kind]) {
          try {
            const cached = await readLibraryCache(kind)
            if (currentGeneration !== generation[kind]) return
            if (cached) {
              assign(kind, cached.items)
              updatedAt.value[kind] = cached.updatedAt
              return
            }
          } catch {
            // Private mode / denied IndexedDB / insecure context: use network.
          }
        }
        const records = await libraryApi[kind]()
        if (currentGeneration !== generation[kind]) return
        const timestamp = Date.now()
        assign(kind, records)
        updatedAt.value[kind] = timestamp
        // The API response stays authoritative if persistence is unavailable.
        try { await writeLibraryCache(kind, records, timestamp) } catch { /* optional cache */ }
      } catch (error) {
        errors.value[kind] = errorMessage(error)
        throw error
      } finally {
        pending.value[kind] = false
      }
    })()
    inFlight[kind] = promise
    try { await promise } finally { delete inFlight[kind] }
  }

  async function loadAll(force = false): Promise<void> {
    const results = await Promise.allSettled(KINDS.map((kind) => load(kind, force)))
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('Unable to load Department, Division, and Position data.')
    }
  }

  const initialLoading = computed(() => KINDS.some((kind) => pending.value[kind] && !updatedAt.value[kind]))
  const loading = computed(() => Object.values(pending.value).some(Boolean))
  const loadError = computed(() => Object.values(errors.value).filter(Boolean).join(' '))

  // Invalidation also clears persistent entries; next load fetches the API.
  function invalidate(kind?: LibraryKind): void {
    for (const item of kind ? [kind] : KINDS) {
      generation[item] += 1
      updatedAt.value[item] = 0
      assign(item, [])
    }
    void clearLibraryCache(kind).catch(() => undefined)
  }

  function labelFor(kind: LibraryKind, id: number | null | undefined): string {
    if (id == null) return '—'
    const source = kind === 'departments' ? departments.value : kind === 'divisions' ? divisions.value : positions.value
    const record = source.find((option) => Number(option.id) === Number(id))
    return record?.alias || record?.name || `Unavailable (ID: ${id})`
  }

  return { departments, divisions, positions, pending, loading, initialLoading,
    errors, loadError, updatedAt, load, loadAll, invalidate, labelFor }
})
