<script setup lang="ts">
import { PublicApiError } from '~/services/api'
import { useAdminThesesService, type ThesisCategory, type ThesisInput, type ThesisLink } from '~/services/admin-theses'
import { useToast } from '~/composables/use-toast'

definePageMeta({ layout: 'admin', middleware: 'admin-auth' })
useSeoMeta({ title: 'Tesis · Administración', robots: 'noindex, nofollow' })

const service = useAdminThesesService()
const toast = useToast()
const items = ref<ThesisLink[]>([])
const categories = ref<ThesisCategory[]>([])
const loading = ref(true)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formError = ref('')
const categoryName = ref('')
const categorySaving = ref(false)
const form = reactive({ title: '', url: '', publicationYear: '', summary: '', published: false, categoryIds: [] as number[] })
type ContributorDraft = { key: number; personId: number | null; name: string; createNew: boolean; search: string; searchOpen: boolean; searchRequest: number; options: Array<{ id: number; name: string }>; loading: boolean }
let nextContributorKey = 1
const newContributor = (name = '', personId: number | null = null): ContributorDraft => ({ key: nextContributorKey++, personId, name, createNew: !personId, search: name, searchOpen: false, searchRequest: 0, options: [], loading: false })
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
  try {
    const [thesisResult, categoryResult] = await Promise.all([service.list(), service.categories()])
    items.value = thesisResult.items
    categories.value = categoryResult
  }
  catch (error) { toast.error(errorText(error)) }
  finally { loading.value = false }
}
onMounted(() => { void load() })
onBeforeUnmount(() => { for (const timer of authorSearchTimers.values()) clearTimeout(timer) })

const loadAuthorOptions = async (contributor: ContributorDraft) => {
  const request = ++contributor.searchRequest
  const query = contributor.search.trim()
  contributor.loading = true
  try {
    const result = await service.authors(query)
    if (request !== contributor.searchRequest) return
    const options = [...result.items]
    if (contributor.personId && !options.some(({ id }) => id === contributor.personId)) {
      options.push({ id: contributor.personId, name: contributor.name })
    }
    contributor.options = options
  } catch (error) { if (request === contributor.searchRequest) toast.error(errorText(error)) }
  finally { if (request === contributor.searchRequest) contributor.loading = false }
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
  contributor.searchOpen = false
}
const updateAuthorSearch = (contributor: ContributorDraft, event: Event) => {
  contributor.search = (event.target as HTMLInputElement).value
  contributor.personId = null
  contributor.name = ''
  contributor.searchOpen = true
  searchAuthors(contributor)
}
const openAuthorSearch = (contributor: ContributorDraft) => {
  contributor.searchOpen = true
  if (!contributor.options.length && !contributor.loading) void loadAuthorOptions(contributor)
}
const chooseExistingAuthor = (contributor: ContributorDraft, person: { id: number; name: string }) => {
  contributor.personId = person.id
  contributor.name = person.name
  contributor.search = person.name
  contributor.searchOpen = false
}
const toggleCategory = (id: number, event: Event) => {
  const selected = (event.target as HTMLInputElement).checked
  form.categoryIds = selected
    ? [...new Set([...form.categoryIds, id])]
    : form.categoryIds.filter((categoryId) => categoryId !== id)
}
const createCategory = async () => {
  categorySaving.value = true
  try {
    const created = await service.createCategory(categoryName.value.trim())
    categories.value = [...categories.value, created].sort((a, b) => a.name.localeCompare(b.name, 'es'))
    categoryName.value = ''
    toast.success(`Se creó la categoría «${created.name}».`)
  } catch (error) { toast.error(errorText(error)) }
  finally { categorySaving.value = false }
}
const toggleCategoryStatus = async (category: ThesisCategory) => {
  try {
    const updated = await service.setCategoryActive(category.id, !category.active)
    categories.value = categories.value.map((item) => item.id === updated.id ? updated : item)
    items.value = items.value.map((thesis) => ({ ...thesis, categories: thesis.categories.map((item) => item.id === updated.id ? updated : item) }))
    toast.success(updated.active ? `Se activó «${updated.name}».` : `Se desactivó «${updated.name}».`)
  } catch (error) { toast.error(errorText(error)) }
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
  Object.assign(form, { title: '', url: '', publicationYear: '', summary: '', published: false, categoryIds: [] })
  contributors.value = [newContributor()]
  formError.value = ''
}
const edit = (item: ThesisLink) => {
  editingId.value = item.id
  Object.assign(form, { title: item.title, url: item.url, publicationYear: item.publicationYear ? String(item.publicationYear) : '', summary: item.summary ?? '', published: Boolean(item.publishedAt), categoryIds: item.categories.map(({ id }) => id) })
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
  categoryIds: [...form.categoryIds],
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
    <section class="category-management" aria-labelledby="thesis-categories-title">
      <div class="category-management__heading"><div><h2 id="thesis-categories-title">Categorías de tesis</h2><p>Crea categorías y activa o desactiva las que se ofrecen al público.</p></div></div>
      <form class="category-create-form" @submit.prevent="createCategory">
        <label for="new-thesis-category">Nueva categoría</label>
        <div class="category-create-form__fields"><input id="new-thesis-category" v-model="categoryName" minlength="2" maxlength="80" required placeholder="Nombre de la categoría" /><button class="secondary" type="submit" :disabled="categorySaving">{{ categorySaving ? 'Guardando…' : 'Crear categoría' }}</button></div>
      </form>
      <ul class="category-management__list">
        <li v-for="category in categories" :key="category.id" :class="{ 'category-management__item--inactive': !category.active }">
          <span>{{ category.name }} <small v-if="!category.active">Inactiva</small></span>
          <button class="secondary" type="button" @click="toggleCategoryStatus(category)">{{ category.active ? 'Desactivar' : 'Activar' }}</button>
        </li>
      </ul>
    </section>
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
              <div v-else class="registered-author-picker">
                <label><span class="field-label">Buscar o seleccionar autor <span aria-hidden="true">*</span></span><input :value="contributor.search" type="search" autocomplete="off" placeholder="Escribe para buscar o elige un autor" :aria-label="`Buscar o seleccionar autor para ${contributorLabel(index)}`" role="combobox" aria-autocomplete="list" :aria-expanded="contributor.searchOpen" @input="updateAuthorSearch(contributor, $event)" @focus="openAuthorSearch(contributor)" @blur="contributor.searchOpen = false" @keydown.esc="contributor.searchOpen = false" /></label>
                <small v-if="contributor.loading">Buscando…</small>
                <ul v-if="contributor.searchOpen && contributor.options.length" class="author-results" role="listbox">
                  <li v-for="person in contributor.options" :key="person.id" role="option" :aria-selected="contributor.personId === person.id" :aria-disabled="contributors.some((item) => item.key !== contributor.key && item.personId === person.id)" @mousedown.prevent="!contributors.some((item) => item.key !== contributor.key && item.personId === person.id) && chooseExistingAuthor(contributor, person)">{{ person.name }}</li>
                </ul>
                <small v-else-if="contributor.searchOpen && !contributor.loading && contributor.search.trim()">No hay autores con ese nombre.</small>
              </div>
              <div v-if="contributors.length > 1" class="contributor-actions">
                <button v-if="contributors.length > 1" class="danger" type="button" :aria-label="`Quitar ${contributorLabel(index)}`" @click="removeContributor(contributor.key)">Quitar</button>
              </div>
            </li>
          </ol>
          <button class="secondary add-coauthor" type="button" @click="addContributor">Agregar coautor</button>
        </fieldset>
        <fieldset class="thesis-categories">
          <legend>Categorías</legend>
          <div v-if="categories.length" class="thesis-category-options">
            <label v-for="category in categories" :key="category.id" :class="{ 'thesis-category-option--inactive': !category.active }"><input type="checkbox" :checked="form.categoryIds.includes(category.id)" :disabled="!category.active && !form.categoryIds.includes(category.id)" @change="toggleCategory(category.id, $event)" /> {{ category.name }}<span v-if="!category.active"> (inactiva)</span></label>
          </div>
          <p v-else>No hay categorías registradas.</p>
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
          <div class="thesis-copy"><span class="status" :class="item.publishedAt ? 'status--published' : 'status--draft'">{{ item.publishedAt ? 'Publicada' : 'Borrador' }}</span><h3>{{ item.title }}</h3><p>{{ [displayAuthors(item), item.publicationYear].filter(Boolean).join(' · ') || 'Autoría y año no especificados' }}</p><div v-if="item.categories.length" class="thesis-category-tags"><span v-for="category in item.categories" :key="category.id" :class="{ 'thesis-category-tag--inactive': !category.active }">{{ category.name }}</span></div><a :href="item.url" target="_blank" rel="noopener noreferrer">Abrir tesis en el repositorio</a></div>
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
.category-management {
  display: grid;
  gap: .9rem;
  min-width: 0;
  padding: 1.25rem;
  background: #fff;
  border: 1px solid #dbe3e8;
  border-radius: .75rem;
}
.category-management h2 { margin: 0; font-size: 1.25rem; }
.category-management p { margin: .25rem 0 0; color: #5d6b78; }
.category-create-form { display: grid; gap: .4rem; max-width: 38rem; }
.category-create-form label { font-weight: 700; }
.category-create-form__fields { display: flex; flex-wrap: wrap; gap: .6rem; }
.category-create-form__fields input { flex: 1 1 14rem; min-width: 0; padding: .7rem .75rem; color: inherit; background: #fff; border: 1px solid #b9c6d0; border-radius: .55rem; font: inherit; }
.category-management__list { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 17rem), 1fr)); gap: .5rem; margin: 0; padding: 0; list-style: none; }
.category-management__list li { display: flex; align-items: center; justify-content: space-between; gap: .75rem; min-width: 0; padding: .65rem .75rem; border: 1px solid #e0e7eb; border-radius: .55rem; }
.category-management__list li span { min-width: 0; overflow-wrap: anywhere; font-weight: 650; }
.category-management__list small { color: #7a4a00; font-weight: 600; }
.category-management__item--inactive { background: #f7f8f8; }
.category-management__list button { flex: 0 0 auto; padding: .5rem .65rem; }
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
.field-label [aria-hidden="true"] { white-space: nowrap; }
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
.thesis-categories { display: grid; gap: .65rem; min-width: 0; margin: 0; padding: 1rem; border: 1px solid #dbe3e8; border-radius: .7rem; }
.thesis-categories legend { padding: 0 .35rem; font-weight: 750; }
.thesis-categories p { margin: 0; color: #5d6b78; }
.thesis-category-options { display: flex; flex-wrap: wrap; gap: .5rem; }
.thesis-category-options label { display: inline-flex !important; align-items: center; gap: .45rem !important; width: auto; padding: .5rem .7rem; border: 1px solid #dbe3e8; border-radius: 999px; background: #fff; }
.thesis-category-options input { width: 1rem; height: 1rem; margin: 0; }
.thesis-category-option--inactive { color: #697781; background: #f5f6f6 !important; }
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
.contributor-row:focus-within { position: relative; z-index: 2; }
.create-author-check { display: flex !important; align-items: center; gap: .5rem !important; padding-bottom: .8rem; }
.create-author-check input { width: 1.1rem; height: 1.1rem; margin: 0; }
.registered-author-picker { position: relative; min-width: 0; }
.author-results { position: absolute; z-index: 5; top: calc(100% + .25rem); left: 0; right: 0; max-height: 14rem; overflow-y: auto; margin: 0; padding: .25rem; list-style: none; background: #fff; border: 1px solid #b9c6d0; border-radius: .55rem; box-shadow: 0 8px 20px #17212b1a; }
.author-results li { padding: .55rem .65rem; border-radius: .35rem; cursor: pointer; }
.author-results li:hover,
.author-results li[aria-selected="true"] { background: #edf5f5; }
.author-results li[aria-disabled="true"] { color: #8a969f; cursor: not-allowed; }
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
.thesis-category-tags { display: flex; flex-wrap: wrap; gap: .4rem; margin: .55rem 0; }
.thesis-category-tags span { padding: .22rem .55rem; color: #07585e; background: #e4f2f2; border-radius: 999px; font-size: .82rem; font-weight: 700; }
.thesis-category-tags .thesis-category-tag--inactive { color: #66727b; background: #edf0f1; }
.status { display: inline-block; padding: .2rem .6rem; border-radius: 999px; font-size: .78rem; font-weight: 700; }
.status--published { color: #12633e; background: #e4f5ed; }
.status--draft { color: #7a4a00; background: #fff3d9; }
@container (max-width: 760px) {
  .contributor-row,
  .contributor-row--removable { grid-template-columns: minmax(0, 1fr); }
  .contributor-row > strong { padding-bottom: 0; }
  .create-author-check { padding-bottom: 0; }
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
  .field-row { grid-template-columns: minmax(0, 1fr); }
  .thesis-item { align-items: flex-start; flex-direction: column; }
  .item-actions { width: 100%; flex-wrap: wrap; justify-content: flex-start; }
  .list-heading { align-items: flex-start; flex-wrap: wrap; }
}
</style>
