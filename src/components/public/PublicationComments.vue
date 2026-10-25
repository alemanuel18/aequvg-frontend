<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useStudentCommentsApi } from '~/services/student-comments'
import type { StudentComment, StudentCommentTargetType } from '~/types/api'

const props = defineProps<{
  targetType: StudentCommentTargetType
  targetId: number
}>()

const commentsApi = useStudentCommentsApi()
const session = useStudentSession()
const toast = useToast()
const route = useRoute()
const comments = ref<StudentComment[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const loading = ref(false)
const loadError = ref('')
const content = ref('')
const sending = ref(false)
const submissionError = ref('')
const postingBlocked = ref(false)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const loginUrl = computed(() => `/acceso?returnTo=${encodeURIComponent(route.fullPath)}`)
let requestId = 0

const formatDate = (value: string) => new Intl.DateTimeFormat('es-GT', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(value))

const loadComments = async () => {
  const currentRequest = ++requestId
  loading.value = true
  loadError.value = ''
  try {
    const result = await commentsApi.publication(props.targetType, props.targetId, page.value, pageSize)
    if (currentRequest !== requestId) return
    comments.value = result.items
    total.value = result.total
  } catch (error) {
    if (currentRequest !== requestId) return
    loadError.value = error instanceof PublicApiError && error.status === 404
      ? 'Esta publicación ya no está disponible; no se pueden mostrar sus comentarios.'
      : error instanceof PublicApiError ? error.message : 'No pudimos cargar los comentarios. Intenta nuevamente.'
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

const explainSubmissionError = (error: unknown) => {
  if (!(error instanceof PublicApiError)) return 'No pudimos publicar tu comentario. Intenta nuevamente.'
  if (error.code === 'COMMENT_REJECTED_BY_MODERATION') return 'Tu comentario no se publicó porque el lenguaje no cumple las reglas de la comunidad. Puedes editarlo e intentar de nuevo.'
  if (error.code === 'COMMENT_MODERATION_UNAVAILABLE') return 'La moderación está temporalmente fuera de servicio. Tu comentario no se publicó; intenta más tarde.'
  if (error.code === 'DUPLICATE_COMMENT') return 'Ya publicaste ese comentario en esta publicación.'
  if (error.code === 'ACCOUNT_TEMPORARILY_BLOCKED') {
    postingBlocked.value = true
    const until = error.fields?.blockedUntil
    return until ? `Tu cuenta está sancionada temporalmente hasta ${formatDate(until)} y no puede comentar.` : 'Tu cuenta está sancionada temporalmente y no puede comentar.'
  }
  if (error.code === 'ACCOUNT_PERMANENTLY_BLOCKED') {
    postingBlocked.value = true
    const channel = error.fields?.reviewChannel
    return channel ? `Tu cuenta está sancionada y no puede comentar. Puedes solicitar revisión por ${channel}.` : 'Tu cuenta está sancionada y no puede comentar.'
  }
  if (error.code === 'ACCOUNT_DELETED') {
    postingBlocked.value = true
    return 'La cuenta fue dada de baja y no puede publicar comentarios.'
  }
  return error.message
}

const submitComment = async () => {
  if (sending.value || postingBlocked.value || session.user.value?.status !== 'ACTIVO') return
  const normalizedContent = content.value.trim()
  if (!normalizedContent || normalizedContent.length > 2000) return

  sending.value = true
  submissionError.value = ''
  try {
    await commentsApi.create(props.targetType, props.targetId, normalizedContent, session.csrfToken.value || useCookie<string | null>('aequvg_student_csrf').value || '')
    content.value = ''
    page.value = 1
    await loadComments()
    toast.success('Tu comentario se publicó correctamente.')
  } catch (error) {
    submissionError.value = explainSubmissionError(error)
    toast.error(submissionError.value)
    if (error instanceof PublicApiError && error.status === 401) await session.load(true)
  } finally {
    sending.value = false
  }
}

const changePage = (nextPage: number) => {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === page.value) return
  page.value = nextPage
  void loadComments()
}

onMounted(() => {
  void session.load()
  void loadComments()
})
</script>

<template>
  <section class="publication-comments" aria-labelledby="publication-comments-title">
    <h2 id="publication-comments-title">Comentarios</h2>

    <StatePanel v-if="loading && comments.length === 0" title="Cargando comentarios" message="Consultando los comentarios de esta publicación." />
    <StatePanel v-else-if="loadError" title="No pudimos mostrar los comentarios" :message="loadError" role="alert">
      <button v-if="!loadError.includes('ya no está disponible')" type="button" @click="loadComments">Reintentar</button>
    </StatePanel>
    <StatePanel v-else-if="comments.length === 0" title="Todavía no hay comentarios" message="Sé la primera persona en comentar esta publicación." />
    <ol v-else class="comment-list">
      <li v-for="comment in comments" :key="comment.id" class="comment-card">
        <article>
          <header class="comment-card__header">
            <strong>{{ comment.authorName }}</strong>
            <time :datetime="comment.createdAt">{{ formatDate(comment.createdAt) }}</time>
          </header>
          <p class="comment-card__content">{{ comment.content }}</p>
        </article>
      </li>
    </ol>

    <nav v-if="total > pageSize && !loadError" class="comments-pagination" aria-label="Paginación de comentarios">
      <button type="button" :disabled="loading || page <= 1" @click="changePage(page - 1)">Anterior</button>
      <span aria-live="polite">Página {{ page }} de {{ totalPages }} · {{ total }} comentarios</span>
      <button type="button" :disabled="loading || page >= totalPages" @click="changePage(page + 1)">Siguiente</button>
    </nav>

    <form v-if="session.user.value?.status === 'ACTIVO'" class="comment-form" @submit.prevent="submitComment">
      <label for="publication-comment-content">Escribe un comentario</label>
      <textarea
        id="publication-comment-content"
        v-model="content"
        name="content"
        rows="4"
        maxlength="2000"
        required
        :disabled="sending || postingBlocked"
        :aria-describedby="submissionError ? 'publication-comment-error comment-length' : 'comment-length'"
      />
      <div class="comment-form__meta">
        <span id="comment-length" aria-live="polite">{{ content.trim().length }} / 2000</span>
      </div>
      <p v-if="submissionError" id="publication-comment-error" class="comment-form__error" role="alert">{{ submissionError }}</p>
      <button type="submit" :disabled="sending || postingBlocked || !content.trim()">
        {{ sending ? 'Publicando…' : 'Publicar comentario' }}
      </button>
    </form>
    <StatePanel v-else-if="session.checked.value && session.user.value" title="No puedes comentar ahora" message="Tu cuenta no está activa o tiene una sanción vigente; puedes seguir leyendo los comentarios." />
    <StatePanel v-else-if="session.checked.value" title="Inicia sesión para comentar" message="Los comentarios son públicos; para publicar necesitas una sesión estudiantil activa.">
      <NuxtLink :to="loginUrl">Iniciar sesión o registrarme</NuxtLink>
    </StatePanel>
    <StatePanel v-else title="Comprobando tu sesión" message="Puedes leer los comentarios mientras verificamos tu acceso para publicar." />
  </section>
</template>

<style scoped>
.publication-comments { display: grid; gap: 1rem; max-width: 52rem; margin: 2rem auto 0; }
.publication-comments > h2 { margin: 0; color: var(--color-ink); font-size: clamp(1.5rem, 4vw, 2rem); }
.comment-list { display: grid; gap: .85rem; margin: 0; padding: 0; list-style: none; }
.comment-card { min-width: 0; padding: 1.1rem 1.2rem; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.comment-card__header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem 1rem; }
.comment-card__header time { color: var(--color-muted); font-size: .9rem; }
.comment-card__content { margin: .75rem 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.comment-form { display: grid; gap: .65rem; padding: 1.25rem; background: var(--color-soft); border: 1px solid var(--color-border); border-radius: var(--radius-md); }
.comment-form label { font-weight: 750; }
.comment-form textarea { width: 100%; min-height: 7rem; resize: vertical; padding: .75rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: .5rem; font: inherit; }
.comment-form textarea:focus-visible, .comment-form button:focus-visible, .comments-pagination button:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
.comment-form textarea:disabled { opacity: .65; }
.comment-form__meta { display: flex; justify-content: flex-end; color: var(--color-muted); font-size: .9rem; }
.comment-form__error { margin: 0; color: var(--color-danger); font-weight: 700; }
.comment-form button, .comments-pagination button { min-height: 2.75rem; padding: .55rem .9rem; color: white; background: var(--color-primary); border: 1px solid var(--color-primary); border-radius: .5rem; font: inherit; font-weight: 750; cursor: pointer; }
.comment-form button { justify-self: start; }
.comment-form button:disabled, .comments-pagination button:disabled { opacity: .55; cursor: not-allowed; }
.comments-pagination { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: .75rem; }
.comments-pagination span { color: var(--color-muted); font-size: .9rem; }
.comments-pagination button { color: var(--color-primary); background: white; }
</style>
