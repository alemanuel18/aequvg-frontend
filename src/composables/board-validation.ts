import type { BoardMemberInput } from '~/types/api'

export type BoardFormState = {
  photoId: string
  name: string
  position: string
  description: string
  institutionalEmail: string
  term: string
  termStartsAt: string
  termEndsAt: string
  displayOrder: number
  status: 'ACTIVO' | 'INACTIVO'
}

export type BoardFormErrors = Partial<Record<keyof BoardFormState, string>>

export const validateBoardForm = (form: BoardFormState): BoardFormErrors => {
  const errors: BoardFormErrors = {}
  if (form.name.trim().length < 2) errors.name = 'Ingresa un nombre de al menos 2 caracteres.'
  if (form.position.trim().length < 2) errors.position = 'Ingresa un cargo de al menos 2 caracteres.'
  if (!/^[^\s@]+@uvg\.edu\.gt$/i.test(form.institutionalEmail.trim())) errors.institutionalEmail = 'Usa un correo institucional que termine exactamente en @uvg.edu.gt.'
  if (form.term.trim().length < 2) errors.term = 'Ingresa el periodo que se mostrará públicamente.'
  if (Boolean(form.termStartsAt) !== Boolean(form.termEndsAt)) {
    errors.termStartsAt = 'Indica ambas fechas del periodo o deja ambas vacías.'
    errors.termEndsAt = 'Indica ambas fechas del periodo o deja ambas vacías.'
  } else if (form.termStartsAt && form.termEndsAt && form.termStartsAt > form.termEndsAt) {
    errors.termEndsAt = 'La fecha final debe ser posterior o igual a la inicial.'
  }
  if (form.photoId.trim() && (!/^\d+$/.test(form.photoId.trim()) || Number(form.photoId) < 1)) errors.photoId = 'El ID de fotografía debe ser un número positivo.'
  if (!Number.isInteger(form.displayOrder) || form.displayOrder < 0) errors.displayOrder = 'El orden debe ser un entero igual o mayor que cero.'
  return errors
}

export const boardFormPayload = (form: BoardFormState): BoardMemberInput => ({
  photoId: form.photoId.trim() ? Number(form.photoId) : null,
  name: form.name.trim(),
  position: form.position.trim(),
  description: form.description.trim() || null,
  institutionalEmail: form.institutionalEmail.trim().toLowerCase(),
  term: form.term.trim(),
  termStartsAt: form.termStartsAt || null,
  termEndsAt: form.termEndsAt || null,
  displayOrder: form.displayOrder,
  status: form.status
})
