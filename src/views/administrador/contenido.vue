<script setup lang="ts">
import {
  ANNOUNCEMENT_TYPES,
  validateAnnouncementForm,
  validateFeaturedSelection,
  validateHeroForm,
  type AnnouncementFormState,
  type HeroFormState
} from '~/composables/institutional-validation'
import { useToast } from '~/composables/use-toast'
import { useAdminContentService } from '~/services/admin-content'
import { PublicApiError } from '~/services/api'
import type { BlockType, InstitutionalBlock, PublicEvent, PublicNews } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Contenido institucional · Administración', robots: 'noindex, nofollow' })

const service = useAdminContentService()
const toast = useToast()

// Lifecycle & data state
const loading = ref(true)
const loadError = ref('')

// Raw data
const blocks = ref<InstitutionalBlock[]>([])
const availableNews = ref<PublicNews[]>([])
const availableEvents = ref<PublicEvent[]>([])
const selectedNewsIds = ref<number[]>([])
const selectedEventIds = ref<number[]>([])

// Section 1: Hero form state
const heroId = ref<number | null>(null)
const heroForm = reactive<HeroFormState>({
  title: '',
  subtitle: '',
  body: '',
  actionLabel: '',
  actionUrl: '',
  status: 'PUBLICADO'
})
const heroErrors = ref<Record<string, string>>({})
const submittingHero = ref(false)

// Section 2: Announcement single unified form state
const editingAnnouncementId = ref<number | null>(null)
const announcementForm = reactive<AnnouncementFormState>({
  type: 'LABORATORIO',
  title: '',
  body: '',
  actionLabel: '',
  actionUrl: '',
  status: 'PUBLICADO'
})
const announcementErrors = ref<Record<string, string>>({})
const submittingAnnouncement = ref(false)
const archivingAnnouncementId = ref<number | null>(null)

// Section 3: Featured items state
const submittingFeatured = ref(false)
const featuredErrors = ref<Record<string, string>>({})

// Active announcements list (non-HERO, non-ARCHIVADO)
const activeAnnouncements = computed(() =>
  blocks.value.filter(b => b.type !== 'HERO' && b.status !== 'ARCHIVADO')
)
const activeCount = computed(() => activeAnnouncements.value.length)
const canCreateAnnouncement = computed(() => activeCount.value < 3 || editingAnnouncementId.value !== null)

// Element refs for keyboard focus
const heroTitleInput = ref<HTMLInputElement | null>(null)
const announcementTypeSelect = ref<HTMLSelectElement | null>(null)
const announcementTitleInput = ref<HTMLInputElement | null>(null)

// Modular Confirmation Modal State
const confirmModal = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmar',
  cancelLabel: 'Cancelar',
  variant: 'primary' as 'primary' | 'danger' | 'warning',
  loading: false,
  action: (() => {}) as () => Promise<void> | void
})

const openConfirmDialog = (options: {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'primary' | 'danger' | 'warning'
  action: () => Promise<void> | void
}) => {
  confirmModal.title = options.title
  confirmModal.message = options.message
  confirmModal.confirmLabel = options.confirmLabel ?? 'Confirmar'
  confirmModal.cancelLabel = options.cancelLabel ?? 'Cancelar'
  confirmModal.variant = options.variant ?? 'primary'
  confirmModal.loading = false
  confirmModal.action = options.action
  confirmModal.open = true
}

const handleConfirmAction = async () => {
  confirmModal.loading = true
  try {
    await confirmModal.action()
    confirmModal.open = false
  } catch (err) {
    // If an error occurs, error toast will already have been fired by the action
  } finally {
    confirmModal.loading = false
  }
}

const loadData = async () => {
  loading.value = true
  loadError.value = ''

  try {
    const [blocksData, featuredData, newsData, eventsData] = await Promise.all([
      service.listBlocks(),
      service.featured().catch(() => ({ newsIds: [], eventIds: [] })),
      service.listNews().catch(() => ({ items: [] })),
      service.listEvents().catch(() => ({ items: [] }))
    ])

    blocks.value = blocksData
    availableNews.value = newsData.items ?? []
    availableEvents.value = eventsData.items ?? []
    selectedNewsIds.value = featuredData.newsIds ?? []
    selectedEventIds.value = featuredData.eventIds ?? []

    // Populate Hero form
    const existingHero = blocksData.find(b => b.type === 'HERO')
    if (existingHero) {
      heroId.value = existingHero.id
      heroForm.title = existingHero.title
      heroForm.subtitle = existingHero.subtitle || ''
      heroForm.body = existingHero.body
      heroForm.actionLabel = existingHero.actionLabel || ''
      heroForm.actionUrl = existingHero.actionUrl || ''
      heroForm.status = existingHero.status
    } else {
      heroId.value = null
      heroForm.title = 'La química está en todo. Descúbrela con nosotros.'
      heroForm.subtitle = '⚛ Asociación de Estudiantes · UVG'
      heroForm.body = 'Conecta con una comunidad que fomenta el pensamiento crítico, la innovación y el interés por la química desde el laboratorio hasta su impacto en la vida cotidiana.'
      heroForm.actionLabel = 'Conocer la carrera'
      heroForm.actionUrl = '/contacto'
      heroForm.status = 'PUBLICADO'
    }
  } catch (error) {
    loadError.value = error instanceof PublicApiError
      ? error.message
      : 'No se pudo cargar el contenido institucional. Revisa tu conexión.'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})

// Section 1: Hero Save flow with modal confirmation
const requestSaveHero = () => {
  heroErrors.value = validateHeroForm(heroForm)
  if (Object.keys(heroErrors.value).length > 0) {
    heroTitleInput.value?.focus()
    toast.error('Revisa los campos del formulario de Inicio antes de continuar.')
    return
  }

  openConfirmDialog({
    title: '¿Guardar sección de Inicio?',
    message: '¿Deseas actualizar el contenido principal de inicio (Hero)? Los cambios se aplicarán inmediatamente en el sitio público.',
    confirmLabel: 'Guardar cambios',
    variant: 'primary',
    action: executeSaveHero
  })
}

const executeSaveHero = async () => {
  submittingHero.value = true
  try {
    const payload = {
      type: 'HERO' as BlockType,
      title: heroForm.title,
      subtitle: heroForm.subtitle || null,
      body: heroForm.body,
      actionLabel: heroForm.actionLabel || null,
      actionUrl: heroForm.actionUrl || null,
      status: heroForm.status
    }

    if (heroId.value) {
      const updated = await service.updateBlock(heroId.value, payload)
      const index = blocks.value.findIndex(b => b.id === heroId.value)
      if (index !== -1) blocks.value[index] = updated
    } else {
      const created = await service.createBlock(payload)
      heroId.value = created.id
      blocks.value.unshift(created)
    }

    toast.success('La sección de Inicio (Hero) se guardó correctamente.')
  } catch (error) {
    const message = error instanceof PublicApiError ? error.message : 'Error al guardar la sección de Inicio.'
    toast.error(message)
    throw error
  } finally {
    submittingHero.value = false
  }
}

// Section 2: Announcement Edit & Save flow with modal confirmation
const startEditingAnnouncement = (block: InstitutionalBlock) => {
  editingAnnouncementId.value = block.id
  announcementForm.type = block.type
  announcementForm.title = block.title
  announcementForm.body = block.body
  announcementForm.actionLabel = block.actionLabel || ''
  announcementForm.actionUrl = block.actionUrl || ''
  announcementForm.status = block.status
  announcementErrors.value = {}
  announcementTitleInput.value?.focus()
  toast.info(`Editando anuncio: "${block.title}"`)
}

const cancelEditingAnnouncement = () => {
  editingAnnouncementId.value = null
  announcementForm.type = 'LABORATORIO'
  announcementForm.title = ''
  announcementForm.body = ''
  announcementForm.actionLabel = ''
  announcementForm.actionUrl = ''
  announcementForm.status = 'PUBLICADO'
  announcementErrors.value = {}
}

const requestSaveAnnouncement = () => {
  const isEditing = editingAnnouncementId.value !== null
  announcementErrors.value = validateAnnouncementForm(announcementForm, activeCount.value, isEditing)
  if (Object.keys(announcementErrors.value).length > 0) {
    if (announcementErrors.value.type) {
      announcementTypeSelect.value?.focus()
    } else {
      announcementTitleInput.value?.focus()
    }
    toast.error('Corrige los errores del formulario de anuncio antes de guardar.')
    return
  }

  if (isEditing) {
    openConfirmDialog({
      title: '¿Actualizar anuncio?',
      message: `¿Deseas guardar los cambios del anuncio "${announcementForm.title}" en la categoría ${getTypeLabel(announcementForm.type)}?`,
      confirmLabel: 'Actualizar anuncio',
      variant: 'primary',
      action: executeSaveAnnouncement
    })
  } else {
    openConfirmDialog({
      title: '¿Crear nuevo anuncio?',
      message: `¿Deseas crear y publicar el anuncio "${announcementForm.title}" en la categoría ${getTypeLabel(announcementForm.type)}?`,
      confirmLabel: 'Crear anuncio',
      variant: 'primary',
      action: executeSaveAnnouncement
    })
  }
}

const executeSaveAnnouncement = async () => {
  const isEditing = editingAnnouncementId.value !== null
  submittingAnnouncement.value = true

  try {
    const payload = {
      type: announcementForm.type,
      title: announcementForm.title,
      body: announcementForm.body,
      actionLabel: announcementForm.actionLabel || null,
      actionUrl: announcementForm.actionUrl || null,
      status: announcementForm.status
    }

    if (isEditing) {
      const updated = await service.updateBlock(editingAnnouncementId.value!, payload)
      const index = blocks.value.findIndex(b => b.id === editingAnnouncementId.value)
      if (index !== -1) blocks.value[index] = updated
      toast.success(`El anuncio "${updated.title}" se actualizó correctamente.`)
    } else {
      const created = await service.createBlock(payload)
      blocks.value.push(created)
      toast.success(`El anuncio "${created.title}" se creó exitosamente.`)
    }

    cancelEditingAnnouncement()
  } catch (error) {
    const message = error instanceof PublicApiError ? error.message : 'Error al guardar el anuncio.'
    toast.error(message)
    throw error
  } finally {
    submittingAnnouncement.value = false
  }
}

const requestArchiveAnnouncement = (block: InstitutionalBlock) => {
  openConfirmDialog({
    title: '¿Retirar anuncio de la carrera?',
    message: `¿Confirmas que deseas retirar el anuncio "${block.title}"? Dejará de mostrarse en la sección pública y liberará un cupo de los 3 permitidos.`,
    confirmLabel: 'Sí, retirar anuncio',
    variant: 'danger',
    action: () => executeArchiveAnnouncement(block)
  })
}

const executeArchiveAnnouncement = async (block: InstitutionalBlock) => {
  archivingAnnouncementId.value = block.id
  try {
    await service.archiveBlock(block.id)
    const index = blocks.value.findIndex(b => b.id === block.id)
    if (index !== -1) {
      blocks.value[index] = { ...block, status: 'ARCHIVADO' }
    }
    if (editingAnnouncementId.value === block.id) {
      cancelEditingAnnouncement()
    }
    toast.success(`El anuncio "${block.title}" fue retirado exitosamente.`)
  } catch (error) {
    const message = error instanceof PublicApiError ? error.message : 'Error al retirar el anuncio.'
    toast.error(message)
    throw error
  } finally {
    archivingAnnouncementId.value = null
  }
}

// Section 3: Featured selection flow with modal confirmation
const toggleNewsSelection = (id: number) => {
  const index = selectedNewsIds.value.indexOf(id)
  if (index !== -1) {
    selectedNewsIds.value.splice(index, 1)
  } else if (selectedNewsIds.value.length < 3) {
    selectedNewsIds.value.push(id)
  } else {
    toast.warning('Solo puedes seleccionar hasta 3 noticias destacadas.')
  }
}

const toggleEventSelection = (id: number) => {
  const index = selectedEventIds.value.indexOf(id)
  if (index !== -1) {
    selectedEventIds.value.splice(index, 1)
  } else if (selectedEventIds.value.length < 3) {
    selectedEventIds.value.push(id)
  } else {
    toast.warning('Solo puedes seleccionar hasta 3 eventos destacados.')
  }
}

const requestSaveFeatured = () => {
  featuredErrors.value = validateFeaturedSelection(selectedNewsIds.value, selectedEventIds.value)
  if (Object.keys(featuredErrors.value).length > 0) {
    toast.error('Revisa la cantidad de noticias o eventos seleccionados.')
    return
  }

  openConfirmDialog({
    title: '¿Guardar destacados de inicio?',
    message: `Se configurarán ${selectedNewsIds.value.length} noticias y ${selectedEventIds.value.length} eventos como elementos destacados en la página principal.`,
    confirmLabel: 'Guardar destacados',
    variant: 'primary',
    action: executeSaveFeatured
  })
}

const executeSaveFeatured = async () => {
  submittingFeatured.value = true
  try {
    await service.saveFeatured({
      newsIds: selectedNewsIds.value,
      eventIds: selectedEventIds.value
    })
    toast.success('La selección de noticias y eventos destacados se guardó correctamente.')
  } catch (error) {
    const message = error instanceof PublicApiError ? error.message : 'Error al guardar los destacados.'
    toast.error(message)
    throw error
  } finally {
    submittingFeatured.value = false
  }
}

const getTypeLabel = (type: BlockType) => {
  return ANNOUNCEMENT_TYPES.find(t => t.value === type)?.label || type
}
</script>

<template>
  <div class="content-admin">
    <AdminPageHeader
      eyebrow="Panel administrativo"
      title="Contenido institucional"
      description="Actualiza la sección de inicio, administra los anuncios de la carrera y selecciona las noticias y eventos destacados."
    />

    <!-- Loading state -->
    <StatePanel
      v-if="loading"
      title="Cargando contenido institucional"
      message="Estamos consultando los bloques y datos configurados en el sistema."
    />

    <!-- Error state with retry -->
    <StatePanel
      v-else-if="loadError"
      role="alert"
      title="No se pudo cargar el contenido"
      :message="loadError"
    >
      <button class="retry-btn" type="button" @click="loadData">Reintentar consulta</button>
    </StatePanel>

    <!-- Main administration workspace -->
    <div v-else class="content-workspace">
      <!-- ============================================== -->
      <!-- SECTION 1: INICIO (HERO)                      -->
      <!-- ============================================== -->
      <section class="admin-card" aria-labelledby="section-hero-title">
        <header class="admin-card__header">
          <div>
            <span class="admin-card__tag">Sección principal</span>
            <h2 id="section-hero-title">Inicio (Hero)</h2>
          </div>
          <p>Define el mensaje de bienvenida y el llamado a la acción que verán los visitantes al ingresar al sitio.</p>
        </header>

        <form class="admin-form" @submit.prevent="requestSaveHero">
          <div class="form-group">
            <label for="hero-title">Título principal <span class="required">*</span></label>
            <input
              id="hero-title"
              ref="heroTitleInput"
              v-model="heroForm.title"
              type="text"
              maxlength="220"
              :aria-invalid="Boolean(heroErrors.title)"
              aria-describedby="hero-title-hint hero-title-error"
            />
            <span id="hero-title-hint" class="field-hint">Hasta 220 caracteres. Encabezado principal del sitio.</span>
            <span v-if="heroErrors.title" id="hero-title-error" class="field-error" role="alert">{{ heroErrors.title }}</span>
          </div>

          <div class="form-group">
            <label for="hero-subtitle">Subtítulo / Encabezado superior</label>
            <input
              id="hero-subtitle"
              v-model="heroForm.subtitle"
              type="text"
              maxlength="320"
              aria-describedby="hero-subtitle-hint"
            />
            <span id="hero-subtitle-hint" class="field-hint">Texto superior en la cápsula institucional (ej. ⚛ Asociación de Estudiantes · UVG).</span>
          </div>

          <div class="form-group">
            <label for="hero-body">Descripción institucional <span class="required">*</span></label>
            <textarea
              id="hero-body"
              v-model="heroForm.body"
              rows="3"
              maxlength="8000"
              :aria-invalid="Boolean(heroErrors.body)"
              aria-describedby="hero-body-hint hero-body-error"
            ></textarea>
            <span id="hero-body-hint" class="field-hint">Párrafo explicativo debajo del título principal.</span>
            <span v-if="heroErrors.body" id="hero-body-error" class="field-error" role="alert">{{ heroErrors.body }}</span>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="hero-action-label">Texto del botón de acción</label>
              <input
                id="hero-action-label"
                v-model="heroForm.actionLabel"
                type="text"
                maxlength="100"
                placeholder="Conocer la carrera"
              />
            </div>
            <div class="form-group">
              <label for="hero-action-url">Enlace del botón de acción</label>
              <input
                id="hero-action-url"
                v-model="heroForm.actionUrl"
                type="text"
                maxlength="2048"
                placeholder="/contacto"
                :aria-invalid="Boolean(heroErrors.actionUrl)"
                aria-describedby="hero-url-error"
              />
              <span v-if="heroErrors.actionUrl" id="hero-url-error" class="field-error" role="alert">{{ heroErrors.actionUrl }}</span>
            </div>
            <div class="form-group">
              <label for="hero-status">Estado de publicación</label>
              <select id="hero-status" v-model="heroForm.status">
                <option value="PUBLICADO">Publicado</option>
                <option value="BORRADOR">Borrador</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button
              class="primary-btn"
              type="submit"
              :disabled="submittingHero"
            >
              {{ submittingHero ? 'Guardando cambios...' : 'Guardar sección de Inicio' }}
            </button>
          </div>
        </form>
      </section>

      <!-- ============================================== -->
      <!-- SECTION 2: CONOCER LA LICENCIATURA (ANUNCIOS)  -->
      <!-- ============================================== -->
      <section class="admin-card" aria-labelledby="section-announcements-title">
        <header class="admin-card__header">
          <div class="header-with-badge">
            <div>
              <span class="admin-card__tag">Promoción de la carrera</span>
              <h2 id="section-announcements-title">Conocer la Licenciatura de Química</h2>
            </div>
            <span class="counter-badge" :class="{ 'counter-badge--full': activeCount >= 3 }">
              {{ activeCount }} de 3 anuncios activos
            </span>
          </div>
          <p>
            Muestra hasta un <strong>máximo de 3 anuncios</strong> en total en la sección "Conoce la Licenciatura en Química", sin importar si son de Laboratorios, Testimonios, Campos Laborales o Plan de Estudios.
          </p>
        </header>

        <!-- Current Announcements List -->
        <div class="announcements-manager">
          <h3 class="subsection-title">Anuncios actuales ({{ activeCount }}/3)</h3>

          <div v-if="activeAnnouncements.length === 0" class="empty-notice">
            <p>No hay anuncios activos actualmente. Utiliza el formulario a continuación para agregar hasta tres anuncios.</p>
          </div>

          <div v-else class="announcements-grid">
            <article
              v-for="announcement in activeAnnouncements"
              :key="announcement.id"
              :class="['announcement-item', { 'announcement-item--editing': editingAnnouncementId === announcement.id }]"
            >
              <div class="announcement-item__header">
                <span class="type-pill">{{ getTypeLabel(announcement.type) }}</span>
                <span :class="['status-pill', `status-pill--${announcement.status.toLowerCase()}`]">
                  {{ announcement.status === 'PUBLICADO' ? 'Publicado' : 'Borrador' }}
                </span>
              </div>
              <h4 class="announcement-item__title">{{ announcement.title }}</h4>
              <p class="announcement-item__body">{{ announcement.body }}</p>
              <div v-if="announcement.actionUrl" class="announcement-item__link">
                🔗 {{ announcement.actionLabel || 'Más información' }}: <code>{{ announcement.actionUrl }}</code>
              </div>
              <div class="announcement-item__actions">
                <button
                  type="button"
                  class="action-btn action-btn--edit"
                  @click="startEditingAnnouncement(announcement)"
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  class="action-btn action-btn--danger"
                  :disabled="archivingAnnouncementId === announcement.id"
                  @click="requestArchiveAnnouncement(announcement)"
                >
                  {{ archivingAnnouncementId === announcement.id ? 'Retirando...' : '🗑️ Retirar' }}
                </button>
              </div>
            </article>
          </div>

          <!-- Single Unified Announcement Form -->
          <div class="unified-form-wrapper">
            <div class="unified-form-heading">
              <h3>{{ editingAnnouncementId ? 'Editar anuncio' : 'Nuevo anuncio' }}</h3>
              <p v-if="!canCreateAnnouncement && !editingAnnouncementId" class="limit-warning" role="alert">
                ⚠️ Ya se alcanzó el límite de 3 anuncios activos. Edita o retira uno existente para poder registrar otro.
              </p>
            </div>

            <form class="admin-form" @submit.prevent="requestSaveAnnouncement">
              <div v-if="announcementErrors.general" class="field-error field-error--banner" role="alert">
                {{ announcementErrors.general }}
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="announcement-type">Tipo de anuncio <span class="required">*</span></label>
                  <select
                    id="announcement-type"
                    ref="announcementTypeSelect"
                    v-model="announcementForm.type"
                    :aria-invalid="Boolean(announcementErrors.type)"
                  >
                    <option v-for="t in ANNOUNCEMENT_TYPES" :key="t.value" :value="t.value">
                      {{ t.label }} — {{ t.description }}
                    </option>
                  </select>
                  <span v-if="announcementErrors.type" class="field-error" role="alert">{{ announcementErrors.type }}</span>
                </div>

                <div class="form-group">
                  <label for="announcement-status">Estado</label>
                  <select id="announcement-status" v-model="announcementForm.status">
                    <option value="PUBLICADO">Publicado</option>
                    <option value="BORRADOR">Borrador</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label for="announcement-title">Título del anuncio <span class="required">*</span></label>
                <input
                  id="announcement-title"
                  ref="announcementTitleInput"
                  v-model="announcementForm.title"
                  type="text"
                  maxlength="220"
                  placeholder="Ej. Laboratorio de Química Computacional"
                  :aria-invalid="Boolean(announcementErrors.title)"
                  aria-describedby="announcement-title-error"
                />
                <span v-if="announcementErrors.title" id="announcement-title-error" class="field-error" role="alert">
                  {{ announcementErrors.title }}
                </span>
              </div>

              <div class="form-group">
                <label for="announcement-body">Contenido / Descripción <span class="required">*</span></label>
                <textarea
                  id="announcement-body"
                  v-model="announcementForm.body"
                  rows="3"
                  maxlength="8000"
                  placeholder="Describe la información que se presentará en la tarjeta de la sección pública..."
                  :aria-invalid="Boolean(announcementErrors.body)"
                  aria-describedby="announcement-body-error"
                ></textarea>
                <span v-if="announcementErrors.body" id="announcement-body-error" class="field-error" role="alert">
                  {{ announcementErrors.body }}
                </span>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="announcement-action-label">Texto del enlace opcional</label>
                  <input
                    id="announcement-action-label"
                    v-model="announcementForm.actionLabel"
                    type="text"
                    maxlength="100"
                    placeholder="Ej. Conocer instalaciones"
                  />
                </div>
                <div class="form-group">
                  <label for="announcement-action-url">Enlace opcional</label>
                  <input
                    id="announcement-action-url"
                    v-model="announcementForm.actionUrl"
                    type="text"
                    maxlength="2048"
                    placeholder="/contacto o https://..."
                    :aria-invalid="Boolean(announcementErrors.actionUrl)"
                    aria-describedby="announcement-url-error"
                  />
                  <span v-if="announcementErrors.actionUrl" id="announcement-url-error" class="field-error" role="alert">
                    {{ announcementErrors.actionUrl }}
                  </span>
                </div>
              </div>

              <div class="form-actions">
                <button
                  class="primary-btn"
                  type="submit"
                  :disabled="submittingAnnouncement || (!canCreateAnnouncement && !editingAnnouncementId)"
                >
                  {{ submittingAnnouncement
                    ? 'Guardando...'
                    : (editingAnnouncementId ? 'Actualizar anuncio' : 'Guardar anuncio')
                  }}
                </button>
                <button
                  v-if="editingAnnouncementId"
                  class="secondary-btn"
                  type="button"
                  @click="cancelEditingAnnouncement"
                >
                  Cancelar edición
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      <!-- ============================================== -->
      <!-- SECTION 3: NOTICIAS Y EVENTOS DESTACADOS       -->
      <!-- ============================================== -->
      <section class="admin-card" aria-labelledby="section-featured-title">
        <header class="admin-card__header">
          <div>
            <span class="admin-card__tag">Destacados en pantalla de inicio</span>
            <h2 id="section-featured-title">Noticias y eventos destacados</h2>
          </div>
          <p>
            Selecciona hasta <strong>tres eventos</strong> y hasta <strong>tres noticias</strong> que se presentarán de forma prioritaria en la página de inicio.
          </p>
        </header>

        <div class="featured-management">
          <!-- Featured Events Selection -->
          <div class="featured-block">
            <div class="featured-block__header">
              <div class="title-with-pill">
                <h3>Eventos destacados</h3>
                <span class="counter-badge" :class="{ 'counter-badge--full': selectedEventIds.length >= 3 }">
                  {{ selectedEventIds.length }} / 3 seleccionados
                </span>
              </div>
              <p class="field-hint">Selecciona hasta 3 eventos que se destacarán en la página de inicio.</p>
            </div>

            <div v-if="availableEvents.length === 0" class="empty-notice">
              <p>No hay eventos disponibles para destacar. Crea eventos en el módulo correspondiente.</p>
            </div>

            <div v-else class="selection-grid">
              <label
                v-for="event in availableEvents"
                :key="event.id"
                :class="[
                  'selectable-card',
                  {
                    'selectable-card--selected': selectedEventIds.includes(event.id),
                    'selectable-card--disabled': !selectedEventIds.includes(event.id) && selectedEventIds.length >= 3
                  }
                ]"
              >
                <input
                  type="checkbox"
                  class="selectable-card__checkbox"
                  :checked="selectedEventIds.includes(event.id)"
                  :disabled="!selectedEventIds.includes(event.id) && selectedEventIds.length >= 3"
                  @change="toggleEventSelection(event.id)"
                />
                <div class="selectable-card__info">
                  <span class="card-meta">📍 {{ event.location }}</span>
                  <span class="card-title">{{ event.name }}</span>
                </div>
              </label>
            </div>
            <span v-if="featuredErrors.events" class="field-error" role="alert">{{ featuredErrors.events }}</span>
          </div>

          <!-- Featured News Selection -->
          <div class="featured-block">
            <div class="featured-block__header">
              <div class="title-with-pill">
                <h3>Noticias destacadas</h3>
                <span class="counter-badge" :class="{ 'counter-badge--full': selectedNewsIds.length >= 3 }">
                  {{ selectedNewsIds.length }} / 3 seleccionadas
                </span>
              </div>
              <p class="field-hint">Selecciona hasta 3 noticias que se destacarán en la página de inicio.</p>
            </div>

            <div v-if="availableNews.length === 0" class="empty-notice">
              <p>No hay noticias disponibles para destacar. Crea noticias en el módulo correspondiente.</p>
            </div>

            <div v-else class="selection-grid">
              <label
                v-for="item in availableNews"
                :key="item.id"
                :class="[
                  'selectable-card',
                  {
                    'selectable-card--selected': selectedNewsIds.includes(item.id),
                    'selectable-card--disabled': !selectedNewsIds.includes(item.id) && selectedNewsIds.length >= 3
                  }
                ]"
              >
                <input
                  type="checkbox"
                  class="selectable-card__checkbox"
                  :checked="selectedNewsIds.includes(item.id)"
                  :disabled="!selectedNewsIds.includes(item.id) && selectedNewsIds.length >= 3"
                  @change="toggleNewsSelection(item.id)"
                />
                <div class="selectable-card__info">
                  <span class="card-meta">📰 {{ item.category?.name || 'Noticia' }}</span>
                  <span class="card-title">{{ item.title }}</span>
                </div>
              </label>
            </div>
            <span v-if="featuredErrors.news" class="field-error" role="alert">{{ featuredErrors.news }}</span>
          </div>

          <div class="form-actions">
            <button
              class="primary-btn"
              type="button"
              :disabled="submittingFeatured"
              @click="requestSaveFeatured"
            >
              {{ submittingFeatured ? 'Guardando destacados...' : 'Guardar selección de destacados' }}
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Reusable confirmation modal -->
    <AppConfirmModal
      :open="confirmModal.open"
      :title="confirmModal.title"
      :message="confirmModal.message"
      :confirm-label="confirmModal.confirmLabel"
      :cancel-label="confirmModal.cancelLabel"
      :variant="confirmModal.variant"
      :loading="confirmModal.loading"
      @confirm="handleConfirmAction"
      @cancel="confirmModal.open = false"
    />
  </div>
</template>

<style scoped>
.content-admin {
  display: grid;
  gap: 2rem;
  max-width: 100%;
}

.content-workspace {
  display: grid;
  gap: 2.5rem;
}

/* Card containers */
.admin-card {
  display: grid;
  gap: 1.5rem;
  background: white;
  padding: clamp(1.25rem, 3.5vw, 2.25rem);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgb(23 100 95 / 4%);
}

.admin-card__header {
  display: grid;
  gap: .5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--admin-border);
}

.admin-card__tag {
  display: inline-block;
  font-size: .75rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: var(--admin-primary);
  margin-bottom: .25rem;
}

.admin-card__header h2 {
  font-size: clamp(1.4rem, 2.5vw, 1.85rem);
  margin: 0;
}

.admin-card__header p {
  color: var(--color-muted);
  font-size: .95rem;
  margin: 0;
}

.header-with-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: .75rem;
}

/* Counter badge */
.counter-badge {
  padding: .35rem .75rem;
  border-radius: 999px;
  background: var(--admin-soft);
  color: var(--admin-primary-dark);
  border: 1px solid var(--admin-border);
  font-size: .85rem;
  font-weight: 800;
}

.counter-badge--full {
  background: #fff3e0;
  color: #e65100;
  border-color: #ffe0b2;
}

/* Forms */
.admin-form {
  display: grid;
  gap: 1.25rem;
}

.form-group {
  display: grid;
  gap: .4rem;
}

.form-group label {
  font-weight: 700;
  font-size: .92rem;
  color: var(--color-ink);
}

.required {
  color: var(--color-danger);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: .75rem .95rem;
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
  background: white;
  color: var(--color-ink);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--admin-primary);
  box-shadow: 0 0 0 3px rgb(23 100 95 / 15%);
}

.form-group input[aria-invalid="true"],
.form-group textarea[aria-invalid="true"] {
  border-color: var(--color-danger);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.field-hint {
  font-size: .82rem;
  color: var(--color-muted);
}

.field-error {
  color: var(--color-danger);
  font-size: .85rem;
  font-weight: 600;
}

.field-error--banner {
  padding: .65rem .85rem;
  background: #ffebee;
  border-radius: var(--radius-sm);
}

/* Actions */
.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
  margin-top: .5rem;
}

.primary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .75rem 1.5rem;
  background: var(--admin-primary);
  color: white;
  border: 1px solid var(--admin-primary-dark);
  border-radius: var(--radius-sm);
  font-weight: 750;
  cursor: pointer;
  transition: background .15s ease;
}

.primary-btn:hover:not(:disabled) {
  background: var(--admin-primary-dark);
}

.primary-btn:disabled {
  opacity: .55;
  cursor: not-allowed;
}

.secondary-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .75rem 1.25rem;
  background: white;
  color: var(--color-ink);
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
}

.secondary-btn:hover {
  background: var(--admin-soft);
}

.retry-btn {
  padding: .6rem 1.2rem;
  background: var(--admin-primary);
  color: white;
  border: 0;
  border-radius: var(--radius-sm);
  font-weight: 700;
  cursor: pointer;
}

/* Announcements manager */
.announcements-manager {
  display: grid;
  gap: 1.5rem;
}

.subsection-title {
  margin: 0;
  font-size: 1.15rem;
}

.empty-notice {
  padding: 1.25rem;
  background: var(--admin-soft);
  border: 1px dashed var(--admin-border);
  border-radius: var(--radius-sm);
  color: var(--color-muted);
  text-align: center;
}

.announcements-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.announcement-item {
  display: grid;
  gap: .65rem;
  padding: 1.15rem;
  background: #fbfdfc;
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
  transition: border-color .15s ease, box-shadow .15s ease;
}

.announcement-item--editing {
  border-color: var(--admin-primary);
  box-shadow: 0 0 0 2px rgb(23 100 95 / 20%);
}

.announcement-item__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.type-pill {
  font-size: .78rem;
  font-weight: 800;
  padding: .2rem .55rem;
  background: var(--admin-soft);
  color: var(--admin-primary-dark);
  border-radius: 999px;
}

.status-pill {
  font-size: .75rem;
  font-weight: 700;
  padding: .15rem .45rem;
  border-radius: 999px;
}

.status-pill--publicado {
  background: #e8f5e9;
  color: #2e7d32;
}

.status-pill--borrador {
  background: #fff8e1;
  color: #f57f17;
}

.announcement-item__title {
  margin: 0;
  font-size: 1.05rem;
}

.announcement-item__body {
  margin: 0;
  color: var(--color-muted);
  font-size: .9rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.announcement-item__link {
  font-size: .82rem;
  color: var(--color-muted);
}

.announcement-item__actions {
  display: flex;
  gap: .5rem;
  margin-top: .5rem;
  padding-top: .65rem;
  border-top: 1px solid var(--admin-border);
}

.action-btn {
  padding: .35rem .7rem;
  border: 1px solid var(--admin-border);
  background: white;
  border-radius: .4rem;
  font-size: .82rem;
  font-weight: 600;
  cursor: pointer;
}

.action-btn--edit:hover {
  background: var(--admin-soft);
}

.action-btn--danger {
  color: var(--color-danger);
}

.action-btn--danger:hover {
  background: #ffebee;
  border-color: #ffcdd2;
}

/* Unified form wrapper */
.unified-form-wrapper {
  margin-top: .75rem;
  padding: clamp(1rem, 2.5vw, 1.5rem);
  background: #fafcfb;
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
}

.unified-form-heading {
  margin-bottom: 1rem;
}

.unified-form-heading h3 {
  margin: 0;
  font-size: 1.15rem;
}

.limit-warning {
  margin: .4rem 0 0;
  color: #b78103;
  font-size: .9rem;
  font-weight: 600;
}

/* Featured block */
.featured-management {
  display: grid;
  gap: 2rem;
}

.featured-block {
  display: grid;
  gap: 1rem;
}

.featured-block__header {
  display: grid;
  gap: .25rem;
}

.title-with-pill {
  display: flex;
  align-items: center;
  gap: .75rem;
}

.title-with-pill h3 {
  margin: 0;
  font-size: 1.15rem;
}

.selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: .75rem;
}

.selectable-card {
  display: flex;
  align-items: flex-start;
  gap: .75rem;
  padding: .9rem 1rem;
  background: white;
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: border-color .15s ease, background .15s ease;
}

.selectable-card:hover:not(.selectable-card--disabled) {
  border-color: var(--admin-primary);
  background: #fbfdfc;
}

.selectable-card--selected {
  border-color: var(--admin-primary);
  background: var(--admin-soft);
}

.selectable-card--disabled {
  opacity: .5;
  cursor: not-allowed;
}

.selectable-card__checkbox {
  margin-top: .2rem;
  accent-color: var(--admin-primary);
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 auto;
}

.selectable-card__info {
  display: grid;
  gap: .2rem;
  min-width: 0;
}

.card-meta {
  font-size: .78rem;
  font-weight: 750;
  color: var(--admin-primary-dark);
}

.card-title {
  font-size: .92rem;
  font-weight: 600;
  color: var(--color-ink);
  line-height: 1.35;
}

@media (max-width: 600px) {
  .header-with-badge {
    flex-direction: column;
    align-items: flex-start;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .selection-grid {
    grid-template-columns: 1fr;
  }
}
</style>
