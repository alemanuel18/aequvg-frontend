const news = {
  id: 7,
  categoryId: 2,
  imageId: null,
  title: 'Convocatoria de laboratorio',
  summary: 'Inscripción abierta para la actividad práctica.',
  content: 'La actividad se realizará en el laboratorio central.',
  status: 'PUBLICADO',
  createdAt: '2026-01-15T12:00:00.000Z',
  updatedAt: '2026-01-15T12:00:00.000Z',
  publishedAt: '2026-01-15T12:00:00.000Z',
  category: { id: 2, name: 'Convocatorias', active: true },
  image: null,
  createdBy: { id: 1, name: 'Contenido de desarrollo' }
}

const secondNews = { ...news, id: 8, title: 'Anuncio de segunda página', summary: 'Contenido para validar la paginación.' }

const event = {
  id: 10,
  name: 'Taller de Espectrometría UV-Vis',
  description: 'Aprende los fundamentos y la calibración práctica de espectrofotómetros en química analítica.',
  startsAt: '2030-04-20T16:00:00.000Z',
  location: 'Laboratorio de Química Analítica (E-302)',
  maximumCapacity: 30,
  additionalInformation: 'Se requiere bata de laboratorio y lentes de seguridad.',
  status: 'PUBLICADO',
  image: null
}

const secondEvent = {
  ...event,
  id: 11,
  name: 'Simposio de Química Verde',
  description: 'Conferencias sobre sostenibilidad y procesos químicos industriales.'
}

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'access-control-allow-origin': '*' } })

Bun.serve({
  port: 3002,
  async fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/health') return json({ status: 'ok' })
    if (request.method === 'POST' && url.pathname === '/api/v1/events/10/registrations') {
      const body = await request.json() as Record<string, unknown>
      if (body.website) {
        return json({ error: { code: 'INVALID_REQUEST', message: 'La solicitud no es válida.' } }, 400)
      }
      if (body.email === 'duplicado@uvg.edu.gt') {
        return json({ error: { code: 'ALREADY_REGISTERED', message: 'Ya existe una inscripción registrada con este correo electrónico para este evento.' } }, 409)
      }
      if (body.email === 'lleno@uvg.edu.gt') {
        return json({ error: { code: 'EVENT_FULL', message: 'Este evento ha alcanzado su capacidad máxima.' } }, 409)
      }
      return json({
        id: 101,
        eventId: 10,
        status: 'CONFIRMADA',
        registeredAt: new Date().toISOString()
      }, 201)
    }
    if (url.pathname === '/api/v1/institutional-content' || url.pathname === '/api/v1/board-members' || url.pathname === '/api/v1/contact-methods') return json([])
    if (url.pathname === '/api/v1/news/categories') return json([{ id: 2, name: 'Convocatorias' }])
    if (url.pathname === '/api/v1/news') {
      const query = url.searchParams.get('q')?.toLowerCase() || ''
      if (query === 'sin-resultados') return json({ items: [], pagination: { page: 1, pageSize: 9, total: 0 } })
      if (query === 'error-prueba') return json({ error: { code: 'REQUEST_FAILED', message: 'Error simulado.' } }, 503)
      const page = Number(url.searchParams.get('page') || 1)
      return json({ items: page === 2 ? [secondNews] : [news], pagination: { page, pageSize: Number(url.searchParams.get('pageSize') || 9), total: 10 } })
    }
    if (url.pathname === '/api/v1/news/7') return json(news)
    if (url.pathname.startsWith('/api/v1/news/')) return json({ error: { code: 'NEWS_NOT_FOUND', message: 'La noticia solicitada no existe.' } }, 404)
    if (url.pathname === '/api/v1/events') {
      const query = url.searchParams.get('q')?.toLowerCase() || ''
      if (query === 'sin-resultados') return json({ items: [], pagination: { page: 1, pageSize: 9, total: 0 } })
      if (query === 'error-prueba') return json({ error: { code: 'REQUEST_FAILED', message: 'Error simulado.' } }, 503)
      const page = Number(url.searchParams.get('page') || 1)
      return json({ items: page === 2 ? [secondEvent] : [event], pagination: { page, pageSize: Number(url.searchParams.get('pageSize') || 9), total: 10 } })
    }
    if (url.pathname === '/api/v1/events/10') return json(event)
    if (url.pathname.startsWith('/api/v1/events/')) return json({ error: { code: 'EVENT_NOT_FOUND', message: 'El evento solicitado no existe.' } }, 404)
    return json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } }, 404)
  }
})
