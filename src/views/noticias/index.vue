<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
import type { PublicNewsList } from '~/types/api'

useSeoMeta({ title: 'Noticias y anuncios', description: 'Noticias y anuncios publicados por AsoQuímica UVG.' })
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
const { data: categories, status: categoriesStatus, error: categoriesError, refresh: refreshCategories } = await useAsyncData('news-categories', () => service.newsCategories(), { default: () => [] })
const loadNews = () => service.news({ q: appliedSearch.value || undefined, categoryId: selectedCategory.value, page: currentPage.value, pageSize })
const { data: result, status, error, refresh } = await useAsyncData('public-news', loadNews, { default: (): PublicNewsList => ({ items: [], pagination: { page: 1, pageSize, total: 0 } }) })
const totalPages = computed(() => Math.max(1, Math.ceil(result.value.pagination.total / pageSize)))
const updateNews = async () => {
  requestError.value = null
  try { result.value = await loadNews() }
  catch (requestFailure) { requestError.value = requestFailure }
}
const submitSearch = async () => { appliedSearch.value = searchInput.value.trim(); currentPage.value = 1; await updateNews() }
const goToPage = async (page: number) => { currentPage.value = page; await updateNews() }
</script>

<template>
  <div>
    <PageHero eyebrow="▣ Mantente al día" title="Noticias y Eventos" description="Anuncios, eventos, actividades, charlas, conferencias, viajes académicos y convivencias de AsoQuímica UVG." />
    <AppSection title="Explora nuestras publicaciones" lead="">
      <form class="news-filters" role="search" @submit.prevent="submitSearch">
        <strong>▼ Filtrar por categoría:</strong>
        <div class="news-filters__chips"><button type="button" :class="{ 'is-active': !selectedCategory }" @click="selectedCategory = undefined; submitSearch()">Todas las noticias</button><button v-for="category in categories" :key="category.id" type="button" :class="{ 'is-active': selectedCategory === category.id }" @click="selectedCategory = category.id; submitSearch()">{{ category.name }}</button></div>
        <label class="sr-only" for="news-search">Buscar noticias</label><input id="news-search" v-model="searchInput" name="q" type="search" placeholder="Buscar noticias" autocomplete="off"><button class="news-filters__submit" type="submit">Buscar</button>
      </form>
      <StatePanel v-if="categoriesStatus === 'pending'" class="news-filter-state" title="Cargando categorías" message="Preparando los filtros disponibles." />
      <StatePanel v-else-if="categoriesError" class="news-filter-state" role="alert" title="No pudimos cargar las categorías" message="Puedes buscar por texto o intentar cargar las categorías nuevamente."><button @click="() => refreshCategories()">Reintentar</button></StatePanel>
      <StatePanel v-if="status === 'pending'" title="Cargando noticias" message="Consultando las publicaciones activas." />
      <StatePanel v-else-if="error || requestError" role="alert" title="No pudimos cargar las noticias" message="Verifica tu conexión e inténtalo nuevamente."><button @click="() => refresh()">Reintentar</button></StatePanel>
      <StatePanel v-else-if="!result.items.length" title="No hay publicaciones para esta búsqueda" message="Prueba con otras palabras o selecciona una categoría diferente." />
      <template v-else>
        <p class="news-count" aria-live="polite">{{ result.pagination.total }} {{ result.pagination.total === 1 ? 'publicación encontrada' : 'publicaciones encontradas' }}.</p>
        <div class="news-grid"><NewsCard v-for="news in result.items" :key="news.id" :news="news" /></div>
        <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de noticias"><button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Anterior</button><span aria-live="polite">Página {{ currentPage }} de {{ totalPages }}</span><button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Siguiente</button></nav>
      </template>
    </AppSection>
  </div>
</template>

<style scoped>
.news-filters { display: grid; gap: .75rem; margin-bottom: 2rem; padding: 1.35rem; background: var(--color-soft); border: 1px solid var(--color-border); border-radius: var(--radius-md); }.news-filters__chips { display: flex; flex-wrap: wrap; gap: .6rem; }.news-filters__chips button { padding: .55rem .9rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: 999px; cursor: pointer; font-weight: 800; }.news-filters__chips .is-active { color: white; background: var(--color-primary); border-color: var(--color-primary); }
.news-filters input { min-height: 2.65rem; padding: .6rem .8rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }
.news-filters__submit, .pagination button { min-height: 2.85rem; padding: .65rem 1rem; color: white; background: var(--color-primary); border: 1px solid var(--color-primary); border-radius: var(--radius-sm); cursor: pointer; font-weight: 800; }
.pagination button:disabled { cursor: not-allowed; opacity: .55; }.news-filter-state { margin-bottom: 1.25rem; }.news-count { margin-bottom: 1rem; color: var(--color-muted); }.news-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }.pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; }
@media (max-width: 900px) { .news-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 620px) { .news-grid { grid-template-columns: 1fr; } .news-filters__submit { width: 100%; } }
</style>
