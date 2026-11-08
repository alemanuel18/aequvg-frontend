import { describe, expect, it } from 'vitest'
import { validateContactForm } from '../../src/composables/contact-validation'

const valid = { firstNames: 'Ana', lastNames: 'Pérez', email: 'ana@example.com', phone: '+502 5555 5555', type: 'CONSULTA' as const, subject: 'Admisiones', message: 'Deseo recibir más información.', preferredAt: '', consent: true }

describe('formulario de contacto', () => {
  it('acepta una consulta completa', () => expect(validateContactForm(valid)).toEqual({}))
  it('exige fecha para una reunión', () => expect(validateContactForm({ ...valid, type: 'REUNION' })).toHaveProperty('preferredAt'))
  it('valida datos y consentimiento', () => {
    const errors = validateContactForm({ ...valid, email: 'incorrecto', message: '', consent: false })
    expect(errors).toMatchObject({ email: expect.any(String), message: expect.any(String), consent: expect.any(String) })
  })

  it('rechaza nombre, teléfono y asunto vacíos', () => {
    expect(validateContactForm({ ...valid, firstNames: ' ', lastNames: ' ', phone: ' ', subject: ' ' })).toMatchObject({
      firstNames: expect.any(String), lastNames: expect.any(String), phone: expect.any(String), subject: expect.any(String)
    })
  })
})
