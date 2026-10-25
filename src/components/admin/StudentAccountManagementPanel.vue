<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminStudentUsersApi, type ManagedAccountType } from '~/services/admin-student-users'
import type { ManagedStudentAccount, ManagedStudentAccountDetail, StudentAccountStatus } from '~/types/api'

const api = useAdminStudentUsersApi()
const toast = useToast()
const accounts = ref<ManagedStudentAccount[]>([])
const detail = ref<ManagedStudentAccountDetail | null>(null)
const loading = ref(true)
const detailLoading = ref(false)
const saving = ref(false)
const loadError = ref('')
const searchInput = ref('')
const query = ref('')
const statusFilter = ref<StudentAccountStatus | ''>('')
const typeFilter = ref<ManagedAccountType | ''>('')
const page = ref(1)
const pageSize = 10
const total = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const selectedAction = ref<'BLOQUEADO_TEMPORAL' | 'BLOQUEADO_PERMANENTE' | 'ACTIVO' | 'ELIMINADO' | null>(null)
const reason = ref('')
const blockedUntil = ref('')
const reviewChannel = ref('')
const actionError = ref('')
const confirmOpen = ref(false)
const pendingAction = ref<null | (() => Promise<void>)>(null)
const confirmTitle = ref('Confirmar acción sobre la cuenta')
const confirmMessage = ref('')
const confirmLabel = ref('Confirmar')
const confirmVariant = ref<'primary' | 'danger' | 'warning'>('warning')

const statusLabel = (status: StudentAccountStatus) => ({
  ACTIVO: 'Activa', BLOQUEADO_TEMPORAL: 'Bloqueada temporalmente', BLOQUEADO_PERMANENTE: 'Bloqueada permanentemente', ELIMINADO: 'Eliminada'
})[status]
const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const result = await api.list({ q: query.value, status: statusFilter.value, type: typeFilter.value, page: page.value, pageSize })
    accounts.value = result.items
    total.value = result.pagination.total
    if (detail.value && !result.items.some(item => item.id === detail.value?.id)) detail.value = null
  } catch (error) {
    loadError.value = error instanceof PublicApiError ? error.message : 'No se pudieron cargar las cuentas normales.'
  } finally { loading.value = false }
}
const search = () => { query.value = searchInput.value.trim(); page.value = 1; void load() }
const changeFilter = () => { page.value = 1; void load() }
const openDetail = async (account: ManagedStudentAccount) => {
  detailLoading.value = true
  selectedAction.value = null
  try { detail.value = await api.detail(account.id) }
  catch (error) { toast.error(error instanceof PublicApiError ? error.message : 'No se pudo abrir el detalle.') }
  finally { detailLoading.value = false }
}
const beginAction = (action: NonNullable<typeof selectedAction.value>) => {
  selectedAction.value = action
  reason.value = ''
  blockedUntil.value = ''
  reviewChannel.value = ''
  actionError.value = ''
}
const toLocalMin = () => {
  const date = new Date(Date.now() + 60_000)
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset())
  return date.toISOString().slice(0, 16)
}
const askAction = () => {
  if (!detail.value || !selectedAction.value || saving.value) return
  actionError.value = ''
  if (reason.value.trim().length < 5) { actionError.value = 'Escribe un motivo de al menos 5 caracteres.'; return }
  if (selectedAction.value === 'BLOQUEADO_TEMPORAL' && (!blockedUntil.value || new Date(blockedUntil.value) <= new Date())) { actionError.value = 'Selecciona una fecha futura para terminar el bloqueo.'; return }
  if (selectedAction.value === 'BLOQUEADO_PERMANENTE' && reviewChannel.value.trim().length < 2) { actionError.value = 'Indica un canal de revisión válido.'; return }

  const selected = selectedAction.value
  const account = detail.value
  const trimmedReason = reason.value.trim()
  confirmVariant.value = selected === 'ELIMINADO' ? 'danger' : 'warning'
  if (selected === 'ELIMINADO') {
    confirmTitle.value = 'Confirmar baja de cuenta'
    confirmMessage.value = `Se bloqueará el acceso y se anonimizarán sus datos personales. Los registros asociados que se conserven (como comentarios e inscripciones) quedarán atribuidos a “Usuario anónimo”; la acción no se puede revertir desde el panel.`
    confirmLabel.value = 'Dar de baja'
  } else if (selected === 'ACTIVO') {
    confirmTitle.value = 'Desbloquear cuenta'
    confirmMessage.value = `Se permitirá que ${account.email} vuelva a iniciar sesión. Las sesiones anteriores no se restauran.`
    confirmLabel.value = 'Desbloquear'
  } else {
    confirmTitle.value = selected === 'BLOQUEADO_TEMPORAL' ? 'Aplicar bloqueo temporal' : 'Aplicar bloqueo permanente'
    confirmMessage.value = selected === 'BLOQUEADO_TEMPORAL'
      ? `Se impedirá el acceso hasta ${new Date(blockedUntil.value).toLocaleString()}; las sesiones activas serán revocadas.`
      : `Se impedirá el acceso hasta que una persona administradora desbloquee la cuenta; las sesiones activas serán revocadas.`
    confirmLabel.value = 'Aplicar bloqueo'
  }
  pendingAction.value = async () => {
    if (selected === 'ELIMINADO') await api.remove(account.id, trimmedReason)
    else if (selected === 'ACTIVO') await api.updateStatus(account.id, { status: 'ACTIVO', reason: trimmedReason })
    else if (selected === 'BLOQUEADO_TEMPORAL') await api.updateStatus(account.id, { status: selected, blockedUntil: new Date(blockedUntil.value).toISOString(), reason: trimmedReason })
    else await api.updateStatus(account.id, { status: selected, reviewChannel: reviewChannel.value.trim(), reason: trimmedReason })
    toast.success(selected === 'ELIMINADO' ? 'La cuenta se dio de baja.' : selected === 'ACTIVO' ? 'La cuenta se desbloqueó.' : 'El bloqueo se aplicó correctamente.')
    selectedAction.value = null
    detail.value = await api.detail(account.id).catch(() => null)
    await load()
  }
  confirmOpen.value = true
}
const executeAction = async () => {
  if (saving.value || !pendingAction.value) return
  saving.value = true
  try { await pendingAction.value(); confirmOpen.value = false }
  catch (error) { toast.error(error instanceof PublicApiError ? error.message : 'No se pudo completar la acción.') }
  finally { saving.value = false }
}
const changePage = (next: number) => { if (next < 1 || next > totalPages.value || loading.value) return; page.value = next; void load() }
const accountType = (account: ManagedStudentAccount) => account.isStudent ? 'Estudiante' : 'Interesado'
onMounted(load)
</script>

<template>
  <section class="normal-accounts card" aria-labelledby="normal-accounts-title">
    <div class="heading"><div><h2 id="normal-accounts-title">Cuentas normales</h2><p class="hint">Busca estudiantes e interesados, revisa su historial y administra sus accesos.</p></div><button class="secondary" type="button" :disabled="loading" @click="load">Actualizar</button></div>
    <form class="filters" role="search" @submit.prevent="search">
      <label class="search-field">Buscar cuenta<input v-model="searchInput" type="search" maxlength="160" placeholder="Nombre o correo" /></label>
      <label>Tipo<select v-model="typeFilter" @change="changeFilter"><option value="">Todos</option><option value="ESTUDIANTE">Estudiante</option><option value="INTERESADO">Interesado</option></select></label>
      <label>Estado<select v-model="statusFilter" @change="changeFilter"><option value="">Todos</option><option value="ACTIVO">Activa</option><option value="BLOQUEADO_TEMPORAL">Bloqueada temporalmente</option><option value="BLOQUEADO_PERMANENTE">Bloqueada permanentemente</option><option value="ELIMINADO">Eliminada</option></select></label>
      <button class="action" type="submit" :disabled="loading">Buscar</button>
    </form>
    <StatePanel v-if="loading" title="Cargando cuentas" message="Consultando la lista de estudiantes e interesados." />
    <StatePanel v-else-if="loadError" role="alert" title="No se pudieron cargar las cuentas" :message="loadError"><button class="action" type="button" @click="load">Reintentar</button></StatePanel>
    <StatePanel v-else-if="!accounts.length" title="No hay cuentas que coincidan" message="Prueba con otra búsqueda o cambia los filtros." />
    <template v-else>
      <p class="result-count" aria-live="polite">{{ total }} resultado{{ total === 1 ? '' : 's' }}</p>
      <div class="table-scroll"><table><thead><tr><th scope="col">Cuenta normal</th><th scope="col">Tipo</th><th scope="col">Estado</th><th scope="col"><span class="sr-only">Acción</span></th></tr></thead><tbody>
        <tr v-for="account in accounts" :key="account.id"><th scope="row"><strong>{{ account.name }}</strong><span>{{ account.email }}</span></th><td>{{ accountType(account) }}</td><td>{{ statusLabel(account.status) }}</td><td><button class="secondary" type="button" :disabled="detailLoading" @click="openDetail(account)">{{ detail?.id === account.id ? 'Seleccionada' : 'Ver detalle' }}</button></td></tr>
      </tbody></table></div>
      <nav class="pagination" aria-label="Paginación de cuentas"><button class="secondary" type="button" :disabled="page <= 1 || loading" @click="changePage(page - 1)">Anterior</button><span>Página {{ page }} de {{ totalPages }}</span><button class="secondary" type="button" :disabled="page >= totalPages || loading" @click="changePage(page + 1)">Siguiente</button></nav>
    </template>

    <StatePanel v-if="detailLoading" title="Cargando detalle" message="Consultando historial y estado de la cuenta." />
    <section v-else-if="detail" class="detail" aria-labelledby="account-detail-title">
      <div class="heading"><div><h3 id="account-detail-title">{{ detail.name }}</h3><p class="hint">{{ detail.email }} · {{ accountType(detail) }} · {{ statusLabel(detail.status) }}</p></div><button class="secondary" type="button" @click="detail = null; selectedAction = null">Cerrar detalle</button></div>
      <p v-if="detail.blockedUntil" class="consequence">Bloqueo temporal hasta {{ new Date(detail.blockedUntil).toLocaleString() }}.</p>
      <p v-if="detail.reviewChannel" class="consequence">Canal para revisión: {{ detail.reviewChannel }}</p>
      <div class="actions" aria-label="Acciones de cuenta">
        <button v-if="detail.status === 'ACTIVO'" class="secondary" type="button" @click="beginAction('BLOQUEADO_TEMPORAL')">Bloqueo temporal</button>
        <button v-if="detail.status === 'ACTIVO'" class="secondary" type="button" @click="beginAction('BLOQUEADO_PERMANENTE')">Bloqueo permanente</button>
        <button v-if="detail.status === 'BLOQUEADO_TEMPORAL' || detail.status === 'BLOQUEADO_PERMANENTE'" class="action" type="button" @click="beginAction('ACTIVO')">Desbloquear</button>
        <button v-if="detail.status !== 'ELIMINADO'" class="danger" type="button" @click="beginAction('ELIMINADO')">Dar de baja</button>
      </div>
      <form v-if="selectedAction" class="action-form" @submit.prevent="askAction">
        <h4>{{ selectedAction === 'ELIMINADO' ? 'Baja de cuenta' : selectedAction === 'ACTIVO' ? 'Desbloqueo' : selectedAction === 'BLOQUEADO_TEMPORAL' ? 'Bloqueo temporal' : 'Bloqueo permanente' }}</h4>
        <label v-if="selectedAction === 'BLOQUEADO_TEMPORAL'">Bloqueada hasta<input v-model="blockedUntil" type="datetime-local" :min="toLocalMin()" required /></label>
        <label v-if="selectedAction === 'BLOQUEADO_PERMANENTE'">Canal para solicitar revisión<input v-model="reviewChannel" type="text" maxlength="255" required /></label>
        <label>Motivo<textarea v-model="reason" minlength="5" maxlength="1000" rows="3" required /></label>
        <p v-if="actionError" class="inline-error" role="alert">{{ actionError }}</p>
        <div class="actions"><button class="action" type="submit" :disabled="saving">Continuar</button><button class="secondary" type="button" :disabled="saving" @click="selectedAction = null">Cancelar</button></div>
      </form>
      <div class="history"><h4>Historial de sanciones y cambios</h4><StatePanel v-if="!detail.statusHistory.length" title="Sin sanciones registradas" message="Esta cuenta no tiene cambios de estado en el historial." /><ol v-else><li v-for="entry in detail.statusHistory" :key="entry.id"><strong>{{ statusLabel(entry.fromStatus) }} → {{ statusLabel(entry.toStatus) }}</strong><span>{{ new Date(entry.createdAt).toLocaleString() }} · {{ entry.actor?.name ?? 'Acción propia' }}</span><p>{{ entry.reason }}</p></li></ol></div>
    </section>
    <AppConfirmModal :open="confirmOpen" :title="confirmTitle" :message="confirmMessage" :confirm-label="confirmLabel" :variant="confirmVariant" :loading="saving" @confirm="executeAction" @cancel="confirmOpen = false" />
  </section>
</template>

<style scoped>
.card{padding:clamp(1rem,3vw,1.5rem);background:#fff;border:1px solid var(--admin-border);border-radius:1rem;box-shadow:0 8px 28px rgb(18 58 54 / 6%)}h2{font-size:1.35rem}h3{font-size:1.2rem;margin:0}.hint{margin:.4rem 0 1rem;color:var(--color-muted)}.heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem}.filters{display:grid;grid-template-columns:minmax(12rem,1.5fr) repeat(2,minmax(10rem,1fr)) auto;gap:.8rem;align-items:end;margin:1.2rem 0}.filters label,.action-form label{display:grid;gap:.4rem;font-weight:700}.filters input,.filters select,.action-form input,.action-form textarea{width:100%;min-width:0;min-height:2.75rem;padding:.55rem .7rem;border:1px solid #9caea9;border-radius:.55rem;background:#fff;color:var(--color-ink);font:inherit}.action-form textarea{resize:vertical}.action,.secondary,.danger{min-height:2.75rem;padding:.6rem .95rem;border-radius:.6rem;font-weight:800;cursor:pointer}.action{background:var(--admin-primary);border:1px solid var(--admin-primary);color:#fff}.secondary{background:#fff;border:1px solid var(--admin-border);color:var(--admin-primary-dark)}.danger{background:#fff;border:1px solid #a62a30;color:#8d1d24}.action:disabled,.secondary:disabled,.danger:disabled{opacity:.55;cursor:wait}.result-count{margin:.7rem 0;color:var(--color-muted)}.table-scroll{overflow-x:auto}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:.75rem .55rem;border-top:1px solid #e2eae8;vertical-align:middle}tbody th span{display:block;color:var(--color-muted);font-weight:500;overflow-wrap:anywhere}.pagination{display:flex;justify-content:center;align-items:center;gap:1rem;margin:1rem 0}.detail{margin-top:1.5rem;padding-top:1.3rem;border-top:2px solid #e2eae8}.actions{display:flex;flex-wrap:wrap;gap:.6rem;margin:1rem 0}.action-form{display:grid;gap:.8rem;padding:1rem;margin:1rem 0;background:#f5f8f7;border-radius:.8rem}.action-form h4,.history h4{margin:.2rem 0}.inline-error{color:var(--color-danger);font-weight:700}.consequence{color:var(--admin-primary-dark)}.history ol{padding-left:1.4rem}.history li{padding:.65rem 0;border-top:1px solid #e2eae8}.history li span{display:block;color:var(--color-muted);font-size:.9rem}.history li p{margin:.35rem 0}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}button:focus-visible,input:focus-visible,select:focus-visible,textarea:focus-visible{outline:3px solid #e6aa32;outline-offset:2px}@media(max-width:800px){.filters{grid-template-columns:repeat(2,minmax(0,1fr))}.search-field{grid-column:1/-1}}@media(max-width:520px){.heading{flex-direction:column}.filters{grid-template-columns:1fr}.search-field{grid-column:auto}.pagination{gap:.5rem}.pagination span{font-size:.9rem}}
</style>
