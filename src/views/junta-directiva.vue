<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
useSeoMeta({ title: 'Junta directiva', description: 'Conoce a quienes integran la junta directiva de AsoQuímica UVG.' })
const service = usePublicContentService()
const { data: members, status, error, refresh } = await useAsyncData('board-members', () => service.boardMembers(), { default: () => [] })
</script>
<template>
  <div>
    <PageHero
      eyebrow="Nuestra Asociación"
      title="Junta directiva"
      description="Conoce a las personas que representan a la comunidad estudiantil y los medios autorizados para comunicarte con ellas."
    />
    <AppSection title="Integrantes actuales" lead="Los datos mostrados corresponden únicamente a integrantes activos publicados por la Asociación.">
      <StatePanel v-if="status === 'pending'" title="Cargando junta directiva" message="Consultando la información vigente." />
      <StatePanel v-else-if="error" role="alert" title="No pudimos cargar la junta" message="Intenta nuevamente en unos momentos.">
        <button @click="() => refresh()">Reintentar</button>
      </StatePanel>
      <div v-else-if="members.length" class="member-grid">
        <BoardMemberCard v-for="member in members" :key="member.id" :member="member" />
      </div>
      <StatePanel v-else title="Sin integrantes publicados" message="La Asociación aún no ha validado y publicado la integración vigente." />
    </AppSection>
  </div>
</template>

<style scoped>
.member-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

@media (max-width: 900px) {
  .member-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 620px) {
  .member-grid { grid-template-columns: 1fr; }
}
</style>
