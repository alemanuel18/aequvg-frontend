export type ModerationFeedbackCode =
  | 'OFFENSIVE_NAME'
  | 'COMMENT_REJECTED_BY_MODERATION'
  | 'COMMENT_MODERATION_UNAVAILABLE'
  | 'ACCOUNT_TEMPORARILY_BLOCKED'
  | 'ACCOUNT_PERMANENTLY_BLOCKED'

export type ModerationFeedback = {
  title: string
  message: string
  offerContact: boolean
}

const formatBlockedUntil = (value?: string) => {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeStyle: 'short' }).format(date)
}

export const safeModerationFeedbackFields = (fields?: Record<string, string>): Record<string, string> => {
  if (fields?.blockedUntil) return { blockedUntil: fields.blockedUntil }
  return {
    ...(fields?.firstWarning === 'true' ? { firstWarning: 'true' } : {}),
    ...(fields?.reviewChannel ? { reviewChannel: fields.reviewChannel.slice(0, 300) } : {})
  }
}

export const getModerationFeedback = (code: string, fields?: Record<string, string>): ModerationFeedback | null => {
  if (code === 'OFFENSIVE_NAME') return {
    title: fields?.firstWarning === 'true' ? 'Primera advertencia de moderación' : 'Nombre no aceptado',
    message: fields?.firstWarning === 'true'
      ? 'El nombre contiene lenguaje que no podemos aceptar. Esta es una advertencia; una segunda falta dentro de 12 meses bloquea la cuenta por 7 días.'
      : 'El nombre contiene lenguaje que no podemos aceptar. Revísalo e intenta de nuevo.',
    offerContact: true
  }
  if (code === 'COMMENT_REJECTED_BY_MODERATION') return {
    title: fields?.firstWarning === 'true' ? 'Primera advertencia de moderación' : 'Comentario no publicado',
    message: fields?.firstWarning === 'true'
      ? 'El comentario no cumple las reglas de convivencia y no se publicó. Esta es una advertencia; una segunda falta dentro de 12 meses bloquea la cuenta por 7 días.'
      : 'El comentario no cumple las reglas de convivencia y no se guardó. Puedes corregirlo e intentarlo otra vez.',
    offerContact: true
  }
  if (code === 'COMMENT_MODERATION_UNAVAILABLE') return {
    title: 'No pudimos revisar el comentario',
    message: 'El comentario no se publicó. Intenta de nuevo más tarde.',
    offerContact: false
  }
  if (code === 'ACCOUNT_TEMPORARILY_BLOCKED') {
    const until = formatBlockedUntil(fields?.blockedUntil)
    return {
      title: 'Bloqueo temporal',
      message: until
        ? `Tu cuenta está bloqueada temporalmente hasta el ${until}.`
        : 'Tu cuenta está bloqueada temporalmente. Si necesitas ayuda, comunícate con la Asociación.',
      offerContact: true
    }
  }
  if (code === 'ACCOUNT_PERMANENTLY_BLOCKED') return {
    title: 'Se requiere revisión administrativa',
    message: 'Tu cuenta está bloqueada permanentemente. Puedes apelar después de seis meses escribiendo a asoquimica@uvg.edu.gt. La Asociación revisará el caso; no se desbloquea automáticamente.',
    offerContact: true
  }
  return null
}
