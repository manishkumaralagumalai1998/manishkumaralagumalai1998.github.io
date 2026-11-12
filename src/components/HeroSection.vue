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
  animate(el.querySelectorAll('.w'), { opacity: [0, 1], y: [28, 0] }, { delay: stagger(0.07), duration: 0.6, ease: [0.2, 0.7, 0.2, 1] })
  animate(el.querySelectorAll('.fade'), { opacity: [0, 1], y: [12, 0] }, { delay: stagger(0.08, { startDelay: 0.45 }), duration: 0.5 })
  animate(el.querySelectorAll('.legend i'), { scaleX: [0, 1] }, { delay: stagger(0.12, { startDelay: 0.7 }), duration: 0.5, ease: 'easeOut' })
})
</script>

<template>
  <header ref="root" class="hero">
    <div class="label fade">Senior full-stack engineer · Carmel, Indiana</div>
    <h1>
      <span v-for="(w, i) in words" :key="i" class="w" :class="{ hl: w.hl }">{{ w.t }}</span>
    </h1>
    <p class="lede fade">
      For <b>5 years</b> I've built React and Angular products on FastAPI and Node.js, for clients including
      <b>Disney</b>, <b>Autodesk</b>, the <b>Commonwealth of Virginia</b> and the <b>City of Westfield</b>. Today I bring
      LLMs into real workflows at Radcube. Follow the line to see how I got here.
    </p>
    <div class="legend fade" aria-label="Map key">
      <span v-for="[c, t] in legend" :key="t"><i :style="{ background: c }"></i>{{ t }}</span>
    </div>
    <div class="cta fade">
      <a class="btn solid" href="#journey">Start the journey</a>
      <a class="btn" href="#contact">Get in touch</a>
    </div>
  </header>
</template>

<style scoped>
.hero { padding-top: 40px; display: grid; gap: 22px; }
h1 { font-size: clamp(46px, 8.6vw, 108px); font-weight: 900; line-height: 0.92; letter-spacing: -0.035em; max-width: 12ch; }
.w { display: inline-block; margin-right: 0.22em; }
.w.hl { color: var(--l-radcube); }
.lede { font-size: clamp(18px, 2.1vw, 22px); max-width: 62ch; margin: 0; }
.legend { display: flex; flex-wrap: wrap; gap: 10px 22px; }
.legend span { display: inline-flex; align-items: center; gap: 8px; font-size: 14px; color: var(--muted); font-weight: 600; }
.legend i { width: 26px; height: 6px; border-radius: 3px; display: inline-block; transform-origin: left center; }
.cta { display: flex; flex-wrap: wrap; gap: 10px; }
</style>
