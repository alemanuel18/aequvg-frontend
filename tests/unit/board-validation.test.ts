import { describe, expect, it } from 'vitest'
import { boardFormPayload, validateBoardForm, type BoardFormState } from '../../src/composables/board-validation'

const validForm = (): BoardFormState => ({
  photoId: '12', name: 'Ana Pérez', position: 'Presidenta', description: '', institutionalEmail: 'ANA@uvg.edu.gt',
  term: '2026–2027', termStartsAt: '2026-01-01', termEndsAt: '2027-01-01', displayOrder: 1, status: 'ACTIVO'
})

describe('validación de administración de Junta Directiva', () => {
  it('acepta un integrante y normaliza el payload', () => {
    expect(validateBoardForm(validForm())).toEqual({})
    expect(boardFormPayload(validForm())).toMatchObject({ photoId: 12, institutionalEmail: 'ana@uvg.edu.gt', description: null })
  })

  it('rechaza correos externos o dominios que solo imitan al institucional', () => {
    for (const email of ['persona@gmail.com', 'persona@uvg.edu.gt.evil.test', 'persona@sub.uvg.edu.gt']) {
      const form = validForm(); form.institutionalEmail = email
      expect(validateBoardForm(form).institutionalEmail).toBeDefined()
    }
  })

  it('rechaza periodos invertidos, incompletos y fotografías inválidas', () => {
    const inverted = validForm(); inverted.termEndsAt = '2025-01-01'
    expect(validateBoardForm(inverted).termEndsAt).toBeDefined()
    const incomplete = validForm(); incomplete.termEndsAt = ''
    expect(validateBoardForm(incomplete).termStartsAt).toBeDefined()
    const invalidPhoto = validForm(); invalidPhoto.photoId = '-1'
    expect(validateBoardForm(invalidPhoto).photoId).toBeDefined()
  })
})
