import { adminNavigation } from '~/router/navigation'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return
  const session = useAdminSession()
  // Revalidar la cookie al cambiar de módulo evita dejar una vista montada
  // cuando el backend revocó la sesión en otra pestaña o por expiración.
  const user = await session.load(true)
  if (!user) {
    return navigateTo({ path: '/administrador', query: { returnTo: to.fullPath, reason: 'expired' } }, { replace: true })
  }

  const destination = adminNavigation.find(item => item.to === to.path)
  if (destination?.permission && !user.permissions.includes(destination.permission)) {
    return navigateTo({ path: '/administrador/access-denied', query: { from: to.path } }, { replace: true })
  }
})
