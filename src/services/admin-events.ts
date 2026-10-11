import type { AdminEvent, AdminEventList, EventInput, EventStatus } from '~/types/api'
import { useApi } from './api'

export const useAdminEventsService = () => {
  const api = useApi()
  const session = useAdminSession()
  const csrf = () => session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || ''
  const mutation = (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) => ({ method, ...(body === undefined ? {} : { body }), credentials: 'include' as const, headers: { 'x-csrf-token': csrf() } })
  const query = (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') search.set(key, String(value))
    return search.size ? `?${search.toString()}` : ''
  }
  return {
    list: (params: { q?: string; status?: EventStatus; page?: number; pageSize?: number } = {}) => api<AdminEventList>(`/admin/events${query(params)}`, { credentials: 'include' }),
    get: (id: number) => api<AdminEvent>(`/admin/events/${id}`, { credentials: 'include' }),
    create: (body: EventInput) => api<AdminEvent>('/admin/events', mutation('POST', body)),
    update: (id: number, body: EventInput) => api<AdminEvent>(`/admin/events/${id}`, mutation('PUT', body)),
    archive: (id: number) => api<AdminEvent>(`/admin/events/${id}/archive`, mutation('PATCH')),
    remove: (id: number) => api<AdminEvent>(`/admin/events/${id}`, mutation('DELETE')),
  }
}
