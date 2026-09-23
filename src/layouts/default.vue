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
  top: .5rem;
  left: .5rem;
  z-index: 100;
  padding: .7rem 1rem;
  color: var(--color-ink);
  background: white;
  border-radius: .5rem;
  transform: translateY(-150%);
}

.skip-link:focus {
  transform: none;
}
</style>
