import confetti from 'canvas-confetti'

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

const cssVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
export const lineColors = () => ['--l-school', '--l-presidio', '--l-iu', '--l-radcube'].map(cssVar)

/** A confetti burst from an element, in the transit-line colors. Skipped for reduced motion. */
export function burstFrom(el, opts = {}) {
  if (reducedMotion() || !el) return
  const r = el.getBoundingClientRect()
  confetti({
    particleCount: 90,
    spread: 70,
    startVelocity: 38,
    ticks: 160,
    scalar: 0.9,
    colors: lineColors(),
    origin: { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight },
    disableForReducedMotion: true,
    ...opts,
  })
}
