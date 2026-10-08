import { describe, expect, it } from 'vitest'
import { validateContactMethod } from '../../src/composables/contact-method-validation'
import { contactMethodIcon, sortContactMethods } from '../../src/utils/contact-methods'

describe('validación de medios de contacto', () => {
  it('acepta una red futura mediante OTRO y detecta su icono', () => {
    const input = { type: 'OTRO' as const, label: 'TikTok', value: '@aeq_uvg', url: 'https://tiktok.com/@aeq_uvg', active: true }
    expect(validateContactMethod(input)).toEqual({})
    expect(contactMethodIcon({ ...input, id: 1 })).toBe('tiktok')
  })

  it('valida correo y enlaces requeridos sin exponer el orden numérico', () => {
    expect(validateContactMethod({ type: 'EMAIL', label: 'Correo', value: 'invalido' })).toMatchObject({ value: expect.any(String) })
    expect(validateContactMethod({ type: 'UBICACION', label: 'Campus', value: 'Zona 15', url: 'https://example.com' })).toMatchObject({ url: 'Usa un enlace de Google Maps.' })
    expect(validateContactMethod({ type: 'INSTAGRAM', label: 'Instagram', value: '@aeq', url: '' })).toMatchObject({ url: 'Escribe un enlace HTTPS válido.' })
  })

  it('resuelve empates de orden y mantiene ubicaciones al final', () => {
    const methods = [
      { id: 3, type: 'UBICACION' as const, displayOrder: 0 },
      { id: 2, type: 'OTRO' as const, displayOrder: 1 },
      { id: 1, type: 'EMAIL' as const, displayOrder: 1 }
    ]
    expect(sortContactMethods(methods).map(method => method.id)).toEqual([1, 2, 3])
  })
})
