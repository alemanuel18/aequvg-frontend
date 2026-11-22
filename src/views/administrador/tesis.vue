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
const form = reactive({ title: '', url: '', publicationYear: '', summary: '', published: false })
type ContributorDraft = { key: number; personId: number | null; name: string }
let nextContributorKey = 1
const newContributor = (): ContributorDraft => ({ key: nextContributorKey++, personId: null, name: '' })
const contributors = ref<ContributorDraft[]>([newContributor()])
const authorSearch = ref('')
const authorOptions = ref<Array<{ id: number; name: string }>>([])
const authorsLoading = ref(false)
let authorSearchTimer: ReturnType<typeof setTimeout> | undefined
const confirmation = reactive({ open: false, title: '', message: '', label: '', variant: 'primary' as 'primary' | 'danger', action: (async () => {}) as () => Promise<void> })
const errorText = (error: unknown) => error instanceof PublicApiError ? error.message : 'Ocurrió un error inesperado.'

const load = async () => {
  loading.value = true
  try { items.value = (await service.list()).items }
  catch (error) { toast.error(errorText(error)) }
  finally { loading.value = false }
}
onMounted(() => { void load(); void loadAuthorOptions() })
onBeforeUnmount(() => { if (authorSearchTimer) clearTimeout(authorSearchTimer) })

const loadAuthorOptions = async () => {
  authorsLoading.value = true
  try {
    const result = await service.authors(authorSearch.value.trim())
    const options = [...result.items]
    for (const contributor of contributors.value) {
      if (contributor.personId && !options.some(({ id }) => id === contributor.personId)) {
        options.push({ id: contributor.personId, name: contributor.name })
      }
    }
    authorOptions.value = options
  } catch (error) { toast.error(errorText(error)) }
  finally { authorsLoading.value = false }
}
watch(authorSearch, () => {
  if (authorSearchTimer) clearTimeout(authorSearchTimer)
  authorSearchTimer = setTimeout(() => { void loadAuthorOptions() }, 250)
})
const selectExistingAuthor = (contributor: ContributorDraft, event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  const personId = Number(value)
  const person = authorOptions.value.find(({ id }) => id === personId)
  contributor.personId = person?.id ?? null
  contributor.name = person?.name ?? ''
}
const addContributor = () => contributors.value.push(newContributor())
const removeContributor = (index: number) => { if (contributors.value.length > 1) contributors.value.splice(index, 1) }
const moveContributor = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= contributors.value.length) return
  const [item] = contributors.value.splice(index, 1)
  if (item) contributors.value.splice(target, 0, item)
}
const contributorLabel = (index: number) => index === 0 ? 'Autor principal' : `Coautor ${index}`
const displayAuthors = (item: ThesisLink) => {
  if (!item.contributors.length) return item.author ?? 'Autoría no especificada'
  return item.contributors.map(({ person }) => person.name).join(' · ')
}

const resetForm = () => {
  editingId.value = null
  Object.assign(form, { title: '', url: '', publicationYear: '', summary: '', published: false })
  contributors.value = [newContributor()]
  formError.value = ''
}
const edit = (item: ThesisLink) => {
  editingId.value = item.id
  Object.assign(form, { title: item.title, url: item.url, publicationYear: item.publicationYear ? String(item.publicationYear) : '', summary: item.summary ?? '', published: Boolean(item.publishedAt) })
  contributors.value = item.contributors.length
    ? item.contributors.map(({ personId, person }) => ({ key: nextContributorKey++, personId, name: person.name }))
    : [{ key: nextContributorKey++, personId: null, name: item.author ?? '' }]
  void loadAuthorOptions()
  formError.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const payload = (): ThesisInput => ({
  title: form.title.trim(), url: form.url.trim(),
  contributors: contributors.value.map(({ personId, name }) => personId ? { personId } : { name: name.trim() }),
  publicationYear: Number(form.publicationYear),
  summary: form.summary.trim(),
  publishedAt: form.published ? new Date().toISOString() : null
})
const askSave = () => {
  formError.value = ''
  if (form.title.trim().length < 3) { formError.value = 'Escribe un título de al menos 3 caracteres.'; return }
  if (!contributors.value.length || contributors.value.some(({ personId, name }) => !personId && !name.trim())) { formError.value = 'Agrega el nombre o selecciona un registro para cada autor.'; return }
  const selectedIds = contributors.value.flatMap(({ personId }) => personId ? [personId] : [])
  if (new Set(selectedIds).size !== selectedIds.length) { formError.value = 'La misma persona no puede aparecer dos veces en una tesis.'; return }
  let parsed: URL
  try { parsed = new URL(form.url.trim()) }
  catch { formError.value = 'La URL del repositorio debe comenzar con https://.'; return }
  if (parsed.protocol !== 'https:' || !parsed.hostname) { formError.value = 'La URL del repositorio debe comenzar con https://.'; return }
  form.url = parsed.toString()
  if (!form.publicationYear || !Number.isInteger(Number(form.publicationYear)) || Number(form.publicationYear) < 1900 || Number(form.publicationYear) > 9999) { formError.value = 'Ingresa un año de publicación válido (1900–9999).'; return }
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
      <form novalidate @submit.prevent="askSave">
        <label>Título <span aria-hidden="true">*</span><input v-model="form.title" required aria-required="true" minlength="3" maxlength="300" /></label>
        <label>URL del repositorio <span aria-hidden="true">*</span><input v-model="form.url" type="text" inputmode="url" autocomplete="url" required aria-required="true" maxlength="2048" placeholder="https://repositorio.uvg.edu.gt/handle/..." /><small>Debe usar HTTPS y ser única entre las tesis registradas.</small></label>
        <fieldset class="contributors-fieldset">
          <legend>Autoría <span aria-hidden="true">*</span></legend>
          <p>El primer nombre será el del autor principal. Los coautores aparecerán después, en el orden indicado.</p>
          <label class="author-search">Buscar persona registrada<input v-model="authorSearch" type="search" placeholder="Escribe un nombre para buscar" /><small v-if="authorsLoading">Buscando personas…</small></label>
          <ol class="contributor-editor">
            <li v-for="(contributor, index) in contributors" :key="contributor.key" class="contributor-row">
              <strong>{{ contributorLabel(index) }}</strong>
              <label>Seleccionar persona existente
                <select :value="contributor.personId ?? ''" @change="selectExistingAuthor(contributor, $event)">
                  <option value="">Registrar una persona nueva</option>
                  <option v-for="person in authorOptions" :key="person.id" :value="person.id" :disabled="contributors.some((item, itemIndex) => itemIndex !== index && item.personId === person.id)">{{ person.name }} · registro #{{ person.id }}</option>
                </select>
              </label>
              <label v-if="!contributor.personId">Nombre completo <span aria-hidden="true">*</span><input v-model="contributor.name" required maxlength="300" :aria-label="`Nombre de ${contributorLabel(index)}`" /></label>
              <div v-else class="selected-author"><span>Seleccionada: {{ contributor.name }} · registro #{{ contributor.personId }}</span><button class="secondary" type="button" @click="contributor.personId = null; contributor.name = ''">Usar un nombre nuevo</button></div>
              <div class="contributor-actions">
                <button class="secondary" type="button" :disabled="index === 0" :aria-label="`Mover ${contributorLabel(index)} arriba`" @click="moveContributor(index, -1)">Subir</button>
                <button class="secondary" type="button" :disabled="index === contributors.length - 1" :aria-label="`Mover ${contributorLabel(index)} abajo`" @click="moveContributor(index, 1)">Bajar</button>
                <button v-if="contributors.length > 1" class="danger" type="button" :aria-label="`Quitar ${contributorLabel(index)}`" @click="removeContributor(index)">Quitar</button>
              </div>
            </li>
          </ol>
          <small>Los nombres iguales pueden ser personas distintas. Selecciona el registro correspondiente; no se fusionan automáticamente.</small>
          <button class="secondary add-coauthor" type="button" @click="addContributor">Agregar coautor</button>
        </fieldset>
        <label>Año <span aria-hidden="true">*</span><input v-model="form.publicationYear" type="number" required aria-required="true" min="1900" max="9999" /></label>
        <label>Resumen <span aria-hidden="true">*</span><textarea v-model="form.summary" required aria-required="true" minlength="1" rows="4" maxlength="12000" /></label>
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
          <div class="thesis-copy"><span class="status" :class="item.publishedAt ? 'status--published' : 'status--draft'">{{ item.publishedAt ? 'Publicada' : 'Borrador' }}</span><h3>{{ item.title }}</h3><p>{{ [displayAuthors(item), item.publicationYear].filter(Boolean).join(' · ') || 'Autoría y año no especificados' }}</p><a :href="item.url" target="_blank" rel="noopener noreferrer">Abrir tesis en el repositorio</a></div>
          <div class="item-actions"><button v-if="!item.publishedAt" class="primary" type="button" @click="askPublish(item)">Publicar</button><button class="secondary" type="button" @click="edit(item)">Editar</button><button class="danger" type="button" @click="askDelete(item)">Eliminar</button></div>
        </li>
      </ul>
    </section>
    <AppConfirmModal :open="confirmation.open" :title="confirmation.title" :message="confirmation.message" :confirm-label="confirmation.label" :variant="confirmation.variant" :loading="saving" @confirm="confirmation.action" @cancel="confirmation.open = false" />
  </main>
</template>

<style scoped>
.theses-admin{max-width:1000px;margin:0 auto;padding:clamp(1rem,3vw,2rem);display:grid;gap:1.5rem;color:#17212b}.page-heading h1{margin:.2rem 0;font-size:clamp(2rem,4vw,3rem)}.page-heading>p:last-child{max-width:65ch;color:#566575}.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-weight:700;color:#087b83;font-size:.8rem}.form-card,.list-section{background:#fff;border:1px solid #dbe3e8;border-radius:1rem;padding:clamp(1rem,2.5vw,1.5rem);box-shadow:0 8px 24px #17212b0a}.form-card h2,.list-heading h2{margin:0 0 1rem}.form-card form{display:grid;gap:1rem}.form-card label{display:grid;gap:.4rem;font-weight:650}.form-card input:not([type=checkbox]),.form-card textarea,.form-card select{width:100%;border:1px solid #b9c6d0;border-radius:.55rem;padding:.75rem;font:inherit;color:inherit;background:white}.form-card input:focus,.form-card textarea:focus,.form-card select:focus{outline:3px solid #0a8c9633;border-color:#087b83}.field-row{display:grid;grid-template-columns:2fr 1fr;gap:1rem}.contributors-fieldset{min-width:0;margin:0;padding:1rem;border:1px solid #dbe3e8;border-radius:.7rem;display:grid;gap:.8rem}.contributors-fieldset legend{padding:0 .35rem;font-weight:750}.contributors-fieldset>p,.contributors-fieldset>small{margin:0;color:#566575}.author-search{max-width:35rem}.contributor-editor{list-style:none;margin:0;padding:0;display:grid;gap:.75rem}.contributor-row{display:grid;grid-template-columns:minmax(8rem,.6fr) minmax(12rem,1fr) minmax(12rem,1fr) auto;align-items:end;gap:.75rem;padding:.8rem;border:1px solid #e0e7eb;border-radius:.65rem}.contributor-row>strong{padding-bottom:.7rem}.contributor-row label{min-width:0}.selected-author{display:grid;gap:.4rem;align-self:stretch}.contributor-actions{display:flex;flex-wrap:wrap;gap:.35rem}.contributor-actions button,.selected-author button{padding:.55rem .65rem}.add-coauthor{justify-self:start}.publish-check{display:flex!important;align-items:center;gap:.55rem!important}.form-actions,.item-actions,.list-heading{display:flex;align-items:center;justify-content:space-between;gap:.75rem}.form-actions{justify-content:flex-start}.primary,.secondary,.danger{border:0;border-radius:.55rem;padding:.7rem 1rem;font:inherit;font-weight:700;cursor:pointer}.primary{background:#087b83;color:#fff}.secondary{background:#edf2f5;color:#203040}.danger{background:#fff0ed;color:#a83220}.primary:disabled,.secondary:disabled,.danger:disabled{opacity:.55;cursor:not-allowed}.primary:focus-visible,.secondary:focus-visible,.danger:focus-visible{outline:3px solid #f2a900;outline-offset:2px}.form-error{color:#a32619;margin:0}.list-heading p{margin:0;color:#657482}.empty-state{padding:1.5rem;text-align:center;color:#596978}.thesis-list{list-style:none;padding:0;margin:0;display:grid;gap:.8rem}.thesis-item{display:flex;justify-content:space-between;gap:1rem;align-items:center;border:1px solid #e0e7eb;border-radius:.75rem;padding:1rem}.thesis-copy h3{margin:.45rem 0}.thesis-copy p{margin:.2rem 0 .5rem;color:#5d6b78}.thesis-copy a{color:#087b83;overflow-wrap:anywhere}.status{display:inline-block;border-radius:999px;padding:.2rem .6rem;font-size:.78rem;font-weight:700}.status--published{background:#e4f5ed;color:#12633e}.status--draft{background:#fff3d9;color:#7a4a00}@media(max-width:760px){.field-row{grid-template-columns:1fr}.contributor-row{grid-template-columns:1fr}.contributor-row>strong{padding-bottom:0}.thesis-item{align-items:flex-start;flex-direction:column}.item-actions{width:100%;justify-content:flex-start}.list-heading{align-items:flex-start}}
.theses-admin{container-type:inline-size}
.form-card,.list-section,.contributor-row>*{min-width:0}
.contributor-row select{max-width:100%}
.selected-author span,.thesis-copy{min-width:0;overflow-wrap:anywhere}
@container (max-width: 760px){
  .contributor-row{grid-template-columns:minmax(0,1fr)}
  .contributor-row>strong{padding-bottom:0}
  .field-row{grid-template-columns:1fr}
  .form-actions,.list-heading{flex-wrap:wrap;justify-content:flex-start}
  .thesis-item{align-items:flex-start;flex-direction:column}
  .item-actions{width:100%;justify-content:flex-start;flex-wrap:wrap}
}
@media(max-width:760px){
  .contributor-row{grid-template-columns:minmax(0,1fr)}
  .contributor-row>strong{padding-bottom:0}
  .field-row{grid-template-columns:1fr}
  .thesis-item{align-items:flex-start;flex-direction:column}
  .item-actions{width:100%;justify-content:flex-start;flex-wrap:wrap}
  .list-heading{align-items:flex-start;flex-wrap:wrap}
}
</style>
