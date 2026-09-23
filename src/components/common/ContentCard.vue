<script setup lang="ts">defineProps<{ eyebrow?: string; title: string; body: string }>()</script>
<template><article class="card"><EyebrowBadge v-if="eyebrow" :text="eyebrow" /><h3>{{ title }}</h3><p>{{ body }}</p><slot /></article></template>
