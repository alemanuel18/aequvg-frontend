<script setup lang="ts">
import { publicNavigation } from '~/router/navigation'
const route = useRoute()
const open = ref(false)
const ready = ref(false)
watch(() => route.fullPath, () => { open.value = false })

const closeMenu = () => { open.value = false }

onMounted(() => {
  ready.value = true
  window.addEventListener('keydown', handleEscape)
})
onBeforeUnmount(() => window.removeEventListener('keydown', handleEscape))

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}
</script>
<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <NuxtLink class="brand" to="/" aria-label="AsoQuímica UVG, ir al inicio">
        <span class="brand__atom" aria-hidden="true"><AppIcon name="atom" :size="24" /></span><span><strong>AsoQuímica UVG</strong><small>Universidad del Valle de Guatemala</small></span>
      </NuxtLink>
      <button class="nav-toggle" :class="{ 'nav-toggle--open': open }" type="button" :disabled="!ready" :aria-expanded="open" aria-controls="main-navigation" :aria-label="open ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'" @click="open = !open"><span /><span /><span /></button>
      <nav id="main-navigation" class="site-nav" :class="{ 'site-nav--open': open }" aria-label="Navegación principal">
        <NuxtLink v-for="item in publicNavigation" :key="item.to" :to="item.to" :aria-current="route.path === item.to ? 'page' : undefined" @click="closeMenu">{{ item.label }}</NuxtLink>
      </nav>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  position: sticky;
  top: 0;
  z-index: 50;
  color: white;
  background: rgb(45 74 43 / 97%);
  border-bottom: 1px solid rgb(255 255 255 / 18%);
  backdrop-filter: blur(14px);
}

.site-header__inner {
  position: relative;
  min-height: 4.75rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: .7rem;
  text-decoration: none;
}

.brand__atom {
  display: grid;
  width: 2.8rem;
  height: 2.8rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-primary);
  background: var(--color-soft);
  border-radius: 50%;
  line-height: 0;
}

.brand strong,
.brand small { display: block; }
.brand strong { font-family: var(--font-display); font-size: 1.15rem; line-height: 1.1; }
.brand small { color: var(--color-soft); font-size: .65rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }

.site-nav {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: .2rem;
}

.site-nav a {
  padding: .45rem .68rem;
  color: var(--color-soft);
  border-radius: 999px;
  font-size: .84rem;
  font-weight: 750;
  text-decoration: none;
  transition: color .18s ease, background-color .18s ease;
}

.site-nav a:hover,
.site-nav a[aria-current="page"] { color: white; background: rgb(255 255 255 / 15%); }

.nav-toggle {
  display: none;
  width: 2.85rem;
  height: 2.85rem;
  padding: .68rem;
  color: white;
  background: rgb(255 255 255 / 12%);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.nav-toggle span {
  display: block;
  width: 100%;
  height: 2px;
  margin: .27rem 0;
  background: currentColor;
  border-radius: 999px;
  transform-origin: center;
  transition: transform .2s ease, opacity .15s ease;
}

.nav-toggle--open span:first-child { transform: translateY(.52rem) rotate(45deg); }
.nav-toggle--open span:nth-child(2) { opacity: 0; }
.nav-toggle--open span:last-child { transform: translateY(-.52rem) rotate(-45deg); }

@media (max-width: 900px) {
  .nav-toggle { display: block; }

  .site-nav {
    position: absolute;
    top: calc(100% + .7rem);
    right: 0;
    left: 0;
    display: grid;
    max-height: calc(100dvh - 6.5rem);
    grid-template-columns: repeat(2, minmax(0, 1fr));
    align-items: stretch;
    gap: .35rem;
    overflow-y: auto;
    padding: .8rem;
    color: var(--color-ink);
    background: white;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    box-shadow: 0 22px 55px rgb(18 31 17 / 25%);
    opacity: 0;
    visibility: hidden;
    transform: translateY(-.6rem) scale(.985);
    transform-origin: top;
    pointer-events: none;
    transition: opacity .18s ease, transform .18s ease, visibility .18s ease;
  }

  .site-nav--open { opacity: 1; visibility: visible; transform: none; pointer-events: auto; }
  .site-nav a { display: flex; min-height: 3rem; align-items: center; padding: .75rem .9rem; color: var(--color-ink); border-radius: .7rem; font-size: .92rem; }
  .site-nav a:hover { color: var(--color-primary); background: var(--color-soft); }
  .site-nav a[aria-current="page"] { color: white; background: var(--color-primary); }
}

@media (max-width: 620px) {
  .brand small { display: none; }
  .brand__atom { width: 2.35rem; height: 2.35rem; }
  .brand strong { font-size: 1rem; }
  .site-header__inner { min-height: 4.35rem; gap: .75rem; }
  .site-nav { top: calc(100% + .45rem); grid-template-columns: 1fr; gap: .2rem; padding: .65rem; }
  .site-nav a { min-height: 2.8rem; padding: .65rem .8rem; }
}
</style>
