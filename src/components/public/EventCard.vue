<script setup lang="ts">
import type { PublicEvent } from '~/types/api'

defineProps<{ event: PublicEvent }>()

const formatEventDate = (value: string) => {
  try {
    return new Intl.DateTimeFormat('es-GT', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'America/Guatemala'
    }).format(new Date(value))
  } catch {
    return 'Fecha por confirmar'
  }
}
</script>

<template>
  <article class="event-card">
    <div class="event-card__media" aria-hidden="true">
      <div class="event-card__badge-deco"></div>
      <span class="event-card__tag">▣ Actividad</span>
    </div>
    <div class="event-card__body">
      <time :datetime="event.startsAt">{{ formatEventDate(event.startsAt) }}</time>
      <div class="event-card__location">📍 {{ event.location }}</div>
      <h3>
        <NuxtLink :to="`/eventos/${event.id}`">{{ event.name }}</NuxtLink>
      </h3>
      <p>{{ event.description }}</p>
      <NuxtLink
        class="event-card__link"
        :to="`/eventos/${event.id}`"
        :aria-label="`Ver evento: ${event.name}`"
      >
        Ver evento <span aria-hidden="true">→</span>
      </NuxtLink>
    </div>
  </article>
</template>

<style scoped>
.event-card {
  display: grid;
  min-width: 0;
  overflow: hidden;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 25px rgb(26 43 24 / 6%);
}

.event-card__media {
  position: relative;
  min-height: 9rem;
  overflow: hidden;
  background: linear-gradient(135deg, var(--color-primary), #436b41 55%, #6a9167);
}

.event-card__media::before,
.event-card__media::after {
  position: absolute;
  width: 9rem;
  height: 9rem;
  content: '';
  border: .45rem solid rgb(255 255 255 / 15%);
  border-radius: 50%;
}

.event-card__media::before {
  top: -3rem;
  left: -2rem;
}

.event-card__media::after {
  right: -2rem;
  bottom: -3rem;
}

.event-card__badge-deco {
  position: absolute;
  bottom: 1rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  border: 2px solid rgb(255 255 255 / 40%);
  border-radius: var(--radius-sm);
  transform: rotate(45deg);
}

.event-card__tag {
  position: absolute;
  top: 1rem;
  left: 1rem;
  padding: .25rem .55rem;
  color: white;
  background: var(--color-primary-dark);
  font-size: .85rem;
  font-weight: 800;
  border-radius: var(--radius-sm);
}

.event-card__body {
  display: grid;
  gap: .65rem;
  padding: 1.35rem 1.45rem 1.5rem;
}

.event-card time {
  color: var(--color-primary);
  font-size: .88rem;
  font-weight: 700;
}

.event-card__location {
  color: var(--color-muted);
  font-size: .86rem;
}

.event-card h3 {
  margin: 0;
  font-size: 1.25rem;
  display: -webkit-box;
  overflow: hidden;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.event-card h3 a {
  color: var(--color-ink);
  text-decoration: none;
}

.event-card h3 a:hover {
  text-decoration: underline;
}

.event-card p {
  margin: 0;
  display: -webkit-box;
  overflow: hidden;
  color: var(--color-muted);
  font-size: .95rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.event-card__link {
  width: fit-content;
  margin-top: .4rem;
  color: var(--color-primary);
  font-weight: 800;
  text-decoration: none;
}

.event-card__link:hover {
  text-decoration: underline;
}
</style>
