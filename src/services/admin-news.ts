import type { AdminNews, AdminNewsList, ContentStatus, NewsCategory, NewsInput } from '~/types/api'
import { useApi } from './api'

export const useAdminNewsService = () => {
  const api = useApi()
  const session = useAdminSession()

  const getCsrfToken = () => session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || ''
  const mutationOptions = (method: 'POST' | 'PUT' | 'PATCH' | 'DELETE', body?: unknown) => ({
    method,
    ...(body === undefined ? {} : { body }),
    credentials: 'include' as const,
    headers: { 'x-csrf-token': getCsrfToken() }
  })

  return {
    list: (query: { q?: string; categoryId?: number; status?: ContentStatus; page?: number; pageSize?: number } = {}) => {
      const params = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) if (value !== undefined && value !== '') params.set(key, String(value))
      return api<AdminNewsList>(`/admin/news${params.size ? `?${params.toString()}` : ''}`, { credentials: 'include' })
    },
    categories: () => api<NewsCategory[]>('/news/categories'),
    create: (body: NewsInput) => api<AdminNews>('/admin/news', mutationOptions('POST', body)),
    update: (id: number, body: NewsInput) => api<AdminNews>(`/admin/news/${id}`, mutationOptions('PUT', body)),
    archive: (id: number) => api<AdminNews>(`/admin/news/${id}/archive`, mutationOptions('PATCH')),
    remove: (id: number) => api<AdminNews>(`/admin/news/${id}`, mutationOptions('DELETE'))
  }
}
