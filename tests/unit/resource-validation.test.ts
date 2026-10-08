import { describe, expect, it } from 'vitest'
import { resourceFormPayload, validateResourceForm, type ResourceFormState } from '../../src/composables/resource-validation'

const validForm = (): ResourceFormState => ({ categoryId: 3, fileId: '4', title: 'Guía de laboratorio', description: 'Descripción suficiente para estudiantes.', status: 'PUBLICADO', links: [] })

describe('validación de recursos administrativos', () => {
  it('requiere un destino para publicar', () => {
    const form = validForm(); form.fileId = ''; form.links = []
    expect(validateResourceForm(form).general).toContain('necesita un archivo')
  })

  it('valida contenido saneado, archivo y enlaces', () => {
    const form = validForm(); form.title = '<script></script>'; form.fileId = 'abc'; form.links = [{ label: 'Sitio', url: 'ftp://example.org' }]
    const errors = validateResourceForm(form)
    expect(errors.title).toBeTruthy()
    expect(errors.fileId).toBeTruthy()
    expect(errors.links).toBeTruthy()
  })

  it('construye el payload con sustitución de archivo y enlaces', () => {
    const payload = resourceFormPayload(validForm())
    expect(payload).toMatchObject({ categoryId: 3, fileId: 4, status: 'PUBLICADO' })
    expect(payload.links).toEqual([])
  })
})
