import { describe, expect, it } from 'vitest'
import { validateAdminLogin } from '../../src/composables/admin-login-validation'

describe('validación del acceso administrativo', () => {
  it('exige correo y contraseña', () => {
    expect(validateAdminLogin({ email: '', password: '' })).toEqual({
      email: 'Escribe tu correo institucional.',
      password: 'Escribe tu contraseña.',
    })
  })

  it('rechaza correos que no sean institucionales', () => {
    expect(validateAdminLogin({ email: 'persona@example.com', password: 'segura' }).email)
      .toBe('Usa tu correo institucional de UVG.')
  })

  it('acepta credenciales con formato válido', () => {
    expect(validateAdminLogin({ email: 'admin@uvg.edu.gt', password: 'segura' })).toEqual({})
  })
})
