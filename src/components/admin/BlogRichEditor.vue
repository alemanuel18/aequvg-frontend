<script setup lang="ts">
import type { AdminNewsImage } from '~/types/api'

const props = defineProps<{
  modelValue: string
  images: AdminNewsImage[]
  imageUrl: (id: number) => string
  uploadImage: (file: File) => Promise<AdminNewsImage>
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const editor = ref<HTMLDivElement | null>(null)
const imageInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
let savedRange: Range | null = null
const tags = new Set(['p', 'div', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'hr', 'img'])

const cleanHtml = (html: string, withImageSources: boolean) => {
  if (!import.meta.client) return html
  const parsed = new DOMParser().parseFromString(html, 'text/html')
  const cleanNode = (node: Node): Node[] => {
    if (node.nodeType === Node.TEXT_NODE) return [document.createTextNode(node.textContent ?? '')]
    if (!(node instanceof HTMLElement)) return []
    const tag = node.tagName.toLowerCase()
    if (!tags.has(tag)) return [...node.childNodes].flatMap(cleanNode)
    if (tag === 'img') {
      const id = Number(node.getAttribute('data-image-id'))
      if (!Number.isSafeInteger(id) || id < 1) return []
      const image = document.createElement('img')
      image.dataset.imageId = String(id)
      image.alt = (node.getAttribute('alt') ?? '').slice(0, 300)
      if (withImageSources && props.images.some(item => item.id === id)) image.src = props.imageUrl(id)
      return [image]
    }
    const element = document.createElement(tag)
    if (['p', 'div', 'h1', 'h2', 'h3'].includes(tag)) {
      const align = node.style.textAlign
      if (['left', 'right', 'center', 'justify'].includes(align)) element.style.textAlign = align
    }
    for (const child of [...node.childNodes]) for (const cleanChild of cleanNode(child)) element.append(cleanChild)
    return [element]
  }
  const output = document.createElement('div')
  for (const child of [...parsed.body.childNodes]) for (const cleanChild of cleanNode(child)) output.append(cleanChild)
  return output.innerHTML
}
const canonicalHtml = (value: string) => cleanHtml(value, false)
const renderHtml = (value: string) => cleanHtml(value, true)
const rememberSelection = () => {
  const selection = window.getSelection()
  if (!selection?.rangeCount || !editor.value?.contains(selection.anchorNode)) return
  savedRange = selection.getRangeAt(0).cloneRange()
}
const restoreSelection = () => {
  if (!editor.value) return
  editor.value.focus()
  const selection = window.getSelection()
  if (!selection) return
  selection.removeAllRanges()
  if (savedRange && editor.value.contains(savedRange.commonAncestorContainer)) selection.addRange(savedRange)
  else {
    const range = document.createRange()
    range.selectNodeContents(editor.value)
    range.collapse(false)
    selection.addRange(range)
  }
}
const applyCommand = (command: string, value?: string) => {
  restoreSelection()
  document.execCommand(command, false, value)
  rememberSelection()
  emit('update:modelValue', canonicalHtml(editor.value?.innerHTML ?? ''))
}
const applyBlock = (event: Event) => {
  const tag = (event.target as HTMLSelectElement).value
  if (tag) applyCommand('formatBlock', `<${tag}>`)
}
const onInput = () => emit('update:modelValue', canonicalHtml(editor.value?.innerHTML ?? ''))
const insertUploadedImage = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const image = await props.uploadImage(file)
    restoreSelection()
    const node = document.createElement('img')
    node.dataset.imageId = String(image.id)
    node.src = props.imageUrl(image.id)
    node.alt = image.originalName
    const selection = window.getSelection()
    if (selection?.rangeCount) {
      const range = selection.getRangeAt(0)
      range.deleteContents()
      range.insertNode(node)
      range.setStartAfter(node)
      range.collapse(true)
      selection.removeAllRanges()
      selection.addRange(range)
      savedRange = range.cloneRange()
    } else editor.value?.append(node)
    onInput()
  } catch {
    // El componente padre comunica el error de carga al usuario.
  } finally {
    uploading.value = false
    if (imageInput.value) imageInput.value.value = ''
  }
}
watch(() => props.modelValue, () => {
  if (!editor.value) return
  if (canonicalHtml(editor.value.innerHTML) !== canonicalHtml(props.modelValue)) editor.value.innerHTML = renderHtml(props.modelValue)
})
watch(() => props.images.map(image => image.id), () => {
  if (!editor.value) return
  for (const image of editor.value.querySelectorAll<HTMLImageElement>('img[data-image-id]')) {
    const id = Number(image.dataset.imageId)
    const available = props.images.some(item => item.id === id)
    if (available) image.src = props.imageUrl(id)
    else image.removeAttribute('src')
  }
})
onMounted(() => { if (editor.value) editor.value.innerHTML = renderHtml(props.modelValue) })
</script>

<template>
  <section class="rich-editor" aria-label="Editor de contenido">
    <div class="toolbar" role="toolbar" aria-label="Formato del contenido">
      <label class="format-picker"><span>Estilo</span><select aria-label="Jerarquía de título" @mousedown="rememberSelection" @change="applyBlock"><option value="p">Párrafo</option><option value="h1">Título 1</option><option value="h2">Título 2</option><option value="h3">Título 3</option></select></label>
      <button type="button" aria-label="Negrita" title="Negrita" @mousedown.prevent="rememberSelection" @click="applyCommand('bold')"><strong>B</strong></button>
      <button type="button" aria-label="Cursiva" title="Cursiva" @mousedown.prevent="rememberSelection" @click="applyCommand('italic')"><em>I</em></button>
      <button type="button" aria-label="Subrayado" title="Subrayado" @mousedown.prevent="rememberSelection" @click="applyCommand('underline')"><u>U</u></button>
      <span class="toolbar-divider" aria-hidden="true"></span>
      <button type="button" aria-label="Alinear a la izquierda" title="Alinear a la izquierda" @mousedown.prevent="rememberSelection" @click="applyCommand('justifyLeft')">☰<span class="sr-only">Izquierda</span></button>
      <button type="button" aria-label="Centrar" title="Centrar" @mousedown.prevent="rememberSelection" @click="applyCommand('justifyCenter')">☷<span class="sr-only">Centro</span></button>
      <button type="button" aria-label="Alinear a la derecha" title="Alinear a la derecha" @mousedown.prevent="rememberSelection" @click="applyCommand('justifyRight')">☰<span class="sr-only">Derecha</span></button>
      <button type="button" aria-label="Justificar" title="Justificar" @mousedown.prevent="rememberSelection" @click="applyCommand('justifyFull')">▤<span class="sr-only">Justificar</span></button>
      <span class="toolbar-divider" aria-hidden="true"></span>
      <button type="button" :disabled="uploading" @mousedown.prevent="rememberSelection" @click="imageInput?.click()">{{ uploading ? 'Subiendo…' : '＋ Imagen' }}</button>
      <input ref="imageInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/gif,image/webp" aria-label="Subir e insertar imagen" @change="insertUploadedImage">
    </div>
    <div ref="editor" class="editable" contenteditable="true" role="textbox" aria-label="Contenido de la entrada" aria-multiline="true" @mouseup="rememberSelection" @keyup="rememberSelection" @input="onInput"></div>
    <p class="editor-hint">Selecciona texto y aplica formato. Las imágenes se cargarán en el contenido de la entrada.</p>
  </section>
</template>

<style scoped>
.rich-editor{min-width:0;border:1px solid var(--color-border);border-radius:.5rem;overflow:hidden}.toolbar{display:flex;align-items:center;gap:.35rem;flex-wrap:wrap;padding:.5rem;background:var(--color-soft);border-bottom:1px solid var(--color-border)}.toolbar button,.format-picker select{min-height:2.25rem;padding:.4rem .6rem;border:1px solid var(--color-border);border-radius:.35rem;background:white;color:var(--color-ink);font:inherit;cursor:pointer}.toolbar button:disabled{opacity:.55;cursor:wait}.format-picker{display:flex;align-items:center;gap:.4rem;padding-inline:.25rem;font-size:.82rem;font-weight:650}.toolbar-divider{width:1px;height:1.5rem;margin-inline:.25rem;background:var(--color-border)}.editable{min-height:20rem;padding:1rem;outline:none;line-height:1.65;overflow-wrap:anywhere}.editable:focus{box-shadow:inset 0 0 0 2px var(--color-primary)}.editable :deep(img){display:block;max-width:100%;max-height:34rem;object-fit:contain;margin:1rem 0}.editable :deep(h1){font-size:2rem}.editable :deep(h2){font-size:1.65rem}.editable :deep(h3){font-size:1.35rem}.editor-hint{margin:0;padding:.5rem .8rem;border-top:1px solid var(--color-border);font-size:.82rem;color:var(--color-muted)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
</style>
