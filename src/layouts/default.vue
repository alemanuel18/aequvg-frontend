<template>
  <div class="site-shell">
    <a class="skip-link" href="#main-content">Saltar al contenido</a>
    <SiteHeader />
    <main id="main-content"><slot /></main>
    <SiteFooter />
  </div>
</template>

<style scoped>
.site-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

main {
  flex: 1;
}

.skip-link {
  position: fixed;
  top: 0.5rem;
  left: 0.5rem;
  z-index: 100;
  padding: 0.7rem 1rem;
  color: var(--color-ink);
  background: white;
  border-radius: 0.5rem;
  transform: translateY(-150%);
}

.skip-link:focus {
  transform: none;
}
</style>
