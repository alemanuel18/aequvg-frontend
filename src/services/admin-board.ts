import type { BoardMember, BoardMemberInput } from '~/types/api'
import { useApi } from './api'

export const useAdminBoardService = () => {
  const api = useApi()
  const session = useAdminSession()
  const mutationOptions = (method: 'POST' | 'PUT' | 'DELETE', body?: unknown) => ({
    method,
    ...(body === undefined ? {} : { body }),
    credentials: 'include' as const,
    headers: { 'x-csrf-token': session.csrfToken.value || useCookie<string | null>('aequvg_csrf').value || '' }
  })
  return {
    list: () => api<BoardMember[]>('/admin/board-members', { credentials: 'include' }),
    create: (body: BoardMemberInput) => api<BoardMember>('/admin/board-members', mutationOptions('POST', body)),
    update: (id: number, body: BoardMemberInput) => api<BoardMember>(`/admin/board-members/${id}`, mutationOptions('PUT', body)),
    reorder: (items: Array<{ id: number; displayOrder: number }>) => api<BoardMember[]>('/admin/board-members/order', mutationOptions('PUT', { items })),
    retire: (id: number) => api<BoardMember>(`/admin/board-members/${id}`, mutationOptions('DELETE'))
  }
}
