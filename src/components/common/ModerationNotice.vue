<script setup lang="ts">
import { computed } from 'vue'
import { getModerationFeedback, safeModerationFeedbackFields } from '../../utils/moderation-feedback'

const props = defineProps<{
  code: string
  fields?: Record<string, string>
}>()

const feedback = computed(() => getModerationFeedback(props.code, safeModerationFeedbackFields(props.fields)))
</script>

<template>
  <aside v-if="feedback" class="moderation-notice" role="alert" aria-live="assertive">
    <strong>{{ feedback.title }}</strong>
    <p>{{ feedback.message }}</p>
    <NuxtLink v-if="feedback.offerContact" to="/contacto">¿Crees que fue un error? Contacta a la Asociación.</NuxtLink>
  </aside>
</template>

<style scoped>
.moderation-notice { display: grid; gap: .45rem; padding: .9rem 1rem; color: #64251f; background: #fff1ef; border: 1px solid #e7b7b1; border-radius: .6rem; }
.moderation-notice strong { font-weight: 800; }
.moderation-notice p { margin: 0; }
.moderation-notice a { width: fit-content; color: #64251f; font-weight: 750; text-underline-offset: .15em; }
.moderation-notice a:focus-visible { outline: 3px solid currentColor; outline-offset: 3px; }
</style>
