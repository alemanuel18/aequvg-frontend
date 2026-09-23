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

<style scoped>
.member-card {
  overflow: hidden;
  display: flex;
  min-width: 0;
  height: 100%;
  flex-direction: column;
  text-align: center;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: 0 10px 26px rgb(26 43 24 / 8%);
  transition: transform .2s ease, box-shadow .2s ease;
}

.member-card:hover { transform: translateY(-4px); box-shadow: 0 16px 34px rgb(26 43 24 / 13%); }

.member-card__portrait {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: grid;
  width: 100%;
  aspect-ratio: 4 / 3;
  place-items: center;
  color: white;
  background: linear-gradient(145deg, var(--color-primary-dark), var(--color-primary) 55%, #758c67);
}

.member-card__portrait::after {
  position: absolute;
  inset: auto -15% -48% 30%;
  z-index: -1;
  aspect-ratio: 1;
  content: "";
  border: 1px solid rgb(255 255 255 / 24%);
  border-radius: 50%;
}

.member-card__initials {
  position: relative;
  z-index: 1;
  display: grid;
  width: 6.25rem;
  aspect-ratio: 1;
  place-items: center;
  font-family: var(--font-display);
  font-size: 2.45rem;
  font-weight: 700;
  background: rgb(255 255 255 / 12%);
  border: 1px solid rgb(255 255 255 / 30%);
  border-radius: 50%;
  box-shadow: 0 14px 30px rgb(0 0 0 / 15%);
  backdrop-filter: blur(5px);
}

.member-card__orb { position: absolute; z-index: -1; display: block; border: 1px solid rgb(255 255 255 / 22%); border-radius: 50%; }
.member-card__orb--one { top: -2rem; left: -1.5rem; width: 8rem; height: 8rem; }
.member-card__orb--two { right: 1.2rem; bottom: 1rem; width: 2rem; height: 2rem; background: rgb(255 255 255 / 10%); }
.member-card__body { display: flex; flex: 1; flex-direction: column; align-items: center; padding: 1.5rem; }
.member-card__heading { min-height: 5.4rem; }
.member-card__heading h2 { margin-top: .45rem; font-size: clamp(1.45rem, 2vw, 1.75rem); }
.member-card__role { color: var(--color-primary); font-size: .76rem; font-weight: 850; letter-spacing: .075em; text-transform: uppercase; }
.member-card__description { display: -webkit-box; min-height: 4.7rem; margin-top: .75rem; overflow: hidden; color: var(--color-muted); font-size: .93rem; -webkit-box-orient: vertical; -webkit-line-clamp: 3; }
.member-card__meta { margin-top: .7rem; color: var(--color-muted); font-size: .86rem; }
.member-card__footer { width: 100%; margin-top: auto; padding-top: 1.15rem; }

.member-card__contact {
  display: inline-flex;
  width: 100%;
  min-height: 2.8rem;
  align-items: center;
  justify-content: center;
  gap: .5rem;
  padding: .65rem 1rem;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
  border-radius: 999px;
  font-size: .9rem;
  font-weight: 800;
  text-decoration: none;
  transition: color .18s ease, background-color .18s ease, transform .18s ease;
}

.member-card__contact:hover { color: white; background: var(--color-primary); transform: translateY(-1px); }

@media (max-width: 620px) {
  .member-card__heading { min-height: auto; }
}
</style>
