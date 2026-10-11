<script setup lang="ts">
import { BOARD_POSITIONS, boardFormPayload, validateBoardForm, type BoardFormErrors, type BoardFormState } from '~/composables/board-validation'
import { useToast } from '~/composables/use-toast'
import { useAdminBoardService } from '~/services/admin-board'
import { PublicApiError } from '~/services/api'
import type { BoardMember } from '~/types/api'
import { boardYears, membersInBoardYear } from '~/utils/board-members'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Junta Directiva · Administración', robots: 'noindex, nofollow' })

const service = useAdminBoardService()
const toast = useToast()
const members = ref<BoardMember[]>([])
const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const orderSaving = ref(false)
const orderDirty = ref(false)
const editingId = ref<number | null>(null)
const errors = ref<BoardFormErrors>({})
const firstInput = ref<HTMLInputElement | null>(null)
const yearFilter = ref(new Date().getFullYear())
const blankForm = (): BoardFormState => ({ name: '', position: '', description: '', institutionalEmail: '', termStartsAt: '', termEndsAt: '', status: 'ACTIVO' })
const form = reactive<BoardFormState>(blankForm())
const years = computed(() => boardYears(members.value))
const filteredMembers = computed(() => membersInBoardYear(members.value, yearFilter.value))
const confirm = reactive({ open: false, title: '', message: '', label: 'Confirmar', variant: 'primary' as 'primary' | 'danger' | 'warning', loading: false, action: (() => Promise.resolve()) as () => Promise<void> })
const sortMembers = (items: BoardMember[]) => [...items].sort((a, b) => (b.termStartsAt ?? b.term).localeCompare(a.termStartsAt ?? a.term) || a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))

const loadMembers = async () => {
  loading.value = true; loadError.value = ''
  try {
    members.value = sortMembers(await service.list())
    yearFilter.value = boardYears(members.value)[0] ?? new Date().getFullYear()
    orderDirty.value = false
  }
  catch (error) { loadError.value = error instanceof PublicApiError ? error.message : 'No se pudo cargar la Junta Directiva.' }
  finally { loading.value = false }
}
onMounted(loadMembers)

const resetForm = () => { editingId.value = null; Object.assign(form, blankForm()); errors.value = {} }
const edit = async (member: BoardMember) => {
  if (orderDirty.value) { toast.error('Guarda el nuevo orden antes de editar integrantes.'); return }
  editingId.value = member.id
  Object.assign(form, { name: member.name, position: member.position, description: member.description ?? '', institutionalEmail: member.institutionalEmail, termStartsAt: member.termStartsAt?.slice(0, 10) ?? '', termEndsAt: member.termEndsAt?.slice(0, 10) ?? '', status: member.status })
  errors.value = {}; await nextTick(); firstInput.value?.focus()
}
const openConfirmation = (options: { title: string; message: string; label: string; variant?: 'primary' | 'danger' | 'warning'; action: () => Promise<void> }) => Object.assign(confirm, { open: true, loading: false, variant: 'primary', ...options })
const requestSave = () => {
  if (saving.value || confirm.loading) return
  if (orderDirty.value) { toast.error('Guarda el nuevo orden antes de agregar o editar integrantes.'); return }
  errors.value = validateBoardForm(form)
  if (Object.keys(errors.value).length) { firstInput.value?.focus(); toast.error('Revisa los campos del integrante.'); return }
  openConfirmation({ title: editingId.value ? '¿Actualizar integrante?' : '¿Agregar integrante?', message: `${form.name.trim()} quedará ${form.status === 'ACTIVO' ? 'publicado' : 'inactivo'} desde ${form.termStartsAt} hasta ${form.termEndsAt}.`, label: editingId.value ? 'Guardar cambios' : 'Agregar integrante', action: save })
}
const save = async () => {
  if (saving.value) return
  saving.value = true
  try {
    const saved = editingId.value ? await service.update(editingId.value, boardFormPayload(form)) : await service.create(boardFormPayload(form))
    const index = members.value.findIndex(member => member.id === saved.id)
    if (index >= 0) members.value[index] = saved; else members.value.push(saved)
    members.value = sortMembers(members.value)
    toast.success(editingId.value ? 'El integrante se actualizó correctamente.' : 'El integrante se agregó correctamente.'); resetForm()
  } catch (error) {
    if (error instanceof PublicApiError && error.fields) errors.value = { ...errors.value, ...error.fields }
    toast.error(error instanceof PublicApiError ? error.message : 'No se pudo guardar el integrante.'); throw error
  } finally { saving.value = false }
}
const requestRetire = (member: BoardMember) => openConfirmation({ title: '¿Retirar integrante?', message: `${member.name} dejará de aparecer en el historial público del periodo ${member.term}. El registro se conservará como inactivo.`, label: 'Retirar integrante', variant: 'danger', action: () => retire(member) })
const moveMember = (member: BoardMember, direction: -1 | 1) => {
  const ordered = [...filteredMembers.value]
  const currentIndex = ordered.findIndex(item => item.id === member.id)
  const targetIndex = currentIndex + direction
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= ordered.length) return
  ;[ordered[currentIndex], ordered[targetIndex]] = [ordered[targetIndex]!, ordered[currentIndex]!]
  const orderById = new Map(ordered.map((item, displayOrder) => [item.id, displayOrder]))
  members.value = members.value.map(item => orderById.has(item.id) ? { ...item, displayOrder: orderById.get(item.id)! } : item)
  orderDirty.value = true
}
const saveOrder = async () => {
  if (!orderDirty.value || orderSaving.value) return
  orderSaving.value = true
  try {
    const saved = await service.reorder(filteredMembers.value.map((member, displayOrder) => ({ id: member.id, displayOrder })))
    const savedById = new Map(saved.map(member => [member.id, member]))
    members.value = sortMembers(members.value.map(member => savedById.get(member.id) ?? member))
    orderDirty.value = false
    toast.success('El orden de la Junta Directiva se guardó correctamente.')
  } catch (error) { toast.error(error instanceof PublicApiError ? error.message : 'No se pudo guardar el orden de la Junta Directiva.') }
  finally { orderSaving.value = false }
}
const retire = async (member: BoardMember) => {
  try {
    const saved = await service.retire(member.id); const index = members.value.findIndex(item => item.id === member.id)
    if (index >= 0) members.value[index] = saved
    if (editingId.value === member.id) resetForm()
    toast.success('El integrante se retiró del sitio público.')
  } catch (error) { toast.error(error instanceof PublicApiError ? error.message : 'No se pudo retirar el integrante.'); throw error }
}
const executeConfirmation = async () => {
  if (confirm.loading) return
  confirm.loading = true
  try { await confirm.action(); confirm.open = false } catch { /* La acción ya informó el error. */ } finally { confirm.loading = false }
}
</script>

<template>
  <div class="board-admin">
    <AdminPageHeader eyebrow="Panel administrativo" title="Junta Directiva" description="Administra integrantes y conserva las juntas publicadas de cada periodo." />
    <StatePanel v-if="loading" title="Cargando Junta Directiva" message="Consultando integrantes y periodos." />
    <StatePanel v-else-if="loadError" role="alert" title="No se pudo cargar la Junta Directiva" :message="loadError"><button type="button" @click="loadMembers">Reintentar</button></StatePanel>
    <template v-else>
      <section class="admin-card" aria-labelledby="board-form-heading">
        <div class="section-heading"><div><p class="eyebrow">{{ editingId ? 'Edición' : 'Alta' }}</p><h2 id="board-form-heading">{{ editingId ? 'Actualizar integrante' : 'Agregar integrante' }}</h2></div><button v-if="editingId" type="button" class="text-button" @click="resetForm">Cancelar edición</button></div>
        <form class="member-form" novalidate :aria-busy="saving" @submit.prevent="requestSave">
          <div class="field"><label for="board-name">Nombre completo</label><input id="board-name" ref="firstInput" v-model="form.name" autocomplete="name" :aria-invalid="!!errors.name" :aria-describedby="errors.name ? 'board-name-error' : undefined"><span v-if="errors.name" id="board-name-error" class="field-error" role="alert">{{ errors.name }}</span></div>
          <div class="field"><label for="board-position">Cargo</label><select id="board-position" v-model="form.position" :aria-invalid="!!errors.position" :aria-describedby="errors.position ? 'board-position-error' : undefined"><option value="" disabled>Selecciona un cargo</option><option v-for="position in BOARD_POSITIONS" :key="position" :value="position">{{ position }}</option></select><span v-if="errors.position" id="board-position-error" class="field-error" role="alert">{{ errors.position }}</span></div>
          <div class="field"><label for="board-email">Correo institucional</label><input id="board-email" v-model="form.institutionalEmail" type="email" autocomplete="email" placeholder="nombre@uvg.edu.gt" :aria-invalid="!!errors.institutionalEmail" :aria-describedby="errors.institutionalEmail ? 'board-email-error' : undefined"><span v-if="errors.institutionalEmail" id="board-email-error" class="field-error" role="alert">{{ errors.institutionalEmail }}</span></div>
          <div class="field"><label for="board-start">Inicio del periodo</label><input id="board-start" v-model="form.termStartsAt" type="date" :aria-invalid="!!errors.termStartsAt" :aria-describedby="errors.termStartsAt ? 'board-start-error' : undefined"><span v-if="errors.termStartsAt" id="board-start-error" class="field-error" role="alert">{{ errors.termStartsAt }}</span></div>
          <div class="field"><label for="board-end">Fin del periodo</label><input id="board-end" v-model="form.termEndsAt" type="date" :aria-invalid="!!errors.termEndsAt" :aria-describedby="errors.termEndsAt ? 'board-end-error' : undefined"><span v-if="errors.termEndsAt" id="board-end-error" class="field-error" role="alert">{{ errors.termEndsAt }}</span></div>
          <div class="field field--wide"><label for="board-description">Descripción (opcional)</label><textarea id="board-description" v-model="form.description" rows="3" maxlength="2000" /></div>
          <div class="field"><label for="board-status">Estado</label><select id="board-status" v-model="form.status"><option value="ACTIVO">Publicado</option><option value="INACTIVO">Inactivo</option></select></div>
          <div class="form-actions"><AppButton type="submit" :disabled="saving || confirm.loading">{{ saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar integrante' }}</AppButton></div>
        </form>
      </section>
      <section class="admin-card" aria-labelledby="board-list-heading">
        <div class="section-heading"><div><p class="eyebrow">Historial</p><h2 id="board-list-heading">Integrantes registrados</h2></div><span class="count">{{ filteredMembers.length }} {{ filteredMembers.length === 1 ? 'registro' : 'registros' }}</span></div>
        <div v-if="members.length" class="filters"><label for="term-filter">Año de la junta</label><select id="term-filter" v-model.number="yearFilter" :disabled="orderDirty"><option v-for="year in years" :key="year" :value="year">{{ year }}</option></select></div>
        <div v-if="filteredMembers.length" class="order-toolbar" :class="{ 'order-toolbar--dirty': orderDirty }" role="status"><span>{{ orderDirty ? 'Hay cambios de orden sin guardar.' : 'Usa las flechas para cambiar el orden público de este año.' }}</span><AppButton type="button" :disabled="!orderDirty || orderSaving" @click="saveOrder">{{ orderSaving ? 'Guardando…' : 'Guardar orden' }}</AppButton></div>
        <StatePanel v-if="!members.length" title="Sin integrantes registrados" message="Agrega el primer integrante para publicar una Junta Directiva." />
        <StatePanel v-else-if="!filteredMembers.length" title="Sin integrantes en este periodo" message="Selecciona otro periodo o agrega un nuevo integrante." />
        <ul v-else class="member-list"><li v-for="(member, index) in filteredMembers" :key="member.id" class="member-item"><div class="member-copy"><div><strong>{{ member.name }}</strong><span :class="['status', member.status === 'ACTIVO' ? 'status--active' : 'status--inactive']">{{ member.status === 'ACTIVO' ? 'Publicado' : 'Inactivo' }}</span></div><span>{{ member.position }} · {{ member.term }}</span><small>{{ member.institutionalEmail }}</small></div><div class="item-actions"><div class="order-actions" aria-label="Cambiar orden"><button type="button" class="action-button action-button--arrow" :aria-label="`Mover ${member.name} hacia arriba`" :disabled="index === 0 || orderSaving" @click="moveMember(member, -1)">↑</button><button type="button" class="action-button action-button--arrow" :aria-label="`Mover ${member.name} hacia abajo`" :disabled="index === filteredMembers.length - 1 || orderSaving" @click="moveMember(member, 1)">↓</button></div><button type="button" class="action-button" @click="edit(member)">Editar</button><button v-if="member.status === 'ACTIVO'" type="button" class="action-button action-button--danger" @click="requestRetire(member)">Retirar</button></div></li></ul>
      </section>
    </template>
    <AppConfirmModal :open="confirm.open" :title="confirm.title" :message="confirm.message" :confirm-label="confirm.label" :variant="confirm.variant" :loading="confirm.loading" @confirm="executeConfirmation" @cancel="confirm.open = false" />
  </div>
</template>

<style scoped>
.board-admin{display:grid;min-width:0;gap:1.5rem}.admin-card{min-width:0;padding:clamp(1rem,3vw,1.75rem);background:white;border:1px solid var(--admin-border,var(--color-border));border-radius:var(--radius-md)}.section-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.25rem}.section-heading h2{font-size:clamp(1.35rem,3vw,1.8rem)}.eyebrow{color:var(--admin-primary);font-size:.72rem;font-weight:900;letter-spacing:.1em;text-transform:uppercase}.member-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.field{display:grid;align-content:start;min-width:0;gap:.35rem}.field--wide{grid-column:1/-1}.field label,.filters label{font-weight:800}.field input,.field select,.field textarea,.filters select{width:100%;min-height:2.8rem;padding:.65rem .75rem;color:var(--color-ink);background:white;border:1px solid #87948a;border-radius:.55rem}.field textarea{resize:vertical}.field small,.member-copy small{color:var(--color-muted)}.field-error{color:var(--color-danger);font-size:.84rem;font-weight:750}.form-actions{grid-column:1/-1}.text-button,.action-button{padding:.5rem .75rem;color:var(--admin-primary);background:white;border:1px solid var(--admin-border,var(--color-border));border-radius:.5rem;cursor:pointer;font-weight:800}.action-button--danger{color:#991b1b;border-color:#fecaca}.action-button:disabled{cursor:not-allowed;opacity:.45}.filters{display:grid;width:min(24rem,100%);gap:.35rem;margin-bottom:1rem}.order-toolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem;padding:.8rem;color:var(--color-muted);background:var(--admin-soft,var(--color-soft));border:1px solid transparent;border-radius:var(--radius-sm)}.order-toolbar--dirty{color:var(--color-ink);background:#fffbeb;border-color:#f59e0b}.member-list{display:grid;gap:.75rem;padding:0;list-style:none}.member-item{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:1rem;padding:1rem;border:1px solid var(--admin-border,var(--color-border));border-radius:var(--radius-sm)}.member-copy{display:grid;min-width:0;gap:.25rem;overflow-wrap:anywhere}.member-copy>div{display:flex;flex-wrap:wrap;align-items:center;gap:.5rem}.item-actions,.order-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:.45rem}.action-button--arrow{min-width:2.35rem;font-size:1.05rem}.status{padding:.14rem .45rem;border-radius:999px;font-size:.7rem;font-weight:900;text-transform:uppercase}.status--active{color:#14532d;background:#dcfce7}.status--inactive{color:#713f12;background:#fef3c7}.count{flex:0 0 auto;color:var(--color-muted);font-weight:750}@media(max-width:720px){.member-form{grid-template-columns:1fr}.field--wide,.form-actions{grid-column:auto}.member-item{grid-template-columns:1fr}.order-toolbar{align-items:stretch;flex-direction:column}.item-actions{justify-content:stretch}.item-actions>button,.order-actions{flex:1}.order-actions button{flex:1}}@media(max-width:390px){.section-heading{align-items:stretch;flex-direction:column}}
</style>
