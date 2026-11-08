import type { ContentStatus, NewsInput } from '~/types/api'

export type NewsFormState = {
  categoryId: number | null
  imageId: string
  title: string
  summary: string
  content: string
  status: ContentStatus
}

export type NewsFormErrors = Partial<Record<keyof NewsFormState | 'general', string>>

const textLength = (value: string) => value.trim().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length

export const validateNewsForm = (form: NewsFormState): NewsFormErrors => {
  const errors: NewsFormErrors = {}
  if (!form.categoryId) errors.categoryId = 'Selecciona una categoría.'
  if (textLength(form.title) < 3) errors.title = 'El título debe tener al menos 3 caracteres.'
  if (textLength(form.summary) < 10) errors.summary = 'El resumen debe tener al menos 10 caracteres.'
  if (textLength(form.content) < 20) errors.content = 'El contenido debe tener al menos 20 caracteres.'
  if (form.imageId.trim() && (!/^\d+$/.test(form.imageId.trim()) || Number(form.imageId) < 1)) {
    errors.imageId = 'El ID de imagen debe ser un número positivo.'
  }
  if (!['BORRADOR', 'PUBLICADO', 'ARCHIVADO'].includes(form.status)) errors.status = 'Selecciona un estado válido.'
  return errors
}

export const newsFormPayload = (form: NewsFormState): NewsInput => ({
  categoryId: form.categoryId!,
  imageId: form.imageId.trim() ? Number(form.imageId) : null,
  title: form.title.trim(),
  summary: form.summary.trim(),
  content: form.content.trim(),
  status: form.status
})
