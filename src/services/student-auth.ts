import type { StudentLoginInput, StudentRegistrationInput, StudentSessionResponse, StudentUser } from '~/types/api'
import { useApi } from './api'

export const useStudentAuthApi = () => {
  const api = useApi()
  return {
    register: (input: StudentRegistrationInput) => api<StudentUser>('/student-auth/register', { method: 'POST', body: input }),
    login: (input: StudentLoginInput) => api<StudentSessionResponse>('/student-auth/login', { method: 'POST', body: input, credentials: 'include' }),
    current: () => api<StudentSessionResponse>('/student-auth/me', { credentials: 'include' }),
    logout: (csrfToken: string) => api<void>('/student-auth/logout', {
      method: 'POST', credentials: 'include', headers: { 'x-csrf-token': csrfToken }
    })
  }
}
