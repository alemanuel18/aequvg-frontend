import type { BoardMember, ContactMethod, ContactRequestInput, InstitutionalBlock } from '~/types/api'
import { useApi } from './api'

export const usePublicContentService = () => {
  const api = useApi()
  return {
    institutionalContent: () => api<InstitutionalBlock[]>('/institutional-content'),
    boardMembers: () => api<BoardMember[]>('/board-members'),
    contactMethods: () => api<ContactMethod[]>('/contact-methods'),
    sendContactRequest: (body: ContactRequestInput) => api<{ id: number; status: string; sentAt: string }>('/contact-requests', { method: 'POST', body })
  }
}
