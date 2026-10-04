import type { AdminFeaturedResponse, BlockInput, InstitutionalBlock, PublicEvent, PublicNews } from '~/types/api'
import { useApi } from './api'

export const useAdminContentService = () => {
  const api = useApi()
  const session = useAdminSession()

  const getCsrfToken = () => {
    return session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || ''
  }

  return {
    listBlocks: () => api<InstitutionalBlock[]>('/admin/institutional-content', {
      credentials: 'include'
    }),

    createBlock: (body: BlockInput) => api<InstitutionalBlock>('/admin/institutional-content', {
      method: 'POST',
      body,
      credentials: 'include',
      headers: { 'x-csrf-token': getCsrfToken() }
    }),

    updateBlock: (id: number, body: BlockInput) => api<InstitutionalBlock>(`/admin/institutional-content/${id}`, {
      method: 'PUT',
      body,
      credentials: 'include',
      headers: { 'x-csrf-token': getCsrfToken() }
    }),

    archiveBlock: (id: number) => api<InstitutionalBlock>(`/admin/institutional-content/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'x-csrf-token': getCsrfToken() }
    }),

    featured: () => api<AdminFeaturedResponse>('/admin/institutional-content/featured', {
      credentials: 'include'
    }),

    saveFeatured: (body: { newsIds: number[]; eventIds: number[] }) => api<AdminFeaturedResponse>('/admin/institutional-content/featured', {
      method: 'PUT',
      body,
      credentials: 'include',
      headers: { 'x-csrf-token': getCsrfToken() }
    }),

    listNews: () => api<{ items: PublicNews[] }>('/admin/news?pageSize=50', {
      credentials: 'include'
    }),

    listEvents: () => api<{ items: PublicEvent[] }>('/admin/events?pageSize=50', {
      credentials: 'include'
    })
  }
}
