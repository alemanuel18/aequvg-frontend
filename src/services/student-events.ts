import type { EventRegistrationStatus, StudentEventRegistrationList } from '~/types/api'
import { useApi } from './api'

export const useStudentEventsService = () => {
  const api = useApi()
  const query = (params: { page?: number; pageSize?: number; status?: EventRegistrationStatus }) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, String(value))
    return search.size ? `?${search.toString()}` : ''
  }

  return {
    history: (params: { page?: number; pageSize?: number; status?: EventRegistrationStatus } = {}) =>
      api<StudentEventRegistrationList>(`/student/events/registrations${query(params)}`, { credentials: 'include' })
  }
}
