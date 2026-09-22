<script setup lang="ts">
withDefaults(defineProps<{ to?: string; href?: string; variant?: 'primary' | 'secondary' }>(), { variant: 'primary' })
</script>
<template>
  <NuxtLink v-if="to" :to="to" class="button" :class="`button--${variant}`"><slot /></NuxtLink>
  <a v-else-if="href" :href="href" class="button" :class="`button--${variant}`"><slot /></a>
  <button v-else class="button" :class="`button--${variant}`"><slot /></button>
</template>
