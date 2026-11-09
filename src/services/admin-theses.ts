import { useApi } from './api'
import { useAdminSession } from '~/composables/use-admin-session'

export interface ThesisLink {
  id: number
  sourceIdentifier: string | null
  title: string
  author: string | null
  publicationYear: number | null
  summary: string | null
  url: string
  createdById: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  createdBy?: { id: number; name: string }
}
export interface ThesisInput {
  sourceIdentifier?: string | null
  title: string
  author?: string | null
  publicationYear?: number | null
  summary?: string | null
  url: string
  publishedAt?: string | null
}

export const useAdminThesesService = () => {
  const api = useApi()
  const session = useAdminSession()
  const csrf = () => session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || ''
  const mutation = (method: 'POST' | 'PUT' | 'DELETE', body?: unknown) => ({ method, ...(body === undefined ? {} : { body }), credentials: 'include' as const, headers: { 'x-csrf-token': csrf() } })
  return {
    list: (page = 1, pageSize = 100) => api<{ items: ThesisLink[]; pagination: { page: number; pageSize: number; total: number } }>(`/admin/theses?page=${page}&pageSize=${pageSize}`, { credentials: 'include' }),
    create: (body: ThesisInput) => api<ThesisLink>('/admin/theses', mutation('POST', body)),
    update: (id: number, body: Partial<ThesisInput>) => api<ThesisLink>(`/admin/theses/${id}`, mutation('PUT', body)),
    remove: (id: number) => api<{ message: string }>(`/admin/theses/${id}`, mutation('DELETE'))
  }
}
