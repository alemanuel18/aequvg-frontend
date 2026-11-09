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
        <p v-if="thesis.author" class="thesis-detail__author">{{ thesis.author }}</p>
        <div v-if="thesis.summary" class="thesis-detail__summary">{{ thesis.summary }}</div>
        <a class="thesis-detail__link" :href="thesis.url" target="_blank" rel="noopener noreferrer">Consultar tesis en el repositorio UVG <span aria-hidden="true">↗</span></a>
      </article>
      <PublicationComments v-if="thesis && !error" target-type="TESIS" :target-id="thesis.id" />
    </AppSection>
  </div>
</template>

<style scoped>
.thesis-detail{display:grid;gap:1.4rem;max-width:52rem;margin-inline:auto}.thesis-detail__meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.75rem;color:var(--color-muted);font-size:.92rem}.thesis-detail__author{margin:0;color:var(--color-primary);font-weight:800}.thesis-detail__summary{white-space:pre-line;color:var(--color-ink);font-size:1.06rem;line-height:1.7}.thesis-detail__link{justify-self:start;padding:.7rem 1rem;color:var(--color-primary);border:1px solid var(--color-primary);border-radius:var(--radius-sm);font-weight:800;text-decoration:none}.thesis-detail__link:hover{color:white;background:var(--color-primary)}
</style>
