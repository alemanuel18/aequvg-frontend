<script setup lang="ts">
import type { BoardMember } from '~/types/api'
const props = defineProps<{ member: BoardMember }>()
const initials = computed(() => props.member.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())
</script>
<template>
  <article class="member-card">
    <div class="member-card__portrait" aria-hidden="true">{{ initials }}</div>
    <div class="member-card__body"><h2>{{ member.name }}</h2><p class="member-card__role">{{ member.position }}</p><p v-if="member.description">{{ member.description }}</p><p class="member-card__meta">Período {{ member.term }}</p><a :href="`mailto:${member.institutionalEmail}`">{{ member.institutionalEmail }}</a></div>
  </article>
</template>
