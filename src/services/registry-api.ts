import { http } from './http'
import type { ApiResponse } from '@/types/auth'
import type { RegistryPayload, RegistryRecord } from '@/types/registry'

// Uses the existing Axios instance, including cookie authentication and baseURL.
const prefix = import.meta.env.QCLI_REGISTRY_PREFIX || '/api/v1/registry'

export const registryApi = {
  async list(): Promise<ApiResponse<RegistryRecord[]>> {
    const { data } = await http.get<ApiResponse<RegistryRecord[]>>(prefix)
    return data
  },

  async view(id: number): Promise<ApiResponse<RegistryRecord>> {
    const { data } = await http.post<ApiResponse<RegistryRecord>>(`${prefix}/view`, { id })
    return data
  },

  async create(payload: RegistryPayload): Promise<ApiResponse<RegistryRecord>> {
    const { data } = await http.post<ApiResponse<RegistryRecord>>(`${prefix}/create`, payload)
    return data
  },

  async update(id: number, payload: Partial<RegistryPayload>): Promise<ApiResponse<RegistryRecord>> {
    const { data } = await http.post<ApiResponse<RegistryRecord>>(`${prefix}/update`, { ...payload, id })
    return data
  },

  async delete(id: number): Promise<ApiResponse<null>> {
    const { data } = await http.post<ApiResponse<null>>(`${prefix}/delete`, { id })
    return data
  },
}
