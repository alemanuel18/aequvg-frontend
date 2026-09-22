<script setup lang="ts">
defineProps<{ title: string; message: string; role?: 'status' | 'alert' }>()
</script>
<template><div class="state-panel" :role="role || 'status'"><span class="state-panel__mark" aria-hidden="true">✦</span><div><h2>{{ title }}</h2><p>{{ message }}</p><div v-if="$slots.default" class="state-panel__action"><slot /></div></div></div></template>
