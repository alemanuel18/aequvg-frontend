export interface ContactFormState { name: string; email: string; phone: string; type: 'CONSULTA' | 'REUNION'; subject: string; message: string; preferredAt: string; consent: boolean }

export const validateContactForm = (form: ContactFormState) => {
  const errors: Record<string, string> = {}
  if (form.name.trim().length < 2) errors.name = 'Escribe tu nombre completo.'
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Escribe un correo válido.'
  if (form.phone.trim().length < 7) errors.phone = 'Escribe un número de teléfono válido.'
  if (form.subject.trim().length < 3) errors.subject = 'Describe brevemente el asunto.'
  if (form.message.trim().length < 10) errors.message = 'El mensaje debe tener al menos 10 caracteres.'
  if (form.type === 'REUNION' && !form.preferredAt) errors.preferredAt = 'Indica una fecha tentativa.'
  if (!form.consent) errors.consent = 'El consentimiento es obligatorio.'
  return errors
}
