import type { StudentCommentList } from '~/types/api'
import { useApi } from './api'

export const useStudentCommentsApi = () => {
  const api = useApi()

  return {
    history: (page = 1, pageSize = 20) => api<StudentCommentList>(
      `/student-auth/me/comments?page=${page}&pageSize=${pageSize}`,
      { credentials: 'include' }
    )
  }
}
