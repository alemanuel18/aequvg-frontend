import type { StudentComment, StudentCommentList, StudentCommentRevisionList, StudentCommentTargetType } from '~/types/api'
import { useApi } from './api'

export const useStudentCommentsApi = () => {
  const api = useApi()

  return {
    publication: (targetType: StudentCommentTargetType, targetId: number, page = 1, pageSize = 20) => api<StudentCommentList>(
      `/publications/${targetType}/${targetId}/comments`,
      { query: { page, pageSize } }
    ),
    create: (targetType: StudentCommentTargetType, targetId: number, content: string, csrfToken: string) => api<StudentComment>(
      `/publications/${targetType}/${targetId}/comments`,
      {
        method: 'POST',
        credentials: 'include',
        headers: { 'x-csrf-token': csrfToken },
        body: { content }
      }
    ),
    history: (page = 1, pageSize = 20) => api<StudentCommentList>(
      `/student-auth/me/comments?page=${page}&pageSize=${pageSize}`,
      { credentials: 'include' }
    ),
    update: (id: number, content: string, csrfToken: string) => api<StudentComment>(
      `/student-auth/me/comments/${id}`,
      { method: 'PUT', credentials: 'include', headers: { 'x-csrf-token': csrfToken }, body: { content } }
    ),
    delete: (id: number, csrfToken: string) => api<{ deleted: boolean }>(
      `/student-auth/me/comments/${id}`,
      { method: 'DELETE', credentials: 'include', headers: { 'x-csrf-token': csrfToken } }
    )
  }
}

export const useAdminCommentHistoryApi = () => {
  const api = useApi()
  return {
    history: (page = 1, pageSize = 20) => api<StudentCommentRevisionList>(
      `/admin/comments/history?page=${page}&pageSize=${pageSize}`,
      { credentials: 'include' }
    )
  }
}
