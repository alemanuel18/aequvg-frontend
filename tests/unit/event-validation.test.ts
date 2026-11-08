import { describe, expect, it } from 'vitest'
import { datetimeLocalToIsoUtc, eventFormPayload, isoUtcToDatetimeLocal, validateEventForm, type EventFormState } from '../../src/composables/event-validation'

const validForm = (): EventFormState => ({
  imageId: '', name: 'Taller de laboratorio', description: 'Descripción suficientemente extensa para el evento.',
  startsAt: '2030-05-15T18:00', location: 'Auditorio Central UVG', maximumCapacity: '30', additionalInformation: '', status: 'BORRADOR'
})

describe('validación del formulario administrativo de eventos', () => {
  it('acepta un formulario válido y construye el DTO sin createdById', () => {
    const form = validForm()
    expect(validateEventForm(form)).toEqual({})
    expect(eventFormPayload(form)).toMatchObject({ name: form.name, maximumCapacity: 30, imageId: null, status: 'BORRADOR' })
    expect(eventFormPayload(form)).not.toHaveProperty('createdById')
  })

  it('rechaza campos obligatorios inválidos y capacidad no positiva', () => {
    const errors = validateEventForm({ ...validForm(), name: 'x', description: 'corta', startsAt: 'no-date', location: '', maximumCapacity: '0' })
    expect(errors).toMatchObject({ name: expect.any(String), description: expect.any(String), startsAt: expect.any(String), location: expect.any(String), maximumCapacity: expect.any(String) })
  })

  it('valida el ID de imagen cuando se proporciona manualmente', () => {
    expect(validateEventForm({ ...validForm(), imageId: 'abc' }).imageId).toBeTruthy()
  })

  it('convierte fechas UTC a datetime-local y conserva el instante en UTC', () => {
    const iso = '2030-05-15T18:00:00.000Z'
    const local = isoUtcToDatetimeLocal(iso, 'UTC')
    expect(local).toBe('2030-05-15T18:00')
    expect(datetimeLocalToIsoUtc(local, 'UTC')).toBe(iso)
  })

  it('convierte correctamente una zona UTC-6', () => {
    const iso = '2030-05-15T18:00:00.000Z'
    const local = isoUtcToDatetimeLocal(iso, 'America/Guatemala')
    expect(local).toBe('2030-05-15T12:00')
    expect(datetimeLocalToIsoUtc(local, 'America/Guatemala')).toBe(iso)
  })

  it('rechaza fechas inválidas y normaliza opcionales vacíos a null', () => {
    expect(isoUtcToDatetimeLocal('not-a-date', 'UTC')).toBe('')
    expect(datetimeLocalToIsoUtc('2030-02-30T10:00', 'UTC')).toBeNull()
    expect(eventFormPayload(validForm())).toMatchObject({ additionalInformation: null, imageId: null })
  })
})
