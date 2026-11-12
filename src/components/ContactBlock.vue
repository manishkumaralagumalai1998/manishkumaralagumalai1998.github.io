<script setup>
import { ref } from 'vue'
import { EMAIL, LINKEDIN } from '../data/journey.js'
import { burstFrom } from '../lib/fx.js'

const emailEl = ref(null)
const toast = ref('')
let timer

function say(msg) {
  toast.value = msg
  clearTimeout(timer)
  timer = setTimeout(() => (toast.value = ''), 2600)
}

async function copy(e) {
  const btn = e.currentTarget
  try {
    await navigator.clipboard.writeText(EMAIL)
    say('Email copied. Talk soon!')
    burstFrom(btn)
  } catch {
    const range = document.createRange()
    range.selectNodeContents(emailEl.value)
    const sel = getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    say('Email selected: copy it from the page')
  }
}
</script>

<template>
  <footer id="contact" class="contact">
    <h2>Let's talk.</h2>
    <p>I'm looking for full-stack, frontend and AI product engineering roles in the US, remote or on site.</p>
    <div class="row">
      <span ref="emailEl" class="email">{{ EMAIL }}</span>
      <button type="button" class="btn solid" @click="copy">Copy email</button>
      <a class="btn" :href="LINKEDIN" target="_blank" rel="noopener">LinkedIn</a>
    </div>
    <p class="edu">
      M.S., Intelligent Systems Engineering, Indiana University Bloomington (2025) ·
      B.E., Computer Science and Engineering, Velammal College of Engineering and Technology (2019)
    </p>
  </footer>
  <div v-if="toast" class="toast" role="status">{{ toast }}</div>
</template>

<style scoped>
.contact { margin-top: 80px; background: radial-gradient(120% 140% at 0% 0%, rgba(95,212,255,.14), transparent 55%), var(--paper); color: var(--ink); border: 1px solid var(--rule); border-radius: 8px; padding: clamp(24px, 4vw, 48px); display: grid; gap: 18px; }
h2 { font-size: clamp(34px, 5vw, 60px); font-weight: 900; letter-spacing: -0.02em; line-height: 1; }
p { margin: 0; max-width: 60ch; opacity: 0.85; }
.row { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; }
.email { font-family: var(--mono); font-size: clamp(14px, 2vw, 18px); user-select: all; overflow-wrap: anywhere; margin-right: 6px; }
.edu { font-size: 14px; opacity: 0.7; padding-top: 10px; border-top: 1px solid var(--rule); max-width: none; }
</style>
