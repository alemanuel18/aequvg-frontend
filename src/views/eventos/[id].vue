<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'

const route = useRoute()
const id = Number(route.params.id)

if (!Number.isSafeInteger(id) || id < 1) {
  throw createError({ statusCode: 404, statusMessage: 'Evento no encontrado' })
}

const service = usePublicContentService()
const { data: event, status, error, refresh } = await useAsyncData(
  `public-event-${id}`,
  () => service.eventById(id),
  { default: () => null }
)

if (error.value) {
  const err = error.value as { status?: number; statusCode?: number; code?: string }
  const isNotFound = err?.status === 404 || err?.statusCode === 404 || err?.code === 'EVENT_NOT_FOUND'
  if (isNotFound) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Evento no encontrado',
      fatal: true
    })
  }
}

useSeoMeta({
  title: () => event.value?.name || 'Evento',
  description: () => event.value?.description || 'Consulta la información de este evento de AsoQuímica UVG.'
})

const mounted = ref(false)

onMounted(() => {
  mounted.value = true
})

const isEventPast = computed(() => {
  if (!mounted.value || !event.value?.startsAt) return false
  const time = new Date(event.value.startsAt).getTime()
  return !Number.isNaN(time) && time <= Date.now()
})

const localAvailableCapacity = ref<number | null>(null)

watch(
  () => event.value?.availableCapacity,
  (val) => {
    if (typeof val === 'number') {
      localAvailableCapacity.value = val
    }
  },
  { immediate: true }
)

const currentAvailableCapacity = computed(() => {
  return localAvailableCapacity.value ?? event.value?.availableCapacity ?? 0
})

const isFull = computed(() => {
  return currentAvailableCapacity.value <= 0
})

const onEventFull = () => {
  localAvailableCapacity.value = 0
}

const formatEventDate = (value: string | null | undefined) => {
  if (!value) return 'Fecha por confirmar'
  try {
    return new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Guatemala'
    }).format(new Date(value))
  } catch {
    return value
  }
}
</script>

<template>
  <div>
    <PageHero
      eyebrow="Agenda y actividades"
      title="Detalle del Evento"
      description="Información de la actividad organizada por AsoQuímica UVG."
    />
    <AppSection title="Información de la actividad">
      <StatePanel
        v-if="status === 'pending'"
        title="Cargando evento"
        message="Consultando la información del evento."
      />
      <StatePanel
        v-else-if="error"
        role="alert"
        title="No pudimos cargar la información del evento"
        message="Ocurrió un error al obtener la información de la actividad. Por favor intenta de nuevo."
      >
        <AppButton to="/eventos" variant="secondary">Volver a eventos</AppButton>
        <button @click="() => refresh()">Reintentar</button>
      </StatePanel>
      <div v-else-if="event" class="event-detail-wrapper">
        <article class="event-detail">
          <div class="event-detail__meta">
            <time :datetime="event.startsAt">📅 {{ formatEventDate(event.startsAt) }}</time>
            <span class="event-detail__location">📍 {{ event.location }}</span>
          </div>
          <h1>{{ event.name }}</h1>
          <div class="event-detail__capacity">
            <div class="capacity-item">
              <span class="capacity-label">Capacidad máxima:</span>
              <span class="capacity-value">{{ event.maximumCapacity }} asistentes</span>
            </div>
            <div class="capacity-item capacity-availability" aria-live="polite">
              <span class="capacity-label">Disponibilidad:</span>
              <span v-if="isEventPast" class="availability-status availability-status--closed">
                Este evento ya inició. Las inscripciones se encuentran cerradas.
              </span>
              <span v-else-if="isFull" class="availability-status availability-status--full">
                Cupo lleno
              </span>
              <span v-else class="availability-status availability-status--available">
                {{ currentAvailableCapacity === 1 ? '1 cupo disponible' : `${currentAvailableCapacity} cupos disponibles` }}
              </span>
            </div>
          </div>
          <div class="event-detail__description">
            {{ event.description }}
          </div>
          <div v-if="event.additionalInformation" class="event-detail__additional">
            <h3>Información adicional</h3>
            <p>{{ event.additionalInformation }}</p>
          </div>
          <div class="event-detail__actions">
            <AppButton
              v-if="!isEventPast && !isFull"
              href="#formulario-inscripcion"
              variant="primary"
            >
              Inscribirme a este evento ↓
            </AppButton>
            <AppButton to="/eventos" variant="secondary">← Ver todos los eventos</AppButton>
          </div>
        </article>

        <section
          id="formulario-inscripcion"
          class="event-registration-section"
          aria-labelledby="registration-heading"
        >
          <EventRegistrationForm
            :event-id="event.id"
            :event-name="event.name"
            :starts-at="event.startsAt"
            :available-capacity="currentAvailableCapacity"
            @full="onEventFull"
          />
        </section>
      </div>
    </AppSection>
  </div>
</template>

<style scoped>
.event-detail-wrapper {
  display: grid;
  gap: 2rem;
  max-width: 52rem;
  margin-inline: auto;
}

.event-detail {
  display: grid;
  gap: 1.4rem;
  width: 100%;
  padding: clamp(1.25rem, 4vw, 2.5rem);
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow);
}

.event-detail__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  color: var(--color-muted);
  font-size: .95rem;
  font-weight: 600;
}

.event-detail__meta time {
  color: var(--color-primary);
}

.event-detail h1 {
  margin: 0;
  font-size: clamp(2rem, 5vw, 3.2rem);
  color: var(--color-ink);
  line-height: 1.2;
}

.event-detail__capacity {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: .85rem 1.15rem;
  background: var(--color-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: .95rem;
}

.capacity-item {
  display: flex;
  align-items: center;
  gap: .5rem;
}

.capacity-label {
  font-weight: 800;
  color: var(--color-ink);
}

.capacity-value {
  color: var(--color-primary);
  font-weight: 700;
}

.availability-status {
  font-weight: 700;
  padding: .2rem .55rem;
  border-radius: var(--radius-sm);
  font-size: .9rem;
}

.availability-status--available {
  color: #1e5922;
  background: #eef7ee;
  border: 1px solid #c2e2c2;
}

.availability-status--full {
  color: #9c2727;
  background: #fdf0f0;
  border: 1px solid #f5c2c2;
}

.availability-status--closed {
  color: var(--color-muted);
  background: #f0f0f0;
  border: 1px solid var(--color-border);
}

.event-detail__description {
  white-space: pre-line;
  font-size: 1.08rem;
  line-height: 1.65;
  color: var(--color-ink);
}

.event-detail__additional {
  padding: 1.25rem;
  background: #fbf9f5;
  border-left: 4px solid var(--color-primary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.event-detail__additional h3 {
  margin: 0 0 .5rem;
  font-size: 1.05rem;
  color: var(--color-primary);
}

.event-detail__additional p {
  margin: 0;
  white-space: pre-line;
  color: var(--color-muted);
  font-size: .95rem;
  line-height: 1.55;
}

.event-detail__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-top: .5rem;
}

@media (max-width: 620px) {
  .event-detail {
    padding: 1.25rem;
  }
}
</style>
