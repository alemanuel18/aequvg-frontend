<script setup lang="ts">
import type { BlockType } from "~/types/api";
import { usePublicContentService } from "~/services/public-content";

useSeoMeta({
  title: "Inicio",
  description:
    "Conoce la Licenciatura en Química, sus campos laborales, laboratorios, testimonios y plan de estudios.",
});

const service = usePublicContentService();

const {
  data: blocks,
  status,
  error,
  refresh,
} = await useAsyncData(
  "institutional-content",
  () => service.institutionalContent(),
  {
    default: () => [],
  },
);

const { data: featured } = await useAsyncData(
  "featured-content",
  () => service.featuredContent(),
  {
    default: () => ({ news: [], events: [] }),
  },
);

const heroBlock = computed(() => blocks.value.find((b) => b.type === "HERO"));
const labels: Record<BlockType, string> = {
  HERO: "Sobre la carrera",
  CAMPO_LABORAL: "Campo laboral",
  TESTIMONIO: "Testimonio",
  LABORATORIO: "Laboratorio",
  PLAN_ESTUDIOS: "Plan de estudios",
};

// Máximo de 3 anuncios para Conocer la Licenciatura sin importar su categoría
const content = computed(() =>
  blocks.value.filter((block) => block.type !== "HERO").slice(0, 3),
);
const featuredEvents = computed(
  () => featured.value?.events?.slice(0, 3) ?? [],
);
const featuredNews = computed(() => featured.value?.news?.slice(0, 3) ?? []);
</script>

<template>
  <div>
    <!-- Hero / Inicio -->
    <section class="hero">
      <div class="container hero__grid">
        <div class="hero__copy">
          <EyebrowBadge
            :text="heroBlock?.subtitle || '⚛ Asociación de Estudiantes · UVG'"
          />
          <h1>
            {{
              heroBlock?.title ||
              "La química está en todo. Descúbrela con nosotros."
            }}
          </h1>
          <p>
            {{
              heroBlock?.body ||
              "Conecta con una comunidad que fomenta el pensamiento crítico, la innovación y el interés por la química desde el laboratorio hasta su impacto en la vida cotidiana."
            }}
          </p>
          <div class="hero__actions">
            <AppButton :to="heroBlock?.actionUrl || '/contacto'">
              {{ heroBlock?.actionLabel || "Conocer la carrera" }} →
            </AppButton>
            <AppButton to="/investigacion" variant="secondary">
              Explorar investigación
            </AppButton>
          </div>
        </div>
        <ChemistryHeroArt />
      </div>
    </section>

    <!-- Una carrera con impacto -->
    <AppSection
      title="Una carrera con impacto"
      lead="La química abre oportunidades para investigar, innovar y aportar soluciones en múltiples sectores."
      labelled-by="career-impact"
    >
      <div class="cards-grid">
        <ContentCard
          eyebrow="Pensamiento crítico"
          title="Aprender con evidencia"
          body="Analiza, experimenta y resuelve problemas mediante el método científico."
        />
        <ContentCard
          eyebrow="Investigación"
          title="Ciencia que transforma"
          body="Participa en proyectos, laboratorios y espacios de divulgación científica."
        />
        <ContentCard
          eyebrow="Comunidad"
          title="Conexiones reales"
          body="Acércate a estudiantes, docentes, egresados, empresas e instituciones."
        />
      </div>
    </AppSection>

    <!-- Conoce la Licenciatura en Química (máximo 3 anuncios sin importar su categoría) -->
    <AppSection
      title="Conoce la Licenciatura en Química"
      lead="Contenido institucional publicado y validado por la Asociación."
      tone="soft"
      labelled-by="institutional-content"
    >
      <StatePanel
        v-if="status === 'pending'"
        title="Cargando información"
        message="Estamos consultando el contenido institucional."
      />
      <StatePanel
        v-else-if="error"
        role="alert"
        title="No pudimos cargar esta sección"
        message="Verifica tu conexión e inténtalo nuevamente."
      >
        <button @click="() => refresh()">Reintentar</button>
      </StatePanel>
      <div v-else-if="content.length" class="cards-grid">
        <ContentCard
          v-for="block in content"
          :key="block.id"
          :eyebrow="labels[block.type]"
          :title="block.title"
          :body="block.body"
        >
          <a v-if="block.actionUrl" class="card__link" :href="block.actionUrl"
            >{{ block.actionLabel || "Más información" }} →</a
          >
        </ContentCard>
      </div>
      <StatePanel
        v-else
        title="Información en preparación"
        message="La Asociación todavía no ha publicado campos laborales, testimonios, laboratorios o plan de estudios validados."
      />
    </AppSection>

    <!-- Chapter estudiantil ACS UVG -->
    <AppSection
      title="Chapter estudiantil ACS UVG"
      lead="Una comunidad estudiantil para acercar la química a Guatemala y conectar con la comunidad científica internacional."
      tone="dark"
      labelled-by="acs-chapter"
    >
      <div class="cards-grid acs-grid">
        <ContentCard
          eyebrow="Divulgación y servicio"
          body="Organizamos talleres, demostraciones y actividades para acercar la química a más personas."
        />
        <ContentCard
          eyebrow="Formación profesional"
          body="Impulsamos habilidades de liderazgo y comunicación, y el encuentro con científicos y profesionales."
        />
        <ContentCard
          eyebrow="Química verde"
          body="Promovemos una práctica de la química atenta a sus impactos ambientales."
        />
      </div>
      <div class="acs-invitation">
        <div>
          <p class="acs-network">ACS · American Chemical Society</p>
          <h3>¡Sé parte del Chapter!</h3>
          <p>Conoce nuevas experiencias, desarrolla tus habilidades y conecta con capítulos estudiantiles en todo el mundo.</p>
          <p class="acs-presence">ACS tiene presencia de miembros en 143 países y capítulos estudiantiles en 28 países.</p>
        </div>
        <a class="acs-contact" href="mailto:químicapura@uvg.edu.gt">
          Escríbenos a químicapura@uvg.edu.gt <span aria-hidden="true">→</span>
        </a>
      </div>
    </AppSection>

    <!-- Eventos destacados (máximo 3) -->
    <AppSection
      v-if="featuredEvents.length > 0"
      title="Eventos destacados"
      lead="Próximas actividades, talleres y encuentros organizados por la Asociación."
      labelled-by="featured-events"
    >
      <div class="cards-grid">
        <EventCard
          v-for="event in featuredEvents"
          :key="event.id"
          :event="event"
        />
      </div>
      <div class="section-actions">
        <AppButton to="/eventos" variant="secondary"
          >Ver todos los eventos →</AppButton
        >
      </div>
    </AppSection>

    <!-- Noticias destacadas (máximo 3) -->
    <AppSection
      v-if="featuredNews.length > 0"
      title="Noticias destacadas"
      lead="Comunicados, iniciativas y anuncios recientes para la comunidad de Química."
      tone="soft"
      labelled-by="featured-news"
    >
      <div class="cards-grid">
        <NewsCard v-for="item in featuredNews" :key="item.id" :news="item" />
      </div>
      <div class="section-actions">
        <AppButton to="/noticias" variant="secondary"
          >Ver todas las noticias →</AppButton
        >
      </div>
    </AppSection>

    <!-- Contactar a la Asociación -->
    <AppSection
      title="¿Quieres saber más?"
      lead="Escríbenos o solicita una reunión con la Asociación para conversar sobre la carrera."
      tone="dark"
    >
      <AppButton to="/contacto" variant="secondary"
        >Contactar a la Asociación</AppButton
      >
    </AppSection>
  </div>
</template>

<style scoped>
.hero {
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 22%, rgb(168 184 154 / 42%), transparent 28%),
    radial-gradient(circle at 90% 10%, rgb(45 74 43 / 14%), transparent 28%);
  border-bottom: 1px solid var(--color-border);
}

.hero__grid {
  display: grid;
  grid-template-columns: 1.05fr 0.95fr;
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
  gap: 0.75rem;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.card__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.75rem;
  color: var(--color-primary);
  font-weight: 700;
  text-decoration: none;
}

.card__link:hover {
  text-decoration: underline;
}

.section-actions {
  display: flex;
  justify-content: center;
  margin-top: 1.75rem;
}

.acs-grid {
  margin-bottom: 2rem;
}

.acs-grid :deep(.card) {
  gap: 0.55rem;
}

.acs-invitation {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  padding: 1.5rem;
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: var(--radius-md);
  background: rgb(255 255 255 / 8%);
}

.acs-invitation h3,
.acs-invitation p {
  margin: 0;
}

.acs-invitation h3 {
  margin-block: 0.35rem;
  font-size: 1.35rem;
}

.acs-network {
  font-size: 0.82rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.acs-presence {
  margin-top: 0.7rem !important;
  color: var(--color-soft);
  font-size: 0.9rem;
}

.acs-contact {
  flex: 0 0 auto;
  color: white;
  font-weight: 800;
  text-underline-offset: 0.2em;
}

.acs-contact:focus-visible {
  outline: 3px solid white;
  outline-offset: 4px;
}

@media (max-width: 900px) {
  .hero__grid {
    grid-template-columns: 1fr;
  }
  .cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .hero__grid {
    padding-block: 3.5rem;
  }
  .cards-grid {
    grid-template-columns: 1fr;
  }
  .acs-invitation {
    align-items: flex-start;
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
