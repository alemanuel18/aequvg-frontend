import type { ContactMethodInput, ContactMethodType } from '~/types/api'

export const CONTACT_METHOD_TYPES: Array<{ value: ContactMethodType; label: string; help: string }> = [
  { value: 'EMAIL', label: 'Correo electrónico', help: 'El primero activo recibirá los mensajes del formulario.' },
  { value: 'TELEFONO', label: 'Teléfono o WhatsApp', help: 'Ingresa los 8 dígitos de Guatemala; el enlace para llamar se genera automáticamente.' },
  { value: 'UBICACION', label: 'Ubicación', help: 'Requiere un enlace HTTPS de Google Maps.' },
  { value: 'INSTAGRAM', label: 'Instagram', help: 'Perfil oficial de Instagram.' },
  { value: 'FACEBOOK', label: 'Facebook', help: 'Página oficial de Facebook.' },
  { value: 'OTRO', label: 'Otra red o medio', help: 'Permite agregar TikTok, YouTube, LinkedIn, X u otra plataforma futura.' }
]

export const validateContactMethod = (input: ContactMethodInput) => {
  const errors: Record<string, string> = {}
  const value = input.value.trim()
  const url = input.url?.trim() ?? ''
  if (input.label.trim().length < 2) errors.label = 'Escribe una etiqueta de al menos 2 caracteres.'
  if (value.length < 2) errors.value = 'Escribe el dato que se mostrará públicamente.'
  if (input.type === 'EMAIL' && !/^\S+@\S+\.\S+$/.test(value)) errors.value = 'Escribe un correo válido.'
  if (input.type === 'TELEFONO' && !/^\d{8}$/.test(value)) errors.value = 'Ingresa los 8 dígitos del número, sin +502.'
  if (!['EMAIL', 'TELEFONO'].includes(input.type)) {
    try {
      const parsed = new URL(url)
      if (parsed.protocol !== 'https:') errors.url = 'El enlace debe iniciar con https://.'
      if (input.type === 'UBICACION' && !/(^|\.)google\.[a-z.]+$|(^|\.)goo\.gl$|(^|\.)maps\.app\.goo\.gl$/i.test(parsed.hostname)) errors.url = 'Usa un enlace de Google Maps.'
    } catch {
      errors.url = 'Escribe un enlace HTTPS válido.'
    }
  } else if (url && !/^(https?:\/\/|mailto:|tel:)/i.test(url)) {
    errors.url = 'Escribe un enlace válido o deja el campo vacío.'
  }
  return errors
}

export const nationalContactPhone = (value: string) => {
  const compact = value.replace(/[\s().-]/g, '')
  const national = compact.startsWith('+502') ? compact.slice(4) : compact
  return /^\d{8}$/.test(national) ? national : value
}
