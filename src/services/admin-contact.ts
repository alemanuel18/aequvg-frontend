import type { ContactMethod, ContactMethodInput } from '~/types/api'
import { useApi } from './api'

export const useAdminContactService = () => {
  const api = useApi()
  const session = useAdminSession()
  const mutationOptions = (method: 'POST' | 'PUT' | 'DELETE', body?: ContactMethodInput) => ({
    method,
    ...(body ? { body } : {}),
    credentials: 'include' as const,
    headers: { 'x-csrf-token': session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || '' }
  })
  return {
    list: () => api<ContactMethod[]>('/admin/contact-methods', { credentials: 'include' }),
    create: (body: ContactMethodInput) => api<ContactMethod>('/admin/contact-methods', mutationOptions('POST', body)),
    update: (id: number, body: ContactMethodInput) => api<ContactMethod>(`/admin/contact-methods/${id}`, mutationOptions('PUT', body)),
    deactivate: (id: number) => api<ContactMethod>(`/admin/contact-methods/${id}`, mutationOptions('DELETE'))
  }
}
