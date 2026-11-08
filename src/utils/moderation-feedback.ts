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
  return {}
}

export const getModerationFeedback = (code: string, fields?: Record<string, string>): ModerationFeedback | null => {
  if (code === 'OFFENSIVE_NAME') return {
    title: 'Nombre no aceptado',
    message: 'El nombre contiene lenguaje que no podemos aceptar. Revísalo e intenta de nuevo.',
    offerContact: true
  }
  if (code === 'COMMENT_REJECTED_BY_MODERATION') return {
    title: 'Comentario no publicado',
    message: 'El comentario no cumple las reglas de convivencia y no se guardó. Puedes corregirlo e intentarlo otra vez.',
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
    message: 'Tu cuenta está bloqueada y requiere una revisión de la Asociación antes de recuperar el acceso.',
    offerContact: true
  }
  return null
}
