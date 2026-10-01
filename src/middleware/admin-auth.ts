import { adminNavigation } from '~/router/navigation'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const session = useAdminSession()
  const user = await session.load()
  if (!user) {
    return navigateTo({ path: '/administrador', query: { returnTo: to.fullPath } }, { replace: true })
  }

  const destination = adminNavigation.find(item => item.to === to.path)
  if (destination?.permission && !user.permissions.includes(destination.permission)) {
    return navigateTo('/administrador/panel', { replace: true })
  }
})
