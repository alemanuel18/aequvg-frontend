import type { BlockType, ContentStatus } from '~/types/api'

export interface HeroFormState {
  title: string
  subtitle: string
  body: string
  actionLabel: string
  actionUrl: string
  status: ContentStatus
}

export interface AnnouncementFormState {
  type: BlockType
  title: string
  body: string
  imageUrl: string
  actionLabel: string
  actionUrl: string
  status: ContentStatus
}

export const ANNOUNCEMENT_TYPES: readonly { value: BlockType; label: string; description: string }[] = [
  { value: 'LABORATORIO', label: 'Laboratorio', description: 'Instalaciones y equipo de laboratorio para la carrera.' },
  { value: 'TESTIMONIO', label: 'Testimonio', description: 'Experiencias de estudiantes, docentes o egresados.' },
  { value: 'CAMPO_LABORAL', label: 'Campo laboral', description: 'Oportunidades de empleo y desarrollo profesional.' },
  { value: 'PLAN_ESTUDIOS', label: 'Plan de estudios', description: 'Información sobre el pensum y asignaturas formativas.' }
]

export const isValidUrl = (url: string) => {
  const trimmed = url.trim()
  if (!trimmed) return true
  if (trimmed.startsWith('/')) return true
  return /^https?:\/\//i.test(trimmed)
}

export const validateHeroForm = (form: HeroFormState) => {
  const errors: Record<string, string> = {}
  const title = form.title.trim()
  const body = form.body.trim()
  const actionUrl = form.actionUrl.trim()

  if (title.length < 2) {
    errors.title = 'El título principal debe tener al menos 2 caracteres.'
  } else if (title.length > 220) {
    errors.title = 'El título principal no puede superar los 220 caracteres.'
  }

  if (form.subtitle && form.subtitle.trim().length > 320) {
    errors.subtitle = 'El subtítulo no puede superar los 320 caracteres.'
  }

  if (body.length < 2) {
    errors.body = 'La descripción de inicio debe tener al menos 2 caracteres.'
  } else if (body.length > 8000) {
    errors.body = 'La descripción no puede superar los 8000 caracteres.'
  }

  if (actionUrl && !isValidUrl(actionUrl)) {
    errors.actionUrl = 'El enlace debe iniciar con / o ser una URL válida (http/https).'
  }

  return errors
}

export const validateAnnouncementForm = (
  form: AnnouncementFormState,
  activeCount: number,
  isEditing: boolean
) => {
  const errors: Record<string, string> = {}
  const title = form.title.trim()
  const body = form.body.trim()
  const imageUrl = form.imageUrl?.trim() ?? ''
  const actionUrl = form.actionUrl.trim()

  const validTypes: BlockType[] = ['LABORATORIO', 'TESTIMONIO', 'CAMPO_LABORAL', 'PLAN_ESTUDIOS']
  if (!validTypes.includes(form.type)) {
    errors.type = 'Selecciona una categoría de anuncio válida.'
  }

  if (!isEditing && activeCount >= 3) {
    errors.general = 'Ya se alcanzó el límite máximo de 3 anuncios para Conocer la Licenciatura de Química. Modifica o elimina uno existente.'
  }

  if (title.length < 2) {
    errors.title = 'El título del anuncio debe tener al menos 2 caracteres.'
  } else if (title.length > 220) {
    errors.title = 'El título no puede superar los 220 caracteres.'
  }

  if (body.length < 2) {
    errors.body = 'El contenido del anuncio debe tener al menos 2 caracteres.'
  } else if (body.length > 8000) {
    errors.body = 'El contenido no puede superar los 8000 caracteres.'
  }

  if (imageUrl && !isValidUrl(imageUrl)) {
    errors.imageUrl = 'La imagen debe iniciar con / o ser una URL válida (http/https).'
  }

  if (actionUrl && !isValidUrl(actionUrl)) {
    errors.actionUrl = 'El enlace debe iniciar con / o ser una URL válida (http/https).'
  }

  return errors
}

export const validateFeaturedSelection = (newsIds: number[], eventIds: number[]) => {
  const errors: Record<string, string> = {}

  if (newsIds.length > 3) {
    errors.news = 'Puedes seleccionar un máximo de 3 noticias destacadas.'
  }
  if (eventIds.length > 3) {
    errors.events = 'Puedes seleccionar un máximo de 3 eventos destacados.'
  }

  return errors
}
