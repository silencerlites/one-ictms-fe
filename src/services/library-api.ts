import { http } from './http'
import type { ApiResponse } from '@/types/auth'

export interface LibraryOption {
  id: number
  name: string
  alias?: string | null
  department_id?: number | null
  department?: { id: number; name?: string; alias?: string } | null
  version?: string | null
  is_active?: boolean
}

export interface DepartmentUser {
  id: number
  name: string
  email: string | null
  department_id: number
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

const prefix = import.meta.env.QCLI_LIBRARY_PREFIX || '/api/v1/library'

async function fetchOptions(path: string): Promise<LibraryOption[]> {
  const { data } = await http.get<ApiResponse<LibraryOption[]>>(`${prefix}/${path}`)
  if (!data.success || !Array.isArray(data.data)) {
    throw new Error(data.message || `Unable to load ${path}.`)
  }
  return data.data
}

export const libraryApi = {
  async departmentUsers(departmentId: number): Promise<DepartmentUser[]> {
    // Laravel installations sometimes wrap collections inside data.data.
    // Normalize here so the Registry component always receives one array.
    const response = await http.post<unknown>(
      `${prefix}/department-users`,
      { department_id: departmentId },
    )
    const payload: unknown = response.data
    if (!isObject(payload)) throw new Error('Invalid department users API response.')
    if (payload.success === false) {
      throw new Error(typeof payload.message === 'string' ? payload.message : 'Unable to load department users.')
    }

    const first = payload.data
    const collection: unknown = Array.isArray(first)
      ? first
      : isObject(first) && Array.isArray(first.data)
        ? first.data
        : isObject(first) && Array.isArray(first.users)
          ? first.users
          : Array.isArray(payload.users) ? payload.users : null

    if (!Array.isArray(collection)) {
      throw new Error('Department Users API returned no user array. Check the Network response structure.')
    }

    return collection.flatMap((raw: unknown): DepartmentUser[] => {
      if (!isObject(raw)) return []
      const embedded = isObject(raw.user) ? raw.user : raw
      const id = Number(embedded.id ?? embedded.user_id ?? raw.user_id)
      if (!Number.isSafeInteger(id) || id <= 0) return []
      const detail = isObject(raw.details) ? raw.details
        : isObject(embedded.details) ? embedded.details
          : raw
      const nameParts = [detail.first_name, detail.middle_name, detail.last_name, detail.ext_name]
        .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      const name = [embedded.name, embedded.full_name, raw.name, raw.full_name]
        .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
        ?? (nameParts.join(' ') || `User #${id}`)
      const emailValue = embedded.email ?? raw.email
      const email = typeof emailValue === 'string' ? emailValue : null
      return [{ id, name: name.trim(), email, department_id: departmentId }]
    })
  },
  // Existing department/division/position lookups
  departments: () => fetchOptions('departments'),
  divisions: () => fetchOptions('divisions'),
  positions: () => fetchOptions('positions'),

  // Registry library lookups (same shared Library API module)
  developmentTypes: () => fetchOptions('development-types'),
  managingTypes: () => fetchOptions('managing-types'),
  developmentSolutionTypes: () => fetchOptions('development-solution-types'),
  stakeholderTypes: () => fetchOptions('stakeholder-types'),
  documentTypes: () => fetchOptions('document-types'),
  registryStatuses: () => fetchOptions('registry-statuses'),
  techStacks: () => fetchOptions('tech-stacks'),
}
