export interface UserDetails {
  id?: number
  user_id?: number
  first_name?: string
  middle_name?: string | null
  last_name?: string
  ext_name?: string | null
  sex?: string | null
  position_id?: number | null
  department_id?: number | null
  division_id?: number | null
  [key: string]: unknown
}

export interface User {
  id: number
  username: string
  email: string
  email_verified_at?: string | null
  details?: UserDetails | null
  [key: string]: unknown
}

export interface ApiResponse<T = unknown> {
  success: boolean
  message?: string
  data?: T
  errors?: Record<string, string[]>
}

export interface LoginChallenge {
  challenge_id?: string
  expires_in?: number
  [key: string]: unknown
}

export interface VerifyLoginResult {
  user?: User
  expires_in?: number
  // The token is intentionally NOT returned in JSON for browser clients.
}

export interface RegisterPayload {
  username: string
  email: string
  password: string
  password_confirmation: string
  first_name: string
  middle_name?: string
  last_name: string
  ext_name?: string
  sex?: string
  position_id?: number | null
  department_id?: number | null
  division_id?: number | null
}
