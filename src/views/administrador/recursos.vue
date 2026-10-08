<script setup lang="ts">
import { resourceFormPayload, validateResourceForm, type ResourceFormErrors, type ResourceFormState } from '~/composables/resource-validation'
import { useToast } from '~/composables/use-toast'
import { PublicApiError } from '~/services/api'
import { useAdminResourcesService } from '~/services/admin-resources'
import type { AdminResource, ContentStatus, ResourceCategory } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Recursos · Administración', robots: 'noindex, nofollow' })

const service = useAdminResourcesService()
const toast = useToast()
const loading = ref(true)
const refreshing = ref(false)
const loadError = ref('')
const items = ref<AdminResource[]>([])
const categories = ref<ResourceCategory[]>([])
const page = ref(1)
const total = ref(0)
const search = ref('')
const selectedCategory = ref<number | undefined>()
const selectedStatus = ref<ContentStatus | undefined>()
const editingId = ref<number | null>(null)
const submitting = ref(false)
const deletingId = ref<number | null>(null)
const statusUpdatingId = ref<number | null>(null)
const statusDrafts = reactive<Record<number, ContentStatus>>({})
const errors = ref<ResourceFormErrors>({})
const titleInput = ref<HTMLInputElement | null>(null)
const categorySelect = ref<HTMLSelectElement | null>(null)
const form = reactive<ResourceFormState>({ categoryId: null, fileId: '', title: '', description: '', status: 'BORRADOR', links: [{ label: '', url: '' }] })
const confirmModal = reactive({ open: false, title: '', message: '', confirmLabel: 'Confirmar', variant: 'primary' as 'primary' | 'danger' | 'warning', loading: false, action: (async () => {}) as () => Promise<void> })
const pageSize = 9
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const isEditing = computed(() => editingId.value !== null)
const statusLabel = (status: ContentStatus) => ({ BORRADOR: 'Borrador', PUBLICADO: 'Publicado', ARCHIVADO: 'Archivado' }[status])
const errorMessage = (error: unknown, fallback: string) => error instanceof PublicApiError ? error.message : fallback

const loadData = async (initial = false) => {
  if (initial) loading.value = true
  else refreshing.value = true
  loadError.value = ''
  try {
    const [result, categoryResult] = await Promise.all([
      service.list({ q: search.value.trim() || undefined, categoryId: selectedCategory.value, status: selectedStatus.value, page: page.value, pageSize }),
      service.categories()
    ])
    items.value = result.items
    total.value = result.pagination.total
    categories.value = categoryResult
    for (const item of items.value) statusDrafts[item.id] = item.status
  } catch (error) {
    const message = errorMessage(error, 'No se pudo cargar la administración de recursos.')
    if (initial) loadError.value = message
    else toast.error(message)
  } finally {
    if (initial) loading.value = false
    else refreshing.value = false
  }
}

const resetForm = () => {
  editingId.value = null; form.categoryId = categories.value[0]?.id ?? null; form.fileId = ''; form.title = ''; form.description = ''; form.status = 'BORRADOR'; form.links = [{ label: '', url: '' }]; errors.value = {}
}
const editResource = (resource: AdminResource) => {
  editingId.value = resource.id; form.categoryId = resource.categoryId; form.fileId = resource.fileId ? String(resource.fileId) : ''; form.title = resource.title; form.description = resource.description; form.status = resource.status; form.links = resource.links.length ? resource.links.map(link => ({ label: link.label, url: link.url })) : [{ label: '', url: '' }]; errors.value = {}; nextTick(() => titleInput.value?.focus()); toast.info(`Editando el recurso “${resource.title}”.`)
}
const openConfirmation = (title: string, message: string, action: () => Promise<void>, variant: 'primary' | 'danger' | 'warning', confirmLabel: string) => { confirmModal.title = title; confirmModal.message = message; confirmModal.action = action; confirmModal.variant = variant; confirmModal.confirmLabel = confirmLabel; confirmModal.loading = false; confirmModal.open = true }
const handleConfirmation = async () => { if (confirmModal.loading) return; confirmModal.loading = true; try { await confirmModal.action(); confirmModal.open = false } catch {} finally { confirmModal.loading = false } }
const requestSave = () => { errors.value = validateResourceForm(form); if (Object.keys(errors.value).length) { if (errors.value.categoryId) categorySelect.value?.focus(); else titleInput.value?.focus(); toast.error('Revisa los campos marcados antes de continuar.'); return }; openConfirmation(isEditing.value ? '¿Actualizar recurso?' : '¿Crear recurso?', `Confirma que deseas ${isEditing.value ? 'actualizar' : 'crear'} “${form.title.trim()}”.`, executeSave, 'primary', isEditing.value ? 'Actualizar recurso' : 'Crear recurso') }
const executeSave = async () => { if (submitting.value) return; submitting.value = true; try { const payload = resourceFormPayload(form); if (editingId.value) { await service.update(editingId.value, payload); toast.success('El recurso se actualizó correctamente.') } else { await service.create(payload); toast.success('El recurso se creó correctamente.') }; resetForm(); await loadData() } catch (error) { toast.error(errorMessage(error, 'No se pudo guardar el recurso.')); throw error } finally { submitting.value = false } }
const requestDelete = (resource: AdminResource) => openConfirmation('¿Eliminar recurso permanentemente?', `Esta acción eliminará “${resource.title}” y sus enlaces.`, () => executeDelete(resource), 'danger', 'Eliminar permanentemente')
const executeDelete = async (resource: AdminResource) => { if (deletingId.value || statusUpdatingId.value) return; deletingId.value = resource.id; try { await service.remove(resource.id); toast.success('El recurso se eliminó correctamente.'); if (editingId.value === resource.id) resetForm(); await loadData() } catch (error) { toast.error(errorMessage(error, 'No se pudo eliminar el recurso.')); throw error } finally { deletingId.value = null } }
const requestStatus = (resource: AdminResource, status: ContentStatus) => { if (status === resource.status) return; const label = status === 'PUBLICADO' ? 'Publicar recurso' : status === 'BORRADOR' ? 'Pasar a borrador' : 'Archivar recurso'; openConfirmation(`¿${label}?`, `“${resource.title}” cambiará a ${statusLabel(status).toLowerCase()}.`, () => executeStatus(resource, status), status === 'PUBLICADO' ? 'primary' : 'warning', label) }
const executeStatus = async (resource: AdminResource, status: ContentStatus) => { if (statusUpdatingId.value || deletingId.value) return; statusUpdatingId.value = resource.id; try { await service.update(resource.id, { categoryId: resource.categoryId, fileId: resource.fileId, title: resource.title, description: resource.description, status, links: resource.links.map(link => ({ label: link.label, url: link.url, displayOrder: link.displayOrder })) }); toast.success(`El recurso pasó a ${statusLabel(status).toLowerCase()}.`); await loadData() } catch (error) { toast.error(errorMessage(error, 'No se pudo cambiar el estado del recurso.')); throw error } finally { statusUpdatingId.value = null } }
const addLink = () => form.links.push({ label: '', url: '' })
const removeLink = (index: number) => { if (form.links.length > 1) form.links.splice(index, 1); else form.links[0] = { label: '', url: '' } }
const applyFilters = async () => { page.value = 1; await loadData() }
const goToPage = async (target: number) => { page.value = target; await loadData() }
watch([search, selectedCategory, selectedStatus], () => { void applyFilters() })
onMounted(async () => { await loadData(true); if (!form.categoryId && categories.value.length) form.categoryId = categories.value[0]!.id })
</script>

<template>
  <div class="resource-admin">
    <AdminPageHeader eyebrow="Panel administrativo" title="Recursos académicos" description="Gestiona materiales y enlaces disponibles para estudiantes." />
    <StatePanel v-if="loading" title="Cargando recursos" message="Estamos consultando materiales, categorías y estados." />
    <StatePanel v-else-if="loadError" role="alert" title="No se pudo cargar el módulo" :message="loadError"><button class="secondary-button" type="button" @click="loadData(true)">Reintentar consulta</button></StatePanel>
    <template v-else>
      <section class="manager-card" :class="{ 'manager-card--refreshing': refreshing }" aria-labelledby="resource-list-title" :aria-busy="refreshing">
        <header class="section-heading"><div><span class="eyebrow">Material académico</span><h2 id="resource-list-title">Listado de recursos</h2></div><button class="primary-button" type="button" @click="titleInput?.focus()">＋ Nuevo recurso</button></header>
        <div class="filters"><div class="field"><label for="resource-admin-search">Buscar</label><input id="resource-admin-search" v-model="search" type="search" placeholder="Título, descripción o enlace" /></div><div class="field"><label for="resource-admin-category">Categoría</label><select id="resource-admin-category" v-model="selectedCategory"><option :value="undefined">Todas</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select></div><div class="field"><label for="resource-admin-status">Estado</label><select id="resource-admin-status" v-model="selectedStatus"><option :value="undefined">Todos</option><option value="BORRADOR">Borrador</option><option value="PUBLICADO">Publicado</option><option value="ARCHIVADO">Archivado</option></select></div></div>
        <div v-if="!items.length" class="empty-state"><h3>No hay recursos para mostrar</h3><p>Prueba con otros filtros o crea el primer recurso académico.</p></div>
        <div v-else class="resource-grid"><article v-for="resource in items" :key="resource.id" class="resource-item"><div class="resource-item__body"><div class="resource-item__meta"><span class="tag">{{ resource.category.name }}</span><span :class="['status', `status--${resource.status.toLowerCase()}`]">{{ statusLabel(resource.status) }}</span></div><h3>{{ resource.title }}</h3><p>{{ resource.description }}</p><small v-if="resource.file">Archivo: {{ resource.file.originalName }}</small><small v-for="link in resource.links" :key="link.id">Enlace: {{ link.label }}</small><small>Actualización: {{ resource.updatedAt || resource.createdAt }}</small></div><div class="item-actions"><button class="secondary-button" type="button" @click="editResource(resource)">Editar</button><label class="status-control"><span>Estado</span><select v-model="statusDrafts[resource.id]" :aria-label="`Cambiar estado de ${resource.title}`" :disabled="statusUpdatingId === resource.id || deletingId === resource.id" @change="requestStatus(resource, statusDrafts[resource.id]!)"><option value="BORRADOR">Borrador</option><option value="PUBLICADO">Publicado</option><option value="ARCHIVADO">Archivado</option></select></label><button class="danger-button" type="button" :disabled="deletingId === resource.id || statusUpdatingId === resource.id" @click="requestDelete(resource)">Eliminar</button></div></article></div>
        <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de recursos"><button type="button" :disabled="page === 1" @click="goToPage(page - 1)">Anterior</button><span aria-live="polite">Página {{ page }} de {{ totalPages }}</span><button type="button" :disabled="page === totalPages" @click="goToPage(page + 1)">Siguiente</button></nav>
      </section>
      <section class="manager-card editor-card" aria-labelledby="resource-editor-title"><header class="section-heading"><div><span class="eyebrow">{{ isEditing ? 'Edición' : 'Nuevo material' }}</span><h2 id="resource-editor-title">{{ isEditing ? 'Editar recurso' : 'Crear recurso' }}</h2></div><button v-if="isEditing" class="secondary-button" type="button" @click="resetForm">Cancelar edición</button></header><form class="editor-fields" @submit.prevent="requestSave" novalidate><div class="form-row"><div class="field"><label for="resource-category">Categoría *</label><select id="resource-category" ref="categorySelect" v-model="form.categoryId" :aria-invalid="Boolean(errors.categoryId)"><option :value="null">Selecciona una categoría</option><option v-for="category in categories" :key="category.id" :value="category.id">{{ category.name }}</option></select><span v-if="errors.categoryId" class="field-error" role="alert">{{ errors.categoryId }}</span></div><div class="field"><label for="resource-status">Estado *</label><select id="resource-status" v-model="form.status"><option value="BORRADOR">Borrador</option><option value="PUBLICADO">Publicado</option><option value="ARCHIVADO">Archivado</option></select></div></div><div class="field"><label for="resource-title">Título *</label><input id="resource-title" ref="titleInput" v-model="form.title" maxlength="220" type="text" :aria-invalid="Boolean(errors.title)" /><span v-if="errors.title" class="field-error" role="alert">{{ errors.title }}</span></div><div class="field"><label for="resource-description">Descripción *</label><textarea id="resource-description" v-model="form.description" maxlength="20000" rows="5" :aria-invalid="Boolean(errors.description)"></textarea><span v-if="errors.description" class="field-error" role="alert">{{ errors.description }}</span></div><div class="field"><label for="resource-file">ID del archivo</label><input id="resource-file" v-model="form.fileId" inputmode="numeric" placeholder="Ej. 42" :aria-invalid="Boolean(errors.fileId)" /><span class="hint">El archivo debe estar previamente cargado. No se suben binarios desde este formulario.</span><span v-if="errors.fileId" class="field-error" role="alert">{{ errors.fileId }}</span></div><fieldset class="links-field"><legend>Enlaces HTTP/HTTPS</legend><div v-for="(link, index) in form.links" :key="index" class="link-row"><div class="field"><label :for="`resource-link-label-${index}`">Etiqueta {{ index + 1 }}</label><input :id="`resource-link-label-${index}`" v-model="link.label" placeholder="Sitio UVG" /></div><div class="field"><label :for="`resource-link-url-${index}`">URL {{ index + 1 }}</label><input :id="`resource-link-url-${index}`" v-model="link.url" type="url" placeholder="https://..." /></div><button class="secondary-button" type="button" @click="removeLink(index)">Quitar</button></div><button class="secondary-button" type="button" @click="addLink">＋ Agregar enlace</button><span v-if="errors.links" class="field-error" role="alert">{{ errors.links }}</span></fieldset><span v-if="errors.general" class="field-error" role="alert">{{ errors.general }}</span><div class="editor-actions"><button class="primary-button" type="submit" :disabled="submitting">{{ submitting ? 'Guardando…' : (isEditing ? 'Actualizar recurso' : 'Guardar recurso') }}</button></div></form></section>
    </template>
    <AppConfirmModal :open="confirmModal.open" :title="confirmModal.title" :message="confirmModal.message" :confirm-label="confirmModal.confirmLabel" :variant="confirmModal.variant" :loading="confirmModal.loading" @cancel="confirmModal.open = false" @confirm="handleConfirmation" />
  </div>
</template>

<style scoped>
.resource-admin { display: grid; gap: 2rem; }.manager-card { display: grid; gap: 1.5rem; padding: clamp(1.1rem, 3vw, 2rem); background: white; border: 1px solid var(--admin-border); border-radius: var(--radius-md); box-shadow: 0 10px 28px rgb(18 31 17 / 5%); }.manager-card--refreshing { opacity: .72; }.section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; border-bottom: 1px solid var(--admin-border); padding-bottom: 1rem; }.section-heading h2 { margin-top: .3rem; font-size: clamp(1.4rem, 3vw, 2rem); }.eyebrow { color: var(--admin-primary); font-size: .72rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }.filters, .form-row, .link-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }.filters { grid-template-columns: 1.5fr 1fr 1fr; align-items: end; }.field { display: grid; gap: .38rem; min-width: 0; }.field label, .links-field legend { color: var(--color-ink); font-size: .86rem; font-weight: 800; }.field input, .field select, .field textarea { width: 100%; min-height: 2.7rem; padding: .65rem .75rem; color: var(--color-ink); background: white; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); font: inherit; }.field textarea { resize: vertical; }.field input:focus, .field select:focus, .field textarea:focus, button:focus { outline: 3px solid rgb(23 100 95 / 22%); outline-offset: 1px; }.field [aria-invalid="true"] { border-color: #b42318; }.hint, .resource-item small { color: var(--color-muted); font-size: .78rem; line-height: 1.4; }.field-error { color: #a4261b; font-size: .8rem; font-weight: 700; }.primary-button, .secondary-button, .danger-button, .pagination button { min-height: 2.7rem; padding: .6rem .85rem; border: 1px solid transparent; border-radius: var(--radius-sm); font: inherit; font-size: .84rem; font-weight: 800; cursor: pointer; }.primary-button { color: white; background: var(--admin-primary); border-color: var(--admin-primary); }.secondary-button { color: var(--admin-primary-dark); background: white; border-color: var(--admin-border); }.danger-button { color: #a4261b; background: #fff1f0; border-color: #e0aaa4; }.primary-button:disabled, .secondary-button:disabled, .danger-button:disabled, .pagination button:disabled { cursor: not-allowed; opacity: .55; }.resource-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1rem; }.resource-item { display: grid; gap: 1rem; min-width: 0; padding: 1rem; border: 1px solid var(--admin-border); border-radius: var(--radius-md); background: #fbfdfc; }.resource-item__body { display: grid; gap: .65rem; }.resource-item__meta { display: flex; justify-content: space-between; gap: .5rem; }.tag { color: var(--admin-primary); font-size: .76rem; font-weight: 800; }.resource-item h3 { font-size: 1.05rem; }.resource-item p { color: var(--color-muted); font-size: .88rem; line-height: 1.45; }.status { display: inline-flex; width: fit-content; padding: .25rem .5rem; border-radius: 999px; font-size: .7rem; font-weight: 900; }.status--publicado { color: #146c3a; background: #e5f6eb; }.status--borrador { color: #7a5511; background: #fff3cf; }.status--archivado { color: #5d6570; background: #e9edf0; }.item-actions, .editor-actions { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }.status-control { display: inline-flex; align-items: center; gap: .35rem; color: var(--color-muted); font-size: .74rem; font-weight: 750; }.status-control select { min-height: 2.7rem; padding: .45rem .55rem; color: var(--admin-primary-dark); background: white; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); font: inherit; font-weight: 800; }.empty-state { padding: 2rem 1rem; text-align: center; border: 1px dashed var(--admin-border); border-radius: var(--radius-md); }.empty-state p { margin-top: .35rem; color: var(--color-muted); }.editor-fields { display: grid; gap: 1rem; }.links-field { display: grid; gap: .8rem; padding: 1rem; border: 1px solid var(--admin-border); border-radius: var(--radius-sm); }.link-row { grid-template-columns: 1fr 1fr auto; align-items: end; }.pagination { display: flex; justify-content: center; gap: 1rem; }.pagination button { color: var(--admin-primary-dark); background: white; border-color: var(--admin-border); }
@media (max-width: 1000px) { .resource-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.filters { grid-template-columns: 1fr 1fr; }.filters .field:first-child { grid-column: 1 / -1; } } @media (max-width: 620px) { .section-heading { align-items: start; flex-direction: column; }.filters, .form-row, .link-row { grid-template-columns: 1fr; }.resource-grid { grid-template-columns: 1fr; }.item-actions, .editor-actions { display: grid; grid-template-columns: 1fr; }.item-actions > *, .editor-actions > button { width: 100%; }.link-row .secondary-button { width: fit-content; } }
</style>
