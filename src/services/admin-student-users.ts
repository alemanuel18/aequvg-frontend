import type { ManagedStudentAccountDetail, ManagedStudentAccountList, ModerationPolicySummary, StudentAccountStatus } from '~/types/api'
import { useApi } from './api'

export type ManagedAccountType = 'ESTUDIANTE' | 'INTERESADO'
export type ManagedAccountFilters = { q?: string; status?: StudentAccountStatus | ''; type?: ManagedAccountType | ''; page: number; pageSize: number }

export const useAdminStudentUsersApi = () => {
  const api = useApi()
  const csrf = () => useCookie<string | null>('aequvg_csrf').value ?? ''
  const writeOptions = () => ({ credentials: 'include' as const, headers: { 'x-csrf-token': csrf() } })
  return {
    list: (filters: ManagedAccountFilters) => {
      const query = new URLSearchParams()
      if (filters.q?.trim()) query.set('q', filters.q.trim())
      if (filters.status) query.set('status', filters.status)
      if (filters.type) query.set('type', filters.type)
      query.set('page', String(filters.page))
      query.set('pageSize', String(filters.pageSize))
      return api<ManagedStudentAccountList>(`/admin/student-users?${query.toString()}`, { credentials: 'include' })
    },
    detail: (id: number) => api<ManagedStudentAccountDetail>(`/admin/student-users/${id}`, { credentials: 'include' }),
    moderationPolicy: () => api<ModerationPolicySummary>('/admin/moderation-policy', { credentials: 'include' }),
    excludeModerationIncident: (studentId: number, incidentId: number, reason: string) => api(`/admin/student-users/${studentId}/moderation-incidents/${incidentId}/review`, { method: 'PATCH', body: { reason }, ...writeOptions() }),
    updateStatus: (id: number, body: { status: 'ACTIVO'; reason: string } | { status: 'BLOQUEADO_TEMPORAL'; blockedUntil: string; reason: string } | { status: 'BLOQUEADO_PERMANENTE'; reviewChannel: string; reason: string }) => api(`/admin/student-users/${id}/status`, { method: 'PATCH', body, ...writeOptions() }),
    remove: (id: number, reason: string) => api(`/admin/student-users/${id}`, { method: 'DELETE', body: { reason }, ...writeOptions() }),
  }
}
