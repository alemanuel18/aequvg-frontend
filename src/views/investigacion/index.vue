<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
import type { ProjectType, PublicProjectList } from '~/types/api'

useSeoMeta({ title: 'Investigación', description: 'Proyectos y tesis aprobados de la comunidad estudiantil de Química UVG.' })
const service = usePublicContentService()
const route = useRoute()
const queryNumber = (value: unknown) => { const number = Number(value); return Number.isSafeInteger(number) && number > 0 ? number : undefined }
const searchInput = ref(typeof route.query.search === 'string' ? route.query.search : '')
const appliedSearch = ref(searchInput.value)
const selectedType = ref<ProjectType | undefined>(route.query.type === 'TESIS' || route.query.type === 'PROYECTO' ? route.query.type : undefined)
const currentPage = ref(queryNumber(route.query.page) || 1)
const pageSize = 9
const requestError = ref<unknown>(null)
const loadProjects = () => service.projects({ search: appliedSearch.value || undefined, type: selectedType.value, page: currentPage.value, pageSize })
const { data: result, status, error, refresh } = await useAsyncData('public-projects', loadProjects, { default: (): PublicProjectList => ({ items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 0 } }) })
const totalPages = computed(() => Math.max(1, result.value.pagination.totalPages))
const updateProjects = async () => { requestError.value = null; try { result.value = await loadProjects() } catch (requestFailure) { requestError.value = requestFailure } }
const submitSearch = async () => { appliedSearch.value = searchInput.value.trim(); currentPage.value = 1; await updateProjects() }
const setType = async (type?: ProjectType) => { selectedType.value = type; currentPage.value = 1; await updateProjects() }
const goToPage = async (page: number) => { currentPage.value = page; await updateProjects() }
const typeLabel = (type: ProjectType) => type === 'TESIS' ? 'Tesis' : 'Proyecto de investigación'
const formatDate = (value: string) => new Intl.DateTimeFormat('es-GT', { year: 'numeric', month: 'long', timeZone: 'UTC' }).format(new Date(value))
</script>

<template>
  <div>
    <PageHero eyebrow="▣ Ciencia hecha por estudiantes" title="Investigación" description="Explora proyectos y tesis aprobados de la comunidad estudiantil de Química UVG." />
    <AppSection title="Explora las investigaciones" lead="Consulta trabajos publicados y conoce a las personas que los desarrollaron.">
      <form class="research-filters" role="search" @submit.prevent="submitSearch"><div class="research-filters__types" aria-label="Filtrar por tipo"><button type="button" :class="{ 'is-active': !selectedType }" @click="setType()">Todas</button><button type="button" :class="{ 'is-active': selectedType === 'PROYECTO' }" @click="setType('PROYECTO')">Proyectos</button><button type="button" :class="{ 'is-active': selectedType === 'TESIS' }" @click="setType('TESIS')">Tesis</button></div><label class="sr-only" for="research-search">Buscar investigaciones</label><input id="research-search" v-model="searchInput" name="search" type="search" placeholder="Buscar por título o autoría" autocomplete="off"><button class="research-filters__submit" type="submit">Buscar</button></form>
      <StatePanel v-if="status === 'pending'" title="Cargando investigaciones" message="Consultando los trabajos aprobados." />
      <StatePanel v-else-if="error || requestError" role="alert" title="No pudimos cargar las investigaciones" message="Verifica tu conexión e inténtalo nuevamente."><button @click="() => refresh()">Reintentar</button></StatePanel>
      <StatePanel v-else-if="!result.items.length" title="No hay investigaciones para esta búsqueda" message="Prueba con otras palabras o selecciona otro tipo de trabajo." />
      <template v-else><p class="research-count" aria-live="polite">{{ result.pagination.total }} {{ result.pagination.total === 1 ? 'investigación encontrada' : 'investigaciones encontradas' }}.</p><div class="research-grid"><ContentCard v-for="project in result.items" :key="project.id" :eyebrow="typeLabel(project.type)" :title="project.title" :body="project.description"><p class="research-card__meta">Por {{ project.author.name }} · {{ formatDate(project.createdAt) }}</p><NuxtLink class="card__link" :to="`/investigacion/${project.id}`" :aria-label="`Ver investigación: ${project.title}`">Ver investigación <span aria-hidden="true">→</span></NuxtLink></ContentCard></div><nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de investigaciones"><button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Anterior</button><span aria-live="polite">Página {{ currentPage }} de {{ totalPages }}</span><button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Siguiente</button></nav></template>
    </AppSection>
  </div>
</template>

<style scoped>
.research-filters { display: flex; flex-wrap: wrap; gap: .75rem; margin-bottom: 2rem; padding: 1.35rem; background: var(--color-soft); border: 1px solid var(--color-border); border-radius: var(--radius-md); }.research-filters__types { display: flex; flex-wrap: wrap; gap: .55rem; }.research-filters__types button { padding: .55rem .9rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: 999px; cursor: pointer; font-weight: 800; }.research-filters__types .is-active, .research-filters__submit, .pagination button { color: white; background: var(--color-primary); border-color: var(--color-primary); }.research-filters input { flex: 1 1 15rem; min-height: 2.65rem; padding: .6rem .8rem; color: var(--color-ink); background: white; border: 1px solid var(--color-border); border-radius: var(--radius-sm); }.research-filters__submit, .pagination button { min-height: 2.85rem; padding: .65rem 1rem; border: 1px solid var(--color-primary); border-radius: var(--radius-sm); cursor: pointer; font-weight: 800; }.pagination button:disabled { cursor: not-allowed; opacity: .55; }.research-count { margin-bottom: 1rem; color: var(--color-muted); }.research-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem; }.research-card__meta { margin: 0; color: var(--color-muted); font-size: .88rem; }.card__link { color: var(--color-primary); text-decoration: none; }.card__link:hover { text-decoration: underline; }.pagination { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 1rem; margin-top: 2rem; } @media (max-width: 900px) { .research-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } } @media (max-width: 620px) { .research-grid { grid-template-columns: 1fr; } .research-filters__submit { width: 100%; } }
</style>
