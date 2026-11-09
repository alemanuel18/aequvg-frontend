<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { usePublicContentService } from '~/services/public-content'
const route = useRoute()
const slug = computed(() => String(route.params.slug))
const service = usePublicContentService()
const { data: post, error, refresh } = await useAsyncData(() => `public-blog-${slug.value}`, () => service.blogPostBySlug(slug.value))
watchEffect(() => { if (post.value) useSeoMeta({ title: `${post.value.title} · Blog ACS`, description: post.value.summary }) })
const message = computed(() => error.value instanceof PublicApiError ? error.value.message : 'No pudimos cargar esta entrada.')
const dateLabel = (date: string | null) => date ? new Intl.DateTimeFormat('es-GT', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(date)) : ''
</script>
<template>
  <main class="blog-detail">
    <DetailBackLink to="/blog" label="Volver al blog ACS" />
    <StatePanel v-if="error" role="alert" title="No encontramos esta entrada" :message="message"><button @click="() => refresh()">Reintentar</button></StatePanel>
    <article v-else-if="post" class="article"><p class="eyebrow">Blog ACS · AsoQuímica UVG</p><h1>{{ post.title }}</h1><p class="summary">{{ post.summary }}</p><p class="byline">Por {{ post.createdBy.name }}<template v-if="post.publishedAt"> · {{ dateLabel(post.publishedAt) }}</template></p><div class="content">{{ post.content }}</div></article>
  </main>
</template>
<style scoped>
.blog-detail{max-width:900px;margin:auto;padding:2rem 1.25rem 5rem}.article{padding:2rem 0}.eyebrow{color:var(--color-primary);font-weight:800}.article h1{font-size:clamp(2rem,5vw,3.5rem);line-height:1.1;margin:.5rem 0 1rem}.summary{font-size:1.25rem;color:var(--color-muted)}.byline{font-size:.95rem;color:var(--color-muted);padding-bottom:1rem;border-bottom:1px solid var(--color-border)}.content{white-space:pre-wrap;line-height:1.8;font-size:1.05rem}
</style>
