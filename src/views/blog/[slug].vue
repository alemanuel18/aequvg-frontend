<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { usePublicContentService } from '~/services/public-content'
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const service = usePublicContentService()
const config = useRuntimeConfig()
const { data: post, error, refresh } = await useAsyncData(() => `public-blog-${slug.value}`, () => service.blogPostBySlug(slug.value))
watchEffect(() => { if (post.value) useSeoMeta({ title: `${post.value.title} · Blog ACS`, description: post.value.summary }) })
const message = computed(() => error.value instanceof PublicApiError ? error.value.message : 'No pudimos cargar esta entrada.')
const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date)) : ''
const coverUrl = (value: string) => new URL(`/api/v1/blog/${encodeURIComponent(value)}/image`, config.public.apiBaseUrl).toString()
</script>
<template>
  <main class="blog-detail">
    <DetailBackLink to="/blog" label="Volver al blog ACS" />
    <StatePanel v-if="error" role="alert" title="No encontramos esta entrada" :message="message"><button @click="() => refresh()">Reintentar</button></StatePanel>
    <article v-else-if="post" class="article"><p class="eyebrow">Blog ACS · AsoQuímica UVG</p><h1>{{ post.title }}</h1><p class="summary">{{ post.summary }}</p><p class="byline">Por {{ post.createdBy.name }}<template v-if="post.publishedAt"> · {{ dateLabel(post.publishedAt) }}</template></p><img v-if="post.image" class="cover-image" :src="coverUrl(post.slug)" :alt="`Portada de ${post.title}`"><div class="content" v-html="post.content"></div></article>
  </main>
</template>
<style scoped>
.blog-detail{max-width:900px;margin:auto;padding:2rem 1.25rem 5rem}.article{padding:2rem 0}.eyebrow{color:var(--color-primary);font-weight:800}.article h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.1;margin:.5rem 0 1rem}.summary{font-size:1.25rem;color:var(--color-muted)}.byline{font-size:.95rem;color:var(--color-muted);padding-bottom:1rem;border-bottom:1px solid var(--color-border)}.cover-image{display:block;width:100%;max-height:34rem;object-fit:cover;margin:1.5rem 0 2rem;border-radius:var(--radius-md)}.content{white-space:pre-wrap;line-height:1.8;font-size:1.05rem}.content :deep(h1){font-size:2.2rem;line-height:1.2}.content :deep(h2){font-size:1.8rem;line-height:1.25}.content :deep(h3){font-size:1.45rem;line-height:1.3}.content :deep(img){display:block;max-width:100%;max-height:38rem;object-fit:contain;margin:1.5rem auto;border-radius:.5rem}.content :deep(blockquote){margin:1.25rem 0;padding:.75rem 1rem;border-left:4px solid var(--color-primary);background:var(--color-soft);color:var(--color-muted)}.content :deep(ul),.content :deep(ol){padding-left:1.5rem}
</style>
