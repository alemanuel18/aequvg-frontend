<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminBlogService } from '~/services/admin-blog'
import type { BlogPostInput, ContentStatus } from '~/types/api'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Editor del blog ACS · Administración', robots: 'noindex, nofollow' })
const route = useRoute()
const service = useAdminBlogService()
const toast = useToast()
const editingId = computed(() => {
  const value = Number(route.query.id)
  return Number.isSafeInteger(value) && value > 0 ? value : null
})
const loading = ref(false)
const saving = ref(false)
const loadError = ref('')
const form = reactive<BlogPostInput>({ title: '', summary: '', content: '', status: 'BORRADOR' })
const hydrated = ref(false)
const slugManuallyEdited = ref(false)
const draftStorageKey = computed(() => `aequvg-blog-entry-draft-${editingId.value ?? 'new'}`)
const errorMessage = (error: unknown) => error instanceof PublicApiError ? error.message : 'No se pudo completar la operación.'
const slugify = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 240).replace(/-+$/g, '')
const restoreDraft = () => {
  try {
    const stored = localStorage.getItem(draftStorageKey.value)
    if (!stored) return null
    const parsed = JSON.parse(stored) as { form?: Partial<BlogPostInput>; slugManuallyEdited?: boolean }
    const draft = parsed.form ?? {}
    if (typeof draft.title === 'string') form.title = draft.title
    if (typeof draft.slug === 'string') form.slug = draft.slug
    if (typeof draft.summary === 'string') form.summary = draft.summary
    if (typeof draft.content === 'string') form.content = draft.content
    if (draft.status && ['BORRADOR', 'PUBLICADO', 'ARCHIVADO'].includes(draft.status)) form.status = draft.status
    if (typeof draft.imageId === 'number' || draft.imageId === null) form.imageId = draft.imageId
    return parsed.slugManuallyEdited === true
  } catch {
    return null
  }
}
const persistDraft = () => {
  if (!hydrated.value) return
  try { localStorage.setItem(draftStorageKey.value, JSON.stringify({ form, slugManuallyEdited: slugManuallyEdited.value })) }
  catch { /* El guardado en el servidor sigue disponible aunque el almacenamiento local esté lleno. */ }
}
const clearDraft = () => {
  try { localStorage.removeItem(draftStorageKey.value) }
  catch { /* La publicación ya quedó guardada en el servidor. */ }
}
const regenerateSlug = () => { slugManuallyEdited.value = false; form.slug = slugify(form.title) }
watch(() => form.title, (title) => {
  if (hydrated.value && !slugManuallyEdited.value) form.slug = slugify(title)
})
watch(form, persistDraft, { deep: true })
watch(slugManuallyEdited, persistDraft)
const loadPost = async () => {
  hydrated.value = false
  loading.value = true
  loadError.value = ''
  try {
    if (editingId.value) {
      const post = await service.get(editingId.value)
      Object.assign(form, { title: post.title, slug: post.slug, summary: post.summary, content: post.content, status: post.status, imageId: post.imageId })
      slugManuallyEdited.value = true
    }
    const restoredManualSlug = restoreDraft()
    if (restoredManualSlug !== null) slugManuallyEdited.value = restoredManualSlug
    else if (editingId.value) slugManuallyEdited.value = true
    if (!slugManuallyEdited.value) form.slug = slugify(form.title)
    hydrated.value = true
  } catch (error) { loadError.value = errorMessage(error) }
  finally { loading.value = false }
}
const save = async () => {
  saving.value = true
  try {
    const { slug, ...fields } = form
    const payload = { ...fields, ...(slug?.trim() ? { slug: slug.trim() } : {}) }
    if (editingId.value) await service.update(editingId.value, payload)
    else await service.create(payload)
    clearDraft()
    hydrated.value = false
    toast.success(editingId.value ? 'La entrada se actualizó.' : 'La entrada se creó.')
    await navigateTo('/administrador/blog')
  } catch (error) { toast.error(errorMessage(error)) }
  finally { saving.value = false }
}
const statusLabel: Record<ContentStatus, string> = { BORRADOR: 'Borrador', PUBLICADO: 'Publicado', ARCHIVADO: 'Archivado' }
onMounted(loadPost)
watch(editingId, () => { if (import.meta.client) void loadPost() })
</script>

<template>
  <div class="blog-editor-page">
    <AdminPageHeader eyebrow="Panel administrativo · ACS" :title="editingId ? 'Editar entrada' : 'Nueva entrada'" description="Redacta una historia sobre el trabajo de la asociación y su relación con la American Chemical Society." />
    <StatePanel v-if="loading" title="Cargando entrada" message="Estamos recuperando el contenido para editarlo." />
    <StatePanel v-else-if="loadError" role="alert" title="No se pudo abrir la entrada" :message="loadError"><NuxtLink class="secondary-button" to="/administrador/blog">Volver al blog</NuxtLink></StatePanel>
    <section v-else class="editor-card" aria-labelledby="entry-form-title">
      <header class="editor-heading"><div><span class="eyebrow">{{ editingId ? 'Edición de contenido' : 'Nueva publicación' }}</span><h2 id="entry-form-title">{{ editingId ? 'Edita la entrada' : 'Escribe una entrada' }}</h2><p>El resumen aparece en el listado público. El contenido admite texto con saltos de línea.</p></div><NuxtLink class="secondary-button" to="/administrador/blog">Volver a entradas</NuxtLink></header>
      <form class="entry-form" @submit.prevent="save">
        <label for="entry-title">Título<input id="entry-title" v-model="form.title" required minlength="3" maxlength="220" autocomplete="off" /></label>
        <label for="entry-slug">Slug (opcional)<input id="entry-slug" v-model="form.slug" @input="slugManuallyEdited = true" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxlength="240" placeholder="se-genera-desde-el-titulo" /><span class="slug-controls"><small>Se actualiza desde el título mientras no lo edites manualmente.</small><button class="auto-slug-button" type="button" @click="regenerateSlug">Generar desde el título</button></span></label>
        <label for="entry-summary">Resumen<textarea id="entry-summary" v-model="form.summary" required minlength="10" maxlength="2000" rows="3" /></label>
        <label for="entry-content">Contenido<textarea id="entry-content" v-model="form.content" required minlength="20" maxlength="20000" rows="14" /></label>
        <label for="entry-status">Estado<select id="entry-status" v-model="form.status"><option value="BORRADOR">{{ statusLabel.BORRADOR }}</option><option value="PUBLICADO">{{ statusLabel.PUBLICADO }}</option><option value="ARCHIVADO">{{ statusLabel.ARCHIVADO }}</option></select></label>
        <p class="autosave-note" role="status">El borrador se guarda automáticamente en este navegador y se recupera si recargas la página.</p>
        <div class="form-actions"><button class="primary-button" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear entrada' }}</button><NuxtLink class="secondary-button" to="/administrador/blog">Cancelar</NuxtLink></div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.blog-editor-page{width:100%;min-width:0}.editor-card{padding:clamp(1.1rem,2.5vw,2.25rem);background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-sm)}.editor-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding-bottom:1.25rem;margin-bottom:1.5rem;border-bottom:1px solid var(--color-border)}.editor-heading h2{margin:.35rem 0;font-size:1.5rem}.editor-heading p,.entry-form small{color:var(--color-muted)}.eyebrow{font-size:.82rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--color-primary)}.entry-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.2rem}.entry-form label{display:grid;align-content:start;gap:.45rem;font-weight:700}.entry-form label:nth-of-type(3),.entry-form label:nth-of-type(4){grid-column:1/-1}.entry-form input,.entry-form textarea,.entry-form select{width:100%;min-width:0;padding:.7rem .8rem;border:1px solid var(--color-border);border-radius:.5rem;background:white;color:var(--color-ink);font:inherit}.entry-form textarea{resize:vertical;line-height:1.6}.entry-form small{font-weight:400}.slug-controls{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap}.auto-slug-button{padding:.25rem .45rem;border:0;background:transparent;color:var(--color-primary);font:inherit;font-size:.85rem;font-weight:750;text-decoration:underline;cursor:pointer}.autosave-note{grid-column:1/-1;margin:0;color:var(--color-muted);font-size:.9rem}.form-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.65rem;padding-top:.5rem}.primary-button,.secondary-button{display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;padding:.65rem 1rem;border:1px solid transparent;border-radius:.5rem;font:inherit;font-weight:750;text-decoration:none;cursor:pointer}.primary-button{background:var(--color-primary);color:white}.secondary-button{background:white;color:var(--color-ink);border-color:var(--color-border)}.primary-button:disabled{opacity:.6;cursor:wait}@media(max-width:650px){.entry-form{grid-template-columns:1fr}.entry-form label:nth-of-type(3),.entry-form label:nth-of-type(4),.form-actions,.autosave-note{grid-column:auto}.editor-heading{display:grid}}
</style>
