import type { StudentLoginInput, StudentRegistrationInput, StudentSessionResponse, StudentUser } from '~/types/api'
import { useApi } from './api'
import { createIdempotencyKey } from '../utils/idempotency'

export const useStudentAuthApi = () => {
  const api = useApi()
  return {
    register: (input: StudentRegistrationInput) => api<StudentUser>('/student-auth/register', { method: 'POST', body: input }),
    login: (input: StudentLoginInput) => api<StudentSessionResponse>('/student-auth/login', { method: 'POST', body: input, credentials: 'include' }),
    current: () => api<StudentSessionResponse>('/student-auth/me', { credentials: 'include' }),
    updateProfile: (input: { firstNames: string; lastNames: string }, csrfToken: string, idempotencyKey = createIdempotencyKey()) => api<StudentSessionResponse>('/student-auth/me', {
      method: 'PATCH', credentials: 'include', headers: { 'x-csrf-token': csrfToken, 'idempotency-key': idempotencyKey }, body: input
    }),
    logout: (csrfToken: string) => api<void>('/student-auth/logout', {
      method: 'POST', credentials: 'include', headers: { 'x-csrf-token': csrfToken }
    }),
    deleteAccount: (input: { email: string; password: string; confirm: true }, csrfToken: string) => api<void>('/student-auth/account', {
      method: 'DELETE', credentials: 'include', headers: { 'x-csrf-token': csrfToken }, body: input
    })
  }
}
