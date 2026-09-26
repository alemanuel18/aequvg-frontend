export type ContentStatus = 'BORRADOR' | 'PUBLICADO' | 'ARCHIVADO'
export type BlockType = 'HERO' | 'CAMPO_LABORAL' | 'TESTIMONIO' | 'LABORATORIO' | 'PLAN_ESTUDIOS'

export interface InstitutionalBlock {
  id: number; type: BlockType; title: string; subtitle: string | null; body: string; imageUrl: string | null
  actionLabel: string | null; actionUrl: string | null; displayOrder: number; status: ContentStatus
}

export interface BoardMember {
  id: number; name: string; position: string; description: string | null; institutionalEmail: string; term: string
  termStartsAt: string | null; termEndsAt: string | null; displayOrder: number; status: 'ACTIVO' | 'INACTIVO'
}

export interface ContactMethod { id: number; type: 'EMAIL' | 'TELEFONO' | 'UBICACION' | 'INSTAGRAM' | 'FACEBOOK' | 'OTRO'; label: string; value: string; url: string | null; displayOrder: number }

export interface ContactRequestInput { name: string; email: string; phone: string; type: 'CONSULTA' | 'REUNION'; subject: string; message: string; preferredAt?: string | null; consent: true; privacyVersion: string; website?: string }

export interface ApiError { error?: { code?: string; message?: string; details?: Record<string, string> } }

export interface NewsCategory { id: number; name: string; active?: boolean }

export interface PublicNews {
  id: number; categoryId: number; imageId: number | null; title: string; summary: string; content: string; status: 'PUBLICADO'
  createdAt: string; updatedAt: string; publishedAt: string | null; category: NewsCategory
  image: { id: number; originalName: string; mimeType: string } | null
  createdBy: { id: number; name: string }
}

export interface Pagination { page: number; pageSize: number; total: number }
export interface PublicNewsList { items: PublicNews[]; pagination: Pagination }
export interface PublicNewsQuery { q?: string; categoryId?: number; page?: number; pageSize?: number }
