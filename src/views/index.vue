<script setup lang="ts">
import type { BlockType } from '~/types/api'
import { usePublicContentService } from '~/services/public-content'
useSeoMeta({ title: 'Inicio', description: 'Conoce la Licenciatura en Química, sus campos laborales, laboratorios, testimonios y plan de estudios.' })
const service = usePublicContentService()
const { data: blocks, status, error, refresh } = await useAsyncData('institutional-content', () => service.institutionalContent(), { default: () => [] })
const labels: Record<BlockType, string> = { HERO: 'Sobre la carrera', CAMPO_LABORAL: 'Campo laboral', TESTIMONIO: 'Testimonio', LABORATORIO: 'Laboratorio', PLAN_ESTUDIOS: 'Plan de estudios' }
const content = computed(() => blocks.value.filter(block => block.type !== 'HERO'))
</script>
<template>
  <div>
    <section class="hero"><div class="container hero__grid"><div class="hero__copy"><EyebrowBadge text="⚛ Asociación de Estudiantes · UVG" /><h1>La química está en todo. Descúbrela con nosotros.</h1><p>Conecta con una comunidad que fomenta el pensamiento crítico, la innovación y el interés por la química desde el laboratorio hasta su impacto en la vida cotidiana.</p><div class="hero__actions"><AppButton to="/contacto">Conocer la carrera →</AppButton><AppButton to="/investigacion" variant="secondary">Explorar investigación</AppButton></div></div><ChemistryHeroArt /></div></section>
    <AppSection title="Una carrera con impacto" lead="La química abre oportunidades para investigar, innovar y aportar soluciones en múltiples sectores." labelled-by="career-impact">
      <div class="cards-grid"><ContentCard eyebrow="Pensamiento crítico" title="Aprender con evidencia" body="Analiza, experimenta y resuelve problemas mediante el método científico."/><ContentCard eyebrow="Investigación" title="Ciencia que transforma" body="Participa en proyectos, laboratorios y espacios de divulgación científica."/><ContentCard eyebrow="Comunidad" title="Conexiones reales" body="Acércate a estudiantes, docentes, egresados, empresas e instituciones."/></div>
    </AppSection>
    <AppSection title="Conoce la Licenciatura en Química" lead="Contenido institucional publicado y validado por la Asociación." tone="soft" labelled-by="institutional-content">
      <StatePanel v-if="status === 'pending'" title="Cargando información" message="Estamos consultando el contenido institucional." />
      <StatePanel v-else-if="error" role="alert" title="No pudimos cargar esta sección" message="Verifica tu conexión e inténtalo nuevamente."><button @click="() => refresh()">Reintentar</button></StatePanel>
      <div v-else-if="content.length" class="cards-grid"><ContentCard v-for="block in content" :key="block.id" :eyebrow="labels[block.type]" :title="block.title" :body="block.body"><a v-if="block.actionUrl" class="card__link" :href="block.actionUrl">{{ block.actionLabel || 'Más información' }} →</a></ContentCard></div>
      <StatePanel v-else title="Información en preparación" message="La Asociación todavía no ha publicado campos laborales, testimonios, laboratorios o plan de estudios validados." />
    </AppSection>
    <AppSection title="¿Quieres saber más?" lead="Escríbenos o solicita una reunión con la Asociación para conversar sobre la carrera." tone="dark"><AppButton to="/contacto" variant="secondary">Contactar a la Asociación</AppButton></AppSection>
  </div>
</template>

<style scoped>
.hero {
  overflow: hidden;
  background: radial-gradient(circle at 12% 22%, rgb(168 184 154 / 42%), transparent 28%), radial-gradient(circle at 90% 10%, rgb(45 74 43 / 14%), transparent 28%);
  border-bottom: 1px solid var(--color-border);
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.05fr .95fr;
  align-items: center;
  gap: 3rem;
  padding-block: clamp(4rem, 9vw, 7rem);
}

.hero__copy {
  display: grid;
  justify-items: start;
  gap: 1.4rem;
}

.hero__copy p {
  max-width: 42rem;
  color: var(--color-muted);
  font-size: clamp(1rem, 2vw, 1.17rem);
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: .75rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 900px) {
  .hero__grid { grid-template-columns: 1fr; }
  .cards-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 620px) {
  .hero__grid { padding-block: 3.5rem; }
  .cards-grid { grid-template-columns: 1fr; }
}
</style>
