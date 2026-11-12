<script setup>
import { computed, ref, watch } from 'vue'
import { animate } from 'motion'
import { LINES, SKILLS, STOPS } from '../data/journey.js'
import { burstFrom, reducedMotion } from '../lib/fx.js'

const current = defineModel({ type: String, required: true })
const filter = ref(null)
const celebrated = ref(false)
const mapEl = ref(null)

const stop = computed(() => STOPS.find((s) => s.id === current.value) ?? STOPS[0])
const index = computed(() => STOPS.indexOf(stop.value))
const line = computed(() => LINES[stop.value.line])
const segments = computed(() =>
  Object.entries(LINES).map(([key, l]) => ({ key, ...l, stops: STOPS.filter((s) => s.line === key) })),
)
const matching = computed(() => (filter.value ? STOPS.filter((s) => s.skills.includes(filter.value)).length : 0))

function select(id) { current.value = id }
function step(d) { current.value = STOPS[(index.value + d + STOPS.length) % STOPS.length].id }
function toggleFilter(k) {
  filter.value = filter.value === k ? null : k
  if (filter.value && !stop.value.skills.includes(filter.value)) current.value = STOPS.find((s) => s.skills.includes(filter.value)).id
}

watch(current, (id) => {
  try { history.replaceState(null, '', '#' + id) } catch { /* ignore */ }
  // Reaching today's end of the line gets a small celebration, once per visit.
  if (id === STOPS[STOPS.length - 1].id && !celebrated.value) {
    celebrated.value = true
    requestAnimationFrame(() => burstFrom(mapEl.value?.querySelector(`[data-id="${id}"] .dot`), { particleCount: 70, spread: 60 }))
  }
})

function onEnter(el, done) {
  if (reducedMotion()) return done()
  animate(el, { opacity: [0, 1], y: [10, 0] }, { duration: 0.32, ease: 'easeOut' }).then(done)
}
function onLeave(el, done) {
  if (reducedMotion()) return done()
  animate(el, { opacity: [1, 0] }, { duration: 0.12 }).then(done)
}
</script>

<template>
  <section id="journey" aria-labelledby="journey-h">
    <div class="sec-head">
      <h2 id="journey-h">The line so far</h2>
      <p>Each stop is a project. Pick one to see the problem, what I built, the result, and who I built it with.</p>
    </div>

    <div class="filters" role="group" aria-label="Highlight stops that use a skill">
      <span class="label">Filter by skill</span>
      <button v-for="(v, k) in SKILLS" :key="k" type="button" class="chip" :aria-pressed="String(filter === k)" @click="toggleFilter(k)">{{ v }}</button>
    </div>

    <div class="map-wrap">
      <div ref="mapEl" class="map">
        <div v-for="seg in segments" :key="seg.key" class="seg" :style="{ '--c': seg.color, '--n': seg.stops.length }">
          <div class="seg-head"><b>{{ seg.name }}</b><span>{{ seg.when }}</span></div>
          <div class="stops">
            <button
              v-for="s in seg.stops" :key="s.id" type="button" class="stop" :data-id="s.id"
              :aria-current="String(s.id === current)" :aria-label="s.title"
              :class="{ dim: filter && !s.skills.includes(filter) }" @click="select(s.id)"
            >
              <span class="dot"></span><span class="nm">{{ s.name }}</span><span class="tg">{{ s.tag }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
    <p class="filter-note" aria-live="polite">
      <template v-if="filter">{{ matching }} stop{{ matching === 1 ? '' : 's' }} use {{ SKILLS[filter] }}.</template>
    </p>

    <article class="detail" :style="{ '--c': line.color }" aria-live="polite" @keydown.right="step(1)" @keydown.left="step(-1)">
      <Transition mode="out-in" :css="false" @enter="onEnter" @leave="onLeave">
        <div :key="stop.id">
          <div class="d-top">
            <div>
              <div class="label" :style="{ color: line.color }">{{ line.name }} · stop {{ index + 1 }} of {{ STOPS.length }}</div>
              <h3>{{ stop.title }}</h3>
              <div class="d-meta"><span v-for="[k, v] in stop.meta" :key="k">{{ k }}: <b>{{ v }}</b></span></div>
            </div>
            <div class="d-nav">
              <button type="button" aria-label="Previous stop" @click="step(-1)">←</button>
              <button type="button" aria-label="Next stop" @click="step(1)">→</button>
            </div>
          </div>
          <div class="d-body">
            <div>
              <h4 class="label">The problem</h4>
              <p>{{ stop.problem }}</p>
              <template v-if="stop.built.length">
                <h4 class="label">What I built</h4>
                <ul><li v-for="b in stop.built" :key="b">{{ b }}</li></ul>
              </template>
              <template v-if="stop.with">
                <h4 class="label">Built with</h4>
                <p>{{ stop.with }}</p>
              </template>
              <div v-if="stop.stack.length" class="stack"><span v-for="t in stop.stack" :key="t">{{ t }}</span></div>
            </div>
            <div class="result">
              <span class="big">{{ stop.big }}</span>
              <span class="what">{{ stop.bigLabel }}</span>
              <div v-if="stop.more.length" class="more">
                <span v-for="[n, t] in stop.more" :key="t"><b>{{ n }}</b> {{ t }}</span>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </article>
  </section>
</template>

<style scoped>
.filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 26px; align-items: center; }
.filters .label { margin-right: 6px; }
.map-wrap { overflow-x: auto; padding: 14px 0 6px; }
.map { display: flex; min-width: 980px; align-items: flex-start; }
.seg { display: grid; gap: 14px; flex: var(--n) 1 0; min-width: 0; }
.seg + .seg { margin-left: 10px; }
.seg-head { display: grid; gap: 2px; padding-right: 8px; white-space: nowrap; }
.seg-head b { font-family: var(--display); font-weight: 800; font-size: 15px; letter-spacing: 0.02em; text-transform: uppercase; color: var(--c); }
.seg-head span { font-family: var(--mono); font-size: 12px; color: var(--muted); }
.stops { display: flex; border-top: 7px solid var(--c); border-radius: 4px; }
.stop { appearance: none; background: none; border: none; color: var(--ink); cursor: pointer; flex: 1 1 0; min-width: 0;
  display: grid; justify-items: center; gap: 8px; padding: 0 4px 6px; margin-top: -14px; text-align: center; font: inherit;
  transition: opacity .2s; }
.dot { width: 21px; height: 21px; border-radius: 50%; background: var(--paper); border: 4px solid var(--c); transition: transform .2s, background .2s, box-shadow .2s; }
.nm { font-weight: 700; font-size: 14px; line-height: 1.2; }
.tg { font-family: var(--mono); font-size: 11.5px; color: var(--muted); line-height: 1.25; }
.stop:hover .dot { transform: scale(1.18); }
.stop[aria-current="true"] .dot { background: var(--c); transform: scale(1.32); box-shadow: 0 0 0 6px color-mix(in srgb, var(--c) 22%, transparent); }
.stop[aria-current="true"] .nm { color: var(--c); }
.stop.dim { opacity: 0.28; }
.filter-note { font-size: 14px; color: var(--muted); margin: 10px 0 0; min-height: 1.4em; }

.detail { margin-top: 22px; background: var(--paper); border: 1.5px solid var(--rule); border-top: 7px solid var(--c);
  border-radius: 6px; padding: 26px clamp(18px, 3vw, 34px); }
.d-top { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-start; gap: 12px 24px; }
.d-top h3 { font-size: clamp(26px, 3.4vw, 38px); font-weight: 900; line-height: 1.05; letter-spacing: -0.015em; }
.d-meta { display: flex; flex-wrap: wrap; gap: 6px 16px; margin-top: 8px; color: var(--muted); font-size: 15px; }
.d-meta b { color: var(--ink); font-weight: 700; }
.d-nav { display: flex; gap: 8px; }
.d-nav button { appearance: none; width: 42px; height: 42px; border-radius: 50%; border: 2px solid var(--rule); background: var(--paper);
  color: var(--ink); font: 700 18px var(--body); cursor: pointer; }
.d-nav button:hover { border-color: var(--glow); }
.d-body { display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(220px, 1fr); gap: 28px 40px; margin-top: 22px; }
.d-body h4 { margin: 0 0 6px; }
.d-body p { margin: 0 0 16px; max-width: 64ch; }
.d-body ul { margin: 0 0 16px; padding-left: 20px; }
.d-body li { margin-bottom: 6px; }
.stack { display: flex; flex-wrap: wrap; gap: 6px; }
.stack span { font-family: var(--mono); font-size: 12.5px; padding: 3px 9px 2px; border-radius: 4px; background: var(--code-bg); }
.result { border-left: 5px solid var(--c); padding: 4px 0 4px 18px; display: grid; gap: 4px; align-content: start; }
.big { font-family: var(--display); font-weight: 900; font-size: clamp(56px, 7vw, 86px); line-height: 0.9; letter-spacing: -0.03em; color: var(--c); }
.what { font-weight: 700; font-size: 17px; max-width: 26ch; }
.more { margin-top: 12px; display: grid; gap: 8px; font-size: 15px; color: var(--muted); }
.more b { color: var(--ink); font-family: var(--mono); }

@media (max-width: 760px) {
  .map { flex-direction: column; min-width: 0; gap: 22px; }
  .seg + .seg { margin-left: 0; }
  .stops { flex-direction: column; border-top: none; border-left: 7px solid var(--c); padding: 6px 0; }
  .stop { margin-top: 0; margin-left: -14px; grid-template-columns: 21px 1fr; justify-items: start; text-align: left;
    column-gap: 14px; row-gap: 0; padding: 8px 0; align-items: center; }
  .dot { grid-row: span 2; }
  .d-body { grid-template-columns: 1fr; }
}
</style>
