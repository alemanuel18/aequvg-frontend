<script setup lang="ts">
withDefaults(defineProps<{ to?: string; href?: string; variant?: 'primary' | 'secondary' }>(), { variant: 'primary' })
</script>
<template>
  <NuxtLink v-if="to" :to="to" class="button" :class="`button--${variant}`"><slot /></NuxtLink>
  <a v-else-if="href" :href="href" class="button" :class="`button--${variant}`"><slot /></a>
  <button v-else class="button" :class="`button--${variant}`"><slot /></button>
</template>

<style scoped>
.button {
  min-height: 2.85rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: .7rem 1.05rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
  transition: transform .15s ease, background .15s ease;
}

.button:hover { transform: translateY(-2px); }
.button--primary { color: white; background: var(--color-primary); }
.button--primary:hover { background: var(--color-primary-dark); }
.button--secondary { color: var(--color-primary); background: white; }
.button[disabled] { cursor: wait; opacity: .68; transform: none; }
</style>
