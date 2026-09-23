<script setup lang="ts">
defineProps<{ text?: string }>()
</script>

<template>
  <span class="eyebrow">
    {{ text }}
    <slot />
  </span>
</template>
