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
let reflectedNews: typeof news | null = null

const resource = {
  id: 9, categoryId: 3, fileId: 4, title: 'Guía de seguridad de laboratorio', description: 'Material para preparar prácticas de laboratorio de forma segura.', status: 'PUBLICADO',
  createdAt: '2026-01-15T12:00:00.000Z', publishedAt: '2026-01-15T12:00:00.000Z', category: { id: 3, name: 'Laboratorio', active: true },
  file: { id: 4, originalName: 'guia-seguridad.pdf', mimeType: 'application/pdf', downloadUrl: 'http://localhost:3002/materials/guia-seguridad.pdf' },
  links: [{ id: 1, label: 'Referencia UVG', url: 'https://www.uvg.edu.gt/', displayOrder: 1 }], createdBy: { id: 1, name: 'Contenido de desarrollo' }
}
let adminResource: typeof resource | null = { ...resource }
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

let nextBoardMemberId = 103
let boardMembers = [
  { id: 101, photoId: null, name: 'Ana Pérez', position: 'Presidenta', description: null, institutionalEmail: 'ana@uvg.edu.gt', term: '2026', termStartsAt: '2026-01-01T00:00:00.000Z', termEndsAt: '2026-12-31T00:00:00.000Z', displayOrder: 0, status: 'ACTIVO', photo: null },
  { id: 102, photoId: null, name: 'Luis Morales', position: 'Presidente', description: null, institutionalEmail: 'luis@uvg.edu.gt', term: '2025', termStartsAt: '2025-01-01T00:00:00.000Z', termEndsAt: '2025-12-31T00:00:00.000Z', displayOrder: 0, status: 'ACTIVO', photo: null }
]

const institutionalBlocks = [
  {
    id: 1,
    type: 'HERO',
    title: 'Licenciatura en Química Farmacéutica y Pura',
    subtitle: 'Excelencia científica e investigación con impacto social.',
    body: 'Formamos profesionales con capacidad analítica, ética y liderazgo para innovar en la ciencia.',
    imageUrl: null,
    actionLabel: 'Conocer la carrera',
    actionUrl: '/contacto',
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
const limitedUser = {
  ...adminUser,
  name: 'Cuenta sin permiso de noticias',
  email: 'editor@uvg.edu.gt',
  permissions: ['ADMIN_ACCESS', 'CONTACT_MANAGE']
}
let adminSessionActive = false
let activeUser = adminUser
let contactMethods = [
  { id: 1, type: 'EMAIL', label: 'Correo oficial', value: 'asoquimica@uvg.edu.gt', url: 'mailto:asoquimica@uvg.edu.gt', displayOrder: 1, active: true },
  { id: 2, type: 'UBICACION', label: 'Campus Central UVG', value: 'Campus Central UVG, zona 15, Ciudad de Guatemala', url: 'https://www.google.com/maps/search/?api=1&query=Universidad+del+Valle+de+Guatemala', displayOrder: 2, active: true },
  { id: 3, type: 'OTRO', label: 'TikTok', value: '@aeq_uvg', url: 'https://www.tiktok.com/@aeq_uvg', displayOrder: 3, active: true }
]
let nextContactMethodId = 4
const sortedContactMethods = () => [...contactMethods].sort((a, b) =>
  Number(a.type === 'UBICACION') - Number(b.type === 'UBICACION')
  || a.displayOrder - b.displayOrder
  || a.id - b.id
)

const json = (body: unknown, status = 200, extraHeaders: Record<string, string> = {}) => Response.json(body, {
  status,
  headers: {
    'access-control-allow-origin': allowedOrigin,
    'access-control-allow-credentials': 'true',
    ...extraHeaders,
  }
})

Bun.serve({
  port: Number(process.env.PLAYWRIGHT_API_PORT || 3002),
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
    if (request.method === 'GET' && url.pathname === '/materials/guia-seguridad.pdf') {
      return new Response('contenido PDF e2e', { status: 200, headers: { 'content-type': 'application/pdf', 'content-disposition': 'attachment; filename="guia-seguridad.pdf"' } })
    }
    if (request.method === 'POST' && url.pathname === '/api/v1/auth/login') {
      const body = await request.json() as { email?: string; password?: string }
      const validEmail = body.email === 'admin@uvg.edu.gt' || body.email === 'editor@uvg.edu.gt'
      if (!validEmail || body.password !== 'Acceso123!') {
        return json({ error: { code: 'INVALID_CREDENTIALS', message: 'El correo o la contraseña no son válidos.' } }, 401)
      }
      adminSessionActive = true
      activeUser = body.email === 'editor@uvg.edu.gt' ? limitedUser : adminUser
      const response = json({ user: activeUser, csrfToken: 'csrf-e2e', expiresAt: '2030-01-01T00:00:00.000Z' })
      response.headers.append('set-cookie', 'aequvg_session=session-e2e; Path=/; HttpOnly; SameSite=Lax')
      response.headers.append('set-cookie', 'aequvg_device=device-e2e; Path=/; HttpOnly; SameSite=Lax')
      response.headers.append('set-cookie', 'aequvg_csrf=csrf-e2e; Path=/; SameSite=Lax')
      return response
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/auth/me') {
      return adminSessionActive && request.headers.get('cookie')?.includes('aequvg_session=session-e2e')
        ? json({ user: activeUser })
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
      if (request.method === 'GET' && url.pathname === '/api/v1/admin/news') {
        const items = [reflectedNews ?? adminNews, secondNews]
        return json({ items, pagination: { page: 1, pageSize: 9, total: items.length } })
      }
      if (request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>
        reflectedNews = { ...news, id: 30, ...body, category: { id: body.categoryId, name: 'Convocatorias', active: true }, createdBy: adminUser } as typeof news
        return json(reflectedNews, 201)
      }
      const id = Number(url.pathname.split('/')[5])
      if (request.method === 'PUT') {
        const body = await request.json() as Record<string, unknown>
        return json({ ...adminNews, id, ...body, category: { id: body.categoryId || 2, name: 'Convocatorias', active: true }, createdBy: adminUser })
      }
      if (request.method === 'PATCH') return json({ ...adminNews, id, status: 'ARCHIVADO', publishedAt: null })
      if (request.method === 'DELETE') {
        if (id === 30) reflectedNews = null
        return json({ ...adminNews, id, status: 'ARCHIVADO', publishedAt: null })
      }
    }
    if (url.pathname === '/api/v1/institutional-content/featured') return json({ news: [news], events: [event] })
    if (url.pathname === '/api/v1/institutional-content') return json(institutionalBlocks)
    if (url.pathname === '/api/v1/board-members') return json(boardMembers.filter(member => member.status === 'ACTIVO'))
    if (url.pathname === '/api/v1/admin/board-members' || url.pathname === '/api/v1/admin/board-members/order' || url.pathname.match(/^\/api\/v1\/admin\/board-members\/\d+$/)) {
      if (!adminSessionActive || !request.headers.get('cookie')?.includes('aequvg_session=session-e2e')) return json({ error: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión administrativa.' } }, 401)
      if (request.method !== 'GET' && request.headers.get('x-csrf-token') !== 'csrf-e2e') return json({ error: { code: 'CSRF_TOKEN_INVALID', message: 'El token de protección CSRF no es válido.' } }, 403)
      if (request.method === 'GET') return json(boardMembers)
      if (request.method === 'PUT' && url.pathname === '/api/v1/admin/board-members/order') {
        const body = await request.json() as { items: Array<{ id: number; displayOrder: number }> }
        body.items.forEach(item => { const index = boardMembers.findIndex(member => member.id === item.id); if (index >= 0) boardMembers[index] = { ...boardMembers[index]!, displayOrder: item.displayOrder } })
        return json(body.items.map(item => boardMembers.find(member => member.id === item.id)))
      }
      if (request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>
        const startYear = String(body.termStartsAt).slice(0, 4); const endYear = String(body.termEndsAt).slice(0, 4)
        const created = { id: nextBoardMemberId++, photoId: null, photo: null, term: startYear === endYear ? startYear : `${startYear}–${endYear}`, displayOrder: boardMembers.length, ...body }
        boardMembers.push(created as typeof boardMembers[number]); return json(created, 201)
      }
      const id = Number(url.pathname.split('/').at(-1)); const index = boardMembers.findIndex(member => member.id === id)
      if (request.method === 'PUT') {
        const body = await request.json() as Record<string, unknown>
        const startYear = String(body.termStartsAt).slice(0, 4); const endYear = String(body.termEndsAt).slice(0, 4)
        boardMembers[index] = { ...boardMembers[index]!, ...body, term: startYear === endYear ? startYear : `${startYear}–${endYear}`, photo: null }; return json(boardMembers[index])
      }
      if (request.method === 'DELETE') {
        boardMembers[index] = { ...boardMembers[index]!, status: 'INACTIVO' }; return json(boardMembers[index])
      }
    }
    if (request.method === 'GET' && url.pathname === '/api/v1/contact-methods') return json(sortedContactMethods().filter(method => method.active))
    if (request.method === 'POST' && url.pathname === '/api/v1/contact-requests') return json({ accepted: true }, 202)
    if (url.pathname === '/api/v1/admin/contact-methods') {
      if (request.method === 'GET') return json(sortedContactMethods())
      if (request.method === 'POST') {
        const body = await request.json() as Record<string, unknown>
        const nextOrder = Math.max(-1, ...contactMethods.filter(method => method.type !== 'UBICACION').map(method => method.displayOrder)) + 1
        const created = { id: nextContactMethodId++, displayOrder: body.type === 'UBICACION' ? 0 : nextOrder, ...body }
        contactMethods.push(created as typeof contactMethods[number])
        return json(created, 201)
      }
    }
    if (request.method === 'PUT' && url.pathname === '/api/v1/admin/contact-methods/order') {
      const body = await request.json() as { orderedIds: number[] }
      body.orderedIds.forEach((id, displayOrder) => {
        const index = contactMethods.findIndex(method => method.id === id)
        if (index >= 0) contactMethods[index] = { ...contactMethods[index]!, displayOrder }
      })
      return json(sortedContactMethods())
    }
    if (url.pathname.match(/^\/api\/v1\/admin\/contact-methods\/\d+$/)) {
      const id = Number(url.pathname.split('/').pop())
      const index = contactMethods.findIndex(method => method.id === id)
      if (index < 0) return json({ error: { code: 'CONTACT_METHOD_NOT_FOUND', message: 'El medio de contacto no existe.' } }, 404)
      if (request.method === 'PUT') {
        const body = await request.json() as Record<string, unknown>
        contactMethods[index] = { ...contactMethods[index]!, ...body } as typeof contactMethods[number]
      } else if (request.method === 'DELETE') contactMethods[index] = { ...contactMethods[index]!, active: false }
      return json(contactMethods[index])
    }
    if (url.pathname === '/api/v1/admin/institutional-content/featured') {
      if (request.method === 'GET') return json({ newsIds: [7], eventIds: [10] })
      if (request.method === 'PUT') {
        const body = await request.json()
        return json(body)
      }
    }
    if (url.pathname === '/api/v1/admin/events') {
      if (!adminSessionActive || !request.headers.get('cookie')?.includes('aequvg_session=session-e2e')) {
        return json({ error: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión administrativa.' } }, 401)
      }
      return json({ items: [event], pagination: { page: 1, pageSize: 50, total: 1 } })
    }
    if (url.pathname === '/api/v1/admin/institutional-content') {
      if (request.method === 'GET') return json(institutionalBlocks)
      if (request.method === 'POST') {
        const body = await request.json()
        return json({ id: 99, ...body, status: body.status || 'PUBLICADO', publishedAt: new Date().toISOString() }, 201)
      }
    }
    if (url.pathname === '/api/v1/admin/files') {
      if (!adminSessionActive || !request.headers.get('cookie')?.includes('aequvg_session=session-e2e')) return json({ error: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión administrativa.' } }, 401)
      if (request.headers.get('x-csrf-token') !== 'csrf-e2e') return json({ error: { code: 'CSRF_TOKEN_INVALID', message: 'El token de protección CSRF no es válido.' } }, 403)
      const form = await request.formData()
      const file = form.get('file')
      if (!(file instanceof File)) return json({ error: { code: 'FILE_REQUIRED', message: 'Debes enviar un archivo.' } }, 422)
      return json({ id: 21, uploadedById: 1, originalName: file.name, mimeType: file.type, sizeBytes: file.size, sha256: 'a'.repeat(64), createdAt: new Date().toISOString() }, 201)
    }
    if (url.pathname === '/api/v1/admin/resources' || url.pathname.match(/^\/api\/v1\/admin\/resources\/\d+$/)) {
      if (!adminSessionActive || !request.headers.get('cookie')?.includes('aequvg_session=session-e2e')) return json({ error: { code: 'UNAUTHORIZED', message: 'Se requiere una sesión administrativa.' } }, 401)
      if (request.method !== 'GET' && request.headers.get('x-csrf-token') !== 'csrf-e2e') return json({ error: { code: 'CSRF_TOKEN_INVALID', message: 'El token de protección CSRF no es válido.' } }, 403)
      if (request.method === 'GET') return json({ items: adminResource ? [adminResource] : [], pagination: { page: 1, pageSize: 9, total: adminResource ? 1 : 0 } })
      const id = Number(url.pathname.split('/').pop())
      if (request.method === 'POST') { adminResource = { ...resource, id: 30, ...(await request.json()) }; return json(adminResource, 201) }
      if (request.method === 'PUT') { adminResource = { ...resource, id, ...(await request.json()) }; return json(adminResource) }
      if (request.method === 'DELETE') { adminResource = null; return json({ ...resource, id, status: 'ARCHIVADO' }) }
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
      if (query === 'nueva noticia de prueba') return json({ items: reflectedNews ? [reflectedNews] : [], pagination: { page: 1, pageSize: 9, total: reflectedNews ? 1 : 0 } })
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
