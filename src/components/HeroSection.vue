<script setup>
import { onMounted, ref } from 'vue'
import { animate, stagger } from 'motion'
import { reducedMotion } from '../lib/fx.js'

const root = ref(null)
const words = [
  { t: 'I' }, { t: 'ship' }, { t: 'AI', hl: true }, { t: 'features', hl: true }, { t: 'into' }, { t: 'production.' },
]
const legend = [
  ['var(--l-school)', 'Engineering degree'],
  ['var(--l-presidio)', 'Presidio, consulting'],
  ['var(--l-iu)', 'Indiana University'],
  ['var(--l-radcube)', 'Radcube, now'],
]

onMounted(() => {
  if (reducedMotion()) return
  const el = root.value
  animate(el.querySelector('.portrait'), { opacity: [0, 1], scale: [0.92, 1], rotate: [-4, 0] }, { duration: 0.8, ease: [0.2, 0.7, 0.2, 1] })
  animate(el.querySelectorAll('.w'), { opacity: [0, 1], y: [28, 0] }, { delay: stagger(0.07, { startDelay: 0.1 }), duration: 0.6, ease: [0.2, 0.7, 0.2, 1] })
  animate(el.querySelectorAll('.fade'), { opacity: [0, 1], y: [12, 0] }, { delay: stagger(0.08, { startDelay: 0.5 }), duration: 0.5 })
  animate(el.querySelectorAll('.legend i'), { scaleX: [0, 1] }, { delay: stagger(0.12, { startDelay: 0.75 }), duration: 0.5, ease: 'easeOut' })
})
</script>

<template>
  <header ref="root" class="hero">
    <div class="copy">
      <div class="label fade">Senior full-stack engineer · Carmel, Indiana</div>
      <h1>
        <span v-for="(w, i) in words" :key="i" class="w" :class="{ hl: w.hl }">{{ w.t }}</span>
      </h1>
      <p class="lede fade">
        Hi, I'm Kaneki. For <b>5 years</b> I've built React and Angular products on FastAPI and Node.js, for clients
        including <b>Disney</b>, <b>Autodesk</b>, the <b>Commonwealth of Virginia</b> and the <b>City of Westfield</b>.
        Today I bring LLMs into real workflows at Radcube.
      </p>
      <div class="legend fade" aria-label="Map key">
        <span v-for="[c, t] in legend" :key="t"><i :style="{ background: c }"></i>{{ t }}</span>
      </div>
      <div class="cta fade">
        <a class="btn solid" href="#journey">Ride the line</a>
        <a class="btn" href="#contact">Get in touch</a>
      </div>
    </div>
    <figure class="portrait">
      <picture>
        <source srcset="/portrait.webp" type="image/webp" />
        <img src="/portrait.jpg" alt="Manishkumar Alagumalai" width="720" height="720" />
      </picture>
    </figure>
  </header>
</template>

<style scoped>
.hero { padding-top: 32px; display: grid; grid-template-columns: minmax(0, 1fr) clamp(220px, 30vw, 380px); gap: 32px 48px; align-items: center; }
.copy { display: grid; gap: 22px; min-width: 0; }
h1 { font-size: clamp(44px, 7.4vw, 96px); font-weight: 900; line-height: 0.92; letter-spacing: -0.035em; max-width: 12ch; }
.w { display: inline-block; margin-right: 0.22em; }
.w.hl { color: var(--glow); text-shadow: 0 0 34px rgba(95, 212, 255, 0.45); }
.lede { font-size: clamp(18px, 2vw, 21px); max-width: 58ch; margin: 0; }
.legend { display: flex; flex-wrap: wrap; gap: 10px 22px; }
.legend span { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); font-weight: 600; }
.legend i { width: 26px; height: 6px; border-radius: 3px; display: inline-block; transform-origin: left center; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; }

/* The portrait sits inside a ring drawn in the four career-line colors. */
.portrait { margin: 0; aspect-ratio: 1; max-width: 100%; border-radius: 50%; padding: 10px;
  background: conic-gradient(from 200deg, var(--l-school) 0 12%, var(--l-presidio) 12% 52%, var(--l-iu) 52% 64%, var(--l-radcube) 64% 100%);
  box-shadow: 0 0 60px rgba(95, 212, 255, 0.28), 0 0 0 1px rgba(95, 212, 255, 0.25); }
.portrait picture, .portrait img { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 6px solid var(--bg); }

@media (max-width: 760px) {
  .hero { grid-template-columns: 1fr; }
  .portrait { width: 180px; order: -1; padding: 7px; }
  .portrait img { border-width: 4px; }
}
</style>
