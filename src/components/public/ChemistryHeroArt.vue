<template>
  <div class="hero-art" aria-hidden="true">
    <svg class="flask" viewBox="0 0 300 360" role="img">
      <path class="flask__glass" d="M112 20h76v24l-17 10v91l82 138c18 30-4 57-39 57H86c-35 0-57-27-39-57l82-138V54l-17-10z" />
      <path class="flask__liquid" d="M75 261c40-28 83 18 151-12l27 46c12 21-4 39-39 39H86c-35 0-51-18-39-39z" />
      <circle class="flask__bubble" cx="115" cy="278" r="9"/><circle class="flask__bubble" cx="171" cy="298" r="13"/><circle class="flask__bubble" cx="192" cy="267" r="6"/>
    </svg>
  </div>
</template>

<style scoped>
.hero-art {
  position: relative;
  min-height: 29rem;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.hero-art::before,
.hero-art::after {
  position: absolute;
  z-index: -1;
  content: "";
  border-radius: 50%;
}

.hero-art::before {
  width: 25rem;
  height: 25rem;
  background: var(--color-soft);
  box-shadow: var(--shadow);
}

.hero-art::after {
  width: 16rem;
  height: 16rem;
  border: 2px dashed var(--color-accent);
  animation: orbit 25s linear infinite;
}

.flask {
  width: min(17rem, 72vw);
  filter: drop-shadow(0 1.5rem 1.3rem rgb(26 43 24 / 18%));
}

.flask__glass { fill: rgb(255 255 255 / 72%); stroke: var(--color-primary); stroke-width: 5; }
.flask__liquid { fill: var(--color-accent); }
.flask__bubble { fill: var(--color-primary); opacity: .7; }

@keyframes orbit { to { transform: rotate(360deg); } }

@media (max-width: 900px) {
  .hero-art { min-height: 23rem; }
}

@media (max-width: 620px) {
  .hero-art { min-height: 19rem; }
  .hero-art::before { width: 18rem; height: 18rem; }
}
</style>
