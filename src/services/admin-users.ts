import type { AdminRegistrationRequest, AdminRole, ManagedAdminUser } from '~/types/api'
import { useApi } from './api'

export const useAdminUsersApi = () => {
  const api = useApi()
  const csrf = () => useCookie<string | null>('aequvg_csrf').value ?? ''
  const writeHeaders = () => ({ 'x-csrf-token': csrf() })
  return {
    list: () => api<ManagedAdminUser[]>('/admin/users', { credentials: 'include' }),
    roles: () => api<AdminRole[]>('/admin/roles', { credentials: 'include' }),
    requests: () => api<AdminRegistrationRequest[]>('/admin/registration-requests', { credentials: 'include' }),
    reviewRequest: (id: number, decision: { status: 'APROBADA'; roleId: number } | { status: 'RECHAZADA' }) => api<{ id: number; status: 'APROBADA' | 'RECHAZADA' }>(`/admin/registration-requests/${id}/review`, { method: 'POST', body: decision, credentials: 'include', headers: writeHeaders() }),
    create: (body: { firstNames: string; lastNames: string; email: string; roleId: number; password?: string }) => api<ManagedAdminUser>('/admin/users', { method: 'POST', body, credentials: 'include', headers: writeHeaders() }),
    update: (id: number, body: { firstNames?: string; lastNames?: string; roleId?: number; status?: ManagedAdminUser['status'] }) => api<ManagedAdminUser>(`/admin/users/${id}`, { method: 'PATCH', body, credentials: 'include', headers: writeHeaders() }),
  }
}
