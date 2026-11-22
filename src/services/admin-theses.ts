import { useApi } from './api'
import { useAdminSession } from '~/composables/use-admin-session'

export interface ThesisContributor {
  personId: number
  role: 'PRINCIPAL' | 'COAUTOR'
  authorOrder: number
  person: { id: number; name: string }
}
export interface ThesisAuthorOption { id: number; name: string }
export interface ThesisLink {
  id: number
  title: string
  author: string | null
  publicationYear: number | null
  summary: string | null
  url: string
  createdById: number
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  contributors: ThesisContributor[]
  createdBy?: { id: number; name: string }
}
export interface ThesisInput {
  title: string
  contributors: Array<{ personId?: number; name?: string }>
  author?: string
  publicationYear: number
  summary: string
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
    authors: (q = '', page = 1, pageSize = 100) => api<{ items: ThesisAuthorOption[]; pagination: { page: number; pageSize: number; total: number } }>(`/admin/thesis-authors?page=${page}&pageSize=${pageSize}${q ? `&q=${encodeURIComponent(q)}` : ''}`, { credentials: 'include' }),
    create: (body: ThesisInput) => api<ThesisLink>('/admin/theses', mutation('POST', body)),
    update: (id: number, body: Partial<ThesisInput>) => api<ThesisLink>(`/admin/theses/${id}`, mutation('PUT', body)),
    remove: (id: number) => api<{ message: string }>(`/admin/theses/${id}`, mutation('DELETE'))
  }
}
