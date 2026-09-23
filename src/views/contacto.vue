<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
useSeoMeta({ title: 'Contacto', description: 'Consulta los medios oficiales o envía una consulta o solicitud de reunión a AsoQuímica UVG.' })
const service = usePublicContentService()
const { data: methods, status, error } = await useAsyncData('contact-methods', () => service.contactMethods(), { default: () => [] })
</script>
<template>
  <div>
    <PageHero
      eyebrow="Hablemos"
      title="Contacto"
      description="Consulta nuestros medios oficiales o envía una solicitud. Para reuniones, indícanos una fecha tentativa."
    />
    <AppSection title="Comunícate con la Asociación">
      <div class="contact-page-stack">
        <section aria-labelledby="contact-methods-title">
          <h2 id="contact-methods-title" class="sr-only">Medios oficiales</h2>
          <div v-if="methods.length" class="contact-methods">
            <ContactMethodCard v-for="method in methods" :key="method.id" :method="method" />
          </div>
          <StatePanel v-else-if="status === 'pending'" title="Cargando medios" message="Consultando los canales oficiales." />
          <StatePanel v-else-if="error" role="alert" title="Medios no disponibles" message="Puedes utilizar el formulario; no mostraremos datos que no hayan sido validados." />
          <StatePanel v-else title="Sin medios publicados" message="Los canales oficiales están pendientes de validación." />
        </section>
        <section class="contact-form-shell" aria-labelledby="contact-form-title">
          <div class="contact-form-shell__intro">
            <span class="contact-form-shell__icon" aria-hidden="true"><AppIcon name="mail" :size="26" /></span>
            <div>
              <EyebrowBadge text="Formulario de contacto" />
              <h2 id="contact-form-title">Envíanos un mensaje</h2>
              <p>Completa tus datos y cuéntanos cómo podemos ayudarte.</p>
            </div>
          </div>
          <ContactForm />
        </section>
      </div>
    </AppSection>
  </div>
</template>

<style scoped>
.contact-page-stack {
  display: grid;
  gap: 2rem;
}

.contact-methods {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.5rem;
}

.contact-form-shell {
  display: grid;
  grid-template-columns: minmax(13rem, .55fr) minmax(0, 1.45fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  padding: clamp(1.25rem, 4vw, 2.25rem);
  background: var(--color-soft);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
}

.contact-form-shell__intro {
  display: flex;
  align-items: flex-start;
  gap: .9rem;
}

.contact-form-shell__intro h2 {
  margin-top: .85rem;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
}

.contact-form-shell__intro p:last-child {
  margin-top: .75rem;
  color: var(--color-muted);
}

.contact-form-shell__icon {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  flex: 0 0 auto;
  place-items: center;
  color: white;
  background: var(--color-primary);
  border-radius: 1rem;
}

@media (max-width: 900px) {
  .contact-form-shell { grid-template-columns: 1fr; }
}

@media (max-width: 620px) {
  .contact-methods { grid-template-columns: 1fr; }
  .contact-form-shell__intro { flex-direction: column; }
}
</style>
