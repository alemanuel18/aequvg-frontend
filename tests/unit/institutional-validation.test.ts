import { describe, expect, it } from 'vitest'
import {
  validateAnnouncementForm,
  validateFeaturedSelection,
  validateHeroForm
} from '../../src/composables/institutional-validation'

describe('validación de formulario de Inicio (Hero)', () => {
  it('detecta campos obligatorios faltantes', () => {
    const errors = validateHeroForm({
      title: ' ',
      subtitle: '',
      body: '',
      actionLabel: '',
      actionUrl: '',
      status: 'PUBLICADO'
    })

    expect(errors.title).toBeDefined()
    expect(errors.body).toBeDefined()
  })

  it('valida la estructura de enlaces de acción', () => {
    const invalidErrors = validateHeroForm({
      title: 'Título válido',
      subtitle: 'Subtítulo válido',
      body: 'Cuerpo descriptivo válido',
      actionLabel: 'Ver más',
      actionUrl: 'javascript:void(0)',
      status: 'PUBLICADO'
    })
    expect(invalidErrors.actionUrl).toBeDefined()

    const validErrors = validateHeroForm({
      title: 'Título válido',
      subtitle: 'Subtítulo válido',
      body: 'Cuerpo descriptivo válido',
      actionLabel: 'Ver más',
      actionUrl: '/contacto',
      status: 'PUBLICADO'
    })
    expect(validErrors.actionUrl).toBeUndefined()
  })
})

describe('validación de formulario unificado de anuncios', () => {
  it('impide crear más de 3 anuncios activos en Conocer la Licenciatura', () => {
    const errors = validateAnnouncementForm({
      type: 'LABORATORIO',
      title: 'Laboratorio de Química Analítica',
      body: 'Equipamiento de alta gama para análisis químicos.',
      imageUrl: '',
      actionLabel: '',
      actionUrl: '',
      status: 'PUBLICADO'
    }, 3, false)

    expect(errors.general).toContain('límite máximo de 3 anuncios')
  })

  it('permite editar un anuncio aunque ya existan 3 activos', () => {
    const errors = validateAnnouncementForm({
      type: 'TESTIMONIO',
      title: 'Testimonio de egresado',
      body: 'Mi experiencia en la carrera fue muy enriquecedora.',
      imageUrl: '',
      actionLabel: '',
      actionUrl: '',
      status: 'PUBLICADO'
    }, 3, true)

    expect(errors.general).toBeUndefined()
  })

  it('valida tipos permitidos y longitudes mínimas', () => {
    const errors = validateAnnouncementForm({
      // @ts-expect-error tipo no permitido
      type: 'HERO',
      title: 'A',
      body: 'B',
      imageUrl: 'javascript:alert(1)',
      actionLabel: '',
      actionUrl: 'ftp://invalido',
      status: 'PUBLICADO'
    }, 1, false)

    expect(errors.type).toBeDefined()
    expect(errors.title).toBeDefined()
    expect(errors.body).toBeDefined()
    expect(errors.actionUrl).toBeDefined()
  })

  it('valida la URL opcional de imagen', () => {
    const errors = validateAnnouncementForm({
      type: 'LABORATORIO',
      title: 'Laboratorio de Química Analítica',
      body: 'Equipamiento de alta gama para análisis químicos.',
      imageUrl: 'javascript:alert(1)',
      actionLabel: '',
      actionUrl: '',
      status: 'PUBLICADO'
    }, 1, false)

    expect(errors.imageUrl).toBeDefined()
  })
})

describe('validación de selección de destacados', () => {
  it('restringe la selección a máximo 3 eventos y 3 noticias', () => {
    const errors = validateFeaturedSelection([1, 2, 3, 4], [1, 2])
    expect(errors.news).toBeDefined()
    expect(errors.events).toBeUndefined()

    const eventErrors = validateFeaturedSelection([1, 2], [1, 2, 3, 4])
    expect(eventErrors.events).toBeDefined()
  })

  it('acepta selecciones válidas de hasta 3 elementos', () => {
    const errors = validateFeaturedSelection([1, 2, 3], [1])
    expect(Object.keys(errors).length).toBe(0)
  })
})
