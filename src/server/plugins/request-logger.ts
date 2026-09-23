import { getRequestURL } from 'h3'

interface RequestTiming {
  requestId: string
  startedAt: number
  path: string
}

const priorities = { debug: 10, info: 20, warn: 30, error: 40 } as const

export default defineNitroPlugin((nitroApp) => {
  const configured = process.env.NUXT_LOG_LEVEL ?? (process.env.NODE_ENV === 'production' ? 'info' : 'debug')
  const minimum = configured in priorities ? priorities[configured as keyof typeof priorities] : priorities.info

  nitroApp.hooks.hook('request', (event) => {
    const path = getRequestURL(event).pathname
    const incomingId = event.headers.get('x-request-id')
    const requestId = incomingId?.slice(0, 100) || crypto.randomUUID()
    event.context.requestLogging = { requestId, startedAt: performance.now(), path } satisfies RequestTiming
    event.node.res.setHeader('x-request-id', requestId)
  })

  nitroApp.hooks.hook('afterResponse', (event) => {
    const timing = event.context.requestLogging as RequestTiming | undefined
    if (!timing || timing.path.startsWith('/_nuxt/') || timing.path === '/favicon.ico' || minimum > priorities.info) return

    console.info(JSON.stringify({
      timestamp: new Date().toISOString(),
      level: 'info',
      service: 'aequvg-frontend',
      event: 'http_request_completed',
      requestId: timing.requestId,
      method: event.method,
      path: timing.path,
      status: event.node.res.statusCode,
      durationMs: Math.round((performance.now() - timing.startedAt) * 100) / 100,
    }))
  })
})
