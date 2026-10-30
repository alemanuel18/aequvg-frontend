<script setup lang="ts">
import type { AdminRegistrationRequest, AdminRole, ManagedAdminUser } from '~/types/api'
import { PublicApiError } from '~/services/api'
import { useAdminUsersApi } from '~/services/admin-users'

definePageMeta({ layout: 'admin', middleware: 'admin-auth', alias: ['/administrador/usuarios'] })
useSeoMeta({ title: 'Usuarios y cuentas', robots: 'noindex, nofollow' })
const session = useAdminSession()
const api = useAdminUsersApi()
const toast = useToast()
const users = ref<ManagedAdminUser[]>([])
const roles = ref<AdminRole[]>([])
const requests = ref<AdminRegistrationRequest[]>([])
const requestedRoles = reactive<Record<number, string>>({})
const loading = ref(true)
const loadError = ref('')
const requestsLoadError = ref('')
const saving = ref(false)
const form = reactive({ firstNames: '', lastNames: '', email: '', roleId: '', password: '' })
const fieldErrors = ref<Record<string, string>>({})
const confirm = reactive({ open: false, title: '', message: '', label: 'Guardar cambios', action: null as null | (() => Promise<void>) })
const selfId = computed(() => session.user.value?.id)
const load = async () => {
  loading.value = true; loadError.value = ''
  requestsLoadError.value = ''
  const [usersResult, rolesResult, requestsResult] = await Promise.allSettled([api.list(), api.roles(), api.requests()])
  if (usersResult.status === 'rejected' || rolesResult.status === 'rejected') {
    const error = usersResult.status === 'rejected' ? usersResult.reason : rolesResult.status === 'rejected' ? rolesResult.reason : null
    loadError.value = error instanceof PublicApiError ? error.message : 'No se pudieron consultar las cuentas y roles.'
  } else {
    users.value = usersResult.value
    roles.value = rolesResult.value
  }
  if (requestsResult.status === 'fulfilled') {
    requests.value = requestsResult.value
    for (const request of requests.value) requestedRoles[request.id] = roles.value[0] ? String(roles.value[0].id) : ''
  } else {
    requestsLoadError.value = requestsResult.reason instanceof PublicApiError ? requestsResult.reason.message : 'No se pudieron consultar las solicitudes.'
  }
  loading.value = false
}
onMounted(load)
const validate = () => {
  const errors: Record<string, string> = {}
  if (form.firstNames.trim().length < 2) errors.firstNames = 'Escribe los nombres.'
  if (form.lastNames.trim().length < 2) errors.lastNames = 'Escribe los apellidos.'
  if (!/^[^\s@]+@uvg\.edu\.gt$/i.test(form.email.trim())) errors.email = 'Usa un correo institucional @uvg.edu.gt.'
  if (!form.roleId || !roles.value.some(role => role.id === Number(form.roleId))) errors.roleId = 'Selecciona un rol disponible.'
  if (form.password && !(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,128}$/).test(form.password)) errors.password = 'Usa 12–128 caracteres con mayúscula, minúscula, número y símbolo.'
  fieldErrors.value = errors
  if (Object.keys(errors).length) {
    nextTick(() => document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus())
  }
  return Object.keys(errors).length === 0
}
const askCreate = () => {
  if (saving.value || !validate()) return
  confirm.title = 'Crear cuenta administrativa'
  confirm.message = `Se creará ${form.email.trim()} con el rol seleccionado. Los permisos corresponden al rol y no se pueden ampliar desde el formulario.`
  confirm.label = 'Crear cuenta'
  confirm.action = async () => {
    const created = await api.create({ firstNames: form.firstNames.trim(), lastNames: form.lastNames.trim(), email: form.email.trim().toLowerCase(), roleId: Number(form.roleId), ...(form.password ? { password: form.password } : {}) })
    users.value.unshift(created); form.firstNames = ''; form.lastNames = ''; form.email = ''; form.roleId = ''; form.password = ''
    toast.success('La cuenta administrativa se creó correctamente.')
  }
  confirm.open = true
}
const askUpdate = (user: ManagedAdminUser, roleId: number, status: ManagedAdminUser['status']) => {
  if (saving.value || user.id === selfId.value) return
  const nextRole = Number(roleId)
  if (nextRole === user.role.id && status === user.status) return
  confirm.title = 'Guardar cambios de cuenta'
  confirm.message = `Se actualizarán rol o estado de ${user.email}. Sus sesiones actuales se revocarán.`
  confirm.label = 'Guardar cambios'
  confirm.action = async () => {
    const updated = await api.update(user.id, { ...(nextRole !== user.role.id ? { roleId: nextRole } : {}), ...(status !== user.status ? { status } : {}) })
    const index = users.value.findIndex(item => item.id === user.id)
    if (index >= 0) users.value[index] = updated
    toast.success('Los cambios de la cuenta se guardaron.')
  }
  confirm.open = true
}
const askReview = (request: (typeof requests.value)[number], decision: 'APROBADA' | 'RECHAZADA') => {
  if (saving.value || (decision === 'APROBADA' && !requestedRoles[request.id])) return
  confirm.title = decision === 'APROBADA' ? 'Aprobar solicitud' : 'Rechazar solicitud'
  confirm.message = decision === 'APROBADA'
    ? `Se creará una cuenta activa para ${request.email} con el rol seleccionado.`
    : `Se rechazará la solicitud de ${request.email}; no se creará una cuenta.`
  confirm.label = decision === 'APROBADA' ? 'Aprobar cuenta' : 'Rechazar solicitud'
  confirm.action = async () => {
    await api.reviewRequest(request.id, decision === 'APROBADA' ? { status: decision, roleId: Number(requestedRoles[request.id]) } : { status: decision })
    requests.value = requests.value.filter(item => item.id !== request.id)
    if (decision === 'APROBADA') await load()
    toast.success(decision === 'APROBADA' ? 'La solicitud fue aprobada y la cuenta quedó activa.' : 'La solicitud fue rechazada.')
  }
  confirm.open = true
}
const execute = async () => {
  if (saving.value || !confirm.action) return
  saving.value = true
  try { await confirm.action(); confirm.open = false }
  catch (error) { toast.error(error instanceof PublicApiError ? error.message : 'No se pudo completar la operación.') }
  finally { saving.value = false }
}
</script>

<template>
  <div class="users-page">
    <AdminPageHeader eyebrow="Administración" title="Cuentas y usuarios" description="Administra cuentas normales y, por separado, las cuentas administrativas y sus permisos." />
    <StatePanel v-if="loading" title="Cargando cuentas" message="Consultando cuentas y roles disponibles." />
    <StatePanel v-else-if="loadError" role="alert" title="No se pudieron cargar las cuentas" :message="loadError"><button class="action" type="button" @click="load">Reintentar</button></StatePanel>
    <template v-else>
      <StudentAccountManagementPanel />
      <section class="card" aria-labelledby="requests-title">
        <div class="section-heading"><div><h2 id="requests-title">Solicitudes de cuenta</h2><p class="hint">Antes de aprobar, verifica la identidad del solicitante por un canal institucional. La cuenta se crea con el rol que asignes.</p></div></div>
        <StatePanel v-if="requestsLoadError" role="alert" title="No se pudieron cargar las solicitudes" :message="requestsLoadError"><button class="secondary" type="button" @click="load">Reintentar</button></StatePanel>
        <StatePanel v-else-if="!requests.length" title="No hay solicitudes pendientes" message="Las nuevas solicitudes de acceso aparecerán aquí." />
        <div v-else class="request-list"><article v-for="request in requests" :key="request.id" class="request-row"><div><strong>{{ request.name }}</strong><span>{{ request.email }}</span><small>Solicitada {{ new Date(request.createdAt).toLocaleDateString() }}</small></div><label class="role-choice">Rol al aprobar<select v-model="requestedRoles[request.id]" :aria-label="'Rol para ' + request.email"><option v-for="role in roles" :key="role.id" :value="String(role.id)">{{ role.name }}</option></select></label><div class="request-actions"><button class="action" type="button" :disabled="saving || !roles.length" @click="askReview(request, 'APROBADA')">Aprobar</button><button class="secondary" type="button" :disabled="saving" @click="askReview(request, 'RECHAZADA')">Rechazar</button></div></article></div>
      </section>
      <section class="card" aria-labelledby="create-title">
        <h2 id="create-title">Dar de alta una cuenta</h2>
        <p class="hint">Solo se permiten correos institucionales. Deja la contraseña vacía si la cuenta usará el inicio de sesión institucional habilitado.</p>
        <form class="create-form" novalidate @submit.prevent="askCreate">
          <label>Nombres<input v-model="form.firstNames" autocomplete="given-name" maxlength="80" :aria-invalid="!!fieldErrors.firstNames" :aria-describedby="fieldErrors.firstNames ? 'first-names-error' : undefined"><span v-if="fieldErrors.firstNames" id="first-names-error" class="error">{{ fieldErrors.firstNames }}</span></label>
          <label>Apellidos<input v-model="form.lastNames" autocomplete="family-name" maxlength="80" :aria-invalid="!!fieldErrors.lastNames" :aria-describedby="fieldErrors.lastNames ? 'last-names-error' : undefined"><span v-if="fieldErrors.lastNames" id="last-names-error" class="error">{{ fieldErrors.lastNames }}</span></label>
          <label>Correo institucional<input v-model="form.email" type="email" inputmode="email" autocomplete="email" :aria-invalid="!!fieldErrors.email" :aria-describedby="fieldErrors.email ? 'email-error' : undefined"><span v-if="fieldErrors.email" id="email-error" class="error">{{ fieldErrors.email }}</span></label>
          <label>Rol<select v-model="form.roleId" :aria-invalid="!!fieldErrors.roleId" :aria-describedby="fieldErrors.roleId ? 'role-error' : undefined"><option value="" disabled>Selecciona un rol</option><option v-for="role in roles" :key="role.id" :value="String(role.id)">{{ role.name }}</option></select><span v-if="fieldErrors.roleId" id="role-error" class="error">{{ fieldErrors.roleId }}</span></label>
          <label>Contraseña inicial (opcional)<input v-model="form.password" type="password" autocomplete="new-password" :aria-invalid="!!fieldErrors.password" :aria-describedby="fieldErrors.password ? 'password-error' : undefined"><span v-if="fieldErrors.password" id="password-error" class="error">{{ fieldErrors.password }}</span></label>
          <button class="action" type="submit" :disabled="saving || !roles.length">Crear cuenta</button>
        </form>
      </section>
      <section class="card" aria-labelledby="list-title">
        <div class="section-heading"><div><h2 id="list-title">Cuentas registradas</h2><p class="hint">{{ users.length }} cuenta{{ users.length === 1 ? '' : 's' }}</p></div><button type="button" class="secondary" @click="load">Actualizar lista</button></div>
        <StatePanel v-if="!users.length" title="No hay cuentas registradas" message="Crea la primera cuenta administrativa usando el formulario anterior." />
        <div v-else class="table-wrap"><table><thead><tr><th scope="col">Cuenta</th><th scope="col">Rol</th><th scope="col">Estado</th><th scope="col">Acceso</th></tr></thead><tbody>
          <tr v-for="user in users" :key="user.id"><th scope="row"><strong>{{ user.name }}</strong><span>{{ user.email }}</span><small v-if="user.id === selfId">Tu cuenta</small></th>
            <td><select :value="user.role.id" :disabled="user.id === selfId || saving" :aria-label="`Rol de ${user.name}`" @change="askUpdate(user, Number(($event.target as HTMLSelectElement).value), user.status)"><option v-for="role in roles" :key="role.id" :value="role.id">{{ role.name }}</option></select></td>
            <td><select :value="user.status" :disabled="user.id === selfId || saving" :aria-label="`Estado de ${user.name}`" @change="askUpdate(user, user.role.id, ($event.target as HTMLSelectElement).value as ManagedAdminUser['status'])"><option value="ACTIVO">Activo</option><option value="INACTIVO">Inactivo</option><option value="BLOQUEADO">Bloqueado</option></select></td>
            <td>{{ user.authenticationProviders.join(', ') || 'Sin método configurado' }}</td></tr>
        </tbody></table></div>
      </section>
    </template>
    <AppConfirmModal :open="confirm.open" :title="confirm.title" :message="confirm.message" :confirm-label="confirm.label" :loading="saving" @confirm="execute" @cancel="confirm.open = false" />
  </div>
</template>
<style scoped>
.users-page{display:grid;gap:1.5rem;min-width:0}.card{padding:clamp(1rem,3vw,1.6rem);background:#fff;border:1px solid var(--admin-border);border-radius:1rem;box-shadow:0 8px 28px rgb(18 58 54 / 6%)}h2{font-size:1.35rem}.hint{margin:.45rem 0 1rem;color:var(--color-muted)}.create-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1rem}.create-form label{display:grid;align-content:start;gap:.4rem;font-weight:750}.create-form input,.create-form select,.table-wrap select{width:100%;min-width:0;min-height:2.8rem;padding:.55rem .7rem;border:1px solid #9caea9;border-radius:.55rem;background:#fff;color:var(--color-ink)}[aria-invalid=true]{border:2px solid var(--color-danger)!important}.error{color:var(--color-danger);font-size:.85rem;font-weight:700}.action,.secondary{min-height:2.8rem;padding:.65rem 1rem;border-radius:.6rem;font-weight:800;cursor:pointer}.action{color:#fff;background:var(--admin-primary);border:1px solid var(--admin-primary)}.action:disabled{opacity:.6;cursor:wait}.secondary{color:var(--admin-primary-dark);background:#fff;border:1px solid var(--admin-border)}.create-form>.action{align-self:end;justify-self:start}.section-heading{display:flex;align-items:center;justify-content:space-between;gap:1rem}.table-wrap{overflow-x:auto}.request-list{display:grid}.request-row{display:grid;grid-template-columns:minmax(10rem,1fr) minmax(12rem,.7fr) auto;align-items:center;gap:1rem;padding:1rem 0;border-top:1px solid #e2eae8}.request-row>div:first-child span,.request-row small{display:block;color:var(--color-muted);overflow-wrap:anywhere}.request-row small{margin-top:.25rem;font-size:.8rem}.request-actions{display:flex;flex-wrap:wrap;gap:.5rem}.role-choice{display:grid;gap:.4rem;font-weight:750}.role-choice select{min-height:2.8rem;padding:.55rem .7rem;border:1px solid #9caea9;border-radius:.55rem;background:#fff;color:var(--color-ink)}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:.8rem .55rem;border-top:1px solid #e2eae8;vertical-align:middle}tbody th span,tbody th small{display:block;font-weight:500;color:var(--color-muted);overflow-wrap:anywhere}tbody th small{color:var(--admin-primary);font-weight:800}td:last-child{font-size:.86rem;color:var(--color-muted)}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #e6aa32;outline-offset:2px}@media(max-width:700px){.create-form{grid-template-columns:1fr}.section-heading{align-items:flex-start;flex-direction:column}.request-row{grid-template-columns:1fr}.table-wrap table{min-width:650px}}@media(max-width:360px){.card{padding:.85rem}}
</style>
