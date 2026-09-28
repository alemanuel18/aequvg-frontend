import type { BoardMember, ContactMethod, ContactRequestInput, EventRegistrationInput, EventRegistrationResponse, InstitutionalBlock, PublicNews, PublicNewsList, PublicNewsQuery, NewsCategory, PublicEvent, PublicEventList, PublicEventQuery, PublicProject, PublicProjectList, PublicProjectQuery, PublicResourceList, PublicResourceQuery, ResourceCategory } from '~/types/api'
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
    events: (query: PublicEventQuery = {}) => api<PublicEventList>('/events', { query }),
    eventById: (id: number) => api<PublicEvent>(`/events/${id}`),
    registerForEvent: (eventId: number, body: EventRegistrationInput) =>
      api<EventRegistrationResponse>(`/events/${eventId}/registrations`, { method: 'POST', body }),
    projects: (query: PublicProjectQuery = {}) => api<PublicProjectList>('/projects', { query }),
    projectById: (id: number) => api<PublicProject>(`/projects/${id}`),
    resources: (query: PublicResourceQuery = {}) => api<PublicResourceList>('/resources', { query }),
    resourceCategories: () => api<ResourceCategory[]>('/resources/categories'),
    sendContactRequest: (body: ContactRequestInput) => api<{ id: number; status: string; sentAt: string }>('/contact-requests', { method: 'POST', body })
  }
}
