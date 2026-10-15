import type { ApiResponse, LoginChallenge, RegisterPayload, User, VerifyLoginResult } from '@/types/auth'
import { csrfPost, http } from './http'

const prefix = import.meta.env.QCLI_AUTH_PREFIX || '/api/v1/auth'
const endpoint = (path: string) => `${prefix}/${path}`

// `User` has an index signature, so `'user' in payload` alone doesn't narrow the type.
function hasUser(p: User | { user: User }): p is { user: User } {
  return 'user' in p && typeof p.user === 'object' && p.user !== null
}

// Adapt these request field names to your Laravel AuthRequest if it differs.
export const authApi = {
  register: (payload: RegisterPayload) => csrfPost<ApiResponse>(endpoint('register'), payload),
  verifyEmail: (email: string, otp: string) => csrfPost<ApiResponse>(endpoint('verify-email'), { email, otp }),
  resendVerification: (email: string) => csrfPost<ApiResponse>(endpoint('resend-verification'), { email }),
  login: (login: string, password: string) =>
    csrfPost<ApiResponse<LoginChallenge>>(endpoint('login'), { login, password }),
  verifyLoginOtp: (challenge_id: string, otp: string) =>
    csrfPost<ApiResponse<VerifyLoginResult>>(endpoint('verify-login-otp'), { challenge_id, otp }),
  resendLoginOtp: (challenge_id: string) =>
    csrfPost<ApiResponse>(endpoint('resend-login-otp'), { challenge_id }),
  forgotPassword: (email: string) => csrfPost<ApiResponse>(endpoint('forgot-password'), { email }),
  resetPassword: (payload: { email: string; token: string; password: string; password_confirmation: string }) =>
    csrfPost<ApiResponse>(endpoint('reset-password'), payload),
  changePassword: (payload: { current_password: string; password: string; password_confirmation: string }) =>
    csrfPost<ApiResponse>(endpoint('change-password'), payload),
  logout: () => csrfPost<ApiResponse>(endpoint('logout')),
  async view(): Promise<User> {
    const { data: response } = await http.get<ApiResponse<User | { user: User }>>(endpoint('view'))
    if (!response.success || !response.data) throw new Error(response.message || 'Unable to load user.')

    const payload = response.data
    return hasUser(payload) ? payload.user : payload
  }
}