<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
useSeoMeta({ title: 'Junta Directiva', description: 'Conoce la integración actual y el historial de la Junta Directiva de AsoQuímica UVG.' })
const service = usePublicContentService()
const { data: members, status, error, refresh } = await useAsyncData('board-members', () => service.boardMembers(), { default: () => [] })
const terms = computed(() => [...new Set(members.value.map(member => member.term))])
const selectedTerm = ref(terms.value[0] ?? '')
const ready = ref(false)
onMounted(() => { ready.value = true })
watch(terms, value => {
  if (!value.length) selectedTerm.value = ''
  else if (!value.includes(selectedTerm.value)) selectedTerm.value = value[0]!
}, { immediate: true })
const visibleMembers = computed(() => members.value.filter(member => member.term === selectedTerm.value))
</script>
<template>
  <div>
    <PageHero
      eyebrow="Nuestra Asociación"
      title="Junta Directiva"
      description="Consulta a las personas que representan o representaron a la comunidad estudiantil en cada periodo."
    />
    <AppSection title="Integrantes por periodo" lead="Selecciona un periodo para consultar la integración publicada de la Junta Directiva.">
      <StatePanel v-if="status === 'pending'" title="Cargando Junta Directiva" message="Consultando los periodos publicados." />
      <StatePanel v-else-if="error" role="alert" title="No pudimos cargar la junta" message="Intenta nuevamente en unos momentos.">
        <button @click="() => refresh()">Reintentar</button>
      </StatePanel>
      <template v-else-if="members.length">
        <div class="term-selector">
          <label for="board-term">Periodo de la Junta Directiva</label>
          <select id="board-term" v-model="selectedTerm" :disabled="!ready">
            <option v-for="term in terms" :key="term" :value="term">{{ term }}</option>
          </select>
        </div>
        <p class="term-summary" role="status">Mostrando {{ visibleMembers.length }} {{ visibleMembers.length === 1 ? 'integrante' : 'integrantes' }} del periodo {{ selectedTerm }}.</p>
        <div class="member-grid">
          <BoardMemberCard v-for="member in visibleMembers" :key="member.id" :member="member" />
        </div>
      </template>
      <StatePanel v-else title="Sin integrantes publicados" message="La Asociación aún no ha publicado juntas directivas." />
    </AppSection>
  </div>
</template>

<style scoped>
.member-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}
.term-selector { display: grid; width: min(24rem, 100%); gap: .4rem; margin-bottom: .75rem; }
.term-selector label { font-weight: 800; }
.term-selector select { min-height: 2.8rem; padding: .65rem .75rem; color: var(--color-ink); background: white; border: 1px solid #87948a; border-radius: var(--radius-sm); }
.term-summary { margin-bottom: 1.25rem; color: var(--color-muted); }

@media (max-width: 900px) {
  .member-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 620px) {
  .member-grid { grid-template-columns: 1fr; }
}
</style>
