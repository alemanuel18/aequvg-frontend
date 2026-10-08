export const publicNavigation = [
  { label: 'Inicio', to: '/' },
  { label: 'Noticias', to: '/noticias' },
  { label: 'Eventos', to: '/eventos' },
  { label: 'Recursos', to: '/recursos' },
  { label: 'Investigación', to: '/investigacion' },
  { label: 'Junta directiva', to: '/junta-directiva' },
  { label: 'Contacto', to: '/contacto' }
] as const

export interface AdminNavigationItem {
  label: string
  description: string
  to?: string
  permission?: string
  icon: 'calendar' | 'dashboard' | 'file-text' | 'folder' | 'messages' | 'newspaper' | 'users'
  disabled?: boolean
}

export const adminNavigation: readonly AdminNavigationItem[] = [
  { label: 'Resumen', description: 'Inicio del panel administrativo.', to: '/administrador/panel', icon: 'dashboard' },
  { label: 'Contenido institucional', description: 'Información general del sitio.', to: '/administrador/contenido', permission: 'INSTITUTIONAL_MANAGE', icon: 'file-text' },
  { label: 'Noticias', description: 'Publicaciones y anuncios.', to: '/administrador/noticias', permission: 'NEWS_MANAGE', icon: 'newspaper' },
  { label: 'Eventos', description: 'Actividades e inscripciones.', to: '/administrador/eventos', permission: 'EVENTS_MANAGE', icon: 'calendar' },
  { label: 'Recursos', description: 'Materiales para estudiantes.', to: '/administrador/recursos', permission: 'RESOURCES_MANAGE', icon: 'folder' },
  { label: 'Investigación', description: 'Proyectos estudiantiles.', to: '/administrador/investigacion', permission: 'PROJECTS_MANAGE', icon: 'file-text' },
  { label: 'Junta directiva', description: 'Integrantes y orden público.', to: '/administrador/junta-directiva', permission: 'BOARD_MANAGE', icon: 'users' },
  { label: 'Contacto', description: 'Medios oficiales y correo receptor.', to: '/administrador/contacto', permission: 'CONTACT_MANAGE', icon: 'messages' },
  { label: 'Usuarios', description: 'Cuentas y permisos del panel.', to: '/administrador/usuarios', permission: 'USERS_MANAGE', icon: 'users' },
  { label: 'Tesis', description: 'Disponible en un próximo sprint.', permission: 'PAPERS_MANAGE', icon: 'file-text', disabled: true },
] as const
