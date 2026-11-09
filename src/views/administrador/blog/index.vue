<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminBlogService } from '~/services/admin-blog'
import type { BlogPost, ContentStatus } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Blog ACS · Administración', robots: 'noindex, nofollow' })
const service = useAdminBlogService()
const toast = useToast()
const items = ref<BlogPost[]>([])
const loading = ref(true)
const loadError = ref('')
const search = ref('')
const appliedSearch = ref('')
const selectedStatus = ref<ContentStatus | ''>('')
const page = ref(1)
const pageSize = 9
const total = ref(0)
const config = useRuntimeConfig()
const confirmModal = reactive({ open: false, title: '', message: '', confirmLabel: 'Confirmar', variant: 'primary' as 'primary' | 'danger' | 'warning', loading: false, action: (async () => {}) as () => Promise<void> })
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)))
const statusLabel: Record<ContentStatus, string> = { BORRADOR: 'Borrador', PUBLICADO: 'Publicado', ARCHIVADO: 'Archivado' }
const errorMessage = (error: unknown) => error instanceof PublicApiError ? error.message : 'No se pudieron cargar las entradas del blog.'
const load = async () => {
  loading.value = true
  loadError.value = ''
  try {
    const result = await service.list({ q: appliedSearch.value || undefined, status: selectedStatus.value || undefined, page: page.value, pageSize })
    items.value = result.items
    total.value = result.pagination.total
  } catch (error) { loadError.value = errorMessage(error) }
  finally { loading.value = false }
}
const submitSearch = () => { appliedSearch.value = search.value.trim(); page.value = 1; void load() }
const filterStatus = () => { page.value = 1; void load() }
const goToPage = (next: number) => { page.value = next; void load() }
const edit = (post: BlogPost) => navigateTo({ path: '/administrador/blog/editor', query: { id: post.id } })
const executeArchive = async (post: BlogPost) => {
  try { await service.archive(post.id); toast.success('La entrada se archivó.'); await load() }
  catch (error) { toast.error(errorMessage(error)) }
}
const archive = (post: BlogPost) => {
  Object.assign(confirmModal, { open: true, title: '¿Archivar entrada?', message: `Confirma que deseas retirar “${post.title}” del listado público.`, confirmLabel: 'Archivar entrada', variant: 'warning', loading: false, action: () => executeArchive(post) })
}
const executeRemove = async (post: BlogPost) => {
  try { await service.remove(post.id); toast.success('La entrada se eliminó.'); await load() }
  catch (error) { toast.error(errorMessage(error)) }
}
const remove = (post: BlogPost) => {
  Object.assign(confirmModal, { open: true, title: '¿Eliminar entrada?', message: `Esta acción eliminará permanentemente “${post.title}”.`, confirmLabel: 'Eliminar entrada', variant: 'danger', loading: false, action: () => executeRemove(post) })
}
const handleConfirmation = async () => {
  if (confirmModal.loading) return
  confirmModal.loading = true
  try { await confirmModal.action(); confirmModal.open = false }
  finally { confirmModal.loading = false }
}
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(value)) : 'Sin publicar'
const coverUrl = (imageId: number) => new URL(`/api/v1/admin/blog/images/${imageId}/preview`, config.public.apiBaseUrl).toString()
onMounted(load)
</script>

<template>
  <div class="blog-admin">
    <AdminPageHeader eyebrow="Panel administrativo · ACS" title="Blog ACS" description="Gestiona las entradas sobre el trabajo de la asociación y su relación con la American Chemical Society." />
    <section class="manager-card" aria-labelledby="blog-list-title" :aria-busy="loading">
      <header class="section-heading">
        <div><span class="eyebrow">Contenido editorial</span><h2 id="blog-list-title">Entradas del blog</h2><p class="section-description">Revisa borradores y publicaciones, y administra su estado desde este panel.</p></div>
        <NuxtLink class="primary-button new-button" to="/administrador/blog/editor">＋ Nueva entrada</NuxtLink>
      </header>
      <div class="filters" role="search">
        <form class="search-form" @submit.prevent="submitSearch"><div class="field"><label for="blog-search">Buscar</label><input id="blog-search" v-model="search" type="search" placeholder="Título, resumen o contenido" /></div><button class="secondary-button" type="submit">Buscar</button></form>
        <div class="field status-filter"><label for="blog-status">Estado</label><select id="blog-status" v-model="selectedStatus" @change="filterStatus"><option value="">Todos</option><option value="BORRADOR">Borrador</option><option value="PUBLICADO">Publicado</option><option value="ARCHIVADO">Archivado</option></select></div>
      </div>
      <StatePanel v-if="loading" title="Cargando entradas" message="Estamos consultando el contenido del blog." />
      <StatePanel v-else-if="loadError" role="alert" title="No se pudo cargar el blog" :message="loadError"><button class="secondary-button" type="button" @click="load">Reintentar</button></StatePanel>
      <div v-else-if="!items.length" class="empty-state"><h3>No hay entradas para mostrar</h3><p>Prueba otra búsqueda o crea la primera entrada del blog.</p><NuxtLink class="primary-button" to="/administrador/blog/editor">＋ Nueva entrada</NuxtLink></div>
      <div v-else class="blog-grid">
        <article v-for="post in items" :key="post.id" class="blog-item">
          <div class="blog-item__media"><img v-if="post.imageId" class="blog-item__cover" :src="coverUrl(post.imageId)" :alt="`Portada de ${post.title}`"><div v-else class="blog-item__image-placeholder" aria-hidden="true">ACS</div><span :class="['blog-item__status', `status--${post.status.toLowerCase()}`]">{{ statusLabel[post.status] }}</span><span class="blog-item__date">◷ {{ formatDate(post.publishedAt) }}</span></div>
          <div class="blog-item__body"><h3>{{ post.title }}</h3><p class="summary">{{ post.summary }}</p><p class="slug">/blog/{{ post.slug }}</p><div class="blog-item__author"><span class="author-avatar">{{ post.createdBy.name.slice(0, 2).toUpperCase() }}</span><span>{{ post.createdBy.name }}</span></div><div class="item-actions"><button class="secondary-button" type="button" @click="edit(post)">Editar</button><button v-if="post.status !== 'ARCHIVADO'" class="secondary-button" type="button" @click="archive(post)">Archivar</button><button class="danger-button" type="button" @click="remove(post)">Eliminar</button></div></div>
        </article>
      </div>
      <nav v-if="!loading && !loadError && totalPages > 1" class="pagination" aria-label="Paginación de entradas"><button type="button" :disabled="page === 1" @click="goToPage(page - 1)">Anterior</button><span aria-live="polite">Página {{ page }} de {{ totalPages }}</span><button type="button" :disabled="page === totalPages" @click="goToPage(page + 1)">Siguiente</button></nav>
    </section>
    <AppConfirmModal :open="confirmModal.open" :title="confirmModal.title" :message="confirmModal.message" :confirm-label="confirmModal.confirmLabel" :variant="confirmModal.variant" :loading="confirmModal.loading" @cancel="confirmModal.open = false" @confirm="handleConfirmation" />
  </div>
</template>

<style scoped>
.blog-admin{width:100%;min-width:0}.manager-card{padding:clamp(1.1rem,2vw,2rem);background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-sm)}.section-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1.5rem;margin-bottom:1.5rem}.section-heading h2{margin:.35rem 0;font-size:1.55rem}.eyebrow{font-size:.82rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--color-primary)}.section-description{max-width:55rem;margin:0;color:var(--color-muted)}.primary-button,.secondary-button,.danger-button{display:inline-flex;align-items:center;justify-content:center;min-height:2.7rem;padding:.6rem .9rem;border:1px solid transparent;border-radius:.5rem;font:inherit;font-weight:700;text-decoration:none;cursor:pointer}.primary-button{background:var(--color-primary);color:white}.secondary-button{background:white;color:var(--color-ink);border-color:var(--color-border)}.danger-button{background:#fff2f1;color:#9c302a;border-color:#efc7c3}.filters{display:grid;grid-template-columns:minmax(0,1fr) minmax(12rem,16rem);align-items:end;gap:1rem;margin-bottom:1.5rem;padding:1rem;background:var(--color-soft);border:1px solid var(--color-border);border-radius:var(--radius-sm)}.search-form{display:flex;align-items:end;gap:.65rem}.field{display:grid;gap:.4rem;min-width:0;flex:1}.field label{font-size:.9rem;font-weight:700}.field input,.field select{width:100%;min-height:2.7rem;padding:.55rem .7rem;border:1px solid var(--color-border);border-radius:.45rem;background:white;color:var(--color-ink);font:inherit}.blog-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,19rem),1fr));gap:1.1rem}.blog-item{display:flex;min-width:0;flex-direction:column;overflow:hidden;border:1px solid var(--color-border);border-radius:var(--radius-sm);background:white}.blog-item__media{position:relative;display:grid;min-height:10rem;place-items:center;overflow:hidden;background:linear-gradient(135deg,#dce8df,#b4caba 55%,#e9efe7);color:#1b543d}.blog-item__image-placeholder{font-size:2.5rem;font-weight:850;letter-spacing:.16em}.blog-item__cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}.blog-item__status,.blog-item__date{position:absolute;z-index:1;padding:.35rem .6rem;font-size:.8rem;font-weight:800}.blog-item__status{top:.75rem;left:.75rem;border-radius:99px}.blog-item__date{right:.75rem;bottom:.75rem;border-radius:.25rem;background:rgb(255 255 255 / 92%);font-weight:750}.blog-item__body{display:flex;flex:1;flex-direction:column;gap:.75rem;padding:1rem}.status--borrador{background:#fff1d7;color:#76510b}.status--publicado{background:#ddf2e7;color:#17623d}.status--archivado{background:#edf0f1;color:#566269}.blog-item h3{margin:0;font-size:1.15rem;line-height:1.35}.summary{display:-webkit-box;overflow:hidden;margin:0;color:var(--color-muted);-webkit-box-orient:vertical;-webkit-line-clamp:3}.slug{overflow-wrap:anywhere;margin:0;color:var(--color-muted);font-size:.85rem}.blog-item__author{display:flex;align-items:center;gap:.55rem;margin-top:auto;font-size:.9rem}.author-avatar{display:grid;width:2rem;height:2rem;place-items:center;border-radius:50%;background:var(--color-soft);color:var(--color-primary);font-size:.75rem;font-weight:800}.item-actions{display:flex;flex-wrap:wrap;gap:.5rem;padding-top:.25rem;border-top:1px solid var(--color-border)}.empty-state{display:grid;justify-items:center;gap:.6rem;padding:3rem 1rem;text-align:center}.empty-state h3,.empty-state p{margin:0}.empty-state p{color:var(--color-muted)}.pagination{display:flex;justify-content:center;align-items:center;gap:1rem;margin-top:1.5rem}.pagination button{padding:.55rem .8rem;border:1px solid var(--color-border);border-radius:.4rem;background:white;color:var(--color-ink);font:inherit}.pagination button:disabled{opacity:.5}@media(max-width:700px){.section-heading{display:grid}.new-button{width:fit-content}.filters{grid-template-columns:1fr}.search-form{align-items:stretch;flex-direction:column}.status-filter{max-width:none}}
</style>
