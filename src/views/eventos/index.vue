<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
import type { PublicEventList } from '~/types/api'

useSeoMeta({
  title: 'Eventos y actividades',
  description: 'Agenda de charlas, talleres, convivencias y conferencias de AsoQuímica UVG.'
})

const service = usePublicContentService()
const route = useRoute()

const queryNumber = (value: unknown) => {
  const number = Number(value)
  return Number.isSafeInteger(number) && number > 0 ? number : undefined
}

const searchInput = ref(typeof route.query.q === 'string' ? route.query.q : '')
const appliedSearch = ref(searchInput.value)
const currentPage = ref(queryNumber(route.query.page) || 1)
const pageSize = 9
const requestError = ref<unknown>(null)

const loadEvents = () =>
  service.events({
    q: appliedSearch.value || undefined,
    page: currentPage.value,
    pageSize
  })

const { data: result, status, error, refresh } = await useAsyncData(
  'public-events',
  loadEvents,
  {
    default: (): PublicEventList => ({
      items: [],
      pagination: { page: 1, pageSize, total: 0 }
    })
  }
)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(result.value.pagination.total / pageSize))
)

const updateEvents = async () => {
  requestError.value = null
  try {
    result.value = await loadEvents()
  } catch (requestFailure) {
    requestError.value = requestFailure
  }
}

const submitSearch = async () => {
  appliedSearch.value = searchInput.value.trim()
  currentPage.value = 1
  await updateEvents()
}

const goToPage = async (page: number) => {
  currentPage.value = page
  await updateEvents()
}
</script>

<template>
  <div>
    <PageHero
      eyebrow="▣ Agenda y actividades"
      title="Eventos"
      description="Charlas, talleres, conferencias, viajes académicos y convivencias de AsoQuímica UVG."
    />
    <AppSection title="Explora nuestras actividades" lead="">
      <form class="events-filters" role="search" @submit.prevent="submitSearch">
        <label class="sr-only" for="events-search">Buscar eventos</label>
        <input
          id="events-search"
          v-model="searchInput"
          name="q"
          type="search"
          placeholder="Buscar eventos por nombre, lugar o descripción"
          autocomplete="off"
        >
        <button class="events-filters__submit" type="submit">Buscar</button>
      </form>

      <StatePanel
        v-if="status === 'pending'"
        title="Cargando eventos"
        message="Consultando la agenda de actividades."
      />
      <StatePanel
        v-else-if="error || requestError"
        role="alert"
        title="No pudimos cargar los eventos"
        message="Verifica tu conexión e inténtalo nuevamente."
      >
        <button @click="() => refresh()">Reintentar</button>
      </StatePanel>
      <StatePanel
        v-else-if="!result.items.length"
        title="No hay eventos para esta búsqueda"
        message="Prueba con otras palabras o consulta más adelante cuando se publiquen nuevas actividades."
      />
      <template v-else>
        <p class="events-count" aria-live="polite">
          {{ result.pagination.total }}
          {{ result.pagination.total === 1 ? 'evento encontrado' : 'eventos encontrados' }}.
        </p>
        <div class="events-grid">
          <EventCard v-for="event in result.items" :key="event.id" :event="event" />
        </div>
        <nav v-if="totalPages > 1" class="pagination" aria-label="Paginación de eventos">
          <button :disabled="currentPage === 1" @click="goToPage(currentPage - 1)">Anterior</button>
          <span aria-live="polite">Página {{ currentPage }} de {{ totalPages }}</span>
          <button :disabled="currentPage === totalPages" @click="goToPage(currentPage + 1)">Siguiente</button>
        </nav>
      </template>
    </AppSection>
  </div>
</template>

<style scoped>
.events-filters {
  display: flex;
  gap: .75rem;
  margin-bottom: 2rem;
  padding: 1.35rem;
  background: var(--color-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.events-filters input {
  flex: 1;
  min-height: 2.65rem;
  padding: .6rem .8rem;
  color: var(--color-ink);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.events-filters__submit,
.pagination button {
  min-height: 2.85rem;
  padding: .65rem 1.25rem;
  color: white;
  background: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 800;
}

.pagination button:disabled {
  cursor: not-allowed;
  opacity: .55;
}

.events-count {
  margin-bottom: 1rem;
  color: var(--color-muted);
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.25rem;
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
  .events-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .events-grid {
    grid-template-columns: 1fr;
  }
  .events-filters {
    flex-direction: column;
  }
  .events-filters__submit {
    width: 100%;
  }
}
</style>
