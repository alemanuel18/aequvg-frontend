import { describe, expect, it } from 'vitest'
import { validateContactMethod } from '../../src/composables/contact-method-validation'
import { contactMethodIcon } from '../../src/utils/contact-methods'

describe('validación de medios de contacto', () => {
  it('acepta una red futura mediante OTRO y detecta su icono', () => {
    const input = { type: 'OTRO' as const, label: 'TikTok', value: '@aeq_uvg', url: 'https://tiktok.com/@aeq_uvg', displayOrder: 4, active: true }
    expect(validateContactMethod(input)).toEqual({})
    expect(contactMethodIcon({ ...input, id: 1 })).toBe('tiktok')
  })

  it('valida correo, orden y enlaces requeridos', () => {
    expect(validateContactMethod({ type: 'EMAIL', label: 'Correo', value: 'invalido', displayOrder: -1 })).toMatchObject({ value: expect.any(String), displayOrder: expect.any(String) })
    expect(validateContactMethod({ type: 'UBICACION', label: 'Campus', value: 'Zona 15', url: 'https://example.com', displayOrder: 1 })).toMatchObject({ url: 'Usa un enlace de Google Maps.' })
    expect(validateContactMethod({ type: 'INSTAGRAM', label: 'Instagram', value: '@aeq', url: '', displayOrder: 2 })).toMatchObject({ url: 'Escribe un enlace HTTPS válido.' })
  })
})
