export const createIdempotencyKey = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`
}

export type PendingIdempotentAttempt = { fingerprint: string; key: string }

export const getIdempotencyKey = (pending: PendingIdempotentAttempt | null, fingerprint: string) => {
  if (pending?.fingerprint === fingerprint) return pending
  return { fingerprint, key: createIdempotencyKey() }
}
