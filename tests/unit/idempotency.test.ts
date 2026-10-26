import { describe, expect, it } from 'vitest'
import { getIdempotencyKey } from '../../src/utils/idempotency'

describe('claves de idempotencia del cliente', () => {
  it('reutiliza la clave al reintentar el mismo contenido', () => {
    const firstAttempt = getIdempotencyKey(null, 'publicacion:42:comentario')
    const retry = getIdempotencyKey(firstAttempt, 'publicacion:42:comentario')

    expect(retry).toBe(firstAttempt)
    expect(retry.key).toMatch(/^[a-zA-Z0-9_.:-]{1,128}$/)
  })

  it('genera otra clave si cambia el contenido de la operación', () => {
    const firstAttempt = getIdempotencyKey(null, 'comentario original')
    const editedAttempt = getIdempotencyKey(firstAttempt, 'comentario corregido')

    expect(editedAttempt.key).not.toBe(firstAttempt.key)
  })
})
