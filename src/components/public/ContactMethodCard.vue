<script setup lang="ts">
import type { ContactMethod } from '~/types/api'

const props = defineProps<{ method: ContactMethod }>()

const details = {
  EMAIL: { icon: 'mail', description: 'Escríbenos y atenderemos tu consulta.', action: 'Enviar correo' },
  TELEFONO: { icon: 'phone', description: 'Comunícate directamente con la Asociación.', action: 'Llamar ahora' },
  UBICACION: { icon: 'map-pin', description: 'Encuéntranos dentro del campus universitario.', action: 'Ver ubicación' },
  INSTAGRAM: { icon: 'instagram', description: 'Conoce nuestras actividades y novedades.', action: 'Visitar Instagram' },
  FACEBOOK: { icon: 'facebook', description: 'Sigue las noticias de nuestra comunidad.', action: 'Visitar Facebook' },
  OTRO: { icon: 'link', description: 'Consulta este medio oficial de la Asociación.', action: 'Abrir enlace' },
} as const

const detail = computed(() => details[props.method.type])
const opensNewWindow = computed(() => props.method.url?.startsWith('http') ?? false)
</script>

<template>
  <article class="contact-method">
    <div class="contact-method__header">
      <span class="contact-method__icon">
        <AppIcon :name="detail.icon" :size="22" />
      </span>
      <span class="contact-method__label">{{ method.label }}</span>
    </div>
    <strong class="contact-method__value">{{ method.value }}</strong>
    <p class="contact-method__description">{{ detail.description }}</p>
    <a
      v-if="method.url"
      class="contact-method__action"
      :href="method.url"
      :target="opensNewWindow ? '_blank' : undefined"
      :rel="opensNewWindow ? 'noopener noreferrer' : undefined"
    >
      {{ detail.action }}
      <AppIcon name="arrow-up-right" :size="17" />
    </a>
  </article>
</template>
