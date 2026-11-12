<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as THREE from 'three'
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { LINES, STOPS } from '../data/journey.js'
import { burstFrom } from '../lib/fx.js'

// The journey as a constellation: each project is a star, career lines are faint light trails between them,
// and scrolling flies the camera from star to star.
const N = STOPS.length
const sectionEl = ref(null)
const stageEl = ref(null)
const index = ref(0)
const showBuilt = ref(false)
const stop = computed(() => STOPS[index.value])
const line = computed(() => LINES[stop.value.line])
const segments = Object.entries(LINES).map(([key, l]) => ({ key, ...l, first: STOPS.findIndex((s) => s.line === key) }))

let renderer, composer, bloom, labelRenderer, scene, camera, pts = [], stars = [], labels = [], dust, sky, halo
let raf = 0, visible = true, smooth = 0, celebrated = false, io, last = 0
const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const GLOW = new THREE.Color('#5fd4ff')

function progress() {
  const el = sectionEl.value
  if (!el) return 0
  const r = el.getBoundingClientRect()
  return Math.min(1, Math.max(0, -r.top / (el.offsetHeight - innerHeight)))
}
function scrollToStop(i) {
  const el = sectionEl.value
  const top = el.getBoundingClientRect().top + scrollY
  window.scrollTo({ top: top + (i / (N - 1)) * (el.offsetHeight - innerHeight) + 2, behavior: 'smooth' })
}

// A soft round glow, drawn once and reused as a sprite texture.
function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.18, 'rgba(255,255,255,0.75)')
  grd.addColorStop(0.45, 'rgba(255,255,255,0.18)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128)
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace
  return t
}

function build() {
  const mobile = stageEl.value.clientWidth < 700
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' })
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.5 : 2))
  renderer.setClearColor('#060a13')
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  stageEl.value.appendChild(renderer.domElement)
  labelRenderer = new CSS2DRenderer()
  labelRenderer.domElement.className = 'labels'
  stageEl.value.appendChild(labelRenderer.domElement)

  scene = new THREE.Scene()
  scene.fog = new THREE.FogExp2('#060a13', 0.02)
  camera = new THREE.PerspectiveCamera(42, 1, 0.1, 400)
  const tex = glowTexture()

  // Background sky: thousands of faint stars on a large sphere.
  const skyGeo = new THREE.BufferGeometry()
  const sp = new Float32Array(3600 * 3)
  for (let k = 0; k < 3600; k++) {
    const r = 90 + Math.random() * 90, th = Math.random() * Math.PI * 2, ph = Math.acos(2 * Math.random() - 1)
    sp.set([r * Math.sin(ph) * Math.cos(th) + 40, r * Math.cos(ph), r * Math.sin(ph) * Math.sin(th)], k * 3)
  }
  skyGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3))
  sky = new THREE.Points(skyGeo, new THREE.PointsMaterial({ size: 0.5, map: tex, color: '#cfe6ff', transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }))
  scene.add(sky)

  // Star positions: a loose, three-dimensional constellation, one star per project.
  pts = STOPS.map((_, i) => new THREE.Vector3(i * 8, Math.sin(i * 1.35) * 2.6 + Math.cos(i * 0.5) * 0.8, Math.cos(i * 0.95) * 4.5))

  // Drifting dust near the path, in the cool glow.
  const dustGeo = new THREE.BufferGeometry()
  const dp = new Float32Array(900 * 3)
  for (let k = 0; k < 900; k++) dp.set([Math.random() * (N * 8 + 20) - 10, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 22], k * 3)
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3))
  dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({ size: 0.18, map: tex, color: GLOW, transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }))
  scene.add(dust)

  // Light trails between consecutive stars: tinted by career line, brighter within a line than across lines.
  for (let i = 0; i < N - 1; i++) {
    const a = pts[i], b = pts[i + 1]
    const same = STOPS[i].line === STOPS[i + 1].line
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, 0.9, 0))
    const c = new THREE.QuadraticBezierCurve3(a, mid, b)
    const tint = new THREE.Color(css(LINES[STOPS[i + 1].line].color.slice(4, -1))).lerp(GLOW, 0.55)
    const m = new THREE.Mesh(new THREE.TubeGeometry(c, 64, same ? 0.035 : 0.02, 8, false),
      new THREE.MeshBasicMaterial({ color: tint, transparent: true, opacity: same ? 0.6 : 0.25, blending: THREE.AdditiveBlending, depthWrite: false }))
    scene.add(m)
  }

  // Stars: a bright core, a tinted glow, and a label.
  STOPS.forEach((s, i) => {
    const tint = new THREE.Color(css(LINES[s.line].color.slice(4, -1))).lerp(GLOW, 0.45)
    const group = new THREE.Group()
    group.position.copy(pts[i])
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.28, 32, 32), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffffff').lerp(tint, 0.25) }))
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: tint, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }))
    glow.scale.setScalar(2.1)
    group.add(core, glow)
    scene.add(group)
    stars.push({ group, core, glow })

    const el = document.createElement('button')
    el.type = 'button'
    el.className = 'st-label'
    el.innerHTML = '<b></b><span></span>'
    el.querySelector('b').textContent = s.name
    el.querySelector('span').textContent = s.tag
    el.setAttribute('aria-label', `Go to ${s.title}`)
    el.addEventListener('click', () => scrollToStop(i))
    const obj = new CSS2DObject(el)
    obj.position.set(0, 1.25, 0)
    group.add(obj)
    labels.push(el)
  })

  // A thin halo that circles whichever star is current.
  halo = new THREE.Mesh(new THREE.TorusGeometry(0.95, 0.018, 8, 96), new THREE.MeshBasicMaterial({ color: GLOW, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }))
  scene.add(halo)

  composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))
  bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), mobile ? 0.45 : 0.55, 0.4, 0.35)
  composer.addPass(bloom)
  composer.addPass(new OutputPass())
  resize()
}

function resize() {
  if (!renderer) return
  const w = stageEl.value.clientWidth, h = stageEl.value.clientHeight
  renderer.setSize(w, h)
  composer.setSize(w, h)
  bloom.resolution.set(w, h)
  labelRenderer.setSize(w, h)
  camera.aspect = w / h
  camera.fov = w < 700 ? 58 : 42
  camera.updateProjectionMatrix()
}

const ease = (x) => x * x * (3 - 2 * x)

function frame(now) {
  raf = requestAnimationFrame(frame)
  if (!visible) return
  const dt = Math.min(0.1, (now - (last || now)) / 1000)
  last = now
  const target = progress()
  smooth += (target - smooth) * (1 - Math.exp(-dt * 4.5))
  if (Math.abs(target - smooth) < 0.0005) smooth = target
  const f = smooth * (N - 1)
  const i = Math.min(N - 2, Math.floor(f))
  const look = pts[i].clone().lerp(pts[i + 1], ease(f - i))
  const cur = Math.round(target * (N - 1))
  if (cur !== index.value) index.value = cur

  const mobile = stageEl.value.clientWidth < 700
  const t = now / 1000
  // Fly slightly below and in front of the star, with a gentle sway.
  const off = mobile ? new THREE.Vector3(-1.5, 2.2 + Math.sin(t * 0.4) * 0.2, 15) : new THREE.Vector3(-4, 1.8 + Math.sin(t * 0.4) * 0.25, 11.5)
  camera.position.copy(look).add(off)
  camera.lookAt(look.clone().add(new THREE.Vector3(mobile ? 0.8 : 5.2, mobile ? -3.4 : 0, 0)))

  stars.forEach((s, k) => {
    const on = k === index.value
    const pulse = on ? 1 + Math.sin(t * 2.4) * 0.08 : 1 + Math.sin(t * 1.3 + k) * 0.04
    const target = (on ? 1.35 : 1) * pulse
    s.group.scale.setScalar(s.group.scale.x + (target - s.group.scale.x) * 0.12)
    s.glow.material.opacity = on ? 0.85 : 0.45
  })
  halo.position.copy(stars[index.value].group.position)
  halo.rotation.set(Math.PI / 2.4, t * 0.6, 0)
  sky.rotation.y = t * 0.006
  dust.rotation.x = Math.sin(t * 0.05) * 0.05
  dust.position.y = Math.sin(t * 0.2) * 0.3

  labels.forEach((l, k) => {
    l.classList.toggle('on', k === index.value)
    l.classList.toggle('far', Math.abs(k - f) > 2.2)
  })
  composer.render()
  labelRenderer.render(scene, camera)
}

watch(index, (i) => {
  showBuilt.value = false
  if (i === N - 1 && !celebrated) {
    celebrated = true
    burstFrom(labels[i], { particleCount: 80, spread: 80, colors: ['#5fd4ff', '#8fb4ff', '#e7eef9', '#7fe0cf'] })
  }
})

defineExpose({ goTo: (id) => { const i = STOPS.findIndex((s) => s.id === id); if (i >= 0) scrollToStop(i) } })

onMounted(() => {
  build()
  addEventListener('resize', resize)
  io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { rootMargin: '100px' })
  io.observe(sectionEl.value)
  const h = STOPS.findIndex((s) => s.id === location.hash.slice(1))
  if (h >= 0) requestAnimationFrame(() => scrollToStop(h))
  raf = requestAnimationFrame(frame)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  removeEventListener('resize', resize)
  io?.disconnect()
  composer?.dispose()
  renderer?.dispose()
})
</script>

<template>
  <section id="journey" ref="sectionEl" class="journey" :style="{ height: `${N * 80 + 40}vh` }" aria-labelledby="journey-h">
    <div class="sticky">
      <div ref="stageEl" class="stage"></div>

      <div class="head">
        <h2 id="journey-h">The line so far</h2>
        <p>Each star is a project. Scroll to travel, or tap a star.</p>
      </div>

      <ol class="progress" aria-label="Career lines">
        <li v-for="seg in segments" :key="seg.key" :style="{ '--c': seg.color }" :class="{ on: stop.line === seg.key }">
          <button type="button" @click="scrollToStop(seg.first)">{{ seg.name }}</button>
        </li>
      </ol>

      <aside class="card" :style="{ '--c': line.color }" aria-live="polite">
        <Transition name="swap" mode="out-in">
          <div :key="stop.id" class="card-in">
            <div class="label kicker">{{ line.name }} · {{ line.when }} · {{ index + 1 }}/{{ N }}</div>
            <h3>{{ stop.title }}</h3>
            <div class="meta"><span v-for="[k, v] in stop.meta" :key="k">{{ k }}: <b>{{ v }}</b></span></div>
            <div class="result">
              <span class="big">{{ stop.big }}</span>
              <span class="what">{{ stop.bigLabel }}</span>
            </div>
            <p class="problem">{{ stop.problem }}</p>
            <template v-if="stop.built.length">
              <button type="button" class="more-btn" :aria-expanded="String(showBuilt)" @click="showBuilt = !showBuilt">
                {{ showBuilt ? 'Hide details ↑' : 'What I built ↓' }}
              </button>
              <ul v-if="showBuilt"><li v-for="b in stop.built" :key="b">{{ b }}</li></ul>
            </template>
            <p v-if="stop.with" class="with"><b>Built with</b> {{ stop.with }}</p>
            <div v-if="stop.stack.length" class="stack"><span v-for="t in stop.stack" :key="t">{{ t }}</span></div>
          </div>
        </Transition>
        <div class="nav">
          <button type="button" aria-label="Previous star" :disabled="index === 0" @click="scrollToStop(index - 1)">←</button>
          <button type="button" aria-label="Next star" :disabled="index === N - 1" @click="scrollToStop(index + 1)">→</button>
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
.stage::before, .stage::after { content: ''; position: absolute; left: 0; right: 0; height: 160px; z-index: 1; pointer-events: none; }
.stage::before { top: 0; background: linear-gradient(var(--bg), transparent); }
.stage::after { bottom: 0; background: linear-gradient(transparent, var(--bg)); }
.stage :deep(.labels) { position: absolute; inset: 0; pointer-events: none; }
.stage :deep(.st-label) { pointer-events: auto; appearance: none; border: 1px solid rgba(95, 212, 255, 0.22); background: rgba(8, 14, 26, 0.72);
  backdrop-filter: blur(6px); border-radius: 999px; padding: 5px 12px 3px; display: grid; justify-items: center; cursor: pointer; font: inherit;
  color: var(--ink); transition: opacity .35s, border-color .2s, box-shadow .2s; }
.stage :deep(.st-label b) { font-family: var(--display); font-weight: 800; font-size: 13.5px; line-height: 1.15; }
.stage :deep(.st-label span) { font-family: var(--mono); font-size: 10px; color: var(--muted); }
.stage :deep(.st-label:hover) { border-color: var(--glow); }
.stage :deep(.st-label.on) { border-color: var(--glow); box-shadow: 0 0 22px rgba(95, 212, 255, 0.35); }
.stage :deep(.st-label.on b) { color: var(--glow); }
.stage :deep(.st-label.far) { opacity: 0; pointer-events: none; }

.head { position: absolute; z-index: 1; top: 28px; left: max(24px, env(safe-area-inset-left, 0px)); pointer-events: none; }
.head h2 { font-size: clamp(30px, 4.4vw, 44px); font-weight: 900; letter-spacing: -0.015em; line-height: 1.05; }
.head p { margin: 4px 0 0; color: var(--muted); font-size: 15px; }

.progress { position: absolute; z-index: 2; left: max(24px, env(safe-area-inset-left, 0px)); bottom: 28px; display: flex; gap: 6px; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
.progress button { appearance: none; border: 1px solid var(--rule); background: rgba(8, 14, 26, 0.75); color: var(--muted); border-radius: 999px;
  padding: 6px 12px 4px 10px; font: 700 13px var(--body); cursor: pointer; display: inline-flex; align-items: center; gap: 7px; backdrop-filter: blur(6px); }
.progress button::before { content: ''; width: 8px; height: 8px; border-radius: 50%; background: var(--c); box-shadow: 0 0 8px var(--c); }
.progress li.on button { color: var(--ink); border-color: rgba(95, 212, 255, 0.5); }

.card { position: absolute; z-index: 2; right: max(24px, env(safe-area-inset-right, 0px)); top: 50%; transform: translateY(-50%); width: min(420px, 40vw);
  max-height: calc(100% - 120px); overflow-y: auto; background: rgba(10, 16, 30, 0.78); backdrop-filter: blur(14px);
  border: 1px solid rgba(95, 212, 255, 0.18); border-radius: 14px; padding: 22px 22px 16px;
  box-shadow: 0 0 0 1px rgba(255,255,255,.02) inset, 0 30px 80px rgba(0, 0, 0, 0.5), 0 0 60px rgba(95, 212, 255, 0.06); display: grid; gap: 12px; }
.card-in { display: grid; gap: 10px; }
.kicker { color: var(--glow); }
.kicker::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: var(--c); box-shadow: 0 0 8px var(--c); margin-right: 8px; vertical-align: 1px; }
.card h3 { font-size: 25px; font-weight: 900; line-height: 1.1; letter-spacing: -0.01em; }
.meta { display: flex; flex-wrap: wrap; gap: 2px 14px; font-size: 13.5px; color: var(--muted); }
.meta b { color: var(--ink); }
.result { display: grid; gap: 2px; border-left: 3px solid var(--glow); padding-left: 12px; }
.big { font-family: var(--display); font-weight: 900; font-size: 54px; line-height: 0.9; letter-spacing: -0.03em; color: var(--glow); text-shadow: 0 0 30px rgba(95, 212, 255, 0.45); }
.what { font-weight: 700; font-size: 15px; }
.problem, .with { margin: 0; font-size: 15px; color: #c9d4e6; }
.with b { font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); margin-right: 6px; }
.more-btn { appearance: none; justify-self: start; background: none; border: none; color: var(--glow); font: 700 14px var(--body); padding: 0; cursor: pointer; }
ul { margin: 0; padding-left: 18px; font-size: 14.5px; display: grid; gap: 4px; color: #c9d4e6; }
.stack { display: flex; flex-wrap: wrap; gap: 5px; }
.stack span { font-family: var(--mono); font-size: 11.5px; padding: 2px 8px 1px; border-radius: 4px; background: var(--code-bg); color: #b8c6dd; }
.nav { display: flex; gap: 8px; justify-content: flex-end; }
.nav button { appearance: none; width: 38px; height: 38px; border-radius: 50%; border: 1px solid var(--rule); background: transparent; color: var(--ink); font: 700 16px var(--body); cursor: pointer; }
.nav button:hover:not(:disabled) { border-color: var(--glow); color: var(--glow); }
.nav button:disabled { opacity: 0.3; cursor: default; }

.swap-enter-active, .swap-leave-active { transition: opacity .22s ease, transform .22s ease; }
.swap-enter-from { opacity: 0; transform: translateY(8px); }
.swap-leave-to { opacity: 0; }

@media (max-width: 760px) {
  .head { top: 18px; }
  .card { top: auto; bottom: 12px; transform: none; left: 12px; right: 12px; width: auto; max-height: 46%; padding: 16px 16px 12px; }
  .card h3 { font-size: 20px; }
  .big { font-size: 40px; }
  .progress { display: none; }
  .stage :deep(.st-label span) { display: none; }
}
</style>
