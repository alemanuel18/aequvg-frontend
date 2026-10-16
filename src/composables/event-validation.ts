import type { EventInput, EventStatus } from '~/types/api'

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone
const zonedParts = (date: Date, timeZone: string) => Object.fromEntries(new Intl.DateTimeFormat('en-US', {
  timeZone, calendar: 'gregory', numberingSystem: 'latn', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
}).formatToParts(date).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value])) as Record<string, string>

export const isoUtcToDatetimeLocal = (value: string, timeZone = browserTimeZone()): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const parts = zonedParts(date, timeZone)
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour === '24' ? '00' : parts.hour}:${parts.minute}`
}

export const datetimeLocalToIsoUtc = (value: string, timeZone = browserTimeZone()): string | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) return null
  const numbers = match.slice(1).map(Number) as [number, number, number, number, number]
  if (numbers[1] < 1 || numbers[1] > 12 || numbers[2] < 1 || numbers[2] > 31 || numbers[3] > 23 || numbers[4] > 59) return null
  const desiredUtc = Date.UTC(numbers[0], numbers[1] - 1, numbers[2], numbers[3], numbers[4])
  const check = new Date(desiredUtc)
  if (check.getUTCFullYear() !== numbers[0] || check.getUTCMonth() !== numbers[1] - 1 || check.getUTCDate() !== numbers[2] || check.getUTCHours() !== numbers[3] || check.getUTCMinutes() !== numbers[4]) return null
  if (timeZone === browserTimeZone()) return new Date(value).toISOString()
  const offsetAt = (instant: number) => {
    const parts = zonedParts(new Date(instant), timeZone)
    return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second)) - instant
  }
  let instant = desiredUtc - offsetAt(desiredUtc)
  instant = desiredUtc - offsetAt(instant)
  return new Date(instant).toISOString()
}

export type EventFormState = { imageId: string; name: string; description: string; startsAt: string; location: string; maximumCapacity: string; additionalInformation: string; status: EventStatus }
export type EventFormErrors = Partial<Record<keyof EventFormState, string>>
const textLength = (value: string) => value.trim().replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().length

export const validateEventForm = (form: EventFormState): EventFormErrors => {
  const errors: EventFormErrors = {}
  if (textLength(form.name) < 3) errors.name = 'El nombre debe tener al menos 3 caracteres.'
  if (textLength(form.description) < 10) errors.description = 'La descripción debe tener al menos 10 caracteres.'
  if (!form.startsAt || !datetimeLocalToIsoUtc(form.startsAt)) errors.startsAt = 'Indica una fecha y hora válidas.'
  if (textLength(form.location) < 3) errors.location = 'La ubicación debe tener al menos 3 caracteres.'
  if (!/^\d+$/.test(form.maximumCapacity) || Number(form.maximumCapacity) < 1) errors.maximumCapacity = 'La capacidad debe ser un entero positivo.'
  if (form.imageId && (!/^\d+$/.test(form.imageId) || Number(form.imageId) < 1)) errors.imageId = 'El ID de imagen debe ser un número positivo.'
  if (!['BORRADOR', 'PUBLICADO', 'FINALIZADO', 'CANCELADO', 'ARCHIVADO'].includes(form.status)) errors.status = 'Selecciona un estado válido.'
  return errors
}

export const eventFormPayload = (form: EventFormState): EventInput => ({
  imageId: form.imageId.trim() ? Number(form.imageId) : null,
  name: form.name.trim(), description: form.description.trim(), startsAt: datetimeLocalToIsoUtc(form.startsAt) ?? '', location: form.location.trim(),
  maximumCapacity: Number(form.maximumCapacity), additionalInformation: form.additionalInformation.trim() || null, status: form.status
})
