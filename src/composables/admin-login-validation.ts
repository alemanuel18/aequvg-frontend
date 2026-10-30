export interface AdminLoginFields {
  email: string
  password: string
}

export type AdminLoginErrors = Partial<Record<keyof AdminLoginFields, string>>

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const validateAdminLogin = (fields: AdminLoginFields): AdminLoginErrors => {
  const errors: AdminLoginErrors = {}
  const email = fields.email.trim()

  if (!email) errors.email = 'Escribe tu correo institucional.'
  else if (email.length > 254 || !emailPattern.test(email)) errors.email = 'Escribe un correo electrónico válido.'
  else if (!email.toLowerCase().endsWith('@uvg.edu.gt')) errors.email = 'Usa tu correo institucional de UVG.'

  if (!fields.password) errors.password = 'Escribe tu contraseña.'
  else if (fields.password.length > 256) errors.password = 'La contraseña supera la longitud permitida.'

  return errors
}
