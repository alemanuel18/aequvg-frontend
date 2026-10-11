<script setup lang="ts">
import type { ContactMethod } from '~/types/api'
const props = defineProps<{ method: ContactMethod }>()
const embedUrl = computed(() => `https://www.google.com/maps?q=${encodeURIComponent(props.method.value)}&output=embed`)
</script>

<template>
  <section class="location-map" aria-labelledby="location-map-title">
    <div class="location-map__copy">
      <span class="location-map__icon" aria-hidden="true"><AppIcon name="map-pin" :size="24" /></span>
      <div>
        <h2 id="location-map-title">{{ method.label }}</h2>
        <p>{{ method.value }}</p>
        <a :href="method.url || embedUrl" target="_blank" rel="noopener noreferrer">
          Abrir dirección en Google Maps <AppIcon name="arrow-up-right" :size="17" />
        </a>
      </div>
    </div>
    <iframe :src="embedUrl" :title="`Mapa de ${method.value}`" loading="lazy" referrerpolicy="no-referrer-when-downgrade" />
  </section>
</template>

<style scoped>
.location-map { display: grid; grid-template-columns: minmax(14rem, .7fr) minmax(0, 1.3fr); overflow: hidden; border: 1px solid var(--color-border); border-radius: var(--radius-lg); background: white; }
.location-map__copy { display: flex; gap: .9rem; padding: clamp(1.25rem, 3vw, 2rem); }
.location-map__icon { display: grid; width: 3rem; height: 3rem; flex: 0 0 auto; place-items: center; color: white; background: var(--color-primary); border-radius: .9rem; }
.location-map h2 { font-size: 1.45rem; }
.location-map p { margin-top: .5rem; color: var(--color-muted); }
.location-map a { display: inline-flex; align-items: center; gap: .35rem; margin-top: 1rem; color: var(--color-primary); font-weight: 800; text-decoration: none; }
.location-map a:hover, .location-map a:focus-visible { text-decoration: underline; }
.location-map iframe { width: 100%; min-height: 20rem; border: 0; }
@media (max-width: 720px) { .location-map { grid-template-columns: 1fr; } .location-map iframe { min-height: 17rem; } }
</style>
