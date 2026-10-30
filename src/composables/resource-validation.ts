import type { ContentStatus, ResourceInput } from '~/types/api'

export type ResourceLinkForm = { label: string; url: string }
export type ResourceFormState = { categoryId: number | null; fileId: string; title: string; description: string; status: ContentStatus; links: ResourceLinkForm[] }
export type ResourceFormErrors = Partial<Record<'categoryId' | 'fileId' | 'title' | 'description' | 'links' | 'status' | 'general', string>>

const textLength = (value: string) => value.trim().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length

export const validateResourceForm = (form: ResourceFormState): ResourceFormErrors => {
  const errors: ResourceFormErrors = {}
  const fileId = form.fileId.trim()
  const links = form.links.filter(link => link.label.trim() || link.url.trim())
  if (!form.categoryId) errors.categoryId = 'Selecciona una categoría.'
  if (textLength(form.title) < 3) errors.title = 'El título debe tener al menos 3 caracteres.'
  if (textLength(form.description) < 10) errors.description = 'La descripción debe tener al menos 10 caracteres.'
  if (fileId && (!/^\d+$/.test(fileId) || Number(fileId) < 1)) errors.fileId = 'El ID de archivo debe ser un número positivo.'
  for (const link of links) if (textLength(link.label) < 2 || !/^https?:\/\//i.test(link.url.trim())) errors.links = 'Cada enlace requiere una etiqueta y una URL HTTP/HTTPS válida.'
  if (form.status === 'PUBLICADO' && !fileId && !links.length) errors.general = 'Un recurso publicado necesita un archivo o al menos un enlace.'
  if (!['BORRADOR', 'PUBLICADO', 'ARCHIVADO'].includes(form.status)) errors.status = 'Selecciona un estado válido.'
  return errors
}

export const resourceFormPayload = (form: ResourceFormState): ResourceInput => ({
  categoryId: form.categoryId!, fileId: form.fileId.trim() ? Number(form.fileId) : null, title: form.title.trim(), description: form.description.trim(), status: form.status,
  links: form.links.filter(link => link.label.trim() || link.url.trim()).map((link, index) => ({ label: link.label.trim(), url: link.url.trim(), displayOrder: index }))
})
