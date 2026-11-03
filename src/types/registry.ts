export interface RegistryDescriptionPayload {
  managing_type?: number | null
  managing_office?: number | null
  third_party_company?: string | null
  project_roll_on?: string | null
  project_sign_off?: string | null
  estimation_project_duration?: number | null
}

export interface RegistryRepositoryPayload {
  staging_url?: string | null
  production_url?: string | null
  repo_git?: string | null
  development_solution_type?: number | null
}

export interface RegistryTechStackPayload {
  frontend_stack?: number[]
  backend_stack?: number[]
  database?: string | null
  server_type?: string | null
  server_name?: string | null
}

export interface RegistryStakeholderPayload {
  user_id: number
  stakeholder_type: number
}

export interface RegistryDocumentPayload {
  docs_type: number
  file_path: string
}

export interface RegistryPayload {
  system_name: string
  alias?: string | null
  description?: string | null
  business_owner?: number | null
  status: number
  desc?: RegistryDescriptionPayload | null
  repo?: RegistryRepositoryPayload | null
  tech_stack?: RegistryTechStackPayload | null
  stakeholders?: RegistryStakeholderPayload[]
  docs?: RegistryDocumentPayload[]
}

export interface RegistryRecord extends RegistryPayload {
  id: number
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}
