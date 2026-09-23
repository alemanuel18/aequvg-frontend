<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <div><strong class="footer-title">AsoQuímica UVG</strong><p>Asociación de Estudiantes de Química de la Universidad del Valle de Guatemala.</p></div>
      <nav aria-label="Enlaces del pie"><strong class="footer-title">Explora</strong><NuxtLink to="/junta-directiva">Junta directiva</NuxtLink><NuxtLink to="/contacto">Contacto</NuxtLink><NuxtLink to="/investigacion">Investigación</NuxtLink></nav>
      <div><strong class="footer-title">Contacto</strong><a href="mailto:asoquimica@uvg.edu.gt">asoquimica@uvg.edu.gt</a><a href="tel:+50223688000">+502 2368-8000</a><p>Campus Central UVG, zona 15, Ciudad de Guatemala</p></div>
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
