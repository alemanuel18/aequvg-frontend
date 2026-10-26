<script setup lang="ts">
import type { StudentComment } from '../../types/api'

const props = defineProps<{
  comments: StudentComment[]
  loading: boolean
  error: string
  onUpdate?: (id: number, content: string) => Promise<void>
  onDelete?: (id: number) => Promise<void>
}>()

defineEmits<{ retry: [] }>()
const editingId = ref<number | null>(null)
const draft = ref('')
const saving = ref(false)
const confirmingDeleteId = ref<number | null>(null)
const deleting = ref(false)
const actionError = ref('')

const beginEdit = (comment: StudentComment) => {
  editingId.value = comment.id
  draft.value = comment.content
  actionError.value = ''
  confirmingDeleteId.value = null
}

const saveEdit = async (commentId: number) => {
  if (saving.value || !props.onUpdate || !draft.value.trim() || draft.value.trim().length > 2000) return
  saving.value = true
  actionError.value = ''
  try {
    await props.onUpdate(commentId, draft.value.trim())
    editingId.value = null
  } catch {
    actionError.value = 'No se guardaron los cambios. Revisa el mensaje y vuelve a intentarlo.'
  } finally {
    saving.value = false
  }
}

const deleteComment = async (commentId: number) => {
  if (deleting.value || !props.onDelete) return
  deleting.value = true
  actionError.value = ''
  try {
    await props.onDelete(commentId)
    confirmingDeleteId.value = null
  } catch {
    actionError.value = 'No se pudo eliminar el comentario. Intenta nuevamente.'
  } finally {
    deleting.value = false
  }
}

const targetLabels: Record<StudentComment['targetType'], string> = {
  NOTICIA: 'Noticia',
  PROYECTO: 'Proyecto',
  EVENTO: 'Evento'
}

const publicationPath = (comment: StudentComment) => {
  const path: Record<StudentComment['targetType'], string> = {
    NOTICIA: '/noticias',
    PROYECTO: '/investigacion',
    EVENTO: '/eventos'
  }
  return `${path[comment.targetType]}/${comment.targetId}`
}

const formatDate = (value: string) => new Intl.DateTimeFormat('es-GT', {
  dateStyle: 'medium',
  timeStyle: 'short'
}).format(new Date(value))
</script>

<template>
  <section class="comments" aria-labelledby="comments-title">
    <h2 id="comments-title">Mis comentarios</h2>
    <StatePanel v-if="loading" title="Cargando comentarios" message="Estamos consultando tu historial personal." />
    <StatePanel v-else-if="error" title="No pudimos cargar tus comentarios" :message="error" role="alert">
      <button type="button" @click="$emit('retry')">Reintentar</button>
    </StatePanel>
    <StatePanel v-else-if="comments.length === 0" title="Aún no tienes comentarios" message="Los comentarios que publiques aparecerán aquí." />
    <ol v-else class="comment-list">
      <li v-for="comment in comments" :key="comment.id" class="comment-card">
        <article>
          <header class="comment-card__header">
            <div>
              <h3><NuxtLink :to="publicationPath(comment)">{{ targetLabels[comment.targetType] }} #{{ comment.targetId }}</NuxtLink></h3>
              <p class="comment-card__author">{{ comment.authorName }}</p>
            </div>
            <time :datetime="comment.createdAt">{{ formatDate(comment.createdAt) }}</time>
          </header>
          <form v-if="editingId === comment.id" class="comment-edit" @submit.prevent="saveEdit(comment.id)">
            <label :for="`edit-comment-${comment.id}`">Editar comentario</label>
            <textarea :id="`edit-comment-${comment.id}`" v-model="draft" rows="4" maxlength="2000" required :disabled="saving" />
            <p v-if="actionError" class="comment-action-error" role="alert">{{ actionError }}</p>
            <div class="comment-actions">
              <button type="submit" :disabled="saving || !draft.trim()">{{ saving ? 'Guardando…' : 'Guardar edición' }}</button>
              <button type="button" :disabled="saving" @click="editingId = null">Cancelar</button>
            </div>
          </form>
          <p v-else class="comment-card__content">{{ comment.content }}</p>
          <div v-if="editingId !== comment.id && (props.onUpdate || props.onDelete)" class="comment-actions">
            <button v-if="props.onUpdate" type="button" @click="beginEdit(comment)">Editar</button>
            <button v-if="props.onDelete && confirmingDeleteId !== comment.id" type="button" @click="confirmingDeleteId = comment.id; actionError = ''">Eliminar</button>
          </div>
          <div v-if="confirmingDeleteId === comment.id" class="comment-delete-confirm" role="group" aria-label="Confirmar eliminación del comentario">
            <p>¿Eliminar este comentario? Dejará de mostrarse; el historial solo estará disponible para administración.</p>
            <p v-if="actionError" class="comment-action-error" role="alert">{{ actionError }}</p>
            <div class="comment-actions">
              <button type="button" :disabled="deleting" @click="deleteComment(comment.id)">{{ deleting ? 'Eliminando…' : 'Confirmar eliminación' }}</button>
              <button type="button" :disabled="deleting" @click="confirmingDeleteId = null">Cancelar</button>
            </div>
          </div>
        </article>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.comments { display: grid; gap: 1rem; }
.comments > h2 { margin: 0; color: var(--color-ink); font-size: 1.5rem; }
.comment-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.comment-card { min-width: 0; padding: 1.25rem; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow); }
.comment-card__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; }
.comment-card__header h3 { margin: 0; font-size: 1.05rem; }
.comment-card__header h3 a { color: var(--color-primary); text-underline-offset: .2em; }
.comment-card__header h3 a:focus-visible { outline: 3px solid var(--color-primary); outline-offset: 3px; }
.comment-card__header time, .comment-card__author { color: var(--color-muted); font-size: .9rem; }
.comment-card__author { margin: .35rem 0 0; }
.comment-card__content { margin: 1rem 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.comment-edit, .comment-delete-confirm { display: grid; gap: .65rem; margin-top: 1rem; }
.comment-edit label { font-weight: 750; }
.comment-edit textarea { width: 100%; min-height: 6rem; padding: .75rem; font: inherit; border: 1px solid var(--color-border); border-radius: .5rem; }
.comment-actions { display: flex; flex-wrap: wrap; gap: .5rem; }
.comment-actions button { min-height: 2.5rem; padding: .45rem .8rem; color: var(--color-primary); background: white; border: 1px solid var(--color-primary); border-radius: .5rem; font: inherit; font-weight: 700; cursor: pointer; }
.comment-actions button:disabled { opacity: .6; cursor: not-allowed; }
.comment-action-error { color: var(--color-danger); font-weight: 700; }
@media (max-width: 480px) { .comment-card__header { flex-direction: column; gap: .5rem; } }
</style>
