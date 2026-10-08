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
const adminNews = { ...news, updatedAt: '2026-01-15T12:00:00.000Z' }

const resource = {
  id: 9, categoryId: 3, fileId: 4, title: 'Guía de seguridad de laboratorio', description: 'Material para preparar prácticas de laboratorio de forma segura.', status: 'PUBLICADO',
  createdAt: '2026-01-15T12:00:00.000Z', publishedAt: '2026-01-15T12:00:00.000Z', category: { id: 3, name: 'Laboratorio', active: true },
  file: { id: 4, originalName: 'guia-seguridad.pdf', mimeType: 'application/pdf', downloadUrl: 'http://localhost:3002/materials/guia-seguridad.pdf' },
  links: [{ id: 1, label: 'Referencia UVG', url: 'https://www.uvg.edu.gt/', displayOrder: 1 }], createdBy: { id: 1, name: 'Contenido de desarrollo' }
}
const secondResource = { ...resource, id: 10, file: null, title: 'Manual de segunda página', description: 'Contenido para validar la paginación de recursos.' }

const event = {
  id: 10,
  name: 'Taller de Espectrometría UV-Vis',
  description: 'Aprende los fundamentos y la calibración práctica de espectrofotómetros en química analítica.',
  startsAt: '2030-04-20T16:00:00.000Z',
  location: 'Laboratorio de Química Analítica (E-302)',
  maximumCapacity: 30,
  availableCapacity: 12,
  additionalInformation: 'Se requiere bata de laboratorio y lentes de seguridad.',
  status: 'PUBLICADO',
  image: null
}

const secondEvent = {
  ...event,
  id: 11,
  name: 'Simposio de Química Verde',
  description: 'Conferencias sobre sostenibilidad y procesos químicos industriales.',
  maximumCapacity: 50,
  availableCapacity: 1
}

const fullEvent = {
  ...event,
  id: 12,
  name: 'Taller Agotado',
  description: 'Evento con cupos totalmente llenos.',
  maximumCapacity: 20,
  availableCapacity: 0
}

const project = {
  id: 20,
  title: 'Análisis de microplásticos en fuentes hídricas urbanas',
  slug: 'analisis-microplasticos-fuentes-hidricas',
  description: 'Investigación para identificar microplásticos en muestras de agua mediante espectroscopía y clasificación de datos.',
  repositoryUrl: null,
  liveUrl: null,
  type: 'PROYECTO',
  status: 'APROBADO',
  createdAt: '2026-01-15T12:00:00.000Z',
  author: { id: 1, name: 'Contenido de desarrollo' },
  coverImage: null
}

const secondProject = { ...project, id: 21, title: 'Tesis de segunda página', slug: 'tesis-segunda-pagina', type: 'TESIS' }

const institutionalBlocks = [
  {
    id: 1,
    type: 'HERO',
    title: 'Licenciatura en Química Farmacéutica y Pura',
    subtitle: 'Excelencia científica e investigación con impacto social.',
    body: 'Formamos profesionales con capacidad analítica, ética y liderazgo para innovar en la ciencia.',
    imageUrl: null,
    actionLabel: 'Conocer la carrera',
    actionUrl: '#conocer-carrera',
    displayOrder: 0,
    status: 'PUBLICADO',
    publishedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 2,
    type: 'LABORATORIO',
    title: 'Laboratorios Especializados',
    subtitle: 'Espacios de alta tecnología',
    body: 'Instalaciones equipadas para cromatografía, espectrometría y síntesis orgánica.',
    imageUrl: null,
    actionLabel: null,
    actionUrl: null,
    displayOrder: 1,
    status: 'PUBLICADO',
    publishedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 3,
    type: 'CAMPO_LABORAL',
    title: 'Oportunidades Laborales',
    subtitle: 'Impacto en la industria',
    body: 'Nuestros graduados destacan en control de calidad, investigación aplicada y docencia.',
    imageUrl: null,
    actionLabel: null,
    actionUrl: null,
    displayOrder: 2,
    status: 'PUBLICADO',
    publishedAt: '2026-01-01T00:00:00.000Z'
  },
  {
    id: 4,
    type: 'TESTIMONIO',
    title: 'Experiencia de Estudiantes',
    subtitle: 'Comunidad activa',
    body: 'La carrera brinda un balance único entre formación teórica rigurosa y aplicación práctica.',
    imageUrl: null,
    actionLabel: null,
    actionUrl: null,
    displayOrder: 3,
    status: 'PUBLICADO',
    publishedAt: '2026-01-01T00:00:00.000Z'
  }
]

const allowedOrigin = `http://127.0.0.1:${process.env.PLAYWRIGHT_FRONTEND_PORT || 3001}`
const adminUser = {
  id: 1,
  name: 'Administración de prueba',
  email: 'admin@uvg.edu.gt',
  status: 'ACTIVO',
  role: 'Administrador',
  permissions: ['ADMIN_ACCESS', 'BOARD_MANAGE', 'CONTACT_MANAGE', 'EVENTS_MANAGE', 'INSTITUTIONAL_MANAGE', 'NEWS_MANAGE', 'PROJECTS_MANAGE', 'RESOURCES_MANAGE', 'USERS_MANAGE']
}
let adminSessionActive = false

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => Response.json(body, {
  status,
  headers: {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-credentials': 'true',
    ...extraHeaders,
  }
})

Bun.serve({
  port: 3002,
  async fetch(request) {
    const url = new URL(request.url)
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: {
        'access-control-allow-origin': allowedOrigin,
        'access-control-allow-credentials': 'true',
        'access-control-allow-headers': 'content-type,x-csrf-token',
        'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      } })
    }
    if (url.pathname === '/health') return json({ status: 'ok' })
    if (request.method === 'POST' && url.pathname === '/api/v1/auth/login') {
      const body = await request.json() as { email?: string; password?: string }
      if (body.email !== 'admin@uvg.edu.gt' || body.password !== 'Acceso123!') {
        return json({ error: { code: 'INVALID_CREDENTIALS', message: 'El correo o la contraseña no son válidos.' } }, 401)
      }
      adminSessionActive = true
      const response = json({ user: adminUser, csrfToken: 'csrf-e2e', expiresAt: '2030-01-01T00:00:00.000Z' })
      response.headers.append('set-cookie', 'aequvg_session=session-e2e; Path=/; HttpOnly; SameSite=Lax')
      response.headers.append('set-cookie', 'aequvg_device=device-e2e; Path=/; HttpOnly; SameSite=Lax')
      response.headers.append('set-cookie', 'aequvg_csrf=csrf-e2e; Path=/; SameSite=Lax')
      return response
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/auth/me') {
      return adminSessionActive && request.headers.get('cookie')?.includes('aequvg_session=session-e2e')
        ? json({ user: adminUser })
        : json({ error: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión administrativa.' } }, 401)
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/auth/logout') {
      if (!adminSessionActive || !request.headers.get('cookie')?.includes('aequvg_session=session-e2e')) {
        return json({ error: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión administrativa.' } }, 401)
      }
      if (request.headers.get('x-csrf-token') !== 'csrf-e2e') {
        return json({ error: { code: 'CSRF_TOKEN_INVALID', message: 'El token de protección CSRF no es válido.' } }, 403)
      }
      adminSessionActive = false
      return new Response(null, { status: 204, headers: {
        'access-control-allow-origin': allowedOrigin,
        'access-control-allow-credentials': 'true',
        'set-cookie': 'aequvg_session=; Max-Age=0; Path=/',
      } })
    }
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
    if (url.pathname === '/api/v1/admin/news' || url.pathname.match(/^\/api\/v1\/admin\/news\/\d+(\/archive)?$/)) {
      if (!adminSessionActive || !request.headers.get('cookie')?.includes('aequvg_session=session-e2e')) return json({ error: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión administrativa.' } }, 401)
      if (request.method !== 'GET' && request.headers.get('x-csrf-token') !== 'csrf-e2e') return json({ error: { code: 'CSRF_TOKEN_INVALID', message: 'El token de protección CSRF no es válido.' } }, 403)
      if (request.method === 'GET' && url.pathname === '/api/v1/admin/news') return json({ items: [adminNews, secondNews], pagination: { page: 1, pageSize: 9, total: 2 } })
      if (request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>
        return json({ ...adminNews, id: 30, ...body, category: { id: body.categoryId, name: 'Convocatorias', active: true }, createdBy: adminUser }, 201)
      }
      const id = Number(url.pathname.split('/')[5])
      if (request.method === 'PUT') {
        const body = await request.json() as Record<string, unknown>
        return json({ ...adminNews, id, ...body, category: { id: body.categoryId || 2, name: 'Convocatorias', active: true }, createdBy: adminUser })
      }
      if (request.method === 'PATCH') return json({ ...adminNews, id, status: 'ARCHIVADO', publishedAt: null })
      if (request.method === 'DELETE') return json({ ...adminNews, id, status: 'ARCHIVADO', publishedAt: null })
    }
    if (url.pathname === '/api/v1/institutional-content/featured') return json({ news: [news], events: [event] })
    if (url.pathname === '/api/v1/institutional-content') return json(institutionalBlocks)
    if (url.pathname === '/api/v1/board-members' || url.pathname === '/api/v1/contact-methods') return json([])
    if (url.pathname === '/api/v1/admin/institutional-content/featured') {
      if (request.method === 'GET') return json({ newsIds: [7], eventIds: [10] })
      if (request.method === 'PUT') {
        const body = await request.json()
        return json(body)
      }
    }
    if (url.pathname === '/api/v1/admin/institutional-content') {
      if (request.method === 'GET') return json(institutionalBlocks)
      if (request.method === 'POST') {
        const body = await request.json()
        return json({ id: 99, ...body, status: body.status || 'PUBLICADO', publishedAt: new Date().toISOString() }, 201)
      }
    }
    if (url.pathname.match(/^\/api\/v1\/admin\/institutional-content\/\d+$/)) {
      const id = Number(url.pathname.split('/').pop())
      if (request.method === 'PUT') {
        const body = await request.json()
        return json({ id, ...body })
      }
      if (request.method === 'DELETE') {
        return json({ id, status: 'ARCHIVADO' })
      }
    }
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
    if (url.pathname === '/api/v1/resources/categories') return json([{ id: 3, name: 'Laboratorio' }])
    if (url.pathname === '/api/v1/resources') {
      const query = url.searchParams.get('q')?.toLowerCase() || ''
      if (query === 'sin-resultados') return json({ items: [], pagination: { page: 1, pageSize: 9, total: 0 } })
      if (query === 'error-prueba') return json({ error: { code: 'REQUEST_FAILED', message: 'Error simulado.' } }, 503)
      const page = Number(url.searchParams.get('page') || 1)
      return json({ items: page === 2 ? [secondResource] : [resource], pagination: { page, pageSize: Number(url.searchParams.get('pageSize') || 9), total: 10 } })
    }
    if (url.pathname === '/api/v1/events') {
      const query = url.searchParams.get('q')?.toLowerCase() || ''
      if (query === 'sin-resultados') return json({ items: [], pagination: { page: 1, pageSize: 9, total: 0 } })
      if (query === 'error-prueba') return json({ error: { code: 'REQUEST_FAILED', message: 'Error simulado.' } }, 503)
      const page = Number(url.searchParams.get('page') || 1)
      return json({ items: page === 2 ? [secondEvent] : [event], pagination: { page, pageSize: Number(url.searchParams.get('pageSize') || 9), total: 10 } })
    }
    if (url.pathname === '/api/v1/events/10') return json(event)
    if (url.pathname === '/api/v1/events/12') return json(fullEvent)
    if (url.pathname.startsWith('/api/v1/events/')) return json({ error: { code: 'EVENT_NOT_FOUND', message: 'El evento solicitado no existe.' } }, 404)
    if (url.pathname === '/api/v1/projects') {
      const search = url.searchParams.get('search')?.toLowerCase() || ''
      if (search === 'sin-resultados') return json({ items: [], pagination: { page: 1, pageSize: 9, total: 0, totalPages: 0 } })
      if (search === 'error-prueba') return json({ error: { code: 'REQUEST_FAILED', message: 'Error simulado.' } }, 503)
      const page = Number(url.searchParams.get('page') || 1)
      return json({ items: page === 2 ? [secondProject] : [project], pagination: { page, pageSize: Number(url.searchParams.get('pageSize') || 9), total: 10, totalPages: 2 } })
    }
    if (url.pathname === '/api/v1/projects/20') return json(project)
    if (url.pathname.startsWith('/api/v1/projects/')) return json({ error: { code: 'PROJECT_NOT_FOUND', message: 'El proyecto solicitado no existe.' } }, 404)
    return json({ error: { code: 'NOT_FOUND', message: 'Ruta no encontrada.' } }, 404)
  }
})
