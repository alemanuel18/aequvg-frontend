<script setup lang="ts">
import { usePublicContentService } from "~/services/public-content";
import type { ProjectType, PublicProjectList, PublicThesis } from "~/types/api";

useSeoMeta({
  title: "Investigación",
  description:
    "Proyectos y tesis aprobados de la comunidad estudiantil de Química UVG.",
});
const service = usePublicContentService();
const route = useRoute();
const queryNumber = (value: unknown) => {
  const number = Number(value);
  return Number.isSafeInteger(number) && number > 0 ? number : undefined;
};
const searchInput = ref(
  typeof route.query.search === "string" ? route.query.search : "",
);
const appliedSearch = ref(searchInput.value);
const selectedType = ref<ProjectType | undefined>(
  route.query.type === "TESIS" || route.query.type === "PROYECTO"
    ? route.query.type
    : undefined,
);
const selectedThesisCategory = ref(route.query.type === 'TESIS' ? queryNumber(route.query.categoryId) : undefined);
const currentPage = ref(queryNumber(route.query.page) || 1);
const pageSize = 9;
const requestError = ref<unknown>(null);
const loadProjects = () =>
  service.projects({
    search: appliedSearch.value || undefined,
    type: selectedType.value,
    page: currentPage.value,
    pageSize,
  });
const {
  data: result,
  status,
  error,
  refresh,
} = await useAsyncData("public-projects", loadProjects, {
  default: (): PublicProjectList => ({
    items: [],
    pagination: { page: 1, pageSize, total: 0, totalPages: 0 },
  }),
});
const { data: thesisCategories } = await useAsyncData('public-thesis-categories', () => service.thesisCategories(), { default: () => [] })
const loadTheses = () => service.theses(currentPage.value, pageSize, appliedSearch.value || undefined, selectedThesisCategory.value)
const {
  data: thesisResult,
  status: thesisStatus,
  error: thesisError,
} = await useAsyncData("public-theses", loadTheses, {
  default: () => ({ items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 0 } }),
});
const totalPages = computed(() =>
  Math.max(1, selectedType.value === 'TESIS' ? thesisResult.value.pagination.totalPages : selectedType.value === undefined ? Math.max(result.value.pagination.totalPages, thesisResult.value.pagination.totalPages) : result.value.pagination.totalPages),
);
const totalResults = computed(() => selectedType.value === 'TESIS'
  ? thesisResult.value.pagination.total
  : selectedType.value === undefined
    ? result.value.pagination.total + thesisResult.value.pagination.total
    : result.value.pagination.total)
const updateProjects = async () => {
  requestError.value = null;
  try {
    if (selectedType.value === 'TESIS') thesisResult.value = await loadTheses();
    else if (selectedType.value === undefined) {
      const [projects, theses] = await Promise.all([loadProjects(), loadTheses()])
      result.value = projects
      thesisResult.value = theses
    } else result.value = await loadProjects();
  } catch (requestFailure) {
    requestError.value = requestFailure;
  }
};
const submitSearch = async () => {
  appliedSearch.value = searchInput.value.trim();
  currentPage.value = 1;
  await updateProjects();
};
const setType = async (type?: ProjectType) => {
  selectedType.value = type;
  if (type !== 'TESIS') selectedThesisCategory.value = undefined
  currentPage.value = 1;
  await updateProjects();
};
const setThesisCategory = async (id?: number) => {
  selectedThesisCategory.value = id
  currentPage.value = 1
  await updateProjects()
}
const goToPage = async (page: number) => {
  currentPage.value = page;
  await updateProjects();
};
const typeLabel = (type: ProjectType) =>
  type === "TESIS" ? "Tesis" : "Proyecto de investigación";
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-GT", {
    year: "numeric",
    month: "long",
    timeZone: "UTC",
  }).format(new Date(value));
const thesisAuthorSummary = (thesis: PublicThesis) => {
  const principal = thesis.contributors?.find(({ role }) => role === 'PRINCIPAL')
  if (!principal) return thesis.author ? `Por ${thesis.author}` : 'Trabajo de graduación'
  const coauthors = thesis.contributors.filter(({ role }) => role === 'COAUTOR').map(({ person }) => person.name)
  return `Autor principal: ${principal.person.name}${coauthors.length ? ` · Coautores: ${coauthors.join(', ')}` : ''}`
}
</script>

<template>
  <div>
    <PageHero
      eyebrow="▣ Ciencia hecha por estudiantes"
      title="Investigación"
      description="Explora proyectos y tesis aprobados de la comunidad estudiantil de Química UVG."
    />
    <AppSection
      title="Explora las investigaciones"
      lead="Consulta trabajos publicados y conoce a las personas que los desarrollaron."
    >
      <form
        class="research-filters"
        role="search"
        @submit.prevent="submitSearch"
      >
        <div class="research-filters__types" aria-label="Filtrar por tipo">
          <button
            type="button"
            :class="{ 'is-active': !selectedType }"
            @click="setType()"
          >
            Todas</button
          ><button
            type="button"
            :class="{ 'is-active': selectedType === 'PROYECTO' }"
            @click="setType('PROYECTO')"
          >
            Proyectos</button
          ><button
            type="button"
            :class="{ 'is-active': selectedType === 'TESIS' }"
            @click="setType('TESIS')"
          >
            Tesis
          </button>
        </div>
        <label class="sr-only" for="research-search"
          >Buscar investigaciones</label
        ><input
          id="research-search"
          v-model="searchInput"
          name="search"
          type="search"
          placeholder="Buscar por título o autoría"
          autocomplete="off"
        /><button class="research-filters__submit" type="submit">Buscar</button>
      </form>
      <nav v-if="selectedType === 'TESIS' && thesisCategories.length" class="thesis-category-filters" aria-label="Filtrar tesis por categoría">
        <span>Categorías de tesis</span>
        <button type="button" :class="{ 'is-active': !selectedThesisCategory }" @click="setThesisCategory()">Todas</button>
        <button v-for="category in thesisCategories" :key="category.id" type="button" :class="{ 'is-active': selectedThesisCategory === category.id }" @click="setThesisCategory(category.id)">{{ category.name }}</button>
      </nav>
      <StatePanel
        v-if="status === 'pending' || (selectedType !== 'PROYECTO' && thesisStatus === 'pending')"
        title="Cargando investigaciones"
        message="Consultando los trabajos aprobados."
      />
      <StatePanel
        v-else-if="(selectedType === 'TESIS' ? thesisError : selectedType === undefined ? thesisError || error : error) || requestError"
        role="alert"
        title="No pudimos cargar las investigaciones"
        message="Verifica tu conexión e inténtalo nuevamente."
        ><button @click="updateProjects()">Reintentar</button></StatePanel
      >
      <StatePanel
        v-else-if="selectedType === 'TESIS' ? !thesisResult.items.length : selectedType === undefined ? !thesisResult.items.length && !result.items.length : !result.items.length"
        title="No hay investigaciones para esta búsqueda"
        message="Prueba con otras palabras o selecciona otro tipo de trabajo."
      />
      <template v-else
        ><p class="research-count" aria-live="polite">
          {{ totalResults }}
          {{
            totalResults === 1
              ? "investigación encontrada"
              : "investigaciones encontradas"
          }}.
        </p>
        <div class="research-grid">
          <template v-if="selectedType !== 'PROYECTO'">
          <ContentCard v-for="thesis in thesisResult.items" :key="`thesis-${thesis.id}`" eyebrow="Tesis de Química" :title="thesis.title" :body="thesis.summary || 'Consulta esta tesis en el repositorio universitario.'">
            <p v-if="thesis.author || thesis.contributors?.length || thesis.publicationYear" class="research-card__meta">{{ thesisAuthorSummary(thesis) }}{{ thesis.publicationYear ? ` · ${thesis.publicationYear}` : '' }}</p>
            <div v-if="thesis.categories.length" class="research-category-tags"><span v-for="category in thesis.categories" :key="category.id">{{ category.name }}</span></div>
            <NuxtLink class="card__link" :to="`/investigacion/tesis/${thesis.id}`" :aria-label="`Ver tesis: ${thesis.title}`">Ver tesis <span aria-hidden="true">→</span></NuxtLink>
          </ContentCard>
          </template>
          <template v-if="selectedType !== 'TESIS'">
          <ContentCard
            v-for="project in result.items"
            :key="`project-${project.id}`"
            :eyebrow="typeLabel(project.type)"
            :title="project.title"
            :body="project.description"
            ><p class="research-card__meta">
              Por {{ project.author.name }} ·
              {{ formatDate(project.createdAt) }}
            </p>
            <NuxtLink
              class="card__link"
              :to="`/investigacion/${project.id}`"
              :aria-label="`Ver investigación: ${project.title}`"
              >Ver investigación <span aria-hidden="true">→</span></NuxtLink
            ></ContentCard
          >
          </template>
        </div>
        <nav
          v-if="totalPages > 1"
          class="pagination"
          aria-label="Paginación de investigaciones"
        >
          <button
            :disabled="currentPage === 1"
            @click="goToPage(currentPage - 1)"
          >
            Anterior</button
          ><span aria-live="polite"
            >Página {{ currentPage }} de {{ totalPages }}</span
          ><button
            :disabled="currentPage === totalPages"
            @click="goToPage(currentPage + 1)"
          >
            Siguiente
          </button>
        </nav></template
      >
    </AppSection>
  </div>
</template>

<style scoped>
.research-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1.35rem;
  background: var(--color-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.research-filters__types {
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
}
.research-filters__types button {
  padding: 0.55rem 0.9rem;
  color: var(--color-ink);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 800;
}
.research-filters__types .is-active,
.research-filters__submit,
.pagination button {
  color: white;
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.research-filters input {
  flex: 1 1 15rem;
  min-height: 2.65rem;
  padding: 0.6rem 0.8rem;
  color: var(--color-ink);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.research-filters__submit,
.pagination button {
  min-height: 2.85rem;
  padding: 0.65rem 1rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 800;
}
.thesis-category-filters { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; margin: -1rem 0 1.5rem; }
.thesis-category-filters span { margin-right: .2rem; color: var(--color-muted); font-size: .92rem; font-weight: 750; }
.thesis-category-filters button { padding: .45rem .75rem; color: var(--color-ink); background: #fff; border: 1px solid var(--color-border); border-radius: 999px; cursor: pointer; font: inherit; font-size: .9rem; }
.thesis-category-filters button.is-active { color: #fff; background: var(--color-primary); border-color: var(--color-primary); }
.pagination button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}
.research-count {
  margin-bottom: 1rem;
  color: var(--color-muted);
}
.research-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
}
.research-card__meta {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.88rem;
}
.research-category-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin: .6rem 0; }
.research-category-tags span { padding: .22rem .55rem; color: var(--color-primary-dark); background: var(--color-soft); border: 1px solid var(--color-border); border-radius: 999px; font-size: .8rem; font-weight: 750; }
.card__link {
  color: var(--color-primary);
  text-decoration: none;
}
.card__link:hover {
  text-decoration: underline;
}
.pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 2rem;
}
@media (max-width: 900px) {
  .research-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 620px) {
  .research-grid {
    grid-template-columns: 1fr;
  }
  .research-filters__submit {
    width: 100%;
  }
}
</style>
