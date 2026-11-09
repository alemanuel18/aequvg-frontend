<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
import type { BlogPostList } from '~/types/api'
useSeoMeta({ title: 'Blog ACS', description: 'Historias y experiencias de AsoQuímica UVG en su relación con la American Chemical Society.' })
const service = usePublicContentService()
const { data, status, error, refresh } = await useAsyncData('public-blog', () => service.blogPosts({ page: 1, pageSize: 12 }), { default: (): BlogPostList => ({ items: [], pagination: { page: 1, pageSize: 12, total: 0 } }) })
const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date)) : ''
</script>
<template>
  <div>
    <PageHero eyebrow="ACS · Asociación de Estudiantes de Química" title="Blog ACS" description="Experiencias, proyectos y aprendizajes de nuestra relación con la American Chemical Society." />
    <AppSection title="Historias de nuestra comunidad" lead="Conoce el trabajo y las experiencias de AsoQuímica UVG vinculadas con ACS.">
      <StatePanel v-if="status === 'pending'" title="Cargando entradas" message="Buscando las publicaciones del blog." />
      <StatePanel v-else-if="error" role="alert" title="No pudimos cargar el blog" message="Intenta cargar las entradas nuevamente."><button @click="() => refresh()">Reintentar</button></StatePanel>
      <StatePanel v-else-if="!data.items.length" title="Pronto habrá nuevas historias" message="Aún no se han publicado entradas." />
      <div v-else class="blog-grid">
        <article v-for="post in data.items" :key="post.id" class="blog-card">
          <div v-if="post.image" class="blog-card__image" aria-hidden="true">ACS</div>
          <div class="blog-card__body"><time v-if="post.publishedAt" :datetime="post.publishedAt">{{ dateLabel(post.publishedAt) }}</time><h2><NuxtLink :to="`/blog/${post.slug}`">{{ post.title }}</NuxtLink></h2><p>{{ post.summary }}</p><NuxtLink class="read-link" :to="`/blog/${post.slug}`">Leer entrada →</NuxtLink></div>
        </article>
      </div>
    </AppSection>
  </div>
</template>
<style scoped>
.blog-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,18rem),1fr));gap:1.25rem}.blog-card{overflow:hidden;border:1px solid var(--color-border);border-radius:var(--radius-md);background:white;box-shadow:var(--shadow-sm)}.blog-card__image{display:grid;place-items:center;height:11rem;background:linear-gradient(135deg,#e9efe7,#bdd0c2);color:#18543d;font-size:2rem;font-weight:800;letter-spacing:.15em}.blog-card__body{padding:1.25rem;display:grid;gap:.75rem}.blog-card time{color:var(--color-muted);font-size:.9rem}.blog-card h2{font-size:1.3rem;margin:0}.blog-card h2 a{text-decoration:none;color:inherit}.blog-card p{color:var(--color-muted);margin:0}.read-link{font-weight:750;color:var(--color-primary)}
</style>
