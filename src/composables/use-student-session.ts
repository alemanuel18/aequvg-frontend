import type { StudentLoginInput, StudentUser } from '~/types/api'
import { useStudentAuthApi } from '~/services/student-auth'

export const useStudentSession = () => {
  const user = useState<StudentUser | null>('student-session-user', () => null)
  const csrfToken = useState('student-session-csrf', () => '')
  const checked = useState('student-session-checked', () => false)
  const loading = useState('student-session-loading', () => false)
  const authApi = useStudentAuthApi()

  const clearLocal = () => {
    user.value = null
    csrfToken.value = ''
    useCookie<string | null>('aequvg_student_csrf').value = null
    checked.value = true
    loading.value = false
  }

  const load = async (force = false) => {
    if (checked.value && !force) return user.value
    if (loading.value) return user.value
    loading.value = true
    try {
      const session = await authApi.current()
      user.value = session.user
      if (session.csrfToken) csrfToken.value = session.csrfToken
    } catch {
      user.value = null
      csrfToken.value = ''
    } finally {
      checked.value = true
      loading.value = false
    }
    return user.value
  }

  const login = async (input: StudentLoginInput) => {
    const session = await authApi.login(input)
    user.value = session.user
    csrfToken.value = session.csrfToken ?? ''
    checked.value = true
    return session.user
  }

  const updateProfile = async (input: { firstNames: string; lastNames: string }, idempotencyKey?: string) => {
    const response = await authApi.updateProfile(input, csrfToken.value || useCookie<string | null>('aequvg_student_csrf').value || '', idempotencyKey)
    user.value = response.user
    return response.user
  }

  const logout = async () => {
    const browserCsrf = useCookie<string | null>('aequvg_student_csrf').value ?? ''
    await authApi.logout(csrfToken.value || browserCsrf)
    clearLocal()
  }

  return { user, csrfToken, checked, loading, load, login, logout, clearLocal, updateProfile }
}
