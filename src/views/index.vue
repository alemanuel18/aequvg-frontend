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
    <section class="hero"><div class="container hero__grid"><div class="hero__copy"><span class="eyebrow">⚛ Asociación de Estudiantes · UVG</span><h1>La química está en todo. Descúbrela con nosotros.</h1><p>Conecta con una comunidad que fomenta el pensamiento crítico, la innovación y el interés por la química desde el laboratorio hasta su impacto en la vida cotidiana.</p><div class="hero__actions"><AppButton to="/contacto">Conocer la carrera →</AppButton><AppButton to="/investigacion" variant="secondary">Explorar investigación</AppButton></div></div><ChemistryHeroArt /></div></section>
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
