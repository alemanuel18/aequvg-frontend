import { describe, expect, it } from 'vitest'
import { adminNavigation, publicNavigation } from '../../src/router/navigation'

describe('navegación pública', () => {
  it('ofrece rutas únicas y accesibles desde el navbar', () => {
    expect(new Set(publicNavigation.map(item => item.to)).size).toBe(publicNavigation.length)
    expect(publicNavigation.some(item => item.to === '/')).toBe(false)
    expect(publicNavigation).toContainEqual({ label: 'Junta Directiva', to: '/junta-directiva' })
    expect(publicNavigation).toContainEqual({ label: 'Tesis', to: '/tesis' })
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

  it('habilita la gestión de tesis para cuentas con el permiso correspondiente', () => {
    const thesis = adminNavigation.find(item => item.label === 'Tesis')
    expect(thesis?.disabled).toBeUndefined()
    expect(thesis?.to).toBe('/administrador/tesis')
    expect(thesis?.permission).toBe('PAPERS_MANAGE')
  })
})
