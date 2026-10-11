export type ContentStatus = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO'
export type BlockType = 'HERO' | 'CAMPO_LABORAL' | 'TESTIMONIO' | 'LABORATORIO' | 'PLAN_ESTUDIOS'

export interface InstitutionalBlock {
  id: number; type: BlockType; title: string; subtitle: string | null; body: string; imageUrl: string | null
  actionLabel: string | null; actionUrl: string | null; displayOrder: number; status: ContentStatus
}

export interface BlockInput {
  type: BlockType
  title: string
  subtitle?: string | null
  body: string
  imageUrl?: string | null
  actionLabel?: string | null
  actionUrl?: string | null
  displayOrder?: number
  status?: ContentStatus
}

export interface FeaturedContentResponse {
  news: PublicNews[]
  events: PublicEvent[]
}

export interface AdminFeaturedResponse {
  newsIds: number[]
  eventIds: number[]
}

export interface BoardMember {
  id: number; photoId: number | null; name: string; position: string; description: string | null; institutionalEmail: string; term: string
  termStartsAt: string | null; termEndsAt: string | null; displayOrder: number; status: 'ACTIVO' | 'INACTIVO'
  photo: { id: number; originalName: string; mimeType: string } | null
}

export interface BoardMemberInput {
  name: string
  position: string
  description?: string | null
  institutionalEmail: string
  termStartsAt: string
  termEndsAt: string
  displayOrder?: number
  status?: 'ACTIVO' | 'INACTIVO'
}

export type ContactMethodType = 'EMAIL' | 'TELEFONO' | 'UBICACION' | 'INSTAGRAM' | 'FACEBOOK' | 'OTRO'
export interface ContactMethod { id: number; type: ContactMethodType; label: string; value: string; url: string | null; displayOrder: number; active: boolean }
export interface ContactMethodInput { type: ContactMethodType; label: string; value: string; url?: string | null; displayOrder?: number; active?: boolean }

export interface ContactRequestInput { name: string; email: string; phone: string; type: 'CONSULTA' | 'REUNION'; subject: string; message: string; preferredAt?: string | null; consent: true; privacyVersion: string; website?: string }

export interface ApiError { error?: { code?: string; message?: string; details?: Record<string, string> } }

export interface AdminUser {
  id: number
  name: string
  email: string
  status: string
  role: string
  permissions: string[]
}

export interface AdminSessionResponse {
  user: AdminUser
  csrfToken?: string
  expiresAt?: string
}

export interface AdminLoginInput {
  email: string
  password: string
}

export interface NewsCategory { id: number; name: string; active?: boolean }

export interface PublicNews {
  id: number; categoryId: number; imageId: number | null; title: string; summary: string; content: string; status: 'PUBLICADO'
  createdAt: string; updatedAt: string; publishedAt: string | null; category: NewsCategory
  image: { id: number; originalName: string; mimeType: string } | null
  createdBy: { id: number; name: string }
}

export interface AdminNews extends Omit<PublicNews, 'status'> {
  status: ContentStatus
}

export interface AdminNewsList {
  items: AdminNews[]
  pagination: Pagination
}

export interface NewsInput {
  categoryId: number
  imageId?: number | null
  title: string
  summary: string
  content: string
  status?: ContentStatus
  publishedAt?: string | null
}

export interface Pagination { page: number; pageSize: number; total: number }
export interface PublicNewsList { items: PublicNews[]; pagination: Pagination }
export interface PublicNewsQuery { q?: string; categoryId?: number; page?: number; pageSize?: number }

export interface ResourceCategory { id: number; name: string; active?: boolean }
export interface ResourceFile { id: number; originalName: string; mimeType: string; downloadUrl?: string | null }
export interface AdminFile { id: number; uploadedById: number; originalName: string; mimeType: string; sizeBytes: number; sha256: string; createdAt: string }
export interface ResourceLink { id: number; label: string; url: string; displayOrder: number }
export interface PublicResource {
  id: number; categoryId: number; fileId: number | null; title: string; description: string; status: 'PUBLICADO'
  createdAt: string; updatedAt?: string; publishedAt: string | null; category: ResourceCategory; file: ResourceFile | null; links: ResourceLink[]
  createdBy: { id: number; name: string }
}
export interface PublicResourceList { items: PublicResource[]; pagination: Pagination }
export interface PublicResourceQuery { q?: string; categoryId?: number; page?: number; pageSize?: number }
export interface AdminResource extends Omit<PublicResource, 'status'> { status: ContentStatus }
export interface AdminResourceList { items: AdminResource[]; pagination: Pagination }
export interface ResourceInput {
  categoryId: number
  fileId?: number | null
  title: string
  description: string
  status?: ContentStatus
  publishedAt?: string | null
  links?: Array<{ label: string; url: string; displayOrder?: number }>
}

export interface PublicEvent {
  id: number
  name: string
  description: string
  startsAt: string
  location: string
  maximumCapacity: number
  availableCapacity: number
  additionalInformation: string | null
  status: 'PUBLICADO'
  image: { id: number; originalName: string; mimeType: string } | null
}

export interface PublicEventList {
  items: PublicEvent[]
  pagination: Pagination
}

export interface PublicEventQuery {
  q?: string
  page?: number
  pageSize?: number
}

export interface EventRegistrationInput {
  fullName: string
  email: string
  phone: string
  consent: true
  privacyVersion: string
  website?: string
}

export interface EventRegistrationResponse {
  id: number
  eventId: number
  status: 'CONFIRMADA'
  registeredAt: string
}

export type ProjectType = 'TESIS' | 'PROYECTO'

export interface PublicProject {
  id: number
  title: string
  slug: string
  description: string
  repositoryUrl: string | null
  liveUrl: string | null
  type: ProjectType
  status: 'APROBADO'
  createdAt: string
  author: { id: number; name: string }
  coverImage: { id: number; originalName: string; storageKey: string } | null
}

export interface PublicProjectList {
  items: PublicProject[]
  pagination: Pagination & { totalPages: number }
}

export interface PublicProjectQuery {
  search?: string
  year?: number
  type?: ProjectType
  sortBy?: 'createdAt' | 'title' | 'author'
  sortOrder?: 'asc' | 'desc'
  page?: number
  pageSize?: number
}
