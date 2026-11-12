<script setup>
import { onMounted, ref } from 'vue'
import { animate, inView, stagger } from 'motion'
import { LINES, RESULTS, STOPS } from '../data/journey.js'
import { reducedMotion } from '../lib/fx.js'

const emit = defineEmits(['pick'])
const root = ref(null)
const shown = ref(RESULTS.map((r) => r.value)) // final values at rest; counted up once on first view
const colorOf = (id) => LINES[STOPS.find((s) => s.id === id).line].color

onMounted(() => {
  if (reducedMotion()) return
  let played = false
  inView(root.value, () => {
    if (played) return
    played = true
    RESULTS.forEach((r, i) => {
      animate(0, r.value, { duration: 1.1, delay: i * 0.08, ease: [0.2, 0.7, 0.2, 1], onUpdate: (v) => { shown.value[i] = Math.round(v) } })
    })
    animate(root.value.querySelectorAll('.tile'), { opacity: [0, 1], y: [16, 0] }, { delay: stagger(0.06), duration: 0.45 })
  }, { amount: 0.3 })
})
</script>

<template>
  <section id="results" aria-labelledby="results-h">
    <div class="sec-head">
      <h2 id="results-h">Results, measured</h2>
      <p>Every number comes from a shipped project. Pick one to jump to its stop on the line.</p>
    </div>
    <div ref="root" class="grid">
      <button v-for="(r, i) in RESULTS" :key="r.label" type="button" class="tile" :style="{ '--c': colorOf(r.stop) }" @click="emit('pick', r.stop)">
        <span class="n">{{ shown[i] }}{{ r.suffix }}</span>
        <span class="t">{{ r.label }}</span>
        <span class="w">{{ r.where }}</span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); border-top: 2px solid var(--ink); }
.tile { appearance: none; text-align: left; background: none; border: none; border-bottom: 1.5px solid var(--rule); color: var(--ink);
  padding: 22px 18px 20px 0; display: grid; gap: 6px; cursor: pointer; font: inherit; }
.n { font-family: var(--display); font-weight: 900; font-size: 56px; line-height: 0.95; letter-spacing: -0.03em; color: var(--c); font-variant-numeric: tabular-nums; }
.t { font-weight: 700; font-size: 17px; }
.w { font-family: var(--mono); font-size: 12.5px; color: var(--muted); }
.tile:hover .t { text-decoration: underline; text-decoration-thickness: 2px; text-underline-offset: 3px; }
</style>
