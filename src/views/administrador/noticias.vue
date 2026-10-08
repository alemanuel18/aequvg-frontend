<script setup lang="ts">
import { validateNewsForm, newsFormPayload, type NewsFormErrors, type NewsFormState } from '~/composables/news-validation'
import { useToast } from '~/composables/use-toast'
import { PublicApiError } from '~/services/api'
import { useAdminNewsService } from '~/services/admin-news'
import type { AdminNews, ContentStatus, NewsCategory } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Noticias · Administración', robots: 'noindex, nofollow' })

const service = useAdminNewsService()
const toast = useToast()
const loading = ref(true)
const loadError = ref('')
const items = ref<AdminNews[]>([])
const categories = ref<NewsCategory[]>([])
const page = ref(1)
const pageSize = 9
const total = ref(0)
const search = ref('')
const appliedSearch = ref('')
const selectedCategory = ref<number | undefined>()
const selectedStatus = ref<ContentStatus | undefined>()
const selectedSort = ref<'recent' | 'oldest' | 'title'>('recent')

const form = reactive<NewsFormState>({ categoryId: null, imageId: '', title: '', summary: '', content: '', status: 'BORRADOR' })
const errors = ref<NewsFormErrors>({})
const editingId = ref<number | null>(null)
const submitting = ref(false)
const archivingId = ref<number | null>(null)
const deletingId = ref<number | null>(null)
const previewOpen = ref(false)
const titleInput = ref<HTMLInputElement | null>(null)
const categorySelect = ref<HTMLSelectElement | null>(null)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const isEditing = computed(() => editingId.value !== null)
const previewCategory = computed(() => categories.value.find(category => category.id === form.categoryId)?.name || 'Sin categoría')
const previewImage = computed(() => form.imageId.trim() ? `Imagen asociada · ID ${form.imageId.trim()}` : 'Sin imagen asociada')
const categoryCounts = computed(() => categories.value.map(category => ({
  ...category,
  count: items.value.filter(item => item.categoryId === category.id).length
})))
const sortedItems = computed(() => [...items.value].sort((left, right) => {
  if (selectedSort.value === 'title') return left.title.localeCompare(right.title, 'es')
  const leftDate = new Date(left.publishedAt || left.updatedAt || left.createdAt).getTime()
  const rightDate = new Date(right.publishedAt || right.updatedAt || right.createdAt).getTime()
  return selectedSort.value === 'recent' ? rightDate - leftDate : leftDate - rightDate
}))

const confirmModal = reactive({ open: false, title: '', message: '', confirmLabel: 'Confirmar', variant: 'primary' as 'primary' | 'danger' | 'warning', loading: false, action: (() => {}) as () => Promise<void> })
const statusLabel = (status: ContentStatus) => ({ BORRADOR: 'Borrador', PUBLICADO: 'Publicado', ARCHIVADO: 'Archivado' }[status])
const errorMessage = (error: unknown, fallback: string) => error instanceof PublicApiError ? error.message : fallback
const formatDate = (date: string | null) => date
  ? new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(date))
  : 'Sin fecha de publicación'
const focusEditor = () => nextTick(() => titleInput.value?.focus())

const loadData = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const [result, categoryResult] = await Promise.all([
      service.list({ q: appliedSearch.value || undefined, categoryId: selectedCategory.value, status: selectedStatus.value, page: page.value, pageSize }),
      service.categories()
    ])
    items.value = result.items
    total.value = result.pagination.total
    categories.value = categoryResult
  } catch (error) {
    loadError.value = errorMessage(error, 'No se pudo cargar la administración de noticias.')
  } finally {
    loading.value = false
  }
}

const applyFilters = async () => { appliedSearch.value = search.value.trim(); page.value = 1; await loadData() }
const goToPage = async (target: number) => { page.value = target; await loadData() }
const resetForm = () => {
  editingId.value = null
  form.categoryId = categories.value[0]?.id ?? null
  form.imageId = ''
  form.title = ''
  form.summary = ''
  form.content = ''
  form.status = 'BORRADOR'
  errors.value = {}
  previewOpen.value = false
}
const editNews = (news: AdminNews) => {
  editingId.value = news.id
  form.categoryId = news.categoryId
  form.imageId = news.imageId ? String(news.imageId) : ''
  form.title = news.title
  form.summary = news.summary
  form.content = news.content
  form.status = news.status
  errors.value = {}
  nextTick(() => titleInput.value?.focus())
  toast.info(`Editando la noticia “${news.title}”.`)
}
const openConfirmation = (title: string, message: string, action: () => Promise<void>, variant: 'primary' | 'danger' | 'warning' = 'primary', confirmLabel = 'Confirmar') => {
  confirmModal.title = title
  confirmModal.message = message
  confirmModal.action = action
  confirmModal.variant = variant
  confirmModal.confirmLabel = confirmLabel
  confirmModal.loading = false
  confirmModal.open = true
}
const handleConfirmation = async () => {
  if (confirmModal.loading) return
  confirmModal.loading = true
  try { await confirmModal.action(); confirmModal.open = false } catch { /* La acción ya muestra el error. */ } finally { confirmModal.loading = false }
}
const requestSave = () => {
  errors.value = validateNewsForm(form)
  if (Object.keys(errors.value).length) {
    if (errors.value.categoryId) categorySelect.value?.focus()
    else titleInput.value?.focus()
    toast.error('Revisa los campos marcados antes de continuar.')
    return
  }
  openConfirmation(isEditing.value ? '¿Actualizar noticia?' : '¿Crear noticia?', `Confirma que deseas ${isEditing.value ? 'actualizar' : 'crear'} “${form.title.trim()}”.`, executeSave, 'primary', isEditing.value ? 'Actualizar noticia' : 'Crear noticia')
}
const executeSave = async () => {
  if (submitting.value) return
  submitting.value = true
  try {
    const payload = newsFormPayload(form)
    if (editingId.value) { await service.update(editingId.value, payload); toast.success('La noticia se actualizó correctamente.') }
    else { await service.create(payload); toast.success('La noticia se creó correctamente.') }
    resetForm()
    await loadData()
  } catch (error) { toast.error(errorMessage(error, 'No se pudo guardar la noticia.')); throw error } finally { submitting.value = false }
}
const requestArchive = (news: AdminNews) => openConfirmation('¿Archivar noticia?', `“${news.title}” dejará de aparecer en el contenido público, pero se conservará en el panel.`, () => executeArchive(news), 'warning', 'Archivar noticia')
const executeArchive = async (news: AdminNews) => {
  if (archivingId.value || deletingId.value) return
  archivingId.value = news.id
  try { await service.archive(news.id); toast.success('La noticia se archivó correctamente.'); if (editingId.value === news.id) resetForm(); await loadData() }
  catch (error) { toast.error(errorMessage(error, 'No se pudo archivar la noticia.')); throw error } finally { archivingId.value = null }
}
const requestDelete = (news: AdminNews) => openConfirmation('¿Eliminar noticia permanentemente?', `Esta acción eliminará “${news.title}” y no se puede deshacer.`, () => executeDelete(news), 'danger', 'Eliminar permanentemente')
const executeDelete = async (news: AdminNews) => {
  if (deletingId.value || archivingId.value) return
  deletingId.value = news.id
  try { await service.remove(news.id); toast.success('La noticia se eliminó correctamente.'); if (editingId.value === news.id) resetForm(); await loadData() }
  catch (error) { toast.error(errorMessage(error, 'No se pudo eliminar la noticia.')); throw error } finally { deletingId.value = null }
}
onMounted(async () => { await loadData(); if (!form.categoryId && categories.value.length) form.categoryId = categories.value[0]!.id })
</script>

<template>
  <div class="news-admin">
    <AdminPageHeader eyebrow="Panel administrativo" title="Noticias y anuncios" description="Crea, revisa, publica y retira las noticias que verá la comunidad." />
    <StatePanel v-if="loading" title="Cargando noticias" message="Estamos consultando publicaciones, categorías y estados administrativos." />
    <StatePanel v-else-if="loadError" role="alert" title="No se pudo cargar el módulo" :message="loadError"><button class="secondary-button" type="button" @click="loadData">Reintentar consulta</button></StatePanel>

    <template v-else>
      <section class="manager-card" aria-labelledby="news-list-title">
        <header class="section-heading"><div><span class="eyebrow">Portal informativo directivo</span><h2 id="news-list-title">Gestión de Noticias y Comunicados</h2><p class="section-description">Publicaciones académicas, convocatorias y boletines informativos de la AEQ para la comunidad de estudiantes y docentes de Química UVG.</p></div><button class="primary-button new-button" type="button" @click="focusEditor">＋ Nueva noticia</button></header>
        <form class="filters" role="search" @submit.prevent="applyFilters">
          <div class="field"><label for="news-search">Buscar</label><input id="news-search" v-model="search" type="search" placeholder="Título, resumen o contenido" /></div>
          <div class="category-tabs" aria-label="Filtrar por categoría"><button type="button" :class="{ 'category-tab--active': selectedCategory === undefined }" @click="selectedCategory = undefined; applyFilters()">Todas ({{ total }})</button><button v-for="category in categoryCounts" :key="category.id" type="button" :class="{ 'category-tab--active': selectedCategory === category.id }" @click="selectedCategory = category.id; applyFilters()">{{ category.name }} ({{ category.count }})</button></div>
          <div class="field"><label for="news-status-filter">Estado</label><select id="news-status-filter" v-model="selectedStatus"><option :value="undefined">Todos</option><option value="BORRADOR">Borrador</option><option value="PUBLICADO">Publicado</option><option value="ARCHIVADO">Archivado</option></select></div>
          <div class="field"><label for="news-sort">Ordenar</label><select id="news-sort" v-model="selectedSort"><option value="recent">Más recientes</option><option value="oldest">Más antiguas</option><option value="title">Título A-Z</option></select></div>
          <button class="primary-button filters__submit" type="submit">Aplicar filtros</button>
        </form>
        <div v-if="!items.length" class="empty-state"><h3>No hay noticias para mostrar</h3><p>Prueba con otros filtros o crea la primera noticia desde el formulario.</p></div>
        <div v-else class="news-grid">
          <article v-for="news in sortedItems" :key="news.id" class="news-item">
            <div class="news-item__media"><span class="news-item__tag">{{ news.category.name }}</span><div class="news-item__image-placeholder"><span v-if="!news.image">Imagen pendiente</span><span v-else>Imagen asociada</span></div><span class="news-item__date">◷ {{ formatDate(news.publishedAt) }}</span></div>
            <div class="news-item__body"><div class="news-item__meta"><span :class="['status', `status--${news.status.toLowerCase()}`]">{{ statusLabel(news.status) }}</span></div><h3>{{ news.title }}</h3><p>{{ news.summary }}</p><p v-if="news.image" class="image-meta">Archivo: {{ news.image.originalName }}</p><div class="news-item__author"><span class="author-avatar">{{ news.createdBy.name.slice(0, 2).toUpperCase() }}</span><span>{{ news.createdBy.name }}</span></div><div class="item-actions"><button class="secondary-button" type="button" @click="editNews(news)">Editar</button><button v-if="news.status !== 'ARCHIVADO'" class="warning-button" type="button" :disabled="archivingId === news.id || deletingId === news.id" @click="requestArchive(news)">{{ archivingId === news.id ? 'Archivando…' : 'Archivar' }}</button><button class="danger-button" type="button" :disabled="deletingId === news.id || archivingId === news.id" @click="requestDelete(news)">{{ deletingId === news.id ? 'Eliminando…' : 'Eliminar' }}</button></div></div>
          </article>
        </div>
        <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de noticias"><button type="button" :disabled="page === 1" @click="goToPage(page - 1)">Anterior</button><span aria-live="polite">Página {{ page }} de {{ totalPages }}</span><button type="button" :disabled="page === totalPages" @click="goToPage(page + 1)">Siguiente</button></nav>
      </section>

      <section class="manager-card editor-card" aria-labelledby="news-editor-title">
        <header class="section-heading"><div><span class="eyebrow">{{ isEditing ? 'Edición' : 'Nueva publicación' }}</span><h2 id="news-editor-title">{{ isEditing ? 'Editar noticia' : 'Crear noticia' }}</h2></div><button v-if="isEditing" class="secondary-button" type="button" @click="resetForm">Cancelar edición</button></header>
        <form class="editor-layout" @submit.prevent="requestSave" novalidate>
          <div class="editor-fields">
            <div class="field"><label for="news-title">Título <span aria-hidden="true">*</span></label><input id="news-title" ref="titleInput" v-model="form.title" maxlength="220" type="text" :aria-invalid="Boolean(errors.title)" aria-describedby="news-title-error" /><span v-if="errors.title" id="news-title-error" class="field-error" role="alert">{{ errors.title }}</span></div>
            <div class="field"><label for="news-summary">Resumen <span aria-hidden="true">*</span></label><textarea id="news-summary" v-model="form.summary" rows="3" maxlength="2000" :aria-invalid="Boolean(errors.summary)" aria-describedby="news-summary-error"></textarea><span class="hint">Entre 10 y 2000 caracteres.</span><span v-if="errors.summary" id="news-summary-error" class="field-error" role="alert">{{ errors.summary }}</span></div>
            <div class="field"><label for="news-content">Contenido <span aria-hidden="true">*</span></label><textarea id="news-content" v-model="form.content" rows="8" maxlength="20000" :aria-invalid="Boolean(errors.content)" aria-describedby="news-content-error"></textarea><span class="hint">Entre 20 y 20000 caracteres. El backend limpia HTML no permitido.</span><span v-if="errors.content" id="news-content-error" class="field-error" role="alert">{{ errors.content }}</span></div>
            <div class="form-row"><div class="field"><label for="news-category">Categoría <span aria-hidden="true">*</span></label><select id="news-category" ref="categorySelect" v-model="form.categoryId" :aria-invalid="Boolean(errors.categoryId)" aria-describedby="news-category-error"><option :value="null">Selecciona una categoría</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select><span v-if="errors.categoryId" id="news-category-error" class="field-error" role="alert">{{ errors.categoryId }}</span></div><div class="field"><label for="news-status">Estado <span aria-hidden="true">*</span></label><select id="news-status" v-model="form.status"><option value="BORRADOR">Borrador</option><option value="PUBLICADO">Publicado</option><option value="ARCHIVADO">Archivado</option></select><span v-if="errors.status" class="field-error" role="alert">{{ errors.status }}</span></div></div>
            <div class="field"><label for="news-image">ID de imagen</label><input id="news-image" v-model="form.imageId" inputmode="numeric" placeholder="Ej. 42" :aria-invalid="Boolean(errors.imageId)" aria-describedby="news-image-hint news-image-error" /><span id="news-image-hint" class="hint">La imagen debe estar previamente cargada en el sistema.</span><span v-if="errors.imageId" id="news-image-error" class="field-error" role="alert">{{ errors.imageId }}</span></div>
            <div class="editor-actions"><button class="primary-button" type="submit" :disabled="submitting">{{ submitting ? 'Guardando…' : (isEditing ? 'Actualizar noticia' : 'Guardar noticia') }}</button><button class="secondary-button" type="button" :disabled="submitting" @click="previewOpen = !previewOpen">{{ previewOpen ? 'Ocultar previsualización' : 'Previsualizar' }}</button></div>
          </div>
          <aside v-show="previewOpen" class="preview" aria-labelledby="preview-title"><div class="preview__header"><span class="eyebrow">Vista previa</span><h3 id="preview-title">{{ form.title.trim() || 'Título de la noticia' }}</h3></div><div class="preview__media"><span>{{ previewCategory }}</span><small>{{ previewImage }}</small></div><div class="preview__content"><span :class="['status', `status--${form.status.toLowerCase()}`]">{{ statusLabel(form.status) }}</span><p>{{ form.summary.trim() || 'El resumen aparecerá aquí.' }}</p><div class="preview__copy">{{ form.content.trim() || 'El contenido aparecerá aquí.' }}</div></div></aside>
        </form>
      </section>
    </template>
    <AppConfirmModal :open="confirmModal.open" :title="confirmModal.title" :message="confirmModal.message" :confirm-label="confirmModal.confirmLabel" :variant="confirmModal.variant" :loading="confirmModal.loading" @cancel="confirmModal.open = false" @confirm="handleConfirmation" />
  </div>
</template>

<style scoped>
.news-admin { display: grid; gap: 2rem; }.manager-card { display: grid; gap: 1.5rem; padding: clamp(1.1rem, 3vw, 2rem); background: white; border: 1px solid var(--admin-border); border-radius: var(--radius-md); box-shadow: 0 10px 28px rgb(18 31 17 / 5%); }.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--admin-border); padding-bottom: 1rem; }.section-heading h2 { margin-top: .3rem; font-size: clamp(1.4rem, 3vw, 2rem); }.eyebrow { color: var(--admin-primary); font-size: .72rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }.count-badge { padding: .35rem .7rem; color: var(--admin-primary-dark); background: var(--admin-soft); border: 1px solid var(--admin-border); border-radius: 999px; font-size: .8rem; font-weight: 800; }
.filters { display: grid; grid-template-columns: minmax(12rem, 1.5fr) repeat(2, minmax(9rem, 1fr)) auto; align-items: end; gap: .85rem; }.field { display: grid; align-content: start; gap: .38rem; min-width: 0; }.field label { color: var(--color-ink); font-size: .86rem; font-weight: 800; }.field input, .field select, .field textarea { width: 100%; min-height: 2.7rem; padding: .65rem .75rem; color: var(--color-ink); background: white; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); font: inherit; }.field textarea { resize: vertical; }.field input:focus, .field select:focus, .field textarea:focus { outline: 3px solid rgb(23 100 95 / 22%); outline-offset: 1px; border-color: var(--admin-primary); }.field [aria-invalid="true"] { border-color: #b42318; }.hint { color: var(--color-muted); font-size: .76rem; line-height: 1.4; }.field-error { color: #a4261b; font-size: .8rem; font-weight: 700; }.primary-button, .secondary-button, .warning-button, .danger-button, .pagination button { min-height: 2.7rem; padding: .6rem .85rem; border: 1px solid transparent; border-radius: var(--radius-sm); font: inherit; font-size: .84rem; font-weight: 800; cursor: pointer; }.primary-button { color: white; background: var(--admin-primary); border-color: var(--admin-primary); }.secondary-button { color: var(--admin-primary-dark); background: white; border-color: var(--admin-border); }.warning-button { color: #8a4b08; background: #fff8e8; border-color: #e8c77a; }.danger-button { color: #a4261b; background: #fff1f0; border-color: #e0aaa4; }.primary-button:disabled, .secondary-button:disabled, .warning-button:disabled, .danger-button:disabled, .pagination button:disabled { cursor: not-allowed; opacity: .55; }
.news-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }.news-item { display: grid; min-width: 0; overflow: hidden; border: 1px solid var(--admin-border); border-radius: var(--radius-md); background: #fbfdfc; }.news-item__media { display: flex; min-height: 8rem; flex-direction: column; justify-content: space-between; gap: .8rem; padding: 1rem; color: white; background: linear-gradient(135deg, var(--admin-primary-dark), #4f8f83); }.news-item__tag { width: fit-content; padding: .3rem .55rem; background: rgb(255 255 255 / 18%); border-radius: 999px; font-size: .75rem; font-weight: 800; }.news-item__image { font-size: .82rem; font-weight: 700; }.news-item__body { display: grid; gap: .75rem; padding: 1rem; }.news-item__meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .4rem; color: var(--color-muted); font-size: .76rem; }.news-item h3 { font-size: 1.05rem; line-height: 1.3; }.news-item p { color: var(--color-muted); font-size: .88rem; line-height: 1.45; }.image-meta { font-size: .76rem !important; }.status { display: inline-flex; width: fit-content; padding: .25rem .5rem; border-radius: 999px; font-size: .7rem; font-weight: 900; }.status--publicado { color: #146c3a; background: #e5f6eb; }.status--borrador { color: #7a5511; background: #fff3cf; }.status--archivado { color: #5d6570; background: #e9edf0; }.item-actions { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .25rem; }.empty-state { padding: 2rem 1rem; text-align: center; border: 1px dashed var(--admin-border); border-radius: var(--radius-md); }.empty-state h3 { font-size: 1.15rem; }.empty-state p { margin-top: .35rem; color: var(--color-muted); }
.pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; }.pagination button { color: var(--admin-primary-dark); background: white; border-color: var(--admin-border); }.editor-layout { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(18rem, .65fr); gap: 1.5rem; }.editor-fields { display: grid; gap: 1rem; }.form-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }.editor-actions { display: flex; flex-wrap: wrap; gap: .7rem; }.preview { align-self: start; overflow: hidden; border: 1px solid var(--admin-border); border-radius: var(--radius-md); background: #f5faf8; }.preview__header { padding: 1.1rem; background: white; }.preview__header h3 { margin-top: .4rem; font-size: 1.25rem; line-height: 1.25; }.preview__media { display: grid; min-height: 7rem; align-content: end; gap: .25rem; padding: 1rem; color: white; background: linear-gradient(135deg, #246d68, #7aa890); }.preview__media span { font-weight: 900; }.preview__media small { opacity: .86; }.preview__content { display: grid; gap: .8rem; padding: 1.1rem; }.preview__content p { color: var(--color-muted); line-height: 1.45; }.preview__copy { max-height: 12rem; overflow: auto; white-space: pre-wrap; color: var(--color-ink); font-size: .9rem; line-height: 1.5; }
@media (max-width: 1000px) { .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); }.filters__submit { width: fit-content; }.news-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.editor-layout { grid-template-columns: 1fr; }.preview { order: -1; } } @media (max-width: 620px) { .section-heading { align-items: start; flex-direction: column; }.filters, .form-row { grid-template-columns: 1fr; }.filters__submit { width: 100%; }.news-grid { grid-template-columns: 1fr; }.item-actions > button { flex: 1 1 8rem; }.editor-actions { display: grid; grid-template-columns: 1fr; }.editor-actions button { width: 100%; } }
<style scoped>
.section-description { max-width: 52rem; margin-top: .45rem; color: var(--color-muted); line-height: 1.45; }
.new-button { white-space: nowrap; }
.category-tabs { display: flex; align-items: center; flex-wrap: wrap; gap: .35rem; padding: .3rem; background: #f5f8f7; border-radius: var(--radius-sm); }
.category-tabs button { padding: .45rem .6rem; color: var(--color-muted); background: transparent; border: 0; border-radius: .35rem; font: inherit; font-size: .78rem; font-weight: 750; cursor: pointer; }
.category-tabs button:hover, .category-tabs .category-tab--active { color: white; background: var(--admin-primary); }
.news-item__image-placeholder { display: grid; min-height: 3rem; place-items: center; color: rgb(255 255 255 / 85%); font-size: .82rem; font-weight: 700; background: rgb(255 255 255 / 12%); border: 1px dashed rgb(255 255 255 / 35%); border-radius: .4rem; }
.news-item__date { font-size: .76rem; font-weight: 700; }
.news-item__author { display: flex; align-items: center; gap: .45rem; color: var(--color-muted); font-size: .76rem; }
.author-avatar { display: grid; width: 1.45rem; height: 1.45rem; place-items: center; color: white; background: var(--admin-primary); border-radius: 50%; font-size: .58rem; font-weight: 900; }
@media (max-width: 1000px) { .category-tabs { grid-column: 1 / -1; order: 3; } }
@media (max-width: 620px) { .new-button { width: 100%; }.category-tabs { grid-column: auto; } }
</style>
