<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { usePublicContentService } from '~/services/public-content'
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const service = usePublicContentService()
const config = useRuntimeConfig()
const { data: post, status, error, refresh } = await useAsyncData(() => `public-blog-${slug.value}`, () => service.blogPostBySlug(slug.value))
watchEffect(() => { if (post.value) useSeoMeta({ title: `${post.value.title} · Blog ACS`, description: post.value.summary }) })
const message = computed(() => error.value instanceof PublicApiError ? error.value.message : 'No pudimos cargar esta entrada.')
const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date)) : ''
const coverUrl = (value: string) => new URL(`/api/v1/blog/${encodeURIComponent(value)}/image`, config.public.apiBaseUrl).toString()
</script>
<template>
  <div>
    <DetailBackLink to="/blog" label="Volver al blog ACS" />
    <PageHero
      eyebrow="Blog ACS · AsoQuímica UVG"
      :title="post?.title || 'Blog ACS'"
      :description="post?.summary || 'Historias y experiencias de AsoQuímica UVG en su relación con la American Chemical Society.'"
    />
    <AppSection>
      <StatePanel v-if="status === 'pending'" title="Cargando entrada" message="Estamos consultando esta publicación del blog." />
      <StatePanel v-else-if="error" role="alert" title="No encontramos esta entrada" :message="message">
        <AppButton to="/blog" variant="secondary">Volver al blog ACS</AppButton>
        <button type="button" @click="() => refresh()">Reintentar</button>
      </StatePanel>
      <article v-else-if="post" class="blog-article">
        <div class="blog-article__meta">
          <EyebrowBadge text="Blog ACS · AsoQuímica UVG" />
          <p class="byline">Por {{ post.createdBy.name }}<template v-if="post.publishedAt"> · {{ dateLabel(post.publishedAt) }}</template></p>
        </div>
        <img v-if="post.image" class="cover-image" :src="coverUrl(post.slug)" :alt="`Portada de ${post.title}`">
        <div class="content" v-html="post.content"></div>
      </article>
    </AppSection>
  </div>
</template>
<style scoped>
.blog-article {
  display: grid;
  gap: 1.4rem;
  max-width: var(--container-reading);
  margin-inline: auto;
}
.blog-article__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--color-border);
}
.byline {
  font-size: 0.94rem;
  color: var(--color-muted);
}
.cover-image {
  display: block;
  width: 100%;
  max-height: 34rem;
  object-fit: cover;
  border-radius: var(--radius-md);
}
.content {
  white-space: pre-wrap;
  line-height: 1.8;
  font-size: 1.06rem;
  overflow-wrap: anywhere;
}
.content :deep(h1),
.content :deep(h2) {
  font-size: 1.8rem;
  line-height: 1.25;
}
.content :deep(h3) {
  font-size: 1.45rem;
  line-height: 1.3;
}
.content :deep(img) {
  display: block;
  max-width: 100%;
  max-height: 38rem;
  object-fit: contain;
  margin: 1.5rem auto;
  border-radius: var(--radius-sm);
}
.content :deep(blockquote) {
  margin: 1.25rem 0;
  padding: 0.75rem 1rem;
  border-left: 4px solid var(--color-primary);
  background: var(--color-soft);
  color: var(--color-muted);
}
.content :deep(ul),
.content :deep(ol) {
  padding-left: 1.5rem;
}
</style>
