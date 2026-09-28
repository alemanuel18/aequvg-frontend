<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
import type { ProjectType } from '~/types/api'

const route = useRoute()
const id = Number(route.params.id)
if (!Number.isSafeInteger(id) || id < 1) throw createError({ statusCode: 404, statusMessage: 'Investigación no encontrada' })

const service = usePublicContentService()
const { data: project, status, error, refresh } = await useAsyncData(`public-project-${id}`, () => service.projectById(id), { default: () => null })
useSeoMeta({ title: () => project.value?.title || 'Investigación', description: () => project.value?.description || 'Consulta una investigación de AsoQuímica UVG.' })
const typeLabel = (type: ProjectType) => type === 'TESIS' ? 'Tesis' : 'Proyecto de investigación'
const formatDate = (value: string) => new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
</script>

<template>
  <div>
    <PageHero eyebrow="Investigación estudiantil" title="Detalle de investigación" description="Información de un trabajo aprobado de la comunidad de Química UVG." />
    <AppSection title="Información del trabajo">
      <StatePanel v-if="status === 'pending'" title="Cargando investigación" message="Consultando la información del trabajo." />
      <StatePanel v-else-if="error" role="alert" title="No encontramos esta investigación" message="Es posible que no exista o ya no esté disponible."><AppButton to="/investigacion" variant="secondary">Volver a investigaciones</AppButton><button @click="() => refresh()">Reintentar</button></StatePanel>
      <article v-else-if="project" class="project-detail">
        <div class="project-detail__meta"><EyebrowBadge :text="typeLabel(project.type)" /><time :datetime="project.createdAt">Publicado en {{ formatDate(project.createdAt) }}</time></div>
        <h1>{{ project.title }}</h1>
        <p class="project-detail__author">Desarrollado por {{ project.author.name }}</p>
        <div class="project-detail__description">{{ project.description }}</div>
        <div v-if="project.repositoryUrl || project.liveUrl" class="project-detail__links" aria-label="Enlaces del proyecto">
          <a v-if="project.repositoryUrl" :href="project.repositoryUrl" target="_blank" rel="noopener noreferrer">Ver repositorio <span class="sr-only">(se abre en una nueva pestaña)</span> ↗</a>
          <a v-if="project.liveUrl" :href="project.liveUrl" target="_blank" rel="noopener noreferrer">Ver demostración <span class="sr-only">(se abre en una nueva pestaña)</span> ↗</a>
        </div>
        <AppButton to="/investigacion" variant="secondary">← Ver todas las investigaciones</AppButton>
      </article>
    </AppSection>
  </div>
</template>

<style scoped>
.project-detail { display: grid; gap: 1.4rem; max-width: 52rem; margin-inline: auto; padding: clamp(1.25rem, 4vw, 2.5rem); background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow); }.project-detail__meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .75rem; color: var(--color-muted); font-size: .92rem; }.project-detail h1 { margin: 0; font-size: clamp(2rem, 6vw, 3.6rem); line-height: 1.15; }.project-detail__author { margin: 0; color: var(--color-primary); font-weight: 800; }.project-detail__description { white-space: pre-line; color: var(--color-ink); font-size: 1.06rem; line-height: 1.7; }.project-detail__links { display: flex; flex-wrap: wrap; gap: .8rem; }.project-detail__links a { padding: .65rem .9rem; color: var(--color-primary); border: 1px solid var(--color-primary); border-radius: var(--radius-sm); font-weight: 800; text-decoration: none; }.project-detail__links a:hover { color: white; background: var(--color-primary); } @media (max-width: 620px) { .project-detail { padding: 1.25rem; } }
</style>
