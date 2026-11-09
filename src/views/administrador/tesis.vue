<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminThesesService, type ThesisInput, type ThesisLink } from '~/services/admin-theses'
import { useToast } from '~/composables/use-toast'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Tesis · Administración', robots: 'noindex, nofollow' })

const service = useAdminThesesService()
const toast = useToast()
const items = ref<ThesisLink[]>([])
const loading = ref(true)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')
const form = reactive({ title: '', url: '', author: '', publicationYear: '', summary: '', sourceIdentifier: '', published: false })
const confirmation = reactive({ open: false, title: '', message: '', label: '', variant: 'primary' as 'primary' | 'danger', action: (async () => {}) as () => Promise<void> })
const errorText = (error: unknown) => error instanceof PublicApiError ? error.message : 'Ocurrió un error inesperado.'

const load = async () => {
  loading.value = true
  try { items.value = (await service.list()).items }
  catch (error) { toast.error(errorText(error)) }
  finally { loading.value = false }
}
onMounted(load)

const resetForm = () => {
  editingId.value = null
  Object.assign(form, { title: '', url: '', author: '', publicationYear: '', summary: '', sourceIdentifier: '', published: false })
  formError.value = ''
}
const edit = (item: ThesisLink) => {
  editingId.value = item.id
  Object.assign(form, { title: item.title, url: item.url, author: item.author ?? '', publicationYear: item.publicationYear ? String(item.publicationYear) : '', summary: item.summary ?? '', sourceIdentifier: item.sourceIdentifier ?? '', published: Boolean(item.publishedAt) })
  formError.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const payload = (): ThesisInput => ({
  title: form.title.trim(), url: form.url.trim(),
  author: form.author.trim() || null,
  publicationYear: form.publicationYear ? Number(form.publicationYear) : null,
  summary: form.summary.trim() || null,
  sourceIdentifier: form.sourceIdentifier.trim() || null,
  publishedAt: form.published ? new Date().toISOString() : null
})
const askSave = () => {
  formError.value = ''
  let parsed: URL
  try { parsed = new URL(form.url.trim()) }
  catch { formError.value = 'Ingresa una dirección web válida.'; return }
  if (!['http:', 'https:'].includes(parsed.protocol)) { formError.value = 'El enlace debe comenzar con http:// o https://.'; return }
  if (form.title.trim().length < 3) { formError.value = 'Escribe un título de al menos 3 caracteres.'; return }
  if (!form.author.trim()) { formError.value = 'Escribe el autor de la tesis.'; return }
  if (!form.publicationYear || !Number.isInteger(Number(form.publicationYear)) || Number(form.publicationYear) < 1900 || Number(form.publicationYear) > 9999) { formError.value = 'Ingresa un año de publicación válido.'; return }
  if (!form.summary.trim()) { formError.value = 'Escribe el resumen de la tesis.'; return }
  confirmation.title = editingId.value ? 'Guardar cambios' : form.published ? 'Publicar tesis' : 'Agregar tesis'
  confirmation.message = editingId.value ? 'Se actualizarán los datos de esta tesis.' : form.published ? 'La tesis aparecerá como publicada.' : 'La tesis se guardará como borrador.'
  confirmation.label = editingId.value ? 'Guardar' : form.published ? 'Publicar' : 'Agregar'
  confirmation.variant = 'primary'
  confirmation.action = save
  confirmation.open = true
}
const save = async () => {
  saving.value = true
  try {
    if (editingId.value) await service.update(editingId.value, payload())
    else await service.create(payload())
    toast.success(editingId.value ? 'Se guardaron los cambios.' : form.published ? 'La tesis se publicó.' : 'Se agregó la tesis.')
    resetForm()
    confirmation.open = false
    await load()
  } catch (error) { confirmation.open = false; toast.error(errorText(error)) }
  finally { saving.value = false }
}
const askDelete = (item: ThesisLink) => {
  confirmation.title = 'Eliminar enlace de tesis'
  confirmation.message = `Se quitará “${item.title}” de esta página. La tesis seguirá en el repositorio universitario.`
  confirmation.label = 'Eliminar enlace'
  confirmation.variant = 'danger'
  confirmation.action = async () => {
    saving.value = true
    try { await service.remove(item.id); toast.success('Se quitó el enlace de la página.'); confirmation.open = false; if (editingId.value === item.id) resetForm(); await load() }
    catch (error) { confirmation.open = false; toast.error(errorText(error)) }
    finally { saving.value = false }
  }
  confirmation.open = true
}
const askPublish = (item: ThesisLink) => {
  confirmation.title = 'Publicar tesis'
  confirmation.message = `“${item.title}” aparecerá como publicada.`
  confirmation.label = 'Publicar'
  confirmation.variant = 'primary'
  confirmation.action = async () => {
    saving.value = true
    try { await service.update(item.id, { publishedAt: new Date().toISOString() }); toast.success('La tesis se publicó.'); confirmation.open = false; await load() }
    catch (error) { confirmation.open = false; toast.error(errorText(error)) }
    finally { saving.value = false }
  }
  confirmation.open = true
}
</script>

<template>
  <main class="theses-admin">
    <header class="page-heading"><p class="eyebrow">Administración</p><h1>Tesis</h1><p>Agrega enlaces a tesis alojadas en el repositorio universitario. Aquí solo guardamos el enlace y sus datos, no los documentos.</p></header>
    <section class="form-card" aria-labelledby="thesis-form-title">
      <h2 id="thesis-form-title">{{ editingId ? 'Editar tesis' : 'Agregar tesis' }}</h2>
      <form @submit.prevent="askSave">
        <label>Título<input v-model="form.title" required minlength="3" maxlength="300" /></label>
        <label>Enlace a la tesis<input v-model="form.url" type="url" required maxlength="2048" placeholder="https://repositorio.uvg.edu.gt/handle/..." /></label>
        <div class="field-row"><label>Autor<input v-model="form.author" required maxlength="300" /></label><label>Año<input v-model="form.publicationYear" type="number" required min="1900" max="9999" /></label></div>
        <label>Resumen<textarea v-model="form.summary" required rows="4" maxlength="12000" /></label>
        <label>Identificador del repositorio (opcional)<input v-model="form.sourceIdentifier" maxlength="255" placeholder="Handle u otro identificador" /></label>
        <label class="publish-check"><input v-model="form.published" type="checkbox" /> Publicar ahora</label>
        <p v-if="formError" class="form-error" role="alert">{{ formError }}</p>
        <div class="form-actions"><button class="primary" type="submit">{{ editingId ? 'Guardar cambios' : form.published ? 'Publicar tesis' : 'Agregar enlace' }}</button><button v-if="editingId" class="secondary" type="button" @click="resetForm">Cancelar edición</button></div>
      </form>
    </section>
    <section class="list-section" aria-labelledby="thesis-list-title">
      <div class="list-heading"><div><h2 id="thesis-list-title">Enlaces registrados</h2><p>{{ items.length }} tesis</p></div><button class="secondary" type="button" :disabled="loading" @click="load">Actualizar lista</button></div>
      <p v-if="loading" class="empty-state">Cargando tesis…</p>
      <p v-else-if="!items.length" class="empty-state">Todavía no hay tesis. Agrega un enlace para comenzar.</p>
      <ul v-else class="thesis-list">
        <li v-for="item in items" :key="item.id" class="thesis-item">
          <div class="thesis-copy"><span class="status" :class="item.publishedAt ? 'status--published' : 'status--draft'">{{ item.publishedAt ? 'Publicada' : 'Borrador' }}</span><h3>{{ item.title }}</h3><p>{{ [item.author, item.publicationYear].filter(Boolean).join(' · ') || 'Autor y año no especificados' }}</p><a :href="item.url" target="_blank" rel="noopener noreferrer">Abrir tesis en el repositorio</a></div>
          <div class="item-actions"><button v-if="!item.publishedAt" class="primary" type="button" @click="askPublish(item)">Publicar</button><button class="secondary" type="button" @click="edit(item)">Editar</button><button class="danger" type="button" @click="askDelete(item)">Eliminar</button></div>
        </li>
      </ul>
    </section>
    <AppConfirmModal :open="confirmation.open" :title="confirmation.title" :message="confirmation.message" :confirm-label="confirmation.label" :variant="confirmation.variant" :loading="saving" @confirm="confirmation.action" @cancel="confirmation.open = false" />
  </main>
</template>

<style scoped>
.theses-admin{max-width:1000px;margin:0 auto;padding:clamp(1rem,3vw,2rem);display:grid;gap:1.5rem;color:#17212b}.page-heading h1{margin:.2rem 0;font-size:clamp(2rem,4vw,3rem)}.page-heading>p:last-child{max-width:65ch;color:#566575}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:#087b83;font-size:.8rem}.form-card,.list-section{background:#fff;border:1px solid #dbe3e8;border-radius:1rem;padding:clamp(1rem,2.5vw,1.5rem);box-shadow:0 8px 24px #17212b0a}.form-card h2,.list-heading h2{margin:0 0 1rem}.form-card form{display:grid;gap:1rem}.form-card label{display:grid;gap:.4rem;font-weight:650}.form-card input:not([type=checkbox]),.form-card textarea{width:100%;border:1px solid #b9c6d0;border-radius:.55rem;padding:.75rem;font:inherit;color:inherit}.form-card input:focus,.form-card textarea:focus{outline:3px solid #0a8c9633;border-color:#087b83}.field-row{display:grid;grid-template-columns:2fr 1fr;gap:1rem}.publish-check{display:flex!important;align-items:center;gap:.55rem!important}.form-actions,.item-actions,.list-heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem}.form-actions{justify-content:flex-start}.primary,.secondary,.danger{border:0;border-radius:.55rem;padding:.7rem 1rem;font:inherit;font-weight:700;cursor:pointer}.primary{background:#087b83;color:#fff}.secondary{background:#edf2f5;color:#203040}.danger{background:#fff0ed;color:#a83220}.primary:focus-visible,.secondary:focus-visible,.danger:focus-visible{outline:3px solid #f2a900;outline-offset:2px}.form-error{color:#a32619;margin:0}.list-heading p{margin:0;color:#657482}.empty-state{padding:1.5rem;text-align:center;color:#596978}.thesis-list{list-style:none;padding:0;margin:0;display:grid;gap:.8rem}.thesis-item{display:flex;justify-content:space-between;gap:1rem;align-items:center;border:1px solid #e0e7eb;border-radius:.75rem;padding:1rem}.thesis-copy h3{margin:.45rem 0}.thesis-copy p{margin:.2rem 0 .5rem;color:#5d6b78}.thesis-copy a{color:#087b83;overflow-wrap:anywhere}.status{display:inline-block;border-radius:999px;padding:.2rem .6rem;font-size:.78rem;font-weight:700}.status--published{background:#e4f5ed;color:#12633e}.status--draft{background:#fff3d9;color:#7a4a00}@media(max-width:600px){.field-row{grid-template-columns:1fr}.thesis-item{align-items:flex-start;flex-direction:column}.item-actions{width:100%;justify-content:flex-start}.list-heading{align-items:flex-start}}
</style>
