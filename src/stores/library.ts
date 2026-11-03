import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { libraryApi } from '@/services/library-api'
import type { LibraryOption } from '@/services/library-api'
import {
  LIBRARY_KINDS, clearLibraryCache, readLibraryCache, writeLibraryCache,
} from '@/services/library-cache'
import type { CachedKind } from '@/services/library-cache'
import { errorMessage } from '@/services/http'

export type LibraryKind = CachedKind
const CACHE_MS = 5 * 60 * 1000

function initialValues<T>(create: () => T): Record<LibraryKind, T> {
  return Object.fromEntries(LIBRARY_KINDS.map((kind) => [kind, create()])) as Record<LibraryKind, T>
}

export const useLibraryStore = defineStore('library', () => {
  const items = reactive(initialValues<LibraryOption[]>(() => []))
  const updatedAt = reactive(initialValues(() => 0))
  const pending = reactive(initialValues(() => false))
  const errors = reactive<Partial<Record<LibraryKind, string>>>({})
  const generation = initialValues(() => 0)
  const inFlight: Partial<Record<LibraryKind, Promise<void>>> = {}

  // Preserve existing store properties so current Quasar pages remain compatible.
  const departments = computed(() => items.departments)
  const divisions = computed(() => items.divisions)
  const positions = computed(() => items.positions)
  const developmentTypes = computed(() => items.developmentTypes)
  const managingTypes = computed(() => items.managingTypes)
  const developmentSolutionTypes = computed(() => items.developmentSolutionTypes)
  const stakeholderTypes = computed(() => items.stakeholderTypes)
  const documentTypes = computed(() => items.documentTypes)
  const registryStatuses = computed(() => items.registryStatuses)
  const techStacks = computed(() => items.techStacks)

  async function load(kind: LibraryKind, force = false): Promise<void> {
    if (inFlight[kind]) return inFlight[kind]
    if (!force && updatedAt[kind] && Date.now() - updatedAt[kind] < CACHE_MS) return

    pending[kind] = true
    delete errors[kind]
    const currentGeneration = generation[kind]
    const promise = (async () => {
      try {
        if (!force && !updatedAt[kind]) {
          try {
            const cached = await readLibraryCache(kind)
            if (currentGeneration !== generation[kind]) return
            if (cached) {
              items[kind] = cached.items
              updatedAt[kind] = cached.updatedAt
              return
            }
          } catch { /* Browser may disallow IndexedDB; fall back to HTTP. */ }
        }
        const records = await libraryApi[kind]()
        if (currentGeneration !== generation[kind]) return
        const timestamp = Date.now()
        items[kind] = records
        updatedAt[kind] = timestamp
        try { await writeLibraryCache(kind, records, timestamp) }
        catch { /* Optional persistence never blocks UI. */ }
      } catch (error) {
        if (currentGeneration === generation[kind]) errors[kind] = errorMessage(error)
        throw error
      } finally {
        pending[kind] = false
      }
    })()
    inFlight[kind] = promise
    try { await promise } finally { delete inFlight[kind] }
  }

  async function loadAll(force = false): Promise<void> {
    const results = await Promise.allSettled(
      (['departments', 'divisions', 'positions'] as const).map((kind) => load(kind, force)),
    )
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('Unable to load Department, Division, and Position data.')
    }
  }

  async function loadRegistryLibraries(force = false): Promise<void> {
    const kinds = LIBRARY_KINDS.filter((kind) => !['departments', 'divisions', 'positions'].includes(kind))
    const results = await Promise.allSettled(kinds.map((kind) => load(kind, force)))
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('Unable to load Registry Library data.')
    }
  }

  async function loadAllLibraries(force = false): Promise<void> {
    const results = await Promise.allSettled(LIBRARY_KINDS.map((kind) => load(kind, force)))
    if (results.every((result) => result.status === 'rejected')) {
      throw new Error('Unable to load Library data.')
    }
  }

  const initialLoading = computed(() => LIBRARY_KINDS.some((kind) => pending[kind] && !updatedAt[kind]))
  const loading = computed(() => LIBRARY_KINDS.some((kind) => pending[kind]))
  const loadError = computed(() => Object.values(errors).filter(Boolean).join(' '))

  function invalidate(kind?: LibraryKind): void {
    for (const item of kind ? [kind] : LIBRARY_KINDS) {
      generation[item] += 1
      updatedAt[item] = 0
      items[item] = []
      delete errors[item]
    }
    void clearLibraryCache(kind).catch(() => undefined)
  }

  function labelFor(kind: LibraryKind, id: number | null | undefined): string {
    if (id == null) return '—'
    const record = items[kind].find((option) => Number(option.id) === Number(id))
    return record?.alias || record?.name || `Unavailable (ID: ${id})`
  }

  return {
    departments, divisions, positions, developmentTypes, managingTypes,
    developmentSolutionTypes, stakeholderTypes, documentTypes, registryStatuses,
    techStacks, items, pending, loading, initialLoading, errors, loadError,
    updatedAt, load, loadAll, loadRegistryLibraries, loadAllLibraries,
    invalidate, labelFor,
  }
})
