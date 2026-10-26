<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useStudentCommentsApi } from '~/services/student-comments'
import { useStudentEventsService } from '~/services/student-events'
import type { EventRegistrationStatus, StudentComment, StudentEventRegistration } from '~/types/api'
import { getModerationFeedback, safeModerationFeedbackFields } from '~/utils/moderation-feedback'
import { getIdempotencyKey, type PendingIdempotentAttempt } from '~/utils/idempotency'

useSeoMeta({ title: 'Mi perfil', description: 'Consulta y actualiza tu perfil estudiantil.', robots: 'noindex, nofollow' })
const session = useStudentSession()
const authApi = useStudentAuthApi()
const commentsApi = useStudentCommentsApi()
const eventsApi = useStudentEventsService()
const toast = useToast()
const route = useRoute()
const currentTab = computed(() => route.query.section === 'events' ? 'events' : route.query.section === 'comments' ? 'comments' : 'profile')
const checking = ref(true)
const saving = ref(false)
const closing = ref(false)
const deleting = ref(false)
const requestError = ref('')
const deletionError = ref('')
const deletionFields = reactive({ email: '', password: '', confirm: false })
const moderationCode = ref('')
const moderationFields = ref<Record<string, string>>({})
const commentsModerationCode = ref('')
const commentsModerationFields = ref<Record<string, string>>({})
const firstNames = ref('')
const lastNames = ref('')
const comments = ref<StudentComment[]>([])
const commentsPage = ref(1)
const commentsPageSize = 20
const commentsTotal = ref(0)
const commentsLoading = ref(false)
const commentsError = ref('')
const commentsTotalPages = computed(() => Math.max(1, Math.ceil(commentsTotal.value / commentsPageSize)))
let commentsRequestId = 0
const eventRegistrations = ref<StudentEventRegistration[]>([])
const eventsPage = ref(1)
const eventsPageSize = 2
const eventsTotal = ref(0)
const eventsStatus = ref<EventRegistrationStatus | undefined>()
const eventsLoading = ref(false)
const eventsError = ref('')
let eventsRequestId = 0
const eventsTotalPages = computed(() => Math.max(1, Math.ceil(eventsTotal.value / eventsPageSize)))
const formatDate = (value: string) => new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const invalidateEventsHistory = () => {
  eventsRequestId += 1
  eventRegistrations.value = []
  eventsTotal.value = 0
  eventsError.value = ''
  eventsLoading.value = false
}
let pendingProfileAttempt: PendingIdempotentAttempt | null = null
const pendingCommentEdits = new Map<number, PendingIdempotentAttempt>()

const loadComments = async () => {
  if (!session.user.value) return
  const requestId = ++commentsRequestId
  commentsLoading.value = true
  commentsError.value = ''
  try {
    const result = await commentsApi.history(commentsPage.value, commentsPageSize)
    if (requestId !== commentsRequestId) return
    comments.value = result.items
    commentsTotal.value = result.total
  } catch (error) {
    if (requestId !== commentsRequestId) return
    commentsError.value = error instanceof PublicApiError ? error.message : 'No pudimos cargar tus comentarios. Intenta nuevamente.'
    toast.error(commentsError.value)
  } finally {
    if (requestId === commentsRequestId) commentsLoading.value = false
  }
}

const changeCommentsPage = (nextPage: number) => {
  if (nextPage < 1 || nextPage > commentsTotalPages.value || nextPage === commentsPage.value) return
  commentsPage.value = nextPage
}

const loadEvents = async () => {
  if (!session.user.value) return
  const requestId = ++eventsRequestId
  eventsLoading.value = true
  eventsError.value = ''
  try {
    const result = await eventsApi.history({ page: eventsPage.value, pageSize: eventsPageSize, status: eventsStatus.value })
    if (requestId !== eventsRequestId) return
    eventRegistrations.value = result.items
    eventsTotal.value = result.pagination.total
  } catch (error) {
    if (requestId !== eventsRequestId) return
    if (error instanceof PublicApiError && ['UNAUTHORIZED', 'INVALID_SESSION', 'SESSION_REVOKED'].includes(error.code)) {
      invalidateEventsHistory()
      await navigateTo('/acceso?returnTo=%2Fmi-cuenta%3Fsection%3Devents', { replace: true })
      return
    }
    eventsError.value = error instanceof PublicApiError ? error.message : 'No pudimos cargar tus eventos. Intenta nuevamente.'
    toast.error(eventsError.value)
  } finally {
    if (requestId === eventsRequestId) eventsLoading.value = false
  }
}

const changeEventsStatus = (status: string) => {
  eventsStatus.value = status === 'CONFIRMADA' || status === 'CANCELADA' ? status : undefined
  eventsPage.value = 1
}

const changeEventsPage = (nextPage: number) => {
  if (nextPage < 1 || nextPage > eventsTotalPages.value || nextPage === eventsPage.value) return
  eventsPage.value = nextPage
}

const commentCsrfToken = () => session.csrfToken.value || useCookie<string | null>('aequvg_student_csrf').value || ''
const updateComment = async (id: number, content: string) => {
  const attempt = getIdempotencyKey(pendingCommentEdits.get(id) ?? null, JSON.stringify([id, content.trim()]))
  pendingCommentEdits.set(id, attempt)
  try {
    commentsModerationCode.value = ''
    commentsModerationFields.value = {}
    await commentsApi.update(id, content, commentCsrfToken(), attempt.key)
    pendingCommentEdits.delete(id)
    toast.success('Tu comentario se actualizó y pasó la revisión de moderación.')
    await loadComments()
  } catch (error) {
    const feedback = error instanceof PublicApiError ? getModerationFeedback(error.code, error.fields) : null
    const message = feedback?.message ?? (error instanceof PublicApiError ? error.message : 'No pudimos actualizar el comentario.')
    if (feedback && error instanceof PublicApiError) {
      commentsModerationCode.value = error.code
      commentsModerationFields.value = safeModerationFeedbackFields(error.fields)
    }
    toast.error(message)
    throw error
  }
}

const deleteComment = async (id: number) => {
  try {
    await commentsApi.delete(id, commentCsrfToken())
    toast.success('El comentario se eliminó. Su registro queda disponible solo para administración.')
    if (comments.value.length === 1 && commentsPage.value > 1) {
      commentsPage.value -= 1
      return
    }
    await loadComments()
  } catch (error) {
    toast.error(error instanceof PublicApiError ? error.message : 'No pudimos eliminar el comentario.')
    throw error
  }
}

watch([currentTab, () => session.user.value?.id, commentsPage], ([tab, userId]) => {
  if (tab === 'comments' && userId) void loadComments()
})

watch([currentTab, () => session.user.value?.id, eventsPage, eventsStatus], ([tab, userId]) => {
  if (tab === 'events' && userId) void loadEvents()
  else if (tab !== 'events' || !userId) invalidateEventsHistory()
})

onMounted(async () => {
  const user = await session.load(true)
  checking.value = false
  if (!user) {
    await navigateTo('/acceso?returnTo=/mi-cuenta', { replace: true })
    return
  }
  firstNames.value = user.firstNames
  lastNames.value = user.lastNames
})

const saveProfile = async () => {
  if (saving.value || !session.user.value) return
  saving.value = true
  requestError.value = ''
  moderationCode.value = ''
  moderationFields.value = {}
  const input = { firstNames: firstNames.value, lastNames: lastNames.value }
  const attempt = getIdempotencyKey(pendingProfileAttempt, JSON.stringify([input.firstNames.trim(), input.lastNames.trim()]))
  pendingProfileAttempt = attempt
  try {
    const user = await session.updateProfile(input, attempt.key)
    pendingProfileAttempt = null
    firstNames.value = user.firstNames
    lastNames.value = user.lastNames
    toast.success('Tu perfil se actualizó correctamente.')
  } catch (error) {
    const feedback = error instanceof PublicApiError ? getModerationFeedback(error.code, error.fields) : null
    if (feedback && error instanceof PublicApiError) {
      moderationCode.value = error.code
      moderationFields.value = safeModerationFeedbackFields(error.fields)
      toast.error(feedback.message)
    } else {
      requestError.value = error instanceof PublicApiError ? error.message : 'No pudimos guardar los cambios. Intenta nuevamente.'
      toast.error(requestError.value)
    }
  } finally {
    saving.value = false
  }
}

const logout = async () => {
  if (closing.value) return
  closing.value = true
  requestError.value = ''
  try {
    await session.logout()
    await navigateTo('/', { replace: true })
  } catch (error) {
    requestError.value = error instanceof PublicApiError ? error.message : 'No pudimos cerrar la sesión. Intenta nuevamente.'
    toast.error(requestError.value)
  } finally {
    closing.value = false
  }
}

const deleteAccount = async () => {
  if (deleting.value || !session.user.value) return
  deleting.value = true
  deletionError.value = ''
  try {
    const csrfToken = session.csrfToken.value || useCookie<string | null>('aequvg_student_csrf').value || ''
    await authApi.deleteAccount({ email: deletionFields.email.trim().toLowerCase(), password: deletionFields.password, confirm: true }, csrfToken)
    deletionFields.email = ''
    deletionFields.password = ''
    deletionFields.confirm = false
    session.clearLocal()
    await navigateTo('/', { replace: true })
  } catch (error) {
    if (error instanceof PublicApiError && ['UNAUTHORIZED', 'INVALID_SESSION', 'SESSION_REVOKED', 'ACCOUNT_DELETED'].includes(error.code)) {
      deletionFields.password = ''
      session.clearLocal()
      await navigateTo(error.code === 'ACCOUNT_DELETED' ? '/acceso' : '/acceso?returnTo=%2Fmi-cuenta', { replace: true })
      return
    }
    deletionError.value = error instanceof PublicApiError ? error.message : 'No pudimos eliminar tu cuenta. Intenta nuevamente.'
    toast.error(deletionError.value)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <AppSection title="Mi cuenta" lead="Gestiona tu presencia en el portal estudiantil.">
    <StatePanel v-if="checking" title="Comprobando tu sesión" message="Estamos preparando tu espacio personal." />
    <div v-else-if="session.user.value" class="panel">
      <AccountNavigation :current="currentTab" />
      <section v-if="currentTab === 'events'" class="events-history" aria-labelledby="events-title">
        <div class="history-heading">
          <div>
            <EyebrowBadge>Actividad estudiantil</EyebrowBadge>
            <h2 id="events-title">Mis eventos</h2>
          </div>
          <label for="event-status">Filtrar por estado
            <select id="event-status" :value="eventsStatus ?? ''" :disabled="eventsLoading" @change="changeEventsStatus(($event.target as HTMLSelectElement).value)">
              <option value="">Todos</option>
              <option value="CONFIRMADA">Confirmadas</option>
              <option value="CANCELADA">Canceladas</option>
            </select>
          </label>
        </div>
        <StatePanel v-if="eventsLoading" title="Cargando tus eventos" message="Estamos consultando tu historial de inscripciones." />
        <StatePanel v-else-if="eventsError" title="No pudimos cargar tus eventos" :message="eventsError" role="alert">
          <AppButton variant="secondary" @click="loadEvents">Reintentar</AppButton>
        </StatePanel>
        <StatePanel v-else-if="!eventRegistrations.length" title="No hay eventos para mostrar" :message="eventsStatus ? 'No tienes inscripciones con este estado.' : 'Aún no tienes inscripciones en eventos.'" />
        <div v-else class="events-list">
          <article v-for="registration in eventRegistrations" :key="registration.id" class="event-history-card">
            <div>
              <h3>{{ registration.event.name }}</h3>
              <p>{{ formatDate(registration.event.startsAt) }} · {{ registration.event.location }}</p>
              <p>Inscrito el {{ formatDate(registration.registeredAt) }}</p>
            </div>
            <span class="registration-status" :class="`registration-status--${registration.status.toLowerCase()}`">{{ registration.status === 'CONFIRMADA' ? 'Confirmada' : 'Cancelada' }}</span>
          </article>
        </div>
        <nav v-if="eventsTotal > 0 && !eventsError" class="events-pagination" aria-label="Paginación de mis eventos">
          <button type="button" :disabled="eventsLoading || eventsPage <= 1" @click="changeEventsPage(eventsPage - 1)">Anterior</button>
          <span aria-live="polite">Página {{ eventsPage }} de {{ eventsTotalPages }} · {{ eventsTotal }} inscripciones</span>
          <button type="button" :disabled="eventsLoading || eventsPage >= eventsTotalPages" @click="changeEventsPage(eventsPage + 1)">Siguiente</button>
        </nav>
      </section>
      <section v-else-if="currentTab === 'comments'" class="comments-history">
        <ModerationNotice v-if="commentsModerationCode" :code="commentsModerationCode" :fields="commentsModerationFields" />
        <StudentCommentsPanel :comments="comments" :loading="commentsLoading" :error="commentsError" :on-update="updateComment" :on-delete="deleteComment" @retry="loadComments" />
        <nav v-if="commentsTotal > 0 && !commentsError" class="comments-pagination" aria-label="Paginación de mis comentarios">
          <button type="button" :disabled="commentsLoading || commentsPage <= 1" @click="changeCommentsPage(commentsPage - 1)">Anterior</button>
          <span aria-live="polite">Página {{ commentsPage }} de {{ commentsTotalPages }} · {{ commentsTotal }} comentarios</span>
          <button type="button" :disabled="commentsLoading || commentsPage >= commentsTotalPages" @click="changeCommentsPage(commentsPage + 1)">Siguiente</button>
        </nav>
      </section>
      <section v-else class="account" aria-labelledby="account-title">
        <div class="profile-placeholder" aria-label="Foto de perfil genérica"><AppIcon name="users" :size="42" /></div>
        <div class="account__heading">
          <EyebrowBadge>Cuenta estudiantil</EyebrowBadge>
          <h2 id="account-title">Hola, {{ session.user.value.name }}</h2>
          <p>Actualiza tus nombres y apellidos. Tu correo institucional identifica tu cuenta y no se puede cambiar aquí.</p>
        </div>
        <form class="profile-form" @submit.prevent="saveProfile">
          <label for="first-names">Nombres</label>
          <input id="first-names" v-model="firstNames" name="firstNames" autocomplete="given-name" minlength="2" maxlength="80" required>
          <label for="last-names">Apellidos</label>
          <input id="last-names" v-model="lastNames" name="lastNames" autocomplete="family-name" minlength="2" maxlength="80" required>
          <div class="email-field" aria-describedby="email-help">
            <span class="email-field__label">Correo institucional</span>
            <p class="email-field__value">{{ session.user.value.email }}</p>
            <small id="email-help">El correo no forma parte de los datos editables del perfil.</small>
          </div>
          <p class="student-type">Tipo de cuenta: Estudiante UVG</p>
          <ModerationNotice v-if="moderationCode" :code="moderationCode" :fields="moderationFields" />
          <p v-if="requestError" class="form-error" role="alert">{{ requestError }}</p>
          <div class="actions">
            <AppButton type="submit" :disabled="saving">{{ saving ? 'Guardando…' : 'Guardar cambios' }}</AppButton>
            <AppButton variant="secondary" :disabled="closing" @click="logout">{{ closing ? 'Cerrando sesión…' : 'Cerrar sesión' }}</AppButton>
          </div>
        </form>
        <section class="account-deletion" aria-labelledby="account-deletion-title">
          <div>
            <EyebrowBadge>Zona de cuenta</EyebrowBadge>
            <h2 id="account-deletion-title">Eliminar mi cuenta</h2>
            <p>Esta acción es irreversible. Tus datos personales serán anonimizados, tus credenciales y sesiones dejarán de funcionar, y la actividad histórica necesaria podrá conservarse sin asociarse públicamente contigo.</p>
          </div>
          <form class="deletion-form" novalidate @submit.prevent="deleteAccount">
            <label for="deletion-email">Confirma tu correo institucional</label>
            <input id="deletion-email" v-model="deletionFields.email" name="deletionEmail" type="email" autocomplete="username" maxlength="254" :disabled="deleting" required>
            <label for="deletion-password">Confirma tu contraseña</label>
            <input id="deletion-password" v-model="deletionFields.password" name="deletionPassword" type="password" autocomplete="current-password" maxlength="256" :disabled="deleting" required>
            <label class="deletion-confirmation" for="deletion-confirm">
              <input id="deletion-confirm" v-model="deletionFields.confirm" type="checkbox" :disabled="deleting">
              Entiendo que mi cuenta será eliminada y que esta acción no se puede deshacer.
            </label>
            <p v-if="deletionError" class="form-error" role="alert">{{ deletionError }}</p>
            <button class="deletion-button" type="submit" :disabled="deleting || !deletionFields.email || !deletionFields.password || !deletionFields.confirm">{{ deleting ? 'Eliminando…' : 'Eliminar mi cuenta' }}</button>
          </form>
        </section>
      </section>
    </div>
  </AppSection>
</template>

<style scoped>
.panel { max-width: 54rem; margin-inline: auto; }
.comments-history { display: grid; gap: 1rem; }
.events-history { display: grid; gap: 1rem; }
.history-heading { display: flex; flex-wrap: wrap; align-items: end; justify-content: space-between; gap: 1rem; }
.history-heading h2 { margin: .6rem 0 0; font-size: clamp(1.8rem, 6vw, 2.8rem); }
.history-heading label { display: grid; gap: .35rem; color: var(--color-muted); font-weight: 700; }
.history-heading select { min-height: 2.75rem; padding: .55rem .75rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: .5rem; font: inherit; }
.events-list { display: grid; gap: .8rem; }
.event-history-card { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; padding: 1.1rem; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow); }
.event-history-card h3 { margin: 0 0 .45rem; }
.event-history-card p { margin: .25rem 0 0; color: var(--color-muted); }
.registration-status { flex: 0 0 auto; padding: .4rem .65rem; border-radius: 999px; font-weight: 800; }
.registration-status--confirmada { color: #14532d; background: #dcfce7; }
.registration-status--cancelada { color: #7f1d1d; background: #fee2e2; }
.events-pagination { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .75rem; }
.events-pagination span { color: var(--color-muted); font-size: .9rem; }
.events-pagination button { min-height: 2.75rem; padding: .55rem .9rem; color: var(--color-primary); background: white; border: 1px solid var(--color-primary); border-radius: .5rem; font: inherit; font-weight: 700; cursor: pointer; }
.events-pagination button:disabled { color: var(--color-muted); border-color: var(--color-border); cursor: not-allowed; }
.comments-pagination { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .75rem; }
.comments-pagination span { color: var(--color-muted); font-size: .9rem; }
.comments-pagination button { min-height: 2.75rem; padding: .55rem .9rem; color: var(--color-primary); background: white; border: 1px solid var(--color-primary); border-radius: .5rem; font: inherit; font-weight: 700; cursor: pointer; }
.comments-pagination button:disabled { color: var(--color-muted); border-color: var(--color-border); cursor: not-allowed; }
.comments-pagination button:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
.profile-form input:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
.account { display: grid; grid-template-columns: auto 1fr; align-items: start; gap: 1.5rem; padding: clamp(1.25rem, 5vw, 2.5rem); background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.profile-placeholder { width: 5rem; height: 5rem; display: grid; place-items: center; color: white; background: var(--color-primary); border: .3rem solid var(--color-soft); border-radius: 50%; }
.account__heading h2 { margin-block: .6rem; font-size: clamp(1.8rem, 6vw, 2.8rem); overflow-wrap: anywhere; }
.account__heading p, .profile-form small { color: var(--color-muted); }
.profile-form { grid-column: 1 / -1; display: grid; gap: .65rem; }
.profile-form label, .email-field__label { margin-top: .5rem; font-weight: 750; }
.profile-form input { width: 100%; min-height: 2.8rem; padding: .65rem .8rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: .5rem; font: inherit; }
.email-field { display: grid; gap: .65rem; margin-top: .5rem; }
.email-field__value { width: 100%; min-height: 2.8rem; display: flex; align-items: center; margin: 0; padding: .65rem .8rem; color: var(--color-muted); background: var(--color-soft); border: 1px solid var(--color-border); border-radius: .5rem; overflow-wrap: anywhere; }
.email-field small { color: var(--color-muted); }
.student-type { display: flex; align-items: center; gap: .5rem; margin-block: .75rem; color: var(--color-primary); font-weight: 750; }
.form-error { color: var(--color-danger); font-weight: 700; }
.actions { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: .5rem; }
.account-deletion { grid-column: 1 / -1; display: grid; gap: 1rem; margin-top: 1rem; padding: 1.25rem; border: 1px solid #e5b7b7; border-radius: var(--radius-md); background: #fffafa; }
.account-deletion h2 { margin: .5rem 0; }
.account-deletion p { max-width: 50rem; color: var(--color-muted); }
.deletion-form { display: grid; gap: .65rem; }
.deletion-form label { margin-top: .35rem; font-weight: 750; }
.deletion-form input[type="email"], .deletion-form input[type="password"] { width: 100%; min-height: 2.8rem; padding: .65rem .8rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: .5rem; font: inherit; }
.deletion-confirmation { display: flex; gap: .65rem; align-items: flex-start; font-weight: 500 !important; }
.deletion-confirmation input { margin-top: .25rem; }
.deletion-button { width: fit-content; min-height: 2.75rem; padding: .65rem 1rem; color: white; background: #8b1e2d; border: 1px solid #8b1e2d; border-radius: .5rem; font: inherit; font-weight: 750; cursor: pointer; }
.deletion-button:disabled { opacity: .65; cursor: not-allowed; }
.deletion-button:focus-visible, .deletion-form input:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
@media (max-width: 480px) { .account { grid-template-columns: 1fr; } .profile-form { grid-column: 1; } .event-history-card { flex-direction: column; } }
</style>
