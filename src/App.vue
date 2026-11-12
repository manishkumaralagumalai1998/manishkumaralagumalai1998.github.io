<script setup>
import { defineAsyncComponent, ref } from 'vue'
import HeroSection from './components/HeroSection.vue'
import JourneyMap from './components/JourneyMap.vue'
const Journey3D = defineAsyncComponent(() => import('./components/Journey3D.vue'))
import ResultsGrid from './components/ResultsGrid.vue'
import ContactBlock from './components/ContactBlock.vue'
import { STOPS } from './data/journey.js'

const fromHash = location.hash.slice(1)
const current = ref(STOPS.some((s) => s.id === fromHash) ? fromHash : 'orbilens')

const use3D = (() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')) } catch { return false }
})()

const journey3d = ref(null)

function goTo(id) {
  if (use3D) { journey3d.value?.goTo(id); return }
  current.value = id
  document.getElementById('journey')?.scrollIntoView()
}
</script>

<template>
  <div class="wrap">
    <div class="top">
      <span class="name">Manishkumar Alagumalai</span>
      <nav aria-label="Sections">
        <a href="#journey">Journey</a>
        <a href="#results">Results</a>
        <a href="#contact">Contact</a>
      </nav>
    </div>
    <HeroSection />
    <Journey3D v-if="use3D" ref="journey3d" />
    <JourneyMap v-else v-model="current" />
    <ResultsGrid @pick="goTo" />
    <ContactBlock />
  </div>
</template>

<style scoped>
.top { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding-block: 20px; flex-wrap: wrap; }
.name { font-family: var(--display); font-weight: 800; font-size: 17px; }
nav { display: flex; gap: 18px; flex-wrap: wrap; }
nav a { color: var(--ink); text-decoration: none; font-weight: 600; font-size: 15px; }
nav a:hover { color: var(--accent); }
</style>
