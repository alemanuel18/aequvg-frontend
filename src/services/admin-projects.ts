import type { AdminFile, AdminProject, AdminProjectList, ProjectAdminQuery, ProjectInput, ProjectStatus } from '~/types/api'
import { useApi } from './api'

export const useAdminProjectsService = () => {
  const api = useApi()
  const config = useRuntimeConfig()
  const session = useAdminSession()
  const csrf = () => session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || ''
  const mutation = (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) => ({ method, ...(body === undefined ? {} : { body }), credentials: 'include' as const, headers: { 'x-csrf-token': csrf() } })
  const query = (params: ProjectAdminQuery) => { const search = new URLSearchParams(); for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== '') search.set(key, String(value)); return search.size ? `?${search}` : '' }
  return {
    list: (params: ProjectAdminQuery) => api<AdminProjectList>(`/admin/projects${query(params)}`, { credentials: 'include' }),
    detail: (id: number) => api<AdminProject>(`/admin/projects/${id}`, { credentials: 'include' }),
    create: (body: ProjectInput) => api<AdminProject>('/admin/projects', mutation('POST', body)),
    update: (id: number, body: ProjectInput) => api<AdminProject>(`/admin/projects/${id}`, mutation('PUT', body)),
    review: (id: number, status: ProjectStatus, rejectionReason?: string) => api<AdminProject>(`/admin/projects/${id}/review`, mutation('PATCH', { status, ...(rejectionReason ? { rejectionReason } : {}) })),
    remove: (id: number) => api<{ message: string }>(`/admin/projects/${id}`, mutation('DELETE')),
    upload: (file: File) => { const body = new FormData(); body.append('file', file); return api<AdminFile>('/admin/projects/files', mutation('POST', body)) },
    documentUrl: (id: number) => `${String(import.meta.server ? config.apiBaseUrl : config.public.apiBaseUrl).replace(/\/$/, '')}/admin/projects/${id}/document`
  }
}
