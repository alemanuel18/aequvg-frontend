<script setup lang="ts">
import type { PublicNews } from '~/types/api'

defineProps<{ news: PublicNews }>()

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
  : 'Fecha por confirmar'
</script>

<template>
  <article class="news-card">
    <div class="news-card__meta">
      <EyebrowBadge :text="news.category.name" />
      <time :datetime="news.publishedAt || news.createdAt">{{ formatDate(news.publishedAt) }}</time>
    </div>
    <h3><NuxtLink :to="`/noticias/${news.id}`">{{ news.title }}</NuxtLink></h3>
    <p>{{ news.summary }}</p>
    <NuxtLink class="news-card__link" :to="`/noticias/${news.id}`" :aria-label="`Leer noticia: ${news.title}`">Leer noticia <span aria-hidden="true">→</span></NuxtLink>
  </article>
</template>

<style scoped>
.news-card {
  display: grid;
  align-content: start;
  gap: 1rem;
  min-width: 0;
  padding: 1.5rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 25px rgb(26 43 24 / 6%);
}

.news-card__meta { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .65rem; }
.news-card time { color: var(--color-muted); font-size: .9rem; }
.news-card h3 a { text-decoration: none; }
.news-card h3 a:hover { text-decoration: underline; }
.news-card p { color: var(--color-muted); }
.news-card__link { width: fit-content; color: var(--color-primary); font-weight: 800; }
</style>
