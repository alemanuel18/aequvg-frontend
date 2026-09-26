<script setup lang="ts">
import type { PublicNews } from '~/types/api'

defineProps<{ news: PublicNews }>()

const formatDate = (value: string | null) => value
  ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(value))
  : 'Fecha por confirmar'
</script>

<template>
  <article class="news-card">
    <div class="news-card__media" aria-hidden="true">
      <div class="news-card__flask news-card__flask--one"></div>
      <div class="news-card__flask news-card__flask--two"></div>
      <span class="news-card__tag">▣ {{ news.category.name }}</span>
    </div>
    <div class="news-card__body">
      <time :datetime="news.publishedAt || news.createdAt">{{ formatDate(news.publishedAt) }}</time>
    <h3><NuxtLink :to="`/noticias/${news.id}`">{{ news.title }}</NuxtLink></h3>
    <p>{{ news.summary }}</p>
    <NuxtLink class="news-card__link" :to="`/noticias/${news.id}`" :aria-label="`Leer noticia: ${news.title}`">Leer noticia <span aria-hidden="true">→</span></NuxtLink>
    </div>
  </article>
</template>

<style scoped>
.news-card {
  display: grid;
  min-width: 0;
  overflow: hidden;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 25px rgb(26 43 24 / 6%);
}

.news-card__media { position: relative; min-height: 13.5rem; overflow: hidden; background: linear-gradient(135deg, #c6d3c5, #f4f0e8 48%, #9bb29a); }
.news-card__media::before, .news-card__media::after { position: absolute; width: 11rem; height: 11rem; content: ''; border: .55rem solid rgb(255 255 255 / 72%); border-radius: 50%; }
.news-card__media::before { top: -4rem; left: -2rem; }.news-card__media::after { right: -3rem; bottom: -5rem; }
.news-card__flask { position: absolute; bottom: 1.25rem; width: 3rem; height: 6rem; border: .32rem solid white; border-radius: .35rem  .35rem 1.5rem 1.5rem; transform: skew(-5deg); }.news-card__flask--one { left: 30%; background: linear-gradient(to top, #e4a34e 42%, transparent 42%); }.news-card__flask--two { left: 49%; height: 8rem; background: linear-gradient(to top, #5b9c82 56%, transparent 56%); }
.news-card__tag { position: absolute; top: 1rem; left: 1rem; padding: .25rem .55rem; color: white; background: #c77822; font-size: .85rem; font-weight: 800; }
.news-card__body { display: grid; gap: .8rem; padding: 1.35rem 1.45rem 1.5rem; }.news-card time { color: var(--color-muted); font-size: .86rem; }
.news-card h3 a { text-decoration: none; }
.news-card h3 a:hover { text-decoration: underline; }
.news-card h3 { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }.news-card p { display: -webkit-box; overflow: hidden; color: var(--color-muted); -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.news-card__link { width: fit-content; color: var(--color-primary); font-weight: 800; }
</style>
