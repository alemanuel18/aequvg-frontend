import { describe, expect, it } from 'vitest'
import { publicNavigation } from '../../src/router/navigation'

describe('navegación pública', () => {
  it('ofrece rutas únicas y accesibles desde el navbar', () => {
    expect(new Set(publicNavigation.map(item => item.to)).size).toBe(publicNavigation.length)
    expect(publicNavigation).toContainEqual({ label: 'Junta directiva', to: '/junta-directiva' })
    expect(publicNavigation).toContainEqual({ label: 'Contacto', to: '/contacto' })
  })
})
