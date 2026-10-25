<script setup lang="ts">
import type { StudentComment } from '../../types/api'

defineProps<{
  comments: StudentComment[]
  loading: boolean
  error: string
}>()

defineEmits<{ retry: [] }>()

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
          <p class="comment-card__content">{{ comment.content }}</p>
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
@media (max-width: 480px) { .comment-card__header { flex-direction: column; gap: .5rem; } }
</style>
