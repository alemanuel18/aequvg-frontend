import type { StudentComment, StudentCommentList, StudentCommentTargetType } from '~/types/api'
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
    )
  }
}
