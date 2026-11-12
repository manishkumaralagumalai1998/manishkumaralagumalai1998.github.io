<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { LINES, STOPS } from '../data/journey.js'
import { burstFrom } from '../lib/fx.js'

const N = STOPS.length
const sectionEl = ref(null)
const stageEl = ref(null)
const cardEl = ref(null)
const index = ref(0)
const showBuilt = ref(false)
const stop = computed(() => STOPS[index.value])
const line = computed(() => LINES[stop.value.line])
const segments = Object.entries(LINES).map(([key, l]) => ({ key, ...l, first: STOPS.findIndex((s) => s.line === key) }))

let renderer, labelRenderer, scene, camera, curve, stationU = [], markers = [], labels = []
let raf = 0, visible = true, smooth = 0, celebrated = false, io, t0 = performance.now()

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

function progress() {
  const el = sectionEl.value
  if (!el) return 0
  const r = el.getBoundingClientRect()
  const span = el.offsetHeight - innerHeight
  return Math.min(1, Math.max(0, -r.top / span))
}

function scrollToStop(i) {
  const el = sectionEl.value
  const top = el.getBoundingClientRect().top + scrollY
  window.scrollTo({ top: top + (i / (N - 1)) * (el.offsetHeight - innerHeight) + 2, behavior: 'smooth' })
}

function build() {
  const bg = new THREE.Color(css('--bg'))
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
  renderer.setClearColor(bg)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  stageEl.value.appendChild(renderer.domElement)

  labelRenderer = new CSS2DRenderer()
  labelRenderer.domElement.className = 'labels'
  stageEl.value.appendChild(labelRenderer.domElement)

  scene = new THREE.Scene()
  scene.fog = new THREE.Fog(bg, 22, 70)
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200)

  // The career track: one point per stop, winding gently across the ground.
  const pts = STOPS.map((_, i) => new THREE.Vector3(i * 9, 0.25, Math.sin(i * 0.85) * 4.5))
  const ext = [pts[0].clone().add(new THREE.Vector3(-9, 0, 0)), ...pts, pts[N - 1].clone().add(new THREE.Vector3(9, 0, 0))]
  curve = new THREE.CatmullRomCurve3(ext, false, 'centripetal')
  const samples = curve.getSpacedPoints(4000)
  stationU = pts.map((p) => {
    let best = 0, bd = Infinity
    samples.forEach((s, k) => { const d = s.distanceToSquared(p); if (d < bd) { bd = d; best = k } })
    return best / 4000
  })

  // A faint base rail along the whole line, then a colored tube for each employer or school.
  const tube = (u0, u1, radius, color, shadow = true) => {
    const ps = []
    for (let k = 0; k <= 160; k++) ps.push(curve.getPointAt(u0 + ((u1 - u0) * k) / 160))
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ps), 240, radius, 14, false)
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.05 }))
    m.castShadow = shadow
    scene.add(m)
  }
  tube(0, 1, 0.07, css('--rule'), false)
  for (const [key, l] of Object.entries(LINES)) {
    const idx = STOPS.map((s, i) => (s.line === key ? i : -1)).filter((i) => i >= 0)
    const pad = 0.03
    tube(Math.max(0, stationU[idx[0]] - pad), Math.min(1, stationU[idx[idx.length - 1]] + pad), 0.2, css(l.color.slice(4, -1)))
  }

  // Stations: a white platform, a colored ring, and a floating marker.
  STOPS.forEach((s, i) => {
    const color = css(LINES[s.line].color.slice(4, -1))
    const p = pts[i]
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.3, 48), new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }))
    plat.position.set(p.x, 0.15, p.z); plat.castShadow = true; plat.receiveShadow = true; scene.add(plat)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.06, 12, 64), new THREE.MeshStandardMaterial({ color }))
    ring.rotation.x = Math.PI / 2; ring.position.set(p.x, 0.31, p.z); scene.add(ring)
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.42, 40, 40), new THREE.MeshStandardMaterial({ color, roughness: 0.3, emissive: color, emissiveIntensity: 0.05 }))
    marker.position.set(p.x, 1.4, p.z); marker.castShadow = true; scene.add(marker)
    markers.push(marker)

    const div = document.createElement('button')
    div.type = 'button'
    div.className = 'st-label'
    div.style.setProperty('--c', color)
    div.innerHTML = `<b></b><span></span>`
    div.querySelector('b').textContent = s.name
    div.querySelector('span').textContent = s.tag
    div.setAttribute('aria-label', `Go to ${s.title}`)
    div.addEventListener('click', () => scrollToStop(i))
    const lbl = new CSS2DObject(div)
    lbl.position.set(p.x, 2.55, p.z)
    scene.add(lbl)
    labels.push(div)
  })

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 200), new THREE.ShadowMaterial({ opacity: 0.1 }))
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground)
  const grid = new THREE.GridHelper(400, 100, css('--rule'), css('--rule'))
  grid.material.transparent = true; grid.material.opacity = 0.35; grid.position.y = 0.001; scene.add(grid)

  scene.add(new THREE.HemisphereLight('#ffffff', css('--bg'), 1.25))
  const sun = new THREE.DirectionalLight('#ffffff', 1.5)
  sun.castShadow = true
  sun.shadow.mapSize.set(2048, 2048)
  Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, near: 1, far: 80 })
  sun.shadow.radius = 4
  scene.add(sun, sun.target)
  scene.userData.sun = sun

  resize()
}

function resize() {
  if (!renderer) return
  const w = stageEl.value.clientWidth, h = stageEl.value.clientHeight
  renderer.setSize(w, h)
  labelRenderer.setSize(w, h)
  camera.aspect = w / h
  camera.fov = w < 700 ? 52 : 38
  camera.updateProjectionMatrix()
}

const ease = (x) => x * x * (3 - 2 * x)

function frame(now) {
  raf = requestAnimationFrame(frame)
  if (!visible) return
  const target = progress()
  const dt = Math.min(0.1, (now - (frame.last ?? now)) / 1000)
  frame.last = now
  smooth += (target - smooth) * (1 - Math.exp(-dt * 5)) // same glide speed at any frame rate
  if (Math.abs(target - smooth) < 0.0005) smooth = target
  const f = smooth * (N - 1)
  const i = Math.min(N - 2, Math.floor(f))
  const u = stationU[i] + (stationU[i + 1] - stationU[i]) * ease(f - i)
  const cur = Math.round(target * (N - 1))
  if (cur !== index.value) index.value = cur

  const look = curve.getPointAt(u)
    const mobile = stageEl.value.clientWidth < 700
  const off = mobile ? new THREE.Vector3(-2.5, 11, 17) : new THREE.Vector3(-5, 10, 19)
  camera.position.copy(look).add(off)
  // Aim past the station so it lands in the open part of the screen: left of the card on desktop, above it on phones.
  camera.lookAt(look.clone().add(new THREE.Vector3(mobile ? 1.2 : 7.5, mobile ? -4.2 : 0.4, mobile ? 0 : -1)))
  const sun = scene.userData.sun
  sun.position.copy(look).add(new THREE.Vector3(8, 22, 10))
  sun.target.position.copy(look)

  const t = (now - t0) / 1000
  markers.forEach((m, k) => {
    const on = k === index.value
    const s = m.scale.x + ((on ? 1.55 : 1) - m.scale.x) * 0.12
    m.scale.setScalar(s)
    m.position.y = 1.4 + (on ? Math.sin(t * 2.2) * 0.18 + 0.25 : 0)
    m.material.emissiveIntensity = on ? 0.35 : 0.05
  })
  labels.forEach((l, k) => {
    l.classList.toggle('on', k === index.value)
    l.classList.toggle('far', Math.abs(k - f) > 2.2) // keep the scene calm: only nearby stations are labeled
  })
  renderer.render(scene, camera)
  labelRenderer.render(scene, camera)
}

watch(index, (i) => {
  showBuilt.value = false
  if (i === N - 1 && !celebrated) {
    celebrated = true
    burstFrom(labels[i], { particleCount: 80, spread: 75 })
  }
})

defineExpose({ goTo: (id) => { const i = STOPS.findIndex((s) => s.id === id); if (i >= 0) scrollToStop(i) } })

onMounted(() => {
  build()
  addEventListener('resize', resize)
  io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '100px' })
  io.observe(sectionEl.value)
  const hash = location.hash.slice(1)
  const h = STOPS.findIndex((s) => s.id === hash)
  if (h >= 0) requestAnimationFrame(() => scrollToStop(h))
  raf = requestAnimationFrame(frame)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  removeEventListener('resize', resize)
  io?.disconnect()
  renderer?.dispose()
})
</script>

<template>
  <section id="journey" ref="sectionEl" class="journey" :style="{ height: `${N * 80 + 40}vh` }" aria-labelledby="journey-h">
    <div class="sticky">
      <div ref="stageEl" class="stage" aria-hidden="false"></div>

      <div class="head">
        <h2 id="journey-h">The line so far</h2>
        <p>Scroll to travel, or tap a station.</p>
      </div>

      <ol class="progress" aria-label="Career lines">
        <li v-for="seg in segments" :key="seg.key" :style="{ '--c': seg.color }" :class="{ on: stop.line === seg.key }">
          <button type="button" @click="scrollToStop(seg.first)">{{ seg.name }}</button>
        </li>
      </ol>

      <aside ref="cardEl" class="card" :style="{ '--c': line.color }" aria-live="polite">
        <Transition name="swap" mode="out-in">
          <div :key="stop.id" class="card-in">
            <div class="label" :style="{ color: line.color }">{{ line.name }} · {{ line.when }} · stop {{ index + 1 }}/{{ N }}</div>
            <h3>{{ stop.title }}</h3>
            <div class="meta"><span v-for="[k, v] in stop.meta" :key="k">{{ k }}: <b>{{ v }}</b></span></div>
            <div class="result">
              <span class="big">{{ stop.big }}</span>
              <span class="what">{{ stop.bigLabel }}</span>
            </div>
            <p class="problem">{{ stop.problem }}</p>
            <template v-if="stop.built.length">
              <button type="button" class="more-btn" :aria-expanded="String(showBuilt)" @click="showBuilt = !showBuilt">
                {{ showBuilt ? 'Hide' : 'What I built' }} {{ showBuilt ? '↑' : '↓' }}
              </button>
              <ul v-if="showBuilt"><li v-for="b in stop.built" :key="b">{{ b }}</li></ul>
            </template>
            <p v-if="stop.with" class="with"><b>Built with</b> {{ stop.with }}</p>
            <div v-if="stop.stack.length" class="stack"><span v-for="t in stop.stack" :key="t">{{ t }}</span></div>
          </div>
        </Transition>
        <div class="nav">
          <button type="button" aria-label="Previous stop" :disabled="index === 0" @click="scrollToStop(index - 1)">←</button>
          <button type="button" aria-label="Next stop" :disabled="index === N - 1" @click="scrollToStop(index + 1)">→</button>
        </div>
      </aside>
    </div>
  </section>
</template>

<style scoped>
.journey { position: relative; margin-top: 80px; width: 100vw; margin-left: calc(50% - 50vw); padding: 0; }
.sticky { position: sticky; top: 0; height: 100vh; height: 100svh; overflow: hidden; }
.stage { position: absolute; inset: 0; isolation: isolate; z-index: 0; }
.stage :deep(canvas) { display: block; }
.stage :deep(.labels) { position: absolute; inset: 0; pointer-events: none; }
.stage :deep(.st-label) { pointer-events: auto; appearance: none; border: 1.5px solid var(--rule); background: rgba(255, 255, 255, 0.92);
  border-radius: 10px; padding: 6px 10px 4px; display: grid; justify-items: center; cursor: pointer; font: inherit; color: var(--ink);
  box-shadow: 0 4px 14px rgba(20, 40, 30, 0.08); transition: border-color .2s, opacity .3s; }
.stage :deep(.st-label.far) { opacity: 0; pointer-events: none; }
.stage :deep(.st-label b) { font-family: var(--display); font-weight: 800; font-size: 14px; line-height: 1.1; }
.stage :deep(.st-label span) { font-family: var(--mono); font-size: 10.5px; color: var(--muted); }
.stage :deep(.st-label:hover) { border-color: var(--c); }
.stage :deep(.st-label.on) { border-color: var(--c); border-width: 2px; }
.stage :deep(.st-label.on b) { color: var(--c); }

.head { position: absolute; z-index: 1; top: 28px; left: max(24px, env(safe-area-inset-left, 0px)); pointer-events: none; }
.head h2 { font-size: clamp(30px, 4.4vw, 44px); font-weight: 900; letter-spacing: -0.015em; line-height: 1.05; }
.head p { margin: 4px 0 0; color: var(--muted); font-size: 15px; }

.progress { position: absolute; z-index: 2; left: max(24px, env(safe-area-inset-left, 0px)); bottom: 28px; display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
.progress button { appearance: none; border: 1.5px solid var(--rule); background: rgba(255, 255, 255, 0.9); color: var(--muted); border-radius: 999px;
  padding: 6px 12px 4px 10px; font: 700 13px var(--body); cursor: pointer; display: inline-flex; align-items: center; gap: 7px; }
.progress button::before { content: ''; width: 14px; height: 5px; border-radius: 3px; background: var(--c); }
.progress li.on button { color: var(--ink); border-color: var(--c); }

.card { position: absolute; z-index: 2; right: max(24px, env(safe-area-inset-right, 0px)); top: 50%; transform: translateY(-50%); width: min(420px, 40vw);
  max-height: calc(100% - 120px); overflow-y: auto; background: rgba(255, 255, 255, 0.96); border: 1.5px solid var(--rule); border-top: 6px solid var(--c);
  border-radius: 10px; padding: 22px 22px 16px; box-shadow: 0 18px 50px rgba(20, 40, 30, 0.12); display: grid; gap: 12px; }
.card-in { display: grid; gap: 10px; }
.card h3 { font-size: 25px; font-weight: 900; line-height: 1.1; letter-spacing: -0.01em; }
.meta { display: flex; flex-wrap: wrap; gap: 2px 14px; font-size: 13.5px; color: var(--muted); }
.meta b { color: var(--ink); }
.result { display: grid; gap: 2px; border-left: 4px solid var(--c); padding-left: 12px; }
.big { font-family: var(--display); font-weight: 900; font-size: 54px; line-height: 0.9; letter-spacing: -0.03em; color: var(--c); }
.what { font-weight: 700; font-size: 15px; }
.problem, .with { margin: 0; font-size: 15px; }
.with b { font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-right: 6px; }
.more-btn { appearance: none; justify-self: start; background: none; border: none; color: var(--c); font: 700 14px var(--body); padding: 0; cursor: pointer; }
ul { margin: 0; padding-left: 18px; font-size: 14.5px; display: grid; gap: 4px; }
.stack { display: flex; flex-wrap: wrap; gap: 5px; }
.stack span { font-family: var(--mono); font-size: 11.5px; padding: 2px 8px 1px; border-radius: 4px; background: var(--code-bg); }
.nav { display: flex; gap: 8px; justify-content: flex-end; }
.nav button { appearance: none; width: 38px; height: 38px; border-radius: 50%; border: 2px solid var(--rule); background: #fff; color: var(--ink); font: 700 16px var(--body); cursor: pointer; }
.nav button:hover:not(:disabled) { border-color: var(--ink); }
.nav button:disabled { opacity: 0.35; cursor: default; }

.swap-enter-active, .swap-leave-active { transition: opacity .2s ease, transform .2s ease; }
.swap-enter-from { opacity: 0; transform: translateY(8px); }
.swap-leave-to { opacity: 0; }

@media (max-width: 760px) {
  .head { top: 18px; }
  .card { top: auto; bottom: 12px; transform: none; left: 12px; right: 12px; width: auto; max-height: 46%; padding: 16px 16px 12px; }
  .card h3 { font-size: 20px; }
  .big { font-size: 40px; }
  .progress { display: none; }
  .stage :deep(.st-label) { padding: 4px 8px 3px; }
  .stage :deep(.st-label span) { display: none; }
}
</style>
