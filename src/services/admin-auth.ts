import type { AdminLoginInput, AdminSessionResponse } from '~/types/api'
import { useApi } from './api'

export const useAdminAuthApi = () => {
  const api = useApi()

  return {
    requestRegistration: (input: AdminLoginInput & { firstNames: string; lastNames: string }) => api<{ message: string }>('/auth/registration-requests', { method: 'POST', body: input }),
    requestPasswordRecovery: (email: string) => api<{ message: string }>('/auth/password-recovery-requests', { method: 'POST', body: { email } }),
    resetPassword: (token: string, password: string) => api<{ message: string }>('/auth/password-resets', { method: 'POST', body: { token, password } }),
    login: (input: AdminLoginInput) => api<AdminSessionResponse>('/auth/login', {
      method: 'POST',
      body: input,
      credentials: 'include',
    }),
    current: () => api<AdminSessionResponse>('/auth/me', { credentials: 'include' }),
    logout: (csrfToken: string) => api<void>('/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: { 'x-csrf-token': csrfToken },
    }),
  }
}
