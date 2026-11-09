<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { usePublicContentService } from '~/services/public-content'
import type { PublicThesisList } from '~/types/api'

useSeoMeta({ title: 'Tesis de Química', description: 'Consulta tesis de Química de la Universidad del Valle de Guatemala.' })
const service = usePublicContentService()
const pageSize = 20
const { data, status, error, refresh } = await useAsyncData('public-theses', () => service.theses(1, pageSize), {
  default: (): PublicThesisList => ({ items: [], pagination: { page: 1, pageSize, total: 0, totalPages: 0 } })
})
const errorMessage = computed(() => error.value instanceof PublicApiError ? error.value.message : 'No pudimos cargar las tesis. Intenta nuevamente.')
</script>

<template>
  <main>
    <PageHero eyebrow="Licenciatura en Química" title="Tesis" description="Consulta los trabajos de graduación y abre cada tesis desde el repositorio de la Universidad del Valle de Guatemala." />
    <AppSection title="Tesis de Química" lead="Los documentos se consultan directamente en el repositorio universitario.">
      <StatePanel v-if="status === 'pending'" title="Cargando tesis" message="Estamos consultando las publicaciones disponibles." />
      <StatePanel v-else-if="error" title="No se pudieron cargar las tesis" :message="errorMessage" role="alert"><button type="button" @click="refresh()">Intentar de nuevo</button></StatePanel>
      <StatePanel v-else-if="!data?.items.length" title="Aún no hay tesis publicadas" message="Cuando haya tesis disponibles, aparecerán en esta sección." />
      <ul v-else class="theses-list">
        <li v-for="thesis in data.items" :key="thesis.id" class="thesis-card">
          <div><p class="thesis-card__eyebrow">{{ thesis.publicationYear || 'Trabajo de graduación' }}</p><h2>{{ thesis.title }}</h2><p v-if="thesis.author" class="thesis-card__author">{{ thesis.author }}</p><p v-if="thesis.summary" class="thesis-card__summary">{{ thesis.summary }}</p></div>
          <a class="thesis-card__link" :href="thesis.url" target="_blank" rel="noopener noreferrer">Consultar tesis en el repositorio <span aria-hidden="true">↗</span></a>
        </li>
      </ul>
    </AppSection>
  </main>
</template>

<style scoped>
.theses-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr));gap:1rem;list-style:none;padding:0;margin:0}.thesis-card{display:flex;flex-direction:column;justify-content:space-between;gap:1.25rem;padding:1.35rem;background:#fff;border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:0 8px 24px #17212b0a}.thesis-card__eyebrow{margin:0 0 .45rem;color:var(--color-primary);font-size:.82rem;font-weight:700;letter-spacing:.04em}.thesis-card h2{margin:0;font-size:1.3rem;line-height:1.35}.thesis-card__author{margin:.6rem 0 0;font-weight:650}.thesis-card__summary{margin:.8rem 0 0;color:var(--color-muted);line-height:1.6}.thesis-card__link{align-self:flex-start;color:var(--color-primary);font-weight:700;text-underline-offset:.2em}.thesis-card__link:focus-visible{outline:3px solid #f2a900;outline-offset:3px;border-radius:2px}
</style>
