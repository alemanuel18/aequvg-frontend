import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchRequest = vi.hoisted(() => vi.fn().mockResolvedValue({}))
vi.stubGlobal('useRuntimeConfig', () => ({ apiBaseUrl: 'http://api.test', public: { apiBaseUrl: 'http://api.test' } }))
vi.stubGlobal('useAppLogger', () => ({ warn: vi.fn() }))
vi.stubGlobal('$fetch', fetchRequest)

import { useStudentCommentsApi } from '../../src/services/student-comments'
import { useStudentAuthApi } from '../../src/services/student-auth'

describe('headers de idempotencia en operaciones moderadas', () => {
  beforeEach(() => fetchRequest.mockClear())

  it('envía y conserva la clave al crear y editar comentarios', async () => {
    const comments = useStudentCommentsApi()
    await comments.create('EVENTO', 10, 'Texto', 'csrf', 'create-attempt-1')
    await comments.update(7, 'Texto editado', 'csrf', 'edit-attempt-1')

    expect(fetchRequest.mock.calls[0]?.[1]).toMatchObject({ headers: {
      'x-csrf-token': 'csrf', 'idempotency-key': 'create-attempt-1'
    } })
    expect(fetchRequest.mock.calls[1]?.[1]).toMatchObject({ headers: {
      'x-csrf-token': 'csrf', 'idempotency-key': 'edit-attempt-1'
    } })
  })

  it('envía la clave al actualizar el perfil', async () => {
    await useStudentAuthApi().updateProfile({ firstNames: 'Ana', lastNames: 'López' }, 'csrf', 'profile-attempt-1')

    expect(fetchRequest.mock.calls[0]?.[1]).toMatchObject({ headers: {
      'x-csrf-token': 'csrf', 'idempotency-key': 'profile-attempt-1'
    } })
  })
})
