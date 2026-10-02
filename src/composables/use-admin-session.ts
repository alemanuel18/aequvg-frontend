import type { AdminLoginInput, AdminUser } from '~/types/api'
import { useAdminAuthApi } from '~/services/admin-auth'

export const useAdminSession = () => {
  const user = useState<AdminUser | null>('admin-session-user', () => null)
  const csrfToken = useState('admin-session-csrf', () => '')
  const checked = useState('admin-session-checked', () => false)
  const loading = useState('admin-session-loading', () => false)
  const authApi = useAdminAuthApi()

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
    } finally {
      checked.value = true
      loading.value = false
    }
    return user.value
  }

  const login = async (input: AdminLoginInput) => {
    const session = await authApi.login(input)
    user.value = session.user
    csrfToken.value = session.csrfToken ?? ''
    checked.value = true
    return session.user
  }

  const logout = async () => {
    const browserCsrf = useCookie<string | null>('aequvg_csrf').value ?? ''
    await authApi.logout(csrfToken.value || browserCsrf)
    user.value = null
    csrfToken.value = ''
    checked.value = true
  }

  const clear = () => {
    user.value = null
    csrfToken.value = ''
    checked.value = true
  }

  return { user, checked, loading, load, login, logout, clear }
}
