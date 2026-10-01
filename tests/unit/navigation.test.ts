import { describe, expect, it } from 'vitest'
import { adminNavigation, publicNavigation } from '../../src/router/navigation'

describe('navegación pública', () => {
  it('ofrece rutas únicas y accesibles desde el navbar', () => {
    expect(new Set(publicNavigation.map(item => item.to)).size).toBe(publicNavigation.length)
    expect(publicNavigation).toContainEqual({ label: 'Junta directiva', to: '/junta-directiva' })
    expect(publicNavigation).toContainEqual({ label: 'Contacto', to: '/contacto' })
  })
})

describe('navegación administrativa', () => {
  it('ofrece rutas únicas para los módulos habilitados', () => {
    const routes = adminNavigation.flatMap(item => item.to ? [item.to] : [])
    expect(new Set(routes).size).toBe(routes.length)
    expect(routes).toContain('/administrador/panel')
    expect(routes.every(route => route.startsWith('/administrador/'))).toBe(true)
  })

  it('mantiene tesis visible pero sin un enlace activo', () => {
    const thesis = adminNavigation.find(item => item.label === 'Tesis')
    expect(thesis?.disabled).toBe(true)
    expect(thesis?.to).toBeUndefined()
  })
})
