import { describe, expect, it } from 'vitest'
import { validateStudentLogin, validateStudentRegistration } from '../../src/composables/student-auth-validation'

describe('validación de acceso estudiantil', () => {
  it('exige correo institucional para iniciar sesión', () => {
    expect(validateStudentLogin({ email: 'persona@example.com', password: 'Clave123!' })).toMatchObject({ email: expect.stringContaining('@uvg.edu.gt') })
  })

  it('acepta credenciales institucionales completas', () => {
    expect(validateStudentLogin({ email: 'persona@uvg.edu.gt', password: 'Clave123!' })).toEqual({})
  })

  it('exige condición de estudiante, contraseña robusta y confirmación coincidente', () => {
    expect(validateStudentRegistration({
      firstNames: 'Estudiante',
      lastNames: 'UVG',
      email: 'estudiante@uvg.edu.gt',
      password: 'debil',
      passwordConfirmation: 'otra',
      isStudent: false
    })).toMatchObject({ password: expect.any(String), passwordConfirmation: expect.any(String), isStudent: expect.any(String) })
  })

  it('acepta el registro completo de un estudiante actual', () => {
    expect(validateStudentRegistration({
      firstNames: 'Estudiante',
      lastNames: 'UVG',
      email: 'estudiante@uvg.edu.gt',
      password: 'Estudiante123!',
      passwordConfirmation: 'Estudiante123!',
      isStudent: true
    })).toEqual({})
  })
})
