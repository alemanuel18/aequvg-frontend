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
