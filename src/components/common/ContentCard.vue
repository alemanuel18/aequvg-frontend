<script setup lang="ts">defineProps<{ eyebrow?: string; title: string; body: string }>()</script>
<template><article class="card"><span v-if="eyebrow" class="eyebrow">{{ eyebrow }}</span><h3>{{ title }}</h3><p>{{ body }}</p><slot /></article></template>
