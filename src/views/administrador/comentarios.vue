<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminCommentHistoryApi } from '~/services/student-comments'
import type { StudentCommentRevision } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Historial de comentarios · Administración', robots: 'noindex, nofollow' })

const api = useAdminCommentHistoryApi()
const items = ref<StudentCommentRevision[]>([])
const page = ref(1)
const pageSize = 20
const total = ref(0)
const loading = ref(true)
const error = ref('')
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))

const load = async () => {
  loading.value = true
  error.value = ''
  try {
    const result = await api.history(page.value, pageSize)
    items.value = result.items
    total.value = result.total
  } catch (cause) {
    error.value = cause instanceof PublicApiError ? cause.message : 'No se pudo cargar el historial de comentarios.'
  } finally {
    loading.value = false
  }
}

const targetPath = (item: StudentCommentRevision) => {
  const base: Record<StudentCommentRevision['targetType'], string> = {
    NOTICIA: '/noticias', PROYECTO: '/investigacion', EVENTO: '/eventos'
  }
  return `${base[item.targetType]}/${item.targetId}`
}

const formatDate = (value: string) => new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
const changePage = (next: number) => {
  if (next < 1 || next > totalPages.value || next === page.value) return
  page.value = next
  void load()
}

onMounted(load)
</script>

<template>
  <div class="comment-history-admin">
    <AdminPageHeader
      eyebrow="Moderación y auditoría"
      title="Historial de comentarios"
      description="Ediciones y eliminaciones quedan registradas aquí. Este historial, incluido el texto anterior, solo está disponible para administradores."
    />

    <StatePanel v-if="loading" title="Cargando historial" message="Consultando los cambios registrados." />
    <StatePanel v-else-if="error" title="No se pudo cargar el historial" :message="error" role="alert">
      <button type="button" @click="load">Reintentar</button>
    </StatePanel>
    <StatePanel v-else-if="items.length === 0" title="Sin cambios registrados" message="Las ediciones y eliminaciones de comentarios aparecerán aquí." />

    <ol v-else class="revision-list">
      <li v-for="item in items" :key="item.id" class="revision-card">
        <header>
          <div>
            <strong>{{ item.action === 'EDIT' ? 'Comentario editado' : 'Comentario eliminado' }}</strong>
            <NuxtLink :to="targetPath(item)">{{ item.targetType }} #{{ item.targetId }}</NuxtLink>
          </div>
          <time :datetime="item.changedAt">{{ formatDate(item.changedAt) }}</time>
        </header>
        <p><b>Cuenta:</b> {{ item.actorName }}</p>
        <div class="revision-content">
          <section>
            <h3>Texto anterior</h3>
            <p>{{ item.previousContent }}</p>
          </section>
          <section v-if="item.action === 'EDIT'">
            <h3>Texto guardado</h3>
            <p>{{ item.nextContent }}</p>
          </section>
          <section v-else>
            <h3>Estado</h3>
            <p>El comentario dejó de mostrarse públicamente.</p>
          </section>
        </div>
      </li>
    </ol>

    <nav v-if="total > pageSize && !error" class="history-pagination" aria-label="Paginación del historial de comentarios">
      <button type="button" :disabled="loading || page <= 1" @click="changePage(page - 1)">Anterior</button>
      <span aria-live="polite">Página {{ page }} de {{ totalPages }} · {{ total }} cambios</span>
      <button type="button" :disabled="loading || page >= totalPages" @click="changePage(page + 1)">Siguiente</button>
    </nav>
  </div>
</template>

<style scoped>
.comment-history-admin { display: grid; gap: 1.25rem; }
.revision-list { display: grid; gap: 1rem; margin: 0; padding: 0; list-style: none; }
.revision-card { display: grid; gap: .85rem; min-width: 0; padding: 1.25rem; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: var(--shadow); }
.revision-card header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: .5rem 1rem; }
.revision-card header div { display: grid; gap: .25rem; }
.revision-card header a { color: var(--color-primary); }
.revision-card time { color: var(--color-muted); }
.revision-card > p { margin: 0; color: var(--color-muted); }
.revision-content { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .85rem; }
.revision-content section { min-width: 0; padding: .9rem; background: var(--color-soft); border-radius: .5rem; }
.revision-content h3 { margin: 0 0 .45rem; font-size: .95rem; }
.revision-content p { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.history-pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; }
.history-pagination button, .comment-history-admin > :deep(.state-panel) button { min-height: 2.65rem; padding: .5rem .85rem; color: var(--color-primary); background: white; border: 1px solid var(--color-primary); border-radius: .5rem; font: inherit; font-weight: 700; cursor: pointer; }
.history-pagination button:disabled { opacity: .55; cursor: not-allowed; }
.history-pagination span { color: var(--color-muted); }
@media (max-width: 620px) { .revision-content { grid-template-columns: 1fr; } }
</style>
