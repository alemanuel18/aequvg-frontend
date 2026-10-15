<script setup lang="ts">
defineProps<{ title: string; hint: string }>()
</script>

<template>
  <section class="auth-page" :aria-labelledby="`${title.replace(/\s+/g, '-').toLowerCase()}-title`">
    <div class="auth-page__intro">
      <EyebrowBadge>Portal estudiantil</EyebrowBadge>
      <h1 :id="`${title.replace(/\s+/g, '-').toLowerCase()}-title`">{{ title }}</h1>
      <p>{{ hint }}</p>
    </div>
    <div class="auth-card"><slot /></div>
  </section>
</template>

<style scoped>
.auth-page { width: min(64rem, calc(100% - 2rem)); display: grid; grid-template-columns: minmax(0, 1fr) minmax(19rem, .82fr); align-items: start; gap: clamp(2rem, 7vw, 6rem); padding-block: clamp(3rem, 8vw, 6rem); margin-inline: auto; }
.auth-page__intro { padding-top: 1.4rem; }
.auth-page__intro h1 { max-width: 11ch; margin-top: 1rem; font-size: clamp(2.6rem, 7vw, 4.8rem); }
.auth-page__intro p { max-width: 34rem; margin-top: 1.25rem; color: var(--color-muted); font-size: 1.06rem; }
.auth-card { display: grid; gap: 1.15rem; padding: clamp(1.35rem, 5vw, 2.2rem); background: white; border: 1px solid var(--color-border); border-radius: var(--radius-lg); box-shadow: var(--shadow); }
.auth-card :deep(.field) { display: grid; gap: .4rem; }
.auth-card :deep(label), .auth-card :deep(legend) { font-weight: 850; }
.auth-card :deep(input:not([type='checkbox'])) { width: 100%; min-height: 3rem; padding: .7rem .8rem; color: var(--color-ink); background: white; border: 1px solid #7d8979; border-radius: .65rem; }
.auth-card :deep(input[aria-invalid='true']) { border-color: var(--color-danger); border-width: 2px; }
.auth-card :deep(.field-error) { color: var(--color-danger); font-weight: 750; }
.auth-card :deep(.form-message) { padding: .8rem; border: 1px solid #d99; border-radius: .6rem; background: #fff0f0; }
.auth-card :deep(.form-message--info) { border-color: #c7b277; background: #fff9e8; }
.auth-card :deep(.button) { width: 100%; }
.auth-card :deep(.auth-switch) { justify-self: center; color: var(--color-primary); font-weight: 800; text-align: center; }
@media (max-width: 720px) { .auth-page { grid-template-columns: 1fr; gap: 2rem; padding-block: 2.5rem 4rem; } .auth-page__intro { padding-top: 0; } }
</style>
