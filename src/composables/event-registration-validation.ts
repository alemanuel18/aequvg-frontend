export interface EventRegistrationFormState {
  fullName: string
  email: string
  phone: string
  consent: boolean
}

export const validateEventRegistrationForm = (form: EventRegistrationFormState) => {
  const errors: Record<string, string> = {}
  if (form.fullName.trim().length < 2) errors.fullName = 'Escribe tu nombre completo.'
  if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = 'Escribe un correo válido.'
  if (form.phone.trim().length < 7) errors.phone = 'Escribe un número de teléfono válido.'
  if (!form.consent) errors.consent = 'Debes aceptar la política de privacidad.'
  return errors
}
