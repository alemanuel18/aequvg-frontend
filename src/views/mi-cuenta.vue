<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useStudentCommentsApi } from '~/services/student-comments'
import type { StudentComment } from '~/types/api'
import { getModerationFeedback, safeModerationFeedbackFields } from '~/utils/moderation-feedback'

useSeoMeta({ title: 'Mi perfil', description: 'Consulta y actualiza tu perfil estudiantil.', robots: 'noindex, nofollow' })
const session = useStudentSession()
const commentsApi = useStudentCommentsApi()
const toast = useToast()
const route = useRoute()
const currentTab = computed(() => route.query.section === 'events' ? 'events' : route.query.section === 'comments' ? 'comments' : 'profile')
const checking = ref(true)
const saving = ref(false)
const closing = ref(false)
const requestError = ref('')
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

const commentCsrfToken = () => session.csrfToken.value || useCookie<string | null>('aequvg_student_csrf').value || ''
const updateComment = async (id: number, content: string) => {
  try {
    await commentsApi.update(id, content, commentCsrfToken())
    commentsModerationCode.value = ''
    commentsModerationFields.value = {}
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
  try {
    const user = await session.updateProfile({ firstNames: firstNames.value, lastNames: lastNames.value })
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
</script>

<template>
  <AppSection title="Mi cuenta" lead="Gestiona tu presencia en el portal estudiantil.">
    <StatePanel v-if="checking" title="Comprobando tu sesión" message="Estamos preparando tu espacio personal." />
    <div v-else-if="session.user.value" class="panel">
      <AccountNavigation :current="currentTab" />
      <StatePanel v-if="currentTab === 'events'" title="Mis eventos" message="Aquí encontrarás tus eventos. La integración del listado está a cargo del equipo de eventos." />
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
      </section>
    </div>
  </AppSection>
</template>

<style scoped>
.panel { max-width: 54rem; margin-inline: auto; }
.comments-history { display: grid; gap: 1rem; }
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
@media (max-width: 480px) { .account { grid-template-columns: 1fr; } .profile-form { grid-column: 1; } }
</style>
