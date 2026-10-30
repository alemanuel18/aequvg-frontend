export interface EventRegistrationFormState {
  firstNames: string
  lastNames: string
  email: string
  phone: string
  consent: boolean
}

export const validateEventRegistrationForm = (form: EventRegistrationFormState) => {
  const errors: Record<string, string> = {}
  if (form.firstNames.trim().length < 2) errors.firstNames = 'Escribe tus nombres.'
  if (form.lastNames.trim().length < 2) errors.lastNames = 'Escribe tus apellidos.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Escribe un correo válido.'
  if (form.phone.trim().length < 7) errors.phone = 'Escribe un número de teléfono válido.'
  if (!form.consent) errors.consent = 'Debes aceptar la política de privacidad.'
  return errors
}
