import type { BoardMember, ContactMethod, ContactRequestInput, InstitutionalBlock, PublicNews, PublicNewsList, PublicNewsQuery, NewsCategory } from '~/types/api'
import { useApi } from './api'

export const usePublicContentService = () => {
  const api = useApi()
  return {
    institutionalContent: () => api<InstitutionalBlock[]>('/institutional-content'),
    boardMembers: () => api<BoardMember[]>('/board-members'),
    contactMethods: () => api<ContactMethod[]>('/contact-methods'),
    news: (query: PublicNewsQuery = {}) => api<PublicNewsList>('/news', { query }),
    newsCategories: () => api<NewsCategory[]>('/news/categories'),
    newsById: (id: number) => api<PublicNews>(`/news/${id}`),
    sendContactRequest: (body: ContactRequestInput) => api<{ id: number; status: string; sentAt: string }>('/contact-requests', { method: 'POST', body })
  }
}
