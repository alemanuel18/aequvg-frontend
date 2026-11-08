import { describe, expect, it } from 'vitest'
import { nationalContactPhone, validateContactMethod } from '../../src/composables/contact-method-validation'
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

  it('rechaza nombre y valor público vacíos', () => {
    expect(validateContactMethod({ type: 'EMAIL', label: ' ', value: ' ' })).toMatchObject({
      label: expect.any(String), value: expect.any(String)
    })
  })

  it('exige ocho dígitos nacionales y permite editar números con +502', () => {
    expect(validateContactMethod({ type: 'TELEFONO', label: 'Teléfono', value: '23688000' })).toEqual({})
    for (const value of ['2368800', '+50223688000', '2368 8000', '123456789']) {
      expect(validateContactMethod({ type: 'TELEFONO', label: 'Teléfono', value })).toMatchObject({ value: expect.any(String) })
    }
    expect(nationalContactPhone('+502 2368-8000')).toBe('23688000')
    expect(nationalContactPhone('2368 8000')).toBe('23688000')
  })
})
