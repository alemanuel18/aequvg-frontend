<script setup lang="ts">
import type { BoardMember } from '~/types/api'

const props = defineProps<{ member: BoardMember }>()
const initials = computed(() => props.member.name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase())
</script>

<template>
  <article class="member-card">
    <div class="member-card__portrait" aria-hidden="true">
      <span class="member-card__orb member-card__orb--one" />
      <span class="member-card__orb member-card__orb--two" />
      <span class="member-card__initials">{{ initials }}</span>
    </div>
    <div class="member-card__body">
      <div class="member-card__heading">
        <p class="member-card__role">{{ member.position }}</p>
        <h2>{{ member.name }}</h2>
      </div>
      <p v-if="member.description" class="member-card__description">{{ member.description }}</p>
      <p class="member-card__meta">Período {{ member.term }}</p>
      <div class="member-card__footer">
        <a class="member-card__contact" :href="`mailto:${member.institutionalEmail}`">
          <AppIcon name="send" :size="17" />
          Contactar
        </a>
      </div>
    </div>
  </article>
</template>
