<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
useSeoMeta({ title: 'Contacto', description: 'Consulta los medios oficiales o envía una consulta o solicitud de reunión a AsoQuímica UVG.' })
const service = usePublicContentService()
const { data: methods, status, error } = await useAsyncData('contact-methods', () => service.contactMethods(), { default: () => [] })
</script>
<template>
  <div>
    <header class="page-hero">
      <div class="container">
        <span class="eyebrow">Hablemos</span>
        <h1>Contacto</h1>
        <p>Consulta nuestros medios oficiales o envía una solicitud. Para reuniones, indícanos una fecha tentativa.</p>
      </div>
    </header>
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
              <p class="eyebrow">Formulario de contacto</p>
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
