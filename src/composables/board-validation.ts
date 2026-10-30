import type { BoardMemberInput } from '~/types/api'

export type BoardFormState = {
  firstNames: string
  lastNames: string
  position: string
  description: string
  institutionalEmail: string
  termStartsAt: string
  termEndsAt: string
  status: 'ACTIVO' | 'INACTIVO'
}

export type BoardFormErrors = Partial<Record<keyof BoardFormState, string>>

export const validateBoardForm = (form: BoardFormState): BoardFormErrors => {
  const errors: BoardFormErrors = {}
  if (form.firstNames.trim().length < 2) errors.firstNames = 'Ingresa los nombres.'
  if (form.lastNames.trim().length < 2) errors.lastNames = 'Ingresa los apellidos.'
  if (!BOARD_POSITIONS.includes(form.position as typeof BOARD_POSITIONS[number])) errors.position = 'Selecciona un cargo válido.'
  if (!/^[^\s@]+@uvg\.edu\.gt$/i.test(form.institutionalEmail.trim())) errors.institutionalEmail = 'Usa un correo institucional que termine exactamente en @uvg.edu.gt.'
  if (!['ACTIVO', 'INACTIVO'].includes(form.status)) errors.status = 'Selecciona un estado válido.'
  if (!form.termStartsAt || !form.termEndsAt) {
    errors.termStartsAt = 'Indica la fecha de inicio del periodo.'
    errors.termEndsAt = 'Indica la fecha final del periodo.'
  } else if (form.termStartsAt && form.termEndsAt && form.termStartsAt > form.termEndsAt) {
    errors.termEndsAt = 'La fecha final debe ser posterior o igual a la inicial.'
  }
  return errors
}

export const boardFormPayload = (form: BoardFormState): BoardMemberInput => ({
  firstNames: form.firstNames.trim(),
  lastNames: form.lastNames.trim(),
  position: form.position.trim(),
  description: form.description.trim() || null,
  institutionalEmail: form.institutionalEmail.trim().toLowerCase(),
  termStartsAt: form.termStartsAt,
  termEndsAt: form.termEndsAt,
  status: form.status
})

export const BOARD_POSITIONS = ['Presidente', 'Presidenta', 'Vicepresidente', 'Vicepresidenta', 'Secretario', 'Secretaria', 'Tesorero', 'Tesorera', 'Vocal'] as const
