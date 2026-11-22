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
type ContributorDraft = { key: number; personId: number | null; name: string; createNew: boolean; search: string; options: Array<{ id: number; name: string }>; loading: boolean }
let nextContributorKey = 1
const newContributor = (name = '', personId: number | null = null): ContributorDraft => ({ key: nextContributorKey++, personId, name, createNew: !personId, search: '', options: [], loading: false })
const contributors = ref<ContributorDraft[]>([newContributor()])
const authorNameCollator = new Intl.Collator('es', { sensitivity: 'base' })
const sortedContributors = computed(() => {
  const principal = contributors.value[0]
  if (!principal) return []
  const coauthors = contributors.value.slice(1).sort((a, b) => {
    if (!a.name.trim() || !b.name.trim()) return a.name.trim() ? -1 : b.name.trim() ? 1 : a.key - b.key
    return authorNameCollator.compare(a.name, b.name) || (a.personId ?? a.key) - (b.personId ?? b.key)
  })
  return [principal, ...coauthors]
})
const authorSearchTimers = new Map<number, ReturnType<typeof setTimeout>>()
const confirmation = reactive({ open: false, title: '', message: '', label: '', variant: 'primary' as 'primary' | 'danger', action: (async () => {}) as () => Promise<void> })
const errorText = (error: unknown) => error instanceof PublicApiError ? error.message : 'Ocurrió un error inesperado.'

const load = async () => {
  loading.value = true
  try { items.value = (await service.list()).items }
  catch (error) { toast.error(errorText(error)) }
  finally { loading.value = false }
}
onMounted(() => { void load() })
onBeforeUnmount(() => { for (const timer of authorSearchTimers.values()) clearTimeout(timer) })

const loadAuthorOptions = async (contributor: ContributorDraft) => {
  contributor.loading = true
  try {
    const result = await service.authors(contributor.search.trim())
    const options = [...result.items]
    if (contributor.personId && !options.some(({ id }) => id === contributor.personId)) {
      options.push({ id: contributor.personId, name: contributor.name })
    }
    contributor.options = options
  } catch (error) { toast.error(errorText(error)) }
  finally { contributor.loading = false }
}
const searchAuthors = (contributor: ContributorDraft) => {
  const timer = authorSearchTimers.get(contributor.key)
  if (timer) clearTimeout(timer)
  authorSearchTimers.set(contributor.key, setTimeout(() => { void loadAuthorOptions(contributor) }, 250))
}
const toggleCreateAuthor = (contributor: ContributorDraft, event: Event) => {
  contributor.createNew = (event.target as HTMLInputElement).checked
  contributor.personId = null
  contributor.name = ''
  contributor.search = ''
  if (!contributor.createNew) void loadAuthorOptions(contributor)
}
const selectExistingAuthor = (contributor: ContributorDraft, event: Event) => {
  const value = (event.target as HTMLSelectElement).value
  const personId = Number(value)
  const person = contributor.options.find(({ id }) => id === personId)
  contributor.personId = person?.id ?? null
  contributor.name = person?.name ?? ''
}
const addContributor = () => contributors.value.push(newContributor())
const removeContributor = (key: number) => {
  if (contributors.value.length > 1) {
    const index = contributors.value.findIndex((contributor) => contributor.key === key)
    if (index >= 0) contributors.value.splice(index, 1)
  }
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
    ? item.contributors.map(({ personId, person }) => newContributor(person.name, personId))
    : [newContributor(item.author ?? '')]
  for (const contributor of contributors.value) if (!contributor.createNew) void loadAuthorOptions(contributor)
  formError.value = ''
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
const payload = (): ThesisInput => ({
  title: form.title.trim(), url: form.url.trim(),
  contributors: sortedContributors.value.map(({ personId, name, createNew }) => createNew ? { name: name.trim() } : { personId: personId! }),
  publicationYear: Number(form.publicationYear),
  summary: form.summary.trim(),
  publishedAt: form.published ? new Date().toISOString() : null
})
const askSave = () => {
  formError.value = ''
  if (form.title.trim().length < 3) { formError.value = 'Escribe un título de al menos 3 caracteres.'; return }
  if (!contributors.value.length || contributors.value.some(({ personId, name, createNew }) => createNew ? !name.trim() : !personId)) { formError.value = 'Escribe el nombre de cada autor nuevo y selecciona los autores registrados.'; return }
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
        <label><span class="field-label">Título <span aria-hidden="true">*</span></span><input v-model="form.title" required aria-required="true" minlength="3" maxlength="300" /></label>
        <label><span class="field-label">URL del repositorio <span aria-hidden="true">*</span></span><input v-model="form.url" type="text" inputmode="url" autocomplete="url" required aria-required="true" maxlength="2048" placeholder="https://repositorio.uvg.edu.gt/handle/..." /></label>
        <fieldset class="contributors-fieldset">
          <legend>Autoría <span aria-hidden="true">*</span></legend>
          <ol class="contributor-editor">
            <li v-for="(contributor, index) in sortedContributors" :key="contributor.key" class="contributor-row" :class="{ 'contributor-row--removable': contributors.length > 1 }">
              <strong>{{ contributorLabel(index) }}</strong>
              <label class="create-author-check"><input type="checkbox" :checked="contributor.createNew" @change="toggleCreateAuthor(contributor, $event)" /> Crear autor nuevo</label>
              <label v-if="contributor.createNew"><span class="field-label">Nombre completo <span aria-hidden="true">*</span></span><input v-model="contributor.name" required maxlength="300" :aria-label="`Nombre de ${contributorLabel(index)}`" /></label>
              <div v-else class="registered-author-fields">
                <label>Buscar autor registrado<input v-model="contributor.search" type="search" placeholder="Escribe para buscar" @input="searchAuthors(contributor)" /><small v-if="contributor.loading">Buscando…</small></label>
                <label>Seleccionar autor
                  <select :value="contributor.personId ?? ''" @change="selectExistingAuthor(contributor, $event)">
                    <option value="">Selecciona un autor</option>
                    <option v-for="person in contributor.options" :key="person.id" :value="person.id" :disabled="contributors.some((item) => item.key !== contributor.key && item.personId === person.id)">{{ person.name }}</option>
                  </select>
                </label>
              </div>
              <div v-if="contributors.length > 1" class="contributor-actions">
                <button v-if="contributors.length > 1" class="danger" type="button" :aria-label="`Quitar ${contributorLabel(index)}`" @click="removeContributor(contributor.key)">Quitar</button>
              </div>
            </li>
          </ol>
          <button class="secondary add-coauthor" type="button" @click="addContributor">Agregar coautor</button>
        </fieldset>
        <label><span class="field-label">Año <span aria-hidden="true">*</span></span><input v-model="form.publicationYear" type="number" required aria-required="true" min="1900" max="9999" /></label>
        <label><span class="field-label">Resumen <span aria-hidden="true">*</span></span><textarea v-model="form.summary" required aria-required="true" minlength="1" rows="4" maxlength="12000" /></label>
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
.theses-admin {
  max-width: 1000px;
  min-width: 0;
  margin: 0 auto;
  padding: clamp(1rem, 3vw, 2rem);
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1.5rem;
  color: #17212b;
  container-type: inline-size;
}
.page-heading h1 { margin: .2rem 0; font-size: clamp(2rem, 4vw, 3rem); }
.page-heading > p:last-child { max-width: 65ch; color: #566575; }
.eyebrow { text-transform: uppercase; letter-spacing: .12em; font-weight: 700; color: #087b83; font-size: .8rem; }
.form-card,
.list-section {
  min-width: 0;
  padding: clamp(1rem, 2.5vw, 1.5rem);
  background: #fff;
  border: 1px solid #dbe3e8;
  border-radius: 1rem;
  box-shadow: 0 8px 24px #17212b0a;
}
.form-card h2,
.list-heading h2 { margin: 0 0 1rem; }
.form-card form {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 1rem;
  min-width: 0;
}
.form-card label { display: grid; gap: .4rem; font-weight: 650; min-width: 0; }
.field-label { display: block; font-weight: 650; }
.form-card input:not([type="checkbox"]),
.form-card textarea,
.form-card select {
  width: 100%;
  min-width: 0;
  max-width: 100%;
  padding: .75rem;
  color: inherit;
  font: inherit;
  background: #fff;
  border: 1px solid #b9c6d0;
  border-radius: .55rem;
}
.form-card input:focus,
.form-card textarea:focus,
.form-card select:focus { outline: 3px solid #0a8c9633; border-color: #087b83; }
.field-row { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
.contributors-fieldset {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: .8rem;
  min-inline-size: 0;
  width: 100%;
  max-width: 100%;
  margin: 0;
  padding: 1rem;
  box-sizing: border-box;
  border: 1px solid #dbe3e8;
  border-radius: .7rem;
}
.contributors-fieldset > * { min-width: 0; max-width: 100%; }
.contributors-fieldset legend { padding: 0 .35rem; font-weight: 750; }
.contributor-editor { display: grid; gap: .75rem; min-width: 0; width: 100%; margin: 0; padding: 0; list-style: none; }
.contributor-row {
  display: grid;
  grid-template-columns: minmax(8rem, .6fr) minmax(12rem, .8fr) minmax(12rem, 1fr);
  align-items: end;
  gap: .75rem;
  min-width: 0;
  width: 100%;
  max-width: 100%;
  padding: .8rem;
  box-sizing: border-box;
  border: 1px solid #e0e7eb;
  border-radius: .65rem;
}
.contributor-row--removable { grid-template-columns: minmax(8rem, .6fr) minmax(12rem, .8fr) minmax(12rem, 1fr) auto; }
.contributor-row > strong { padding-bottom: .7rem; }
.contributor-row label { min-width: 0; }
.contributor-row select { min-width: 0; max-width: 100%; }
.create-author-check { display: flex !important; align-items: center; gap: .5rem !important; padding-bottom: .8rem; }
.create-author-check input { width: 1.1rem; height: 1.1rem; margin: 0; }
.registered-author-fields { display: grid; grid-column: span 2; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; min-width: 0; }
.registered-author-fields label { min-width: 0; }
.thesis-copy { min-width: 0; overflow-wrap: anywhere; }
.contributor-actions { display: flex; flex-wrap: wrap; gap: .35rem; }
.contributor-actions button { padding: .55rem .65rem; }
.add-coauthor { justify-self: start; }
.publish-check { display: flex !important; align-items: center; gap: .55rem !important; }
.form-actions,
.item-actions,
.list-heading { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
.form-actions { justify-content: flex-start; }
.primary,
.secondary,
.danger { padding: .7rem 1rem; border: 0; border-radius: .55rem; font: inherit; font-weight: 700; cursor: pointer; }
.primary { color: #fff; background: #087b83; }
.secondary { color: #203040; background: #edf2f5; }
.danger { color: #a83220; background: #fff0ed; }
.primary:disabled,
.secondary:disabled,
.danger:disabled { opacity: .55; cursor: not-allowed; }
.primary:focus-visible,
.secondary:focus-visible,
.danger:focus-visible { outline: 3px solid #f2a900; outline-offset: 2px; }
.form-error { margin: 0; color: #a32619; }
.list-heading p { margin: 0; color: #657482; }
.empty-state { padding: 1.5rem; color: #596978; text-align: center; }
.thesis-list { display: grid; gap: .8rem; margin: 0; padding: 0; list-style: none; }
.thesis-item { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1rem; border: 1px solid #e0e7eb; border-radius: .75rem; }
.thesis-copy h3 { margin: .45rem 0; }
.thesis-copy p { margin: .2rem 0 .5rem; color: #5d6b78; }
.thesis-copy a { color: #087b83; overflow-wrap: anywhere; }
.status { display: inline-block; padding: .2rem .6rem; border-radius: 999px; font-size: .78rem; font-weight: 700; }
.status--published { color: #12633e; background: #e4f5ed; }
.status--draft { color: #7a4a00; background: #fff3d9; }
@container (max-width: 760px) {
  .contributor-row,
  .contributor-row--removable { grid-template-columns: minmax(0, 1fr); }
  .contributor-row > strong { padding-bottom: 0; }
  .create-author-check { padding-bottom: 0; }
  .registered-author-fields { grid-column: auto; grid-template-columns: minmax(0, 1fr); }
  .field-row { grid-template-columns: minmax(0, 1fr); }
  .form-actions,
  .list-heading { flex-wrap: wrap; justify-content: flex-start; }
  .thesis-item { align-items: flex-start; flex-direction: column; }
  .item-actions { width: 100%; flex-wrap: wrap; justify-content: flex-start; }
}
@media (max-width: 760px) {
  .contributor-row,
  .contributor-row--removable { grid-template-columns: minmax(0, 1fr); }
  .contributor-row > strong { padding-bottom: 0; }
  .create-author-check { padding-bottom: 0; }
  .registered-author-fields { grid-column: auto; grid-template-columns: minmax(0, 1fr); }
  .field-row { grid-template-columns: minmax(0, 1fr); }
  .thesis-item { align-items: flex-start; flex-direction: column; }
  .item-actions { width: 100%; flex-wrap: wrap; justify-content: flex-start; }
  .list-heading { align-items: flex-start; flex-wrap: wrap; }
}
</style>
