<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
import type { PublicResourceList } from '~/types/api'

useSeoMeta({ title: 'Recursos', description: 'Materiales, documentos y enlaces publicados por AsoQuímica UVG.' })
const service = usePublicContentService()
const route = useRoute()
const queryNumber = (value: unknown) => {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : undefined
}
const searchInput = ref(typeof route.query.q === 'string' ? route.query.q : '')
const appliedSearch = ref(searchInput.value)
const selectedCategory = ref(queryNumber(route.query.categoryId))
const currentPage = ref(queryNumber(route.query.page) || 1)
const pageSize = 9
const requestError = ref<unknown>(null)
const { data: categories, status: categoriesStatus, error: categoriesError, refresh: refreshCategories } = await useAsyncData('resource-categories', () => service.resourceCategories(), { default: () => [] })
const loadResources = () => service.resources({ q: appliedSearch.value || undefined, categoryId: selectedCategory.value, page: currentPage.value, pageSize })
const { data: result, status, error, refresh } = await useAsyncData('public-resources', loadResources, { default: (): PublicResourceList => ({ items: [], pagination: { page: 1, pageSize, total: 0 } }) })
const totalPages = computed(() => Math.max(1, Math.ceil(result.value.pagination.total / pageSize)))
const updateResources = async () => {
  requestError.value = null
  try { result.value = await loadResources() }
  catch (requestFailure) { requestError.value = requestFailure }
}
const submitSearch = async () => { appliedSearch.value = searchInput.value.trim(); currentPage.value = 1; await updateResources() }
const goToPage = async (page: number) => { currentPage.value = page; await updateResources() }
</script>

<template>
  <div>
    <PageHero class="resources-hero" eyebrow="▣ Apoyo académico" title="Recursos para estudiantes" description="Herramientas, materiales y acompañamiento para que estudiar química sea una experiencia apasionante, clara y sin miedo." />
    <AppSection title="Explora las áreas principales" lead="Accede rápidamente a las secciones más consultadas por la comunidad estudiantil de Química UVG.">
      <div class="featured-areas">
        <NuxtLink class="featured-area" to="/investigacion">
          <AppIcon name="flask" :size="36" /><span>Proyectos</span><h3>Investigación estudiantil</h3><p>Consulta trabajos, experimentos y publicaciones científicas realizadas por estudiantes de la carrera.</p><strong>Explorar <span aria-hidden="true">→</span></strong>
        </NuxtLink>
        <NuxtLink class="featured-area" to="/investigacion">
          <AppIcon name="graduation-cap" :size="36" /><span>Tesis</span><h3>Repositorio de graduación</h3><p>Explora tesis aprobadas o envía tu trabajo de graduación a revisión para su publicación.</p><strong>Ver repositorio <span aria-hidden="true">→</span></strong>
        </NuxtLink>
        <NuxtLink class="featured-area" to="/contacto">
          <AppIcon name="messages" :size="36" /><span>Acompañamiento</span><h3>Contacto directo</h3><p>Solicita orientación académica, información sobre la carrera o apoyo de la Junta Directiva.</p><strong>Contactar <span aria-hidden="true">→</span></strong>
        </NuxtLink>
      </div>
    </AppSection>
    <AppSection class="resource-catalog" title="Explora materiales disponibles" lead="Busca guías, documentos y referencias de la comunidad.">
      <form class="resource-filters" role="search" @submit.prevent="submitSearch">
        <strong>▼ Filtrar por categoría:</strong>
        <div class="resource-filters__chips"><button type="button" :class="{ 'is-active': !selectedCategory }" @click="selectedCategory = undefined; submitSearch()">Todos los recursos</button><button v-for="category in categories" :key="category.id" type="button" :class="{ 'is-active': selectedCategory === category.id }" @click="selectedCategory = category.id; submitSearch()">{{ category.name }}</button></div>
        <label class="sr-only" for="resource-search">Buscar recursos</label><input id="resource-search" v-model="searchInput" name="q" type="search" placeholder="Buscar recursos" autocomplete="off"><button class="resource-filters__submit" type="submit">Buscar</button>
      </form>
      <StatePanel v-if="categoriesStatus === 'pending'" class="resource-filter-state" title="Cargando categorías" message="Preparando los filtros disponibles." />
      <StatePanel v-else-if="categoriesError" class="resource-filter-state" role="alert" title="No pudimos cargar las categorías" message="Puedes buscar por texto o intentar cargar las categorías nuevamente."><button @click="() => refreshCategories()">Reintentar</button></StatePanel>
      <StatePanel v-if="status === 'pending'" title="Cargando recursos" message="Consultando los materiales publicados." />
      <StatePanel v-else-if="error || requestError" role="alert" title="No pudimos cargar los recursos" message="Verifica tu conexión e inténtalo nuevamente."><button @click="() => refresh()">Reintentar</button></StatePanel>
      <StatePanel v-else-if="!result.items.length" title="No hay recursos para esta búsqueda" message="Prueba con otras palabras o selecciona una categoría diferente." />
      <template v-else>
        <p class="resource-count" aria-live="polite">{{ result.pagination.total }} {{ result.pagination.total === 1 ? 'recurso encontrado' : 'recursos encontrados' }}.</p>
        <div class="resource-grid"><ResourceCard v-for="resource in result.items" :key="resource.id" :resource="resource" /></div>
        <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de recursos"><button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Anterior</button><span aria-live="polite">Página {{ currentPage }} de {{ totalPages }}</span><button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Siguiente</button></nav>
      </template>
    </AppSection>
  </div>
</template>

<style scoped>
.resource-filters { display: grid; gap: .75rem; margin-bottom: 2rem; padding: 1.35rem; background: var(--color-soft); border: 1px solid var(--color-border); border-radius: var(--radius-md); }.resource-filters__chips { display: flex; flex-wrap: wrap; gap: .6rem; }.resource-filters__chips button { padding: .55rem .9rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: 999px; cursor: pointer; font-weight: 800; }.resource-filters__chips .is-active { color: white; background: var(--color-primary); border-color: var(--color-primary); }
.resource-filters input { min-height: 2.65rem; padding: .6rem .8rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }.resource-filters__submit, .pagination button { min-height: 2.85rem; padding: .65rem 1rem; color: white; background: var(--color-primary); border: 1px solid var(--color-primary); border-radius: var(--radius-sm); cursor: pointer; font-weight: 800; }.pagination button:disabled { cursor: not-allowed; opacity: .55; }.resource-filter-state { margin-bottom: 1.25rem; }.resource-count { margin-bottom: 1rem; color: var(--color-muted); }.resource-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }.pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
.resources-hero :deep(h1) { max-width: 37rem; }.resources-hero :deep(p) { max-width: 42rem; }.featured-areas { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }.featured-area { display: grid; align-content: start; gap: .65rem; min-width: 0; min-height: 18rem; padding: 1.5rem; color: inherit; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 8px 25px rgb(26 43 24 / 6%); text-decoration: none; transition: transform .2s ease, box-shadow .2s ease; }.featured-area:hover { transform: translateY(-.2rem); box-shadow: var(--shadow); }.featured-area > .app-icon { color: var(--color-primary); margin-bottom: .45rem; }.featured-area > span { color: var(--color-muted); font-size: .9rem; }.featured-area p { color: var(--color-muted); }.featured-area strong { align-self: end; margin-top: auto; color: var(--color-primary); }.resource-catalog { padding-top: 0; }
@media (max-width: 900px) { .featured-areas, .resource-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 620px) { .featured-areas, .resource-grid { grid-template-columns: 1fr; } .featured-area { min-height: 0; }.resource-filters__submit { width: 100%; } }
</style>
