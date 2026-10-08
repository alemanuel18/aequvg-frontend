<script setup lang="ts">
import { usePublicContentService } from '~/services/public-content'
import { contactMethodIcon, sortContactMethods } from '~/utils/contact-methods'
const service = usePublicContentService()
const { data: methods, status } = await useAsyncData('contact-methods', () => service.contactMethods(), { default: () => [] })
const orderedMethods = computed(() => sortContactMethods(methods.value))
</script>

<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div><strong class="footer-title">AsoQuímica UVG</strong><p>Asociación de Estudiantes de Química de la Universidad del Valle de Guatemala.</p></div>
      <nav aria-label="Enlaces del pie"><strong class="footer-title">Explora</strong><NuxtLink to="/junta-directiva">Junta directiva</NuxtLink><NuxtLink to="/contacto">Contacto</NuxtLink><NuxtLink to="/investigacion">Investigación</NuxtLink></nav>
      <div>
        <strong class="footer-title">Contacto</strong>
        <span v-if="status === 'pending'" class="footer-state" role="status">Cargando medios…</span>
        <template v-else-if="orderedMethods.length">
          <a
            v-for="method in orderedMethods"
            :key="method.id"
            class="footer-contact"
            :href="method.url || undefined"
            :target="method.url?.startsWith('http') ? '_blank' : undefined"
            :rel="method.url?.startsWith('http') ? 'noopener noreferrer' : undefined"
          >
            <AppIcon :name="contactMethodIcon(method)" :size="17" />
            <span>{{ method.value }}</span>
          </a>
        </template>
        <NuxtLink v-else to="/contacto" class="footer-contact"><AppIcon name="mail" :size="17" /> Consultar medios oficiales</NuxtLink>
      </div>
    </div>
    <div class="container footer-bottom"><span>© {{ new Date().getFullYear() }} AsoQuímica UVG</span><span>Contenido sujeto a validación institucional.</span></div>
  </footer>
</template>

<style scoped>
.site-footer {
  color: var(--color-soft);
  background: var(--color-primary-dark);
}

.footer-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr 1.3fr;
  gap: 2rem;
  padding-block: 3rem;
}

.footer-grid > * {
  display: grid;
  align-content: start;
  justify-items: start;
  gap: .45rem;
}

.footer-title {
  color: white;
  font-family: var(--font-display);
  font-size: 1.18rem;
}

.footer-grid p,
.footer-grid a { color: #d9ddd5; }
.footer-grid a { text-decoration: none; }
.footer-grid a:hover,
.footer-grid a:focus-visible { text-decoration: underline; text-decoration-thickness: .08em; }
.footer-contact { display: inline-flex; align-items: flex-start; gap: .45rem; overflow-wrap: anywhere; }
.footer-contact :deep(.app-icon) { margin-top: .15rem; }
.footer-state { color: #d9ddd5; }

.footer-bottom {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-block: 1rem;
  border-top: 1px solid rgb(255 255 255 / 14%);
  font-size: .82rem;
}

@media (max-width: 620px) {
  .footer-grid { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; }
}
</style>
