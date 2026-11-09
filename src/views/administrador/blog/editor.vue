<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminBlogService } from '~/services/admin-blog'
import type { AdminNewsImage, BlogPostInput, ContentStatus } from '~/types/api'

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
const images = ref<AdminNewsImage[]>([])
const imageInput = ref<HTMLInputElement | null>(null)
const uploadingImage = ref(false)
const config = useRuntimeConfig()
const form = reactive<BlogPostInput>({ title: '', summary: '', content: '', status: 'BORRADOR' })
const selectedImageId = computed({
  get: () => form.imageId ? String(form.imageId) : '',
  set: (value: string) => { form.imageId = value ? Number(value) : null }
})
const selectedImage = computed(() => images.value.find(image => image.id === form.imageId) ?? null)
const imagePreviewUrl = computed(() => selectedImage.value ? new URL(selectedImage.value.previewUrl, config.public.apiBaseUrl).toString() : '')
const adminImageUrl = (id: number) => new URL(`/api/v1/admin/blog/images/${id}/preview`, config.public.apiBaseUrl).toString()
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
const loadImages = async () => {
  try { images.value = await service.images() }
  catch (error) { toast.error(errorMessage(error)) }
}
const uploadCover = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploadingImage.value = true
  try {
    const image = await service.uploadImage(file)
    images.value = [image, ...images.value.filter(item => item.id !== image.id)]
    form.imageId = image.id
    toast.success('La imagen de portada se cargó.')
  } catch (error) { toast.error(errorMessage(error)) }
  finally {
    uploadingImage.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}
const uploadInlineImage = async (file: File) => {
  try {
    const image = await service.uploadImage(file)
    images.value = [image, ...images.value.filter(item => item.id !== image.id)]
    toast.success('La imagen se insertó en el contenido.')
    return image
  } catch (error) {
    toast.error(errorMessage(error))
    throw error
  }
}
const save = async () => {
  const textContent = form.content.replace(/<[^>]*>/g, ' ').replace(/&(?:nbsp|amp|lt|gt|quot|#\d+|#x[\da-f]+);/gi, ' ').replace(/\s+/g, ' ').trim()
  if (textContent.length < 20) { toast.error('El contenido debe incluir al menos 20 caracteres de texto.'); return }
  if (form.content.length > 20000) { toast.error('El contenido no puede superar los 20,000 caracteres.'); return }
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
onMounted(() => { void Promise.all([loadPost(), loadImages()]) })
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
        <label for="entry-cover">Imagen de portada<select id="entry-cover" v-model="selectedImageId"><option value="">Sin imagen</option><option v-for="image in images" :key="image.id" :value="String(image.id)">{{ image.originalName }}</option></select><span class="cover-upload"><input ref="imageInput" class="file-input" type="file" accept="image/jpeg,image/png,image/gif,image/webp" aria-label="Seleccionar una imagen de portada" :disabled="uploadingImage" @change="uploadCover"><small>{{ uploadingImage ? 'Cargando imagen…' : 'Formatos JPEG, PNG, GIF o WebP; máximo 25 MB.' }}</small></span><img v-if="imagePreviewUrl" class="cover-preview" :src="imagePreviewUrl" :alt="selectedImage?.originalName || 'Imagen de portada seleccionada'"></label>
        <label for="entry-summary">Resumen<textarea id="entry-summary" v-model="form.summary" required minlength="10" maxlength="2000" rows="3" /></label>
        <label class="content-field">Contenido<BlogRichEditor v-model="form.content" :images="images" :image-url="adminImageUrl" :upload-image="uploadInlineImage" /></label>
        <label for="entry-status">Estado<select id="entry-status" v-model="form.status"><option value="BORRADOR">{{ statusLabel.BORRADOR }}</option><option value="PUBLICADO">{{ statusLabel.PUBLICADO }}</option><option value="ARCHIVADO">{{ statusLabel.ARCHIVADO }}</option></select></label>
        <p class="autosave-note" role="status">El borrador se guarda automáticamente en este navegador y se recupera si recargas la página.</p>
        <div class="form-actions"><button class="primary-button" type="submit" :disabled="saving">{{ saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear entrada' }}</button><NuxtLink class="secondary-button" to="/administrador/blog">Cancelar</NuxtLink></div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.blog-editor-page{width:100%;min-width:0}.editor-card{padding:clamp(1.1rem,2.5vw,2.25rem);background:white;border:1px solid var(--color-border);border-radius:var(--radius-md);box-shadow:var(--shadow-sm)}.editor-heading{display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;padding-bottom:1.25rem;margin-bottom:1.5rem;border-bottom:1px solid var(--color-border)}.editor-heading h2{margin:.35rem 0;font-size:1.5rem}.editor-heading p,.entry-form small{color:var(--color-muted)}.eyebrow{font-size:.82rem;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--color-primary)}.entry-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:1.2rem}.entry-form label{display:grid;align-content:start;gap:.45rem;font-weight:700}.entry-form label:nth-of-type(3),.entry-form label:nth-of-type(4),.entry-form label:nth-of-type(5){grid-column:1/-1}.entry-form input,.entry-form textarea,.entry-form select{width:100%;min-width:0;padding:.7rem .8rem;border:1px solid var(--color-border);border-radius:.5rem;background:white;color:var(--color-ink);font:inherit}.entry-form textarea{resize:vertical;line-height:1.6}.entry-form small{font-weight:400}.slug-controls{display:flex;align-items:center;justify-content:space-between;gap:.75rem;flex-wrap:wrap}.auto-slug-button{padding:.25rem .45rem;border:0;background:transparent;color:var(--color-primary);font:inherit;font-size:.85rem;font-weight:750;text-decoration:underline;cursor:pointer}.cover-upload{display:grid;gap:.4rem}.file-input{padding:.4rem!important;background:var(--color-soft)!important}.cover-preview{display:block;width:min(100%,42rem);max-height:22rem;object-fit:contain;object-position:left center;border:1px solid var(--color-border);border-radius:.5rem;background:#f4f7f5}.autosave-note{grid-column:1/-1;margin:0;color:var(--color-muted);font-size:.9rem}.form-actions{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:.65rem;padding-top:.5rem}.primary-button,.secondary-button{display:inline-flex;align-items:center;justify-content:center;min-height:2.75rem;padding:.65rem 1rem;border:1px solid transparent;border-radius:.5rem;font:inherit;font-weight:750;text-decoration:none;cursor:pointer}.primary-button{background:var(--color-primary);color:white}.secondary-button{background:white;color:var(--color-ink);border-color:var(--color-border)}.primary-button:disabled{opacity:.6;cursor:wait}@media(max-width:650px){.entry-form{grid-template-columns:1fr}.entry-form label:nth-of-type(3),.entry-form label:nth-of-type(4),.entry-form label:nth-of-type(5),.form-actions,.autosave-note{grid-column:auto}.editor-heading{display:grid}}
</style>
