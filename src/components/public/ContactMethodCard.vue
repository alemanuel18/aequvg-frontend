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

<style scoped>
.contact-method {
  position: relative;
  overflow: hidden;
  display: flex;
  min-width: 0;
  min-height: 15.5rem;
  flex-direction: column;
  align-items: flex-start;
  padding: 1.55rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 9px 24px rgb(26 43 24 / 7%);
  transition: transform .2s ease, border-color .2s ease, box-shadow .2s ease;
}

.contact-method::after { position: absolute; top: -3rem; right: -3rem; z-index: 0; width: 8rem; height: 8rem; content: ""; background: var(--color-soft); border-radius: 50%; }
.contact-method:hover { transform: translateY(-3px); border-color: var(--color-accent); box-shadow: 0 15px 32px rgb(26 43 24 / 11%); }
.contact-method__header { position: relative; z-index: 1; display: flex; align-items: center; gap: .7rem; }
.contact-method__icon { display: grid; width: 2.75rem; height: 2.75rem; place-items: center; color: white; background: var(--color-primary); border-radius: .85rem; box-shadow: 0 7px 16px rgb(45 74 43 / 20%); }
.contact-method__label { color: var(--color-primary); font-size: .76rem; font-weight: 850; letter-spacing: .07em; text-transform: uppercase; }
.contact-method__value { position: relative; z-index: 1; margin-top: 1.15rem; overflow-wrap: anywhere; font-family: var(--font-display); font-size: clamp(1.22rem, 2vw, 1.55rem); line-height: 1.2; }
.contact-method__description { position: relative; z-index: 1; margin-top: .55rem; color: var(--color-muted); font-size: .92rem; }
.contact-method__action { position: relative; z-index: 1; display: inline-flex; align-items: center; gap: .4rem; margin-top: auto; padding-top: 1rem; color: var(--color-primary); font-size: .88rem; font-weight: 800; text-decoration: none; }
.contact-method__action:hover { text-decoration: underline; }

@media (max-width: 620px) {
  .contact-method { min-height: 14rem; }
}
</style>
