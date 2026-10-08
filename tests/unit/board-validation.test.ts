import { describe, expect, it } from 'vitest'
import { boardFormPayload, validateBoardForm, type BoardFormState } from '../../src/composables/board-validation'

const validForm = (): BoardFormState => ({
  name: 'Ana Pérez', position: 'Presidenta', description: '', institutionalEmail: 'ANA@uvg.edu.gt',
  termStartsAt: '2026-01-01', termEndsAt: '2027-01-01', status: 'ACTIVO'
})

describe('validación de administración de Junta Directiva', () => {
  it('acepta un integrante y normaliza el payload', () => {
    expect(validateBoardForm(validForm())).toEqual({})
    expect(boardFormPayload(validForm())).toMatchObject({ institutionalEmail: 'ana@uvg.edu.gt', description: null, termStartsAt: '2026-01-01', termEndsAt: '2027-01-01' })
  })

  it('rechaza correos externos o dominios que solo imitan al institucional', () => {
    for (const email of ['persona@gmail.com', 'persona@uvg.edu.gt.evil.test', 'persona@sub.uvg.edu.gt']) {
      const form = validForm(); form.institutionalEmail = email
      expect(validateBoardForm(form).institutionalEmail).toBeDefined()
    }
  })

  it('rechaza periodos invertidos, incompletos y cargos fuera del catálogo', () => {
    const inverted = validForm(); inverted.termEndsAt = '2025-01-01'
    expect(validateBoardForm(inverted).termEndsAt).toBeDefined()
    const incomplete = validForm(); incomplete.termEndsAt = ''
    expect(validateBoardForm(incomplete).termStartsAt).toBeDefined()
    const invalidPosition = validForm(); invalidPosition.position = 'Cargo inventado'
    expect(validateBoardForm(invalidPosition).position).toBeDefined()
  })
})
