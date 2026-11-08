import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiRequest = vi.hoisted(() => vi.fn().mockResolvedValue({}))
vi.mock('../../src/services/api', () => ({ useApi: () => apiRequest }))

import { useStudentCommentsApi } from '../../src/services/student-comments'
import { useStudentAuthApi } from '../../src/services/student-auth'

describe('headers de idempotencia en operaciones moderadas', () => {
  beforeEach(() => apiRequest.mockClear())

  it('envía y conserva la clave al crear y editar comentarios', async () => {
    const comments = useStudentCommentsApi()
    await comments.create('EVENTO', 10, 'Texto', 'csrf', 'create-attempt-1')
    await comments.update(7, 'Texto editado', 'csrf', 'edit-attempt-1')

    expect(apiRequest.mock.calls[0]?.[1]).toMatchObject({ headers: {
      'x-csrf-token': 'csrf', 'idempotency-key': 'create-attempt-1'
    } })
    expect(apiRequest.mock.calls[1]?.[1]).toMatchObject({ headers: {
      'x-csrf-token': 'csrf', 'idempotency-key': 'edit-attempt-1'
    } })
  })

  it('envía la clave al actualizar el perfil', async () => {
    await useStudentAuthApi().updateProfile({ firstNames: 'Ana', lastNames: 'López' }, 'csrf', 'profile-attempt-1')

    expect(apiRequest.mock.calls[0]?.[1]).toMatchObject({ headers: {
      'x-csrf-token': 'csrf', 'idempotency-key': 'profile-attempt-1'
    } })
  })
})
