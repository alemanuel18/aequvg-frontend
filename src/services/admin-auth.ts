import type { AdminLoginInput, AdminSessionResponse } from '~/types/api'
import { useApi } from './api'

export const useAdminAuthApi = () => {
  const api = useApi()

  return {
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
