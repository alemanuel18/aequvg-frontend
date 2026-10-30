import { beforeEach, describe, expect, it } from 'vitest'
import { useToast } from '../../src/composables/use-toast'

describe('useToast composable', () => {
  const toast = useToast()

  beforeEach(() => {
    toast.clear()
  })

  it('agrega toasts de diferentes tipos', () => {
    toast.success('Operación exitosa')
    toast.error('Ocurrió un error')
    toast.warning('Advertencia de prueba')
    toast.info('Mensaje informativo')

    expect(toast.toasts.value.length).toBe(4)
    expect(toast.toasts.value[0].type).toBe('success')
    expect(toast.toasts.value[0].message).toBe('Operación exitosa')
    expect(toast.toasts.value[1].type).toBe('error')
    expect(toast.toasts.value[2].type).toBe('warning')
    expect(toast.toasts.value[3].type).toBe('info')
  })

  it('permite descartar toasts por su identificador', () => {
    const id = toast.info('Aviso 1')
    toast.info('Aviso 2')

    expect(toast.toasts.value.length).toBe(2)
    toast.dismiss(id)
    expect(toast.toasts.value.length).toBe(1)
    expect(toast.toasts.value[0].message).toBe('Aviso 2')
  })

  it('limpia todos los toasts con clear', () => {
    toast.info('Uno')
    toast.info('Dos')
    expect(toast.toasts.value.length).toBe(2)

    toast.clear()
    expect(toast.toasts.value.length).toBe(0)
  })
})
