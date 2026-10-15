export interface StudentLoginFields { email: string; password: string }
export interface StudentRegistrationFields extends StudentLoginFields { name: string; passwordConfirmation: string; isStudent: boolean }
export type StudentLoginErrors = Partial<Record<keyof StudentLoginFields, string>>
export type StudentRegistrationErrors = Partial<Record<keyof StudentRegistrationFields, string>>

const institutionalEmail = /^[^\s@]+@uvg\.edu\.gt$/i
const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/

const validateCredentials = (fields: StudentLoginFields): StudentLoginErrors => {
  const errors: StudentLoginErrors = {}
  const email = fields.email.trim()
  if (!email) errors.email = 'Escribe tu correo institucional.'
  else if (email.length > 254 || !institutionalEmail.test(email)) errors.email = 'Usa tu correo institucional @uvg.edu.gt.'
  if (!fields.password) errors.password = 'Escribe tu contraseña.'
  else if (fields.password.length > 256) errors.password = 'La contraseña supera la longitud permitida.'
  return errors
}

export const validateStudentLogin = validateCredentials

export const validateStudentRegistration = (fields: StudentRegistrationFields): StudentRegistrationErrors => {
  const errors: StudentRegistrationErrors = { ...validateCredentials(fields) }
  const name = fields.name.trim()
  if (name.length < 2) errors.name = 'Escribe tu nombre completo.'
  else if (name.length > 160) errors.name = 'El nombre supera la longitud permitida.'
  if (fields.password && !strongPassword.test(fields.password)) errors.password = 'Usa al menos 12 caracteres con mayúscula, minúscula, número y símbolo.'
  if (fields.passwordConfirmation !== fields.password) errors.passwordConfirmation = 'Las contraseñas no coinciden.'
  if (!fields.isStudent) errors.isStudent = 'Debes confirmar que actualmente eres estudiante de UVG.'
  return errors
}
