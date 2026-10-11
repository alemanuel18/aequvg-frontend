import type { ContactMethod } from '~/types/api'

export type ContactIconName = 'facebook' | 'instagram' | 'link' | 'linkedin' | 'mail' | 'map-pin' | 'phone' | 'tiktok' | 'x' | 'youtube'

export const sortContactMethods = <T extends Pick<ContactMethod, 'id' | 'type' | 'displayOrder'>>(methods: T[]) =>
  [...methods].sort((a, b) =>
    Number(a.type === 'UBICACION') - Number(b.type === 'UBICACION')
    || a.displayOrder - b.displayOrder
    || a.id - b.id
  )

export const contactMethodIcon = (method: Pick<ContactMethod, 'type' | 'label' | 'url'>): ContactIconName => {
  if (method.type === 'EMAIL') return 'mail'
  if (method.type === 'TELEFONO') return 'phone'
  if (method.type === 'UBICACION') return 'map-pin'
  if (method.type === 'INSTAGRAM') return 'instagram'
  if (method.type === 'FACEBOOK') return 'facebook'

  const identity = `${method.label} ${method.url ?? ''}`.toLowerCase()
  if (identity.includes('tiktok')) return 'tiktok'
  if (identity.includes('youtube') || identity.includes('youtu.be')) return 'youtube'
  if (identity.includes('linkedin')) return 'linkedin'
  if (identity.includes('twitter') || /(^|[\s/.])x\.com/.test(identity)) return 'x'
  return 'link'
}

export const contactMethodAction = (method: Pick<ContactMethod, 'type' | 'label'>) => {
  if (method.type === 'EMAIL') return 'Enviar correo'
  if (method.type === 'TELEFONO') return 'Llamar ahora'
  if (method.type === 'UBICACION') return 'Abrir en Google Maps'
  return `Visitar ${method.label}`
}
