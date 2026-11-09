import type { BlogPost, BlogPostInput, BlogPostList } from '~/types/api'
import { useApi } from './api'

export const useAdminBlogService = () => {
  const api = useApi()
  const session = useAdminSession()
  const csrf = () => session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || ''
  const mutate = (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) => ({ method, ...(body === undefined ? {} : { body }), credentials: 'include' as const, headers: { 'x-csrf-token': csrf() } })
  return {
    list: (query: { q?: string; status?: string; page?: number; pageSize?: number } = {}) => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value))
      return api<BlogPostList>(`/admin/blog${params.size ? `?${params}` : ''}`, { credentials: 'include' })
    },
    get: (id: number) => api<BlogPost>(`/admin/blog/${id}`, { credentials: 'include' }),
    create: (body: BlogPostInput) => api<BlogPost>('/admin/blog', mutate('POST', body)),
    update: (id: number, body: BlogPostInput) => api<BlogPost>(`/admin/blog/${id}`, mutate('PUT', body)),
    archive: (id: number) => api<BlogPost>(`/admin/blog/${id}/archive`, mutate('PATCH')),
    remove: (id: number) => api<BlogPost>(`/admin/blog/${id}`, mutate('DELETE'))
  }
}
