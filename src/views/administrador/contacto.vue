<script setup lang="ts">
import { CONTACT_METHOD_TYPES, validateContactMethod } from '~/composables/contact-method-validation'
import { useToast } from '~/composables/use-toast'
import { useAdminContactService } from '~/services/admin-contact'
import { PublicApiError } from '~/services/api'
import type { ContactMethod, ContactMethodInput } from '~/types/api'
import { contactMethodIcon } from '~/utils/contact-methods'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Contacto · Administración', robots: 'noindex, nofollow' })

const service = useAdminContactService()
const toast = useToast()
const methods = ref<ContactMethod[]>([])
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const editingId = ref<number | null>(null)
const errors = ref<Record<string, string>>({})
const firstInput = ref<HTMLInputElement | null>(null)

const blankForm = (): ContactMethodInput => ({ type: 'EMAIL', label: '', value: '', url: '', displayOrder: 0, active: true })
const form = reactive<ContactMethodInput>(blankForm())
const selectedType = computed(() => CONTACT_METHOD_TYPES.find(option => option.value === form.type)!)
const activeRecipient = computed(() => methods.value
  .filter(method => method.active && method.type === 'EMAIL')
  .sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)[0])

const confirm = reactive({
  open: false, title: '', message: '', label: 'Confirmar', variant: 'primary' as 'primary' | 'danger' | 'warning', loading: false,
  action: (() => Promise.resolve()) as () => Promise<void>
})

const loadMethods = async () => {
  loading.value = true
  loadError.value = ''
  try { methods.value = await service.list() }
  catch (error) { loadError.value = error instanceof PublicApiError ? error.message : 'No se pudieron cargar los medios oficiales.' }
  finally { loading.value = false }
}

onMounted(loadMethods)

const resetForm = () => {
  editingId.value = null
  Object.assign(form, blankForm())
  errors.value = {}
}

const edit = async (method: ContactMethod) => {
  editingId.value = method.id
  Object.assign(form, { type: method.type, label: method.label, value: method.value, url: method.url ?? '', displayOrder: method.displayOrder, active: method.active })
  errors.value = {}
  await nextTick()
  firstInput.value?.focus()
}

const payload = (): ContactMethodInput => ({
  type: form.type, label: form.label.trim(), value: form.value.trim(), url: form.url?.trim() || null,
  displayOrder: Number(form.displayOrder), active: Boolean(form.active)
})

const openConfirmation = (options: { title: string; message: string; label: string; variant?: 'primary' | 'danger' | 'warning'; action: () => Promise<void> }) => {
  Object.assign(confirm, { open: true, loading: false, variant: 'primary', ...options })
}

const requestSave = () => {
  errors.value = validateContactMethod(payload())
  if (Object.keys(errors.value).length) {
    firstInput.value?.focus()
    toast.error('Revisa los campos del medio de contacto.')
    return
  }
  openConfirmation({
    title: editingId.value ? '¿Actualizar medio oficial?' : '¿Agregar medio oficial?',
    message: `${form.label} se ${form.active ? 'mostrará' : 'guardará como inactivo'} en el sitio público.`,
    label: editingId.value ? 'Actualizar medio' : 'Agregar medio', action: save
  })
}

const save = async () => {
  saving.value = true
  try {
    const saved = editingId.value ? await service.update(editingId.value, payload()) : await service.create(payload())
    const index = methods.value.findIndex(method => method.id === saved.id)
    if (index >= 0) methods.value[index] = saved
    else methods.value.push(saved)
    methods.value.sort((a, b) => a.displayOrder - b.displayOrder || a.id - b.id)
    toast.success(editingId.value ? 'El medio oficial se actualizó correctamente.' : 'El medio oficial se agregó correctamente.')
    resetForm()
  } catch (error) {
    if (error instanceof PublicApiError && error.fields) errors.value = { ...errors.value, ...error.fields }
    toast.error(error instanceof PublicApiError ? error.message : 'No se pudo guardar el medio oficial.')
    throw error
  } finally { saving.value = false }
}

const requestDeactivate = (method: ContactMethod) => openConfirmation({
  title: '¿Desactivar medio oficial?',
  message: `${method.label} dejará de aparecer en Contacto y en el pie de página. Puedes reactivarlo al editarlo.`,
  label: 'Desactivar medio', variant: 'danger', action: () => deactivate(method)
})

const deactivate = async (method: ContactMethod) => {
  try {
    const saved = await service.deactivate(method.id)
    const index = methods.value.findIndex(item => item.id === method.id)
    if (index >= 0) methods.value[index] = saved
    if (editingId.value === method.id) resetForm()
    toast.success('El medio oficial se desactivó correctamente.')
  } catch (error) {
    toast.error(error instanceof PublicApiError ? error.message : 'No se pudo desactivar el medio oficial.')
    throw error
  }
}

const executeConfirmation = async () => {
  if (confirm.loading) return
  confirm.loading = true
  try { await confirm.action(); confirm.open = false }
  finally { confirm.loading = false }
}
</script>

<template>
  <div class="contact-admin">
    <AdminPageHeader
      eyebrow="Panel administrativo" title="Medios de contacto"
      description="Actualiza los canales oficiales que aparecen en Contacto y en el pie de todas las páginas. No existe una bandeja: el formulario entrega cada mensaje al correo activo con menor orden."
    />

    <StatePanel v-if="loading" title="Cargando medios oficiales" message="Consultando la configuración pública de contacto." />
    <StatePanel v-else-if="loadError" role="alert" title="No se pudieron cargar los medios" :message="loadError">
      <button type="button" @click="loadMethods">Reintentar</button>
    </StatePanel>

    <template v-else>
      <section class="admin-card" aria-labelledby="contact-form-heading">
        <div class="section-heading">
          <div><p class="eyebrow">{{ editingId ? 'Edición' : 'Nuevo medio' }}</p><h2 id="contact-form-heading">{{ editingId ? 'Actualizar medio oficial' : 'Agregar medio oficial' }}</h2></div>
          <button v-if="editingId" type="button" class="text-button" @click="resetForm">Cancelar edición</button>
        </div>

        <p class="recipient-note" role="status">
          <AppIcon name="mail" :size="18" />
          <span v-if="activeRecipient">El formulario entrega los mensajes a <strong>{{ activeRecipient.value }}</strong>.</span>
          <span v-else>Activa al menos un correo para habilitar la entrega del formulario público.</span>
        </p>

        <form class="method-form" novalidate :aria-busy="saving" @submit.prevent="requestSave">
          <div class="field">
            <label for="method-label">Nombre público</label>
            <input id="method-label" ref="firstInput" v-model="form.label" :aria-invalid="!!errors.label" :aria-describedby="errors.label ? 'method-label-error' : undefined">
            <span v-if="errors.label" id="method-label-error" class="field-error">{{ errors.label }}</span>
          </div>
          <div class="field">
            <label for="method-type">Tipo de medio</label>
            <select id="method-type" v-model="form.type"><option v-for="option in CONTACT_METHOD_TYPES" :key="option.value" :value="option.value">{{ option.label }}</option></select>
            <small>{{ selectedType.help }}</small>
          </div>
          <div class="field">
            <label for="method-value">Valor público</label>
            <input id="method-value" v-model="form.value" :type="form.type === 'EMAIL' ? 'email' : 'text'" :aria-invalid="!!errors.value" :aria-describedby="errors.value ? 'method-value-error' : undefined">
            <span v-if="errors.value" id="method-value-error" class="field-error">{{ errors.value }}</span>
          </div>
          <div class="field">
            <label for="method-url">Enlace {{ ['EMAIL', 'TELEFONO'].includes(form.type) ? '(opcional)' : '' }}</label>
            <input id="method-url" v-model="form.url" type="url" placeholder="https://" :aria-invalid="!!errors.url" :aria-describedby="errors.url ? 'method-url-error' : undefined">
            <span v-if="errors.url" id="method-url-error" class="field-error">{{ errors.url }}</span>
          </div>
          <div class="field field--order">
            <label for="method-order">Orden</label>
            <input id="method-order" v-model.number="form.displayOrder" type="number" min="0" step="1" :aria-invalid="!!errors.displayOrder" :aria-describedby="errors.displayOrder ? 'method-order-error' : undefined">
            <span v-if="errors.displayOrder" id="method-order-error" class="field-error">{{ errors.displayOrder }}</span>
          </div>
          <label class="active-check"><input v-model="form.active" type="checkbox"> Mostrar en el sitio público</label>
          <div class="form-actions"><AppButton type="submit" :disabled="saving">{{ saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar medio' }}</AppButton></div>
        </form>
      </section>

      <section class="admin-card" aria-labelledby="contact-list-heading">
        <div class="section-heading"><div><p class="eyebrow">Vista pública</p><h2 id="contact-list-heading">Medios configurados</h2></div><span class="count">{{ methods.length }} {{ methods.length === 1 ? 'medio' : 'medios' }}</span></div>
        <StatePanel v-if="!methods.length" title="Sin medios configurados" message="Agrega el correo o la red social oficial para comenzar." />
        <ul v-else class="method-list">
          <li v-for="method in methods" :key="method.id" class="method-item">
            <span class="method-icon" aria-hidden="true"><AppIcon :name="contactMethodIcon(method)" :size="21" /></span>
            <div class="method-copy">
              <div><strong>{{ method.label }}</strong><span :class="['status', method.active ? 'status--active' : 'status--inactive']">{{ method.active ? 'Activo' : 'Inactivo' }}</span></div>
              <span>{{ method.value }}</span>
              <small>Orden {{ method.displayOrder }} · {{ CONTACT_METHOD_TYPES.find(option => option.value === method.type)?.label }}</small>
            </div>
            <div class="item-actions">
              <button type="button" class="action-button" @click="edit(method)">Editar</button>
              <button v-if="method.active" type="button" class="action-button action-button--danger" @click="requestDeactivate(method)">Desactivar</button>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <AppConfirmModal :open="confirm.open" :title="confirm.title" :message="confirm.message" :confirm-label="confirm.label" :variant="confirm.variant" :loading="confirm.loading" @confirm="executeConfirmation" @cancel="confirm.open = false" />
  </div>
</template>

<style scoped>
.contact-admin { display: grid; gap: 1.5rem; min-width: 0; }
.admin-card { min-width: 0; padding: clamp(1rem, 3vw, 1.75rem); background: white; border: 1px solid var(--admin-border, var(--color-border)); border-radius: var(--radius-md); }
.section-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; margin-bottom: 1.25rem; }
.section-heading h2 { font-size: clamp(1.35rem, 3vw, 1.8rem); }
.eyebrow { color: var(--admin-primary); font-size: .72rem; font-weight: 900; letter-spacing: .1em; text-transform: uppercase; }
.recipient-note { display: flex; align-items: flex-start; gap: .55rem; margin-bottom: 1.25rem; padding: .8rem; color: var(--color-muted); background: var(--admin-soft, var(--color-soft)); border-radius: var(--radius-sm); overflow-wrap: anywhere; }
.method-form { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
.field { display: grid; align-content: start; gap: .35rem; min-width: 0; }
.field label, .active-check { font-weight: 800; }
.field input, .field select { width: 100%; min-height: 2.8rem; padding: .65rem .75rem; color: var(--color-ink); background: white; border: 1px solid #87948a; border-radius: .55rem; }
.field small, .method-copy small { color: var(--color-muted); }
.field--order { max-width: 10rem; }
.field-error { color: var(--color-danger); font-size: .84rem; font-weight: 750; }
.active-check { display: flex; align-items: center; gap: .55rem; align-self: center; }.active-check input { width: 1.15rem; height: 1.15rem; }
.form-actions { grid-column: 1 / -1; }
.text-button, .action-button { padding: .5rem .75rem; color: var(--admin-primary); background: white; border: 1px solid var(--admin-border, var(--color-border)); border-radius: .5rem; cursor: pointer; font-weight: 800; }
.method-list { display: grid; gap: .75rem; padding: 0; list-style: none; }
.method-item { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: center; gap: .85rem; padding: 1rem; border: 1px solid var(--admin-border, var(--color-border)); border-radius: var(--radius-sm); }
.method-icon { display: grid; width: 2.7rem; height: 2.7rem; place-items: center; color: white; background: var(--admin-primary); border-radius: .75rem; }
.method-copy { display: grid; min-width: 0; gap: .2rem; overflow-wrap: anywhere; }.method-copy > div { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
.status { padding: .14rem .45rem; border-radius: 999px; font-size: .7rem; font-weight: 900; text-transform: uppercase; }.status--active { color: #14532d; background: #dcfce7; }.status--inactive { color: #713f12; background: #fef3c7; }
.item-actions { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: .45rem; }.action-button--danger { color: #991b1b; border-color: #fecaca; }
.count { flex: 0 0 auto; color: var(--color-muted); font-weight: 750; }
@media (max-width: 720px) { .method-form { grid-template-columns: 1fr; } .form-actions { grid-column: auto; } .method-item { grid-template-columns: auto minmax(0, 1fr); } .item-actions { grid-column: 1 / -1; justify-content: stretch; } .item-actions button { flex: 1; } }
@media (max-width: 390px) { .section-heading { align-items: stretch; flex-direction: column; } .method-item { grid-template-columns: 1fr; } .method-icon { width: 2.5rem; height: 2.5rem; } }
</style>
