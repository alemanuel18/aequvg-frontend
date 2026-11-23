<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { usePublicContentService } from '~/services/public-content'

const route = useRoute()
const id = Number(route.params.id)
if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 404, statusMessage: 'Tesis no encontrada' })
const service = usePublicContentService()
const { data: thesis, status, error, refresh } = await useAsyncData(`public-thesis-${id}`, () => service.thesisById(id), { default: () => null })
useSeoMeta({ title: () => thesis.value?.title || 'Tesis de Química', description: () => thesis.value?.summary || 'Consulta una tesis de Química de la Universidad del Valle de Guatemala.' })
const errorMessage = computed(() => error.value instanceof PublicApiError ? error.value.message : 'No pudimos cargar esta tesis.')
</script>

<template>
  <div>
    <DetailBackLink to="/investigacion" label="Volver a investigación" />
    <PageHero eyebrow="Tesis de Química" :title="thesis?.title || 'Tesis'" :description="thesis?.summary || 'Consulta los datos de esta tesis y abre el registro en el repositorio universitario.'" />
    <AppSection>
      <StatePanel v-if="status === 'pending'" title="Cargando tesis" message="Consultando los datos de la publicación." />
      <StatePanel v-else-if="error" role="alert" title="No encontramos esta tesis" :message="errorMessage"><AppButton to="/investigacion" variant="secondary">Volver a investigación</AppButton><button type="button" @click="refresh()">Reintentar</button></StatePanel>
      <article v-else-if="thesis" class="thesis-detail">
        <div class="thesis-detail__meta"><EyebrowBadge :text="thesis.publicationYear ? String(thesis.publicationYear) : 'Tesis de Química'" /><time :datetime="thesis.publishedAt">Publicada en {{ new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(thesis.publishedAt)) }}</time></div>
        <div v-if="thesis.categories.length" class="thesis-detail__categories" aria-label="Categorías de la tesis"><span v-for="category in thesis.categories" :key="category.id">{{ category.name }}</span></div>
        <section v-if="thesis.contributors?.length || thesis.author" class="thesis-detail__authors" aria-labelledby="thesis-authors-title">
          <h2 id="thesis-authors-title">Autoría</h2>
          <ol v-if="thesis.contributors?.length">
            <li v-for="contributor in thesis.contributors" :key="contributor.personId">
              <span>{{ contributor.person.name }}</span>
              <strong>{{ contributor.role === 'PRINCIPAL' ? 'Autor principal' : 'Coautor' }}</strong>
            </li>
          </ol>
          <p v-else>{{ thesis.author }}</p>
        </section>
        <div v-if="thesis.summary" class="thesis-detail__summary">{{ thesis.summary }}</div>
        <AppButton class="thesis-detail__link" :href="thesis.url" target="_blank" rel="noopener noreferrer" variant="secondary">Consultar tesis en el repositorio UVG <span aria-hidden="true">↗</span></AppButton>
        <p class="thesis-detail__access-note">La disponibilidad del documento y cualquier requisito de acceso dependen del repositorio de origen.</p>
      </article>
    </AppSection>
  </div>
</template>

<style scoped>
.thesis-detail{display:grid;gap:1.4rem;max-width:var(--container-reading);margin-inline:auto}.thesis-detail__meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;color:var(--color-muted);font-size:.92rem}.thesis-detail__authors h2{margin:0 0 .65rem;font-size:1rem}.thesis-detail__authors ol{display:grid;gap:.5rem;margin:0;padding:0;list-style:none}.thesis-detail__authors li{display:flex;flex-wrap:wrap;justify-content:space-between;gap:.5rem;padding:.65rem .8rem;border:1px solid var(--color-border);border-radius:var(--radius-sm)}.thesis-detail__authors strong{color:var(--color-primary);font-size:.88rem}.thesis-detail__summary{white-space:pre-line;color:var(--color-ink);font-size:1.06rem;line-height:1.7}.thesis-detail__link{justify-self:start}.thesis-detail__access-note{margin:-.8rem 0 0;color:var(--color-muted);font-size:.92rem}
.thesis-detail__categories{display:flex;flex-wrap:wrap;gap:.5rem}.thesis-detail__categories span{padding:.3rem .7rem;color:var(--color-primary-dark);background:var(--color-soft);border:1px solid var(--color-border);border-radius:999px;font-size:.88rem;font-weight:750}
</style>
