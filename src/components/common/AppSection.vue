<script setup lang="ts">
withDefaults(defineProps<{ title: string; lead?: string; tone?: 'default' | 'soft' | 'dark'; labelledBy?: string }>(), { tone: 'default' })
</script>
<template>
  <section class="section" :class="`section--${tone}`" :aria-labelledby="labelledBy || undefined">
    <div class="container">
      <header class="section__header">
        <h2 :id="labelledBy" class="section__title">{{ title }}</h2>
        <p v-if="lead" class="section__lead">{{ lead }}</p>
      </header>
      <slot />
    </div>
  </section>
</template>
