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

const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'access-control-allow-origin': '*' } })

Bun.serve({
  port: 3002,
  fetch(request) {
    const url = new URL(request.url)
    if (url.pathname === '/health') return json({ status: 'ok' })
    if (url.pathname === '/api/v1/institutional-content' || url.pathname === '/api/v1/board-members' || url.pathname === '/api/v1/contact-methods') return json([])
    if (url.pathname === '/api/v1/news/categories') return json([{ id: 2, name: 'Convocatorias' }])
    if (url.pathname === '/api/v1/news') {
      const query = url.searchParams.get('q')?.toLowerCase() || ''
      const items = query === 'sin-resultados' ? [] : [news]
      return json({ items, pagination: { page: 1, pageSize: Number(url.searchParams.get('pageSize') || 9), total: items.length } })
    }
    if (url.pathname === '/api/v1/news/7') return json(news)
    if (url.pathname.startsWith('/api/v1/news/')) return json({ error: { code: 'NEWS_NOT_FOUND', message: 'La noticia solicitada no existe.' } }, 404)
    return json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } }, 404)
  }
})
