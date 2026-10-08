import { describe, expect, it } from 'vitest'
import { newsFormPayload, validateNewsForm, type NewsFormState } from '../../src/composables/news-validation'

const validForm = (): NewsFormState => ({
  categoryId: 2,
  imageId: '42',
  title: 'Convocatoria de laboratorio',
  summary: 'Resumen suficientemente descriptivo.',
  content: 'Contenido suficientemente extenso para publicar una noticia.',
  status: 'PUBLICADO'
})

describe('validación de administración de noticias', () => {
  it('requiere categoría y contenido con longitud útil después de limpiar etiquetas', () => {
    const form = validForm()
    form.categoryId = null
    form.title = '<p></p>'
    form.summary = 'corto'
    form.content = '<strong></strong>'

    const errors = validateNewsForm(form)

    expect(errors.categoryId).toBeDefined()
    expect(errors.title).toBeDefined()
    expect(errors.summary).toBeDefined()
    expect(errors.content).toBeDefined()
  })

  it('valida IDs de imagen positivos y construye el payload esperado', () => {
    const form = validForm()
    expect(newsFormPayload(form)).toMatchObject({ categoryId: 2, imageId: 42, status: 'PUBLICADO' })

    form.imageId = 'imagen'
    expect(validateNewsForm(form).imageId).toBeDefined()
  })

  it('acepta formularios válidos', () => {
    expect(validateNewsForm(validForm())).toEqual({})
  })
})
