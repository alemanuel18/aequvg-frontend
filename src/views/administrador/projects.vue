<script setup lang="ts">
import { PublicApiError } from "~/services/api";
import { useAdminProjectsService } from "~/services/admin-projects";
import { useToast } from "~/composables/use-toast";
import type { AdminProject, ProjectStatus, ProjectType } from "~/types/api";

definePageMeta({
  layout: "admin",
  middleware: "admin-auth",
  alias: ["/administrador/investigacion"],
});
useSeoMeta({
  title: "Investigación · Administración",
  robots: "noindex, nofollow",
});
const service = useAdminProjectsService(),
  toast = useToast();
const statuses: ProjectStatus[] = ["EN_REVISION", "APROBADO", "NO_APROBADO"];
const statusNames: Record<ProjectStatus, string> = {
  EN_REVISION: "En revisión",
  APROBADO: "Aprobado",
  NO_APROBADO: "No aprobado",
};
const items = ref<AdminProject[]>([]),
  total = ref(0),
  page = ref(1),
  pageSize = 10;
const loading = ref(true),
  refreshing = ref(false),
  loadError = ref(""),
  search = ref(""),
  status = ref<ProjectStatus | "">(""),
  type = ref<ProjectType | "">("");
const editingId = ref<number | null>(null),
  detail = ref<AdminProject | null>(null),
  detailLoading = ref(false);
const saving = ref(false),
  uploading = ref(false),
  deletingId = ref<number | null>(null),
  fileInput = ref<HTMLInputElement | null>(null),
  titleInput = ref<HTMLInputElement | null>(null);
const pdfName = ref(""),
  errors = ref<Record<string, string>>({});
const form = reactive({
  title: "",
  slug: "",
  description: "",
  type: "PROYECTO" as ProjectType,
  repositoryUrl: "",
  liveUrl: "",
  documentFileId: "",
});
const confirm = reactive({
  open: false,
  title: "",
  message: "",
  label: "Confirmar",
  variant: "primary" as "primary" | "danger" | "warning",
  busy: false,
  action: (async () => {}) as () => Promise<void>,
});
const pages = computed(() => Math.max(1, Math.ceil(total.value / pageSize)));
const errorText = (error: unknown) =>
  error instanceof PublicApiError
    ? error.message
    : "Ocurrió un error inesperado.";
let searchTimer: ReturnType<typeof setTimeout> | undefined;
const load = async (initial = false) => {
  if (initial) loading.value = true;
  else refreshing.value = true;
  loadError.value = "";
  try {
    const result = await service.list({
      q: search.value.trim() || undefined,
      status: status.value || undefined,
      type: type.value || undefined,
      page: page.value,
      pageSize,
    });
    items.value = result.items;
    total.value = result.pagination.total;
  } catch (error) {
    if (initial) loadError.value = errorText(error);
    else toast.error(errorText(error));
  } finally {
    loading.value = false;
    refreshing.value = false;
  }
};
onMounted(() => load(true));
watch([status, type], () => {
  page.value = 1;
  load();
});
watch(search, () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    page.value = 1;
    load();
  }, 250);
});
onBeforeUnmount(() => clearTimeout(searchTimer));
const clearForm = () => {
  editingId.value = null;
  Object.assign(form, {
    title: "",
    slug: "",
    description: "",
    type: "PROYECTO",
    repositoryUrl: "",
    liveUrl: "",
    documentFileId: "",
  });
  pdfName.value = "";
  errors.value = {};
  if (fileInput.value) fileInput.value.value = "";
};
const slugify = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 220);
watch(
  () => form.title,
  (value) => {
    if (!editingId.value || !form.slug) form.slug = slugify(value);
  },
);
const startEdit = async (project: AdminProject) => {
  detail.value = null;
  detailLoading.value = true;
  try {
    const full = await service.detail(project.id);
    editingId.value = full.id;
    Object.assign(form, {
      title: full.title,
      slug: full.slug,
      description: full.description,
      type: full.type,
      repositoryUrl: full.repositoryUrl ?? "",
      liveUrl: full.liveUrl ?? "",
      documentFileId: full.documentFileId ? String(full.documentFileId) : "",
    });
    pdfName.value = full.documentFile?.originalName ?? "";
    await nextTick();
    titleInput.value?.focus();
  } catch (error) {
    toast.error(errorText(error));
  } finally {
    detailLoading.value = false;
  }
};
const showDetail = async (project: AdminProject) => {
  editingId.value = null;
  detailLoading.value = true;
  try {
    detail.value = await service.detail(project.id);
  } catch (error) {
    toast.error(errorText(error));
  } finally {
    detailLoading.value = false;
  }
};
const uploadPdf = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  if (file.type !== "application/pdf" || file.size > 25 * 1024 * 1024) {
    toast.error("Selecciona un PDF válido de hasta 25 MB.");
    if (fileInput.value) fileInput.value.value = "";
    return;
  }
  uploading.value = true;
  try {
    const uploaded = await service.upload(file);
    form.documentFileId = String(uploaded.id);
    pdfName.value = uploaded.originalName;
    toast.success("El PDF se cargó correctamente.");
  } catch (error) {
    toast.error(errorText(error));
    if (fileInput.value) fileInput.value.value = "";
  } finally {
    uploading.value = false;
  }
};
const validate = () => {
  const next: Record<string, string> = {};
  if (form.title.trim().length < 3)
    next.title = "Escribe un título de al menos 3 caracteres.";
  if (!form.slug.trim()) next.slug = "El identificador URL es obligatorio.";
  if (form.description.trim().length < 10)
    next.description = "La descripción debe tener al menos 10 caracteres.";
  for (const key of ["repositoryUrl", "liveUrl"] as const)
    if (form[key] && !/^https?:\/\//i.test(form[key]))
      next[key] = "Usa una dirección que comience con http:// o https://.";
  errors.value = next;
  return !Object.keys(next).length;
};
const ask = (
  title: string,
  message: string,
  label: string,
  variant: "primary" | "danger" | "warning",
  action: () => Promise<void>,
) => {
  confirm.title = title;
  confirm.message = message;
  confirm.label = label;
  confirm.variant = variant;
  confirm.action = action;
  confirm.open = true;
};
const save = () => {
  if (saving.value || uploading.value || !validate()) {
    if (errors.value.title) titleInput.value?.focus();
    else if (Object.keys(errors.value).length)
      document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    if (Object.keys(errors.value).length)
      toast.error("Revisa los campos marcados.");
    return;
  }
  ask(
    editingId.value ? "¿Guardar cambios?" : "¿Crear proyecto?",
    `Confirma ${editingId.value ? "la edición" : "el alta"} de “${form.title.trim()}”.`,
    editingId.value ? "Guardar cambios" : "Crear proyecto",
    "primary",
    saveConfirmed,
  );
};
const saveConfirmed = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    const repositoryUrl = form.repositoryUrl.trim(),
      liveUrl = form.liveUrl.trim();
    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      description: form.description.trim(),
      type: form.type,
      ...(repositoryUrl ? { repositoryUrl } : {}),
      ...(liveUrl ? { liveUrl } : {}),
      documentFileId: form.documentFileId ? Number(form.documentFileId) : null,
    };
    if (editingId.value) await service.update(editingId.value, payload);
    else await service.create(payload);
    toast.success(
      editingId.value
        ? "El proyecto se actualizó correctamente."
        : "El proyecto se creó en estado En revisión.",
    );
    clearForm();
    await load();
  } catch (error) {
    toast.error(errorText(error));
    throw error;
  } finally {
    saving.value = false;
  }
};
const askDelete = (project: AdminProject) =>
  ask(
    "¿Eliminar proyecto permanentemente?",
    `Se eliminará “${project.title}”. Esta acción no se puede deshacer.`,
    "Eliminar proyecto",
    "danger",
    () => remove(project),
  );
const remove = async (project: AdminProject) => {
  if (deletingId.value) return;
  deletingId.value = project.id;
  try {
    await service.remove(project.id);
    toast.success("El proyecto se eliminó correctamente.");
    if (editingId.value === project.id) clearForm();
    if (detail.value?.id === project.id) detail.value = null;
    await load();
  } catch (error) {
    toast.error(errorText(error));
    throw error;
  } finally {
    deletingId.value = null;
  }
};
const review = (project: AdminProject, next: ProjectStatus) => {
  if (next === project.status) return;
  ask(
    "¿Cambiar estado del proyecto?",
    `“${project.title}” pasará a ${statusNames[next].toLowerCase()}.`,
    "Actualizar estado",
    next === "NO_APROBADO" ? "warning" : "primary",
    async () => {
      try {
        await service.review(project.id, next);
        toast.success("El estado se actualizó correctamente.");
        await load();
      } catch (error) {
        toast.error(errorText(error));
        throw error;
      }
    },
  );
};
const requestStatusChange = (project: AdminProject, event: Event) => {
  const select = event.target as HTMLSelectElement;
  const next = select.value as ProjectStatus;
  select.value = project.status;
  review(project, next);
};
const goToPage = (next: number) => {
  if (next < 1 || next > pages.value) return;
  page.value = next;
  load();
};
const handleConfirmation = async () => {
  if (confirm.busy) return;
  confirm.busy = true;
  try {
    await confirm.action();
    confirm.open = false;
  } catch {
  } finally {
    confirm.busy = false;
  }
};
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("es-GT", { dateStyle: "medium" }).format(
    new Date(value),
  );
</script>

<template>
  <main class="project-admin">
    <header class="page-heading">
      <div>
        <span class="eyebrow">Panel administrativo</span>
        <h1>Proyectos de investigación</h1>
        <p>
          Registra y administra proyectos cargados por la junta directiva. No
          hay envío por estudiantes.
        </p>
      </div>
      <button class="primary" type="button" @click="clearForm">
        ＋ Nuevo proyecto
      </button>
    </header>
    <section class="panel" aria-labelledby="list-title">
      <div class="section-heading">
        <div>
          <h2 id="list-title">Listado de proyectos</h2>
          <p>Consulta metadatos, PDF y estado de revisión.</p>
        </div>
        <span v-if="refreshing" aria-live="polite">Actualizando…</span>
      </div>
      <div class="filters">
        <label class="filter-search"
          >Buscar<input
            v-model="search"
            type="search"
            placeholder="Título, descripción o autoría" /></label
        ><label
          >Estado<select v-model="status">
            <option value="">Todos los estados</option>
            <option v-for="s in statuses" :key="s" :value="s">
              {{ statusNames[s] }}
            </option>
          </select></label
        ><label
          >Tipo<select v-model="type">
            <option value="">Todos los tipos</option>
            <option value="PROYECTO">Proyecto</option>
            <option value="TESIS">Tesis</option>
          </select></label
        >
      </div>
      <StatePanel
        v-if="loading"
        title="Cargando proyectos"
        message="Consultando el listado administrativo."
      />
      <StatePanel
        v-else-if="loadError"
        role="alert"
        title="No pudimos cargar los proyectos"
        :message="loadError"
        ><button class="secondary" type="button" @click="load(true)">
          Reintentar
        </button></StatePanel
      >
      <StatePanel
        v-else-if="!items.length"
        title="No hay proyectos para mostrar"
        message="Ajusta los filtros o registra el primer proyecto desde este panel."
      />
      <div v-else class="table-wrap">
        <table>
          <caption class="sr-only">
            Proyectos de investigación administrados
          </caption>
          <thead>
            <tr>
              <th>Proyecto</th>
              <th>Autoría</th>
              <th>Tipo y estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in items" :key="item.id">
              <td data-label="Proyecto">
                <strong>{{ item.title }}</strong
                ><small>{{ item.slug }} · ID {{ item.id }}</small
                ><small v-if="item.documentFile"
                  ><a
                    :href="service.documentUrl(item.id)"
                    target="_blank"
                    rel="noopener noreferrer"
                    >Ver PDF: {{ item.documentFile.originalName }}</a
                  >
                  ·
                  {{ (item.documentFile.sizeBytes / 1048576).toFixed(1) }}
                  MB</small
                >
              </td>
              <td data-label="Autoría">
                {{ item.author.name }}<small>{{ item.author.email }}</small>
              </td>
              <td data-label="Estado">
                <span class="pill">{{
                  item.type === "TESIS" ? "Tesis" : "Proyecto"
                }}</span
                ><select
                  class="status-select"
                  :aria-label="`Estado de ${item.title}`"
                  :value="item.status"
                  @change="requestStatusChange(item, $event)"
                >
                  <option v-for="s in statuses" :key="s" :value="s">
                    {{ statusNames[s] }}
                  </option>
                </select>
              </td>
              <td data-label="Fecha">{{ formatDate(item.createdAt) }}</td>
              <td data-label="Acciones">
                <div class="actions">
                  <button
                    class="secondary"
                    type="button"
                    @click="showDetail(item)"
                  >
                    Detalle</button
                  ><button
                    class="secondary"
                    type="button"
                    @click="startEdit(item)"
                  >
                    Editar</button
                  ><button
                    class="danger"
                    type="button"
                    :disabled="deletingId === item.id"
                    @click="askDelete(item)"
                  >
                    Eliminar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <nav
        v-if="!loading && !loadError && pages > 1"
        class="pagination"
        aria-label="Paginación de proyectos"
      >
        <span>{{ total }} proyectos · página {{ page }} de {{ pages }}</span>
        <div>
          <button
            class="secondary"
            :disabled="page <= 1"
            @click="goToPage(page - 1)"
          >
            Anterior</button
          ><button
            class="secondary"
            :disabled="page >= pages"
            @click="goToPage(page + 1)"
          >
            Siguiente
          </button>
        </div>
      </nav>
    </section>
    <section v-if="detailLoading" class="panel" aria-live="polite">
      Cargando detalle…
    </section>
    <section v-if="detail" class="panel detail" aria-labelledby="detail-title">
      <div class="section-heading">
        <div>
          <span class="eyebrow"
            >Detalle · {{ statusNames[detail.status] }}</span
          >
          <h2 id="detail-title">{{ detail.title }}</h2>
        </div>
        <button class="secondary" type="button" @click="detail = null">
          Cerrar detalle
        </button>
      </div>
      <p class="description">{{ detail.description }}</p>
      <dl>
        <div>
          <dt>Tipo</dt>
          <dd>{{ detail.type === "TESIS" ? "Tesis" : "Proyecto" }}</dd>
        </div>
        <div>
          <dt>Autoría registrada por la junta</dt>
          <dd>{{ detail.author.name }} · {{ detail.author.email }}</dd>
        </div>
        <div>
          <dt>Creado</dt>
          <dd>{{ formatDate(detail.createdAt) }}</dd>
        </div>
        <div v-if="detail.reviewer">
          <dt>Revisado por</dt>
          <dd>{{ detail.reviewer.name }}</dd>
        </div>
        <div v-if="detail.rejectionReason">
          <dt>Motivo de rechazo</dt>
          <dd>{{ detail.rejectionReason }}</dd>
        </div>
        <div v-if="detail.documentFile">
          <dt>PDF</dt>
          <dd>
            <a
              :href="service.documentUrl(detail.id)"
              target="_blank"
              rel="noopener noreferrer"
              >{{ detail.documentFile.originalName }} ·
              {{ (detail.documentFile.sizeBytes / 1048576).toFixed(1) }} MB</a
            >
          </dd>
        </div>
        <div v-if="detail.repositoryUrl">
          <dt>Repositorio</dt>
          <dd>
            <a
              :href="detail.repositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ detail.repositoryUrl }}</a
            >
          </dd>
        </div>
        <div v-if="detail.liveUrl">
          <dt>Enlace del proyecto</dt>
          <dd>
            <a
              :href="detail.liveUrl"
              target="_blank"
              rel="noopener noreferrer"
              >{{ detail.liveUrl }}</a
            >
          </dd>
        </div>
      </dl>
    </section>
    <section class="panel editor" aria-labelledby="editor-title">
      <div class="section-heading">
        <div>
          <span class="eyebrow">{{
            editingId ? "Edición" : "Alta administrativa"
          }}</span>
          <h2 id="editor-title">
            {{ editingId ? "Editar proyecto" : "Registrar proyecto" }}
          </h2>
        </div>
        <button
          v-if="editingId"
          class="secondary"
          type="button"
          @click="clearForm"
        >
          Cancelar edición
        </button>
      </div>
      <p>
        El registro se atribuye a la cuenta administrativa activa y comienza En
        revisión. Solo la junta puede cargar proyectos.
      </p>
      <form novalidate @submit.prevent="save">
        <div class="grid">
          <label
            >Título *<input
              ref="titleInput"
              v-model="form.title"
              maxlength="220"
              :aria-invalid="Boolean(errors.title)"
            />
            <small v-if="errors.title" class="error" role="alert">{{
              errors.title
            }}</small></label
          ><label
            >Identificador URL *<input
              v-model="form.slug"
              maxlength="220"
              :aria-invalid="Boolean(errors.slug)"
            /><small v-if="errors.slug" class="error" role="alert">{{
              errors.slug
            }}</small></label
          ><label
            >Tipo *<select v-model="form.type">
              <option value="PROYECTO">Proyecto</option>
              <option value="TESIS">Tesis</option>
            </select></label
          ><label
            >Repositorio URL<input
              v-model="form.repositoryUrl"
              type="url"
              placeholder="https://…"
              :aria-invalid="Boolean(errors.repositoryUrl)"
            /><small v-if="errors.repositoryUrl" class="error" role="alert">{{
              errors.repositoryUrl
            }}</small></label
          ><label
            >Enlace del proyecto<input
              v-model="form.liveUrl"
              type="url"
              placeholder="https://…"
              :aria-invalid="Boolean(errors.liveUrl)"
            /><small v-if="errors.liveUrl" class="error" role="alert">{{
              errors.liveUrl
            }}</small></label
          ><label class="span-two"
            >Descripción *<textarea
              v-model="form.description"
              rows="5"
              :aria-invalid="Boolean(errors.description)"
            ></textarea
            ><small v-if="errors.description" class="error" role="alert">{{
              errors.description
            }}</small></label
          ><label class="span-two"
            >Documento PDF<input
              ref="fileInput"
              type="file"
              accept="application/pdf,.pdf"
              :disabled="uploading || saving"
              @change="uploadPdf"
            /><small
              >PDF hasta 25 MB.
              {{
                pdfName ? `Archivo: ${pdfName}` : "El PDF es opcional."
              }}</small
            ><small v-if="uploading" aria-live="polite"
              >Cargando PDF…</small
            ></label
          >
        </div>
        <label class="sr-only" for="file-id">ID del archivo PDF</label
        ><input
          id="file-id"
          v-model="form.documentFileId"
          class="sr-only"
          tabindex="-1"
          aria-hidden="true"
        />
        <div class="form-actions">
          <button class="primary" type="submit" :disabled="saving || uploading">
            {{
              saving
                ? "Guardando…"
                : editingId
                  ? "Guardar cambios"
                  : "Crear proyecto"
            }}
          </button>
        </div>
      </form>
    </section>
    <AppConfirmModal
      :open="confirm.open"
      :title="confirm.title"
      :message="confirm.message"
      :confirm-label="confirm.label"
      :variant="confirm.variant"
      :loading="confirm.busy"
      @cancel="confirm.open = false"
      @confirm="handleConfirmation"
    />
  </main>
</template>

<style scoped>
.project-admin {
  display: grid;
  gap: 1.25rem;
  min-width: 0;
}
.page-heading,
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}
.page-heading {
  align-items: end;
}
.page-heading h1 {
  font-size: clamp(1.55rem, 4vw, 2.3rem);
  margin: 0.3rem 0;
}
.page-heading p,
.section-heading p,
.editor > p {
  color: var(--color-muted);
  margin: 0.35rem 0 0;
}
.eyebrow {
  color: var(--admin-primary);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}
.panel {
  display: grid;
  gap: 1rem;
  min-width: 0;
  padding: clamp(0.9rem, 3vw, 1.4rem);
  background: #fff;
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 28px rgb(18 31 17 / 5%);
}
h2 {
  margin: 0;
  font-size: clamp(1.15rem, 3vw, 1.5rem);
}
.filters {
  display: grid;
  grid-template-columns: minmax(12rem, 1fr) repeat(2, minmax(10rem, 0.4fr));
  gap: 0.7rem;
  align-items: end;
}
.filters label,
.grid label {
  display: grid;
  gap: 0.4rem;
  font-size: 0.85rem;
  font-weight: 750;
}
.filters input,
.filters select,
.grid input,
.grid select,
.grid textarea {
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  min-height: 2.7rem;
  padding: 0.6rem 0.7rem;
  border: 1px solid var(--admin-border);
  border-radius: var(--radius-sm);
  font: inherit;
}
.grid textarea {
  resize: vertical;
}
.grid input:focus,
.grid select:focus,
.grid textarea:focus,
.filters input:focus,
.filters select:focus {
  outline: 3px solid rgb(23 100 95 / 22%);
  outline-offset: 1px;
}
.grid [aria-invalid="true"] {
  border-color: #a4261b;
}
.table-wrap {
  width: 100%;
  overflow: auto;
}
table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}
th {
  padding: 0.65rem;
  color: #58657a;
  background: #f1f4fc;
  font-size: 0.72rem;
  text-transform: uppercase;
}
td {
  padding: 0.8rem 0.65rem;
  border-top: 1px solid #edf0f6;
  vertical-align: top;
}
td strong,
td small {
  display: block;
}
td small {
  margin-top: 0.2rem;
  color: var(--color-muted);
  font-size: 0.75rem;
  overflow-wrap: anywhere;
}
.pill {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #e7edfb;
  border-radius: 999px;
  font-size: 0.73rem;
  font-weight: 800;
}
.status-select {
  display: block;
  max-width: 10rem;
  margin-top: 0.4rem;
  min-height: 2.3rem;
  border: 1px solid var(--admin-border);
  border-radius: 0.35rem;
  background: #fff;
  font: inherit;
}
.actions {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.35rem;
}
.actions > button {
  white-space: nowrap;
}
.primary,
.secondary,
.danger {
  min-height: 2.65rem;
  padding: 0.55rem 0.8rem;
  border: 1px solid transparent;
  border-radius: 0.4rem;
  font: inherit;
  font-size: 0.82rem;
  font-weight: 800;
  cursor: pointer;
}
.primary {
  background: var(--admin-primary);
  border-color: var(--admin-primary);
  color: #fff;
}
.secondary {
  background: white;
  border-color: var(--admin-border);
  color: var(--admin-primary-dark);
}
.danger {
  background: #fff1f0;
  border-color: #e0aaa4;
  color: #a4261b;
}
button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.pagination,
.pagination > div {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}
.pagination {
  color: var(--color-muted);
  font-size: 0.83rem;
}
.detail .description {
  white-space: pre-wrap;
}
.detail dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.detail dl div {
  min-width: 0;
  padding: 0.7rem;
  background: #f7f8fb;
  border-radius: 0.4rem;
}
.detail dt {
  color: var(--color-muted);
  font-size: 0.75rem;
  font-weight: 800;
}
.detail dd {
  margin: 0.25rem 0 0;
  overflow-wrap: anywhere;
}
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}
.grid label {
  min-width: 0;
}
.grid small {
  color: var(--color-muted);
  font-weight: 400;
}
.grid small.error {
  color: #a4261b;
  font-weight: 700;
}
.span-two {
  grid-column: 1/-1;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 1rem;
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (max-width: 760px) {
  .page-heading,
  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
  .filters,
  .grid {
    grid-template-columns: 1fr;
  }
  .span-two {
    grid-column: auto;
  }
  .table-wrap {
    overflow: visible;
  }
  table,
  tbody,
  tr,
  td {
    display: block;
    width: 100%;
    box-sizing: border-box;
  }
  thead {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0 0 0 0);
  }
  tr {
    padding: 0.7rem 0;
    border-top: 1px solid #edf0f6;
  }
  td {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    gap: 0.6rem;
    padding: 0.4rem 0;
    border: 0;
  }
  td::before {
    content: attr(data-label);
    color: #58657a;
    font-size: 0.68rem;
    font-weight: 900;
    text-transform: uppercase;
  }
  .actions {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.3rem;
  }
  .actions > button {
    min-width: 0;
    padding-inline: 0.3rem;
    font-size: 0.72rem;
  }
  .detail dl {
    grid-template-columns: 1fr;
  }
  .pagination {
    align-items: stretch;
    flex-direction: column;
  }
  .pagination > div {
    justify-content: space-between;
  }
}
@media (max-width: 360px) {
  .panel {
    padding: 0.8rem;
  }
  .page-heading > .primary {
    width: 100%;
  }
  .pagination > div > * {
    min-width: 0;
  }
}
</style>
