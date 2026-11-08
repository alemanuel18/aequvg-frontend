import type { AdminFile, AdminResource, AdminResourceList, ContentStatus, ResourceCategory, ResourceInput } from '~/types/api'
import { useApi } from './api'

export const useAdminResourcesService = () => {
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
    list: (params: { q?: string; categoryId?: number; status?: ContentStatus; page?: number; pageSize?: number } = {}) => api<AdminResourceList>(`/admin/resources${query(params)}`, { credentials: 'include' }),
    categories: () => api<ResourceCategory[]>('/resources/categories'),
    create: (body: ResourceInput) => api<AdminResource>('/admin/resources', mutation('POST', body)),
    update: (id: number, body: ResourceInput) => api<AdminResource>(`/admin/resources/${id}`, mutation('PUT', body)),
    remove: (id: number) => api<AdminResource>(`/admin/resources/${id}`, mutation('DELETE')),
    upload: (file: File) => { const body = new FormData(); body.append('file', file); return api<AdminFile>('/admin/files', mutation('POST', body)) },
    removeFile: (id: number) => api<AdminFile>(`/admin/files/${id}`, mutation('DELETE'))
  }
}
