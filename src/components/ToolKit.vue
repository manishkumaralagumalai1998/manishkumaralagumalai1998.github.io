<script setup>
import { computed, onMounted, ref } from 'vue'
import { animate, inView, stagger } from 'motion'
import { LINES, STOPS, TOOLS } from '../data/journey.js'
import { reducedMotion } from '../lib/fx.js'

const emit = defineEmits(['pick'])
const root = ref(null)
const picked = ref('React')
const byId = Object.fromEntries(STOPS.map((s) => [s.id, s]))
const used = computed(() => (TOOLS.flatMap((g) => g.items).find(([t]) => t === picked.value)?.[1] ?? []).map((id) => byId[id]))
const colorOf = (s) => LINES[s.line].color

onMounted(() => {
  if (reducedMotion()) return
  let played = false
  inView(root.value, () => {
    if (played) return
    played = true
    animate(root.value.querySelectorAll('.tool'), { opacity: [0, 1], y: [10, 0] }, { delay: stagger(0.015), duration: 0.35 })
  }, { amount: 0.2 })
})
</script>

<template>
  <section id="toolkit" aria-labelledby="toolkit-h">
    <div class="sec-head">
      <h2 id="toolkit-h">Toolkit</h2>
      <p>Pick a tool to see where I've shipped with it. The dots show how many projects on the line used it.</p>
    </div>
    <div ref="root" class="layout">
      <div class="groups">
        <div v-for="g in TOOLS" :key="g.group" class="group">
          <h3 class="label">{{ g.group }}</h3>
          <div class="tools" role="group" :aria-label="g.group">
            <button
              v-for="[name, ids] in g.items" :key="name" type="button" class="tool"
              :aria-pressed="String(picked === name)" :class="{ light: !ids.length }" @click="picked = name"
            >
              {{ name }}
              <span v-if="ids.length" class="dots" aria-hidden="true">
                <i v-for="id in ids" :key="id" :style="{ background: colorOf(byId[id]) }"></i>
              </span>
            </button>
          </div>
        </div>
      </div>

      <aside class="panel" aria-live="polite">
        <div class="label">Where I used it</div>
        <h3>{{ picked }}</h3>
        <ul v-if="used.length" class="stops">
          <li v-for="s in used" :key="s.id" :style="{ '--c': colorOf(s) }">
            <button type="button" @click="emit('pick', s.id)">
              <span class="dot"></span>
              <span class="txt"><b>{{ s.title }}</b><small>{{ LINES[s.line].name }} · {{ s.big }} {{ s.bigLabel }}</small></span>
              <span class="go" aria-hidden="true">→</span>
            </button>
          </li>
        </ul>
        <p v-else class="none">Part of my everyday toolkit, outside the projects featured on the line.</p>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.layout { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr); gap: 28px 40px; align-items: start; }
.groups { display: grid; gap: 22px; }
.group h3 { margin: 0 0 10px; }
.tools { display: flex; flex-wrap: wrap; gap: 8px; }
.tool { appearance: none; display: inline-flex; align-items: center; gap: 8px; font: 600 15px var(--body); padding: 8px 14px 6px;
  border-radius: 999px; border: 1.5px solid var(--rule); background: var(--paper); color: var(--ink); cursor: pointer;
  transition: border-color .15s, background .15s, color .15s, transform .15s; }
.tool:hover { border-color: var(--ink); transform: translateY(-1px); }
.tool.light { color: var(--muted); }
.tool[aria-pressed="true"] { background: var(--ink); color: var(--bg); border-color: var(--ink); }
.dots { display: inline-flex; gap: 3px; }
.dots i { width: 7px; height: 7px; border-radius: 50%; display: block; }

.panel { position: sticky; top: 24px; background: var(--paper); border: 1.5px solid var(--rule); border-radius: 10px; padding: 22px; display: grid; gap: 10px; }
.panel h3 { font-size: 28px; font-weight: 900; letter-spacing: -0.015em; }
.stops { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.stops button { appearance: none; width: 100%; display: grid; grid-template-columns: 14px 1fr auto; gap: 12px; align-items: center; text-align: left;
  background: var(--bg); border: 1.5px solid transparent; border-radius: 8px; padding: 10px 12px; cursor: pointer; font: inherit; color: var(--ink); }
.stops button:hover { border-color: var(--c); }
.dot { width: 14px; height: 14px; border-radius: 50%; background: var(--c); }
.txt { display: grid; gap: 1px; min-width: 0; }
.txt b { font-size: 15px; }
.txt small { font-size: 13px; color: var(--muted); }
.go { color: var(--c); font-weight: 800; }
.none { margin: 0; color: var(--muted); }

@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  .panel { position: static; order: -1; }
}
</style>
