import { describe, expect, it } from 'vitest'
import { validateEventRegistrationForm } from '../../src/composables/event-registration-validation'

const valid = {
  fullName: 'Estudiante Ejemplo',
  email: 'estudiante@uvg.edu.gt',
  phone: '+502 5555 1234',
  consent: true
}

describe('validación de formulario de inscripción a eventos', () => {
  it('acepta una inscripción con datos válidos', () => {
    expect(validateEventRegistrationForm(valid)).toEqual({})
  })

  it('exige nombre completo con al menos 2 caracteres y no solo espacios', () => {
    expect(validateEventRegistrationForm({ ...valid, fullName: '' })).toHaveProperty('fullName')
    expect(validateEventRegistrationForm({ ...valid, fullName: '   ' })).toHaveProperty('fullName')
    expect(validateEventRegistrationForm({ ...valid, fullName: 'A' })).toHaveProperty('fullName')
  })

  it('valida formato básico de correo electrónico', () => {
    expect(validateEventRegistrationForm({ ...valid, email: 'correo-invalido' })).toHaveProperty('email')
    expect(validateEventRegistrationForm({ ...valid, email: '' })).toHaveProperty('email')
  })

  it('exige número de teléfono con al menos 7 caracteres', () => {
    expect(validateEventRegistrationForm({ ...valid, phone: '123' })).toHaveProperty('phone')
    expect(validateEventRegistrationForm({ ...valid, phone: '      ' })).toHaveProperty('phone')
  })

  it('exige aceptación explícita de la política de privacidad', () => {
    expect(validateEventRegistrationForm({ ...valid, consent: false })).toHaveProperty('consent')
  })
})
