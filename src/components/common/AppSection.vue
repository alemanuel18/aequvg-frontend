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

<style scoped>
.section { padding-block: clamp(3.5rem, 7vw, 6rem); }
.section--soft { background: var(--color-soft); }
.section--dark { color: white; background: var(--color-primary); }
.section__header { max-width: 48rem; margin-bottom: 2.3rem; }
.section__lead { margin-top: .8rem; color: var(--color-muted); font-size: 1.08rem; }
.section--dark .section__lead { color: var(--color-soft); }
</style>
