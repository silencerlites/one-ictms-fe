import { http } from './http'
import type { ApiResponse } from '@/types/auth'

export interface LibraryOption {
  id: number
  name: string
  alias?: string | null
  department_id?: number | null
  department?: { id: number; name?: string; alias?: string } | null
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
  departments: () => fetchOptions('departments'),
  divisions: () => fetchOptions('divisions'),
  positions: () => fetchOptions('positions'),
}
