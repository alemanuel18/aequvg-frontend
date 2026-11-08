import { describe, expect, it } from 'vitest'
import { getModerationFeedback } from '../../src/utils/moderation-feedback'

describe('avisos de moderación para la persona afectada', () => {
  it('explica el rechazo de nombre y comentario sin repetir contenido detectado', () => {
    const nameNotice = getModerationFeedback('OFFENSIVE_NAME')
    const commentNotice = getModerationFeedback('COMMENT_REJECTED_BY_MODERATION')

    expect(nameNotice).toMatchObject({ title: 'Nombre no aceptado', offerContact: true })
    expect(commentNotice).toMatchObject({ title: 'Comentario no publicado', offerContact: true })
    expect(JSON.stringify([nameNotice, commentNotice])).not.toMatch(/insulto|evidencia|reviewChannel/i)
  })

  it('muestra fecha de fin temporal y ofrece contacto sin exponer campos privados', () => {
    const notice = getModerationFeedback('ACCOUNT_TEMPORARILY_BLOCKED', {
      blockedUntil: '2026-10-26T18:30:00.000Z',
      reviewChannel: 'privado@example.org',
      evidence: 'texto detectado'
    })

    expect(notice?.message).toContain('bloqueada temporalmente hasta el')
    expect(notice?.offerContact).toBe(true)
    expect(JSON.stringify(notice)).not.toContain('privado@example.org')
    expect(JSON.stringify(notice)).not.toContain('texto detectado')
  })

  it('pide revisión administrativa para un bloqueo permanente sin mostrar canal interno', () => {
    const notice = getModerationFeedback('ACCOUNT_PERMANENTLY_BLOCKED', { reviewChannel: 'interno@example.org' })

    expect(notice).toMatchObject({ title: 'Se requiere revisión administrativa', offerContact: true })
    expect(JSON.stringify(notice)).not.toContain('interno@example.org')
  })

  it('no presenta aviso si el error no corresponde a MOD', () => {
    expect(getModerationFeedback('INVALID_CREDENTIALS')).toBeNull()
  })
})
