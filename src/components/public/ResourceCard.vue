<script setup lang="ts">
import type { PublicResource } from '~/types/api'

defineProps<{ resource: PublicResource }>()

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
  : 'Fecha por confirmar'

const fileKind = (name: string) => name.split('.').pop()?.toUpperCase() || 'ARCHIVO'
</script>

<template>
  <article class="resource-card">
    <div class="resource-card__header">
      <span class="resource-card__category">▣ {{ resource.category.name }}</span>
      <time :datetime="resource.publishedAt || resource.createdAt">Publicado el {{ formatDate(resource.publishedAt) }}</time>
    </div>
    <h3>{{ resource.title }}</h3>
    <p>{{ resource.description }}</p>
    <section v-if="resource.links.length" class="resource-card__actions" :aria-label="`Enlaces de ${resource.title}`">
      <a v-for="link in resource.links" :key="link.id" :href="link.url" target="_blank" rel="noopener noreferrer" :aria-label="`${link.label}: se abre en una nueva pestaña`">{{ link.label }} <span aria-hidden="true">↗</span></a>
    </section>
    <section v-if="resource.file" class="resource-card__file" :aria-label="`Material disponible: ${resource.file.originalName}`">
      <div class="resource-card__preview" aria-hidden="true"><span>{{ fileKind(resource.file.originalName) }}</span><i></i><i></i><i></i></div>
      <div class="resource-card__file-content"><span>Material disponible</span><strong>{{ resource.file.originalName }}</strong><small>{{ resource.file.mimeType }}</small><a v-if="resource.file.downloadUrl" class="resource-card__download" :href="resource.file.downloadUrl" :download="resource.file.originalName" :aria-label="`Descargar ${resource.file.originalName}`">Descargar</a><em v-else>Descarga pendiente</em></div>
    </section>
  </article>
</template>

<style scoped>
.resource-card { display: grid; gap: 1rem; min-width: 0; padding: 1.4rem; background: white; border: 1px solid var(--color-border); border-radius: var(--radius-md); box-shadow: 0 8px 25px rgb(26 43 24 / 6%); }
.resource-card__header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .7rem; }.resource-card__category { padding: .3rem .6rem; color: white; background: #c77822; font-size: .82rem; font-weight: 800; }.resource-card time, .resource-card p, .resource-card small { color: var(--color-muted); }.resource-card h3 { font-size: 1.3rem; }.resource-card__actions { display: flex; flex-wrap: wrap; gap: .65rem; }.resource-card__actions a, .resource-card__download { display: inline-flex; align-items: center; min-height: 2.6rem; padding: .5rem .75rem; color: var(--color-primary); border: 1px solid var(--color-primary); border-radius: var(--radius-sm); font-weight: 800; text-decoration: none; }.resource-card__actions a:hover, .resource-card__download:hover { color: white; background: var(--color-primary); }
.resource-card__file { display: grid; grid-template-columns: 4.7rem minmax(0, 1fr); align-items: start; gap: .9rem; padding: 1rem; background: var(--color-soft); border-radius: var(--radius-sm); }.resource-card__preview { display: grid; gap: .35rem; min-height: 6rem; padding: .65rem .55rem; color: var(--color-primary); background: white; border: 1px solid var(--color-border); border-radius: .35rem; box-shadow: 0 .25rem .5rem rgb(26 43 24 / 8%); }.resource-card__preview span { font-size: .68rem; font-weight: 900; letter-spacing: .04em; }.resource-card__preview i { display: block; height: .18rem; background: var(--color-accent); border-radius: 1rem; }.resource-card__preview i:nth-of-type(2) { width: 82%; }.resource-card__preview i:nth-of-type(3) { width: 60%; }.resource-card__file-content { display: grid; min-width: 0; gap: .25rem; }.resource-card__file-content > span { color: var(--color-primary); font-size: .82rem; font-weight: 800; }.resource-card__file strong, .resource-card__file small { display: block; overflow-wrap: anywhere; }.resource-card__file-content em { color: var(--color-muted); font-size: .8rem; font-style: normal; }.resource-card__download { width: fit-content; margin-top: .4rem; }
</style>
