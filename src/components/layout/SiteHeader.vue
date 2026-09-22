<script setup lang="ts">
import { publicNavigation } from '~/router/navigation'
const route = useRoute()
const open = ref(false)
watch(() => route.fullPath, () => { open.value = false })
</script>
<template>
  <header class="site-header">
    <div class="container site-header__inner">
      <NuxtLink class="brand" to="/" aria-label="AsoQuímica UVG, ir al inicio">
        <span class="brand__atom" aria-hidden="true">⚛</span><span><strong>AsoQuímica UVG</strong><small>Universidad del Valle de Guatemala</small></span>
      </NuxtLink>
      <button class="nav-toggle" type="button" :aria-expanded="open" aria-controls="main-navigation" aria-label="Abrir o cerrar menú" @click="open = !open"><span /><span /><span /></button>
      <nav id="main-navigation" class="site-nav" :class="{ 'site-nav--open': open }" aria-label="Navegación principal">
        <NuxtLink v-for="item in publicNavigation" :key="item.to" :to="item.to" :aria-current="route.path === item.to ? 'page' : undefined">{{ item.label }}</NuxtLink>
      </nav>
    </div>
  </header>
</template>
