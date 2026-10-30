// Editorial language transition for the whole site.
//
// The current page content is snapshotted (cloned) before the language swap.
// Only text-bearing blocks fade/blur: headings, paragraphs, labels, list
// items… Images, illustrations and backgrounds stay perfectly sharp because
// they are never animated. The outgoing copy loses opacity and focus while
// the incoming copy resolves from a soft blur in the exact same position.
// No translation, no per-word effects and no travel.

const EASE = 'cubic-bezier(0.22, 1, 0.36, 1)'
const BLUR = 3.5
const EXIT_MS = 160
const ENTER_MS = 500
const ENTER_DELAY_MS = 40
const CLEANUP_MS = 700
const SKIP_TAGS = new Set([
  'SCRIPT',
  'STYLE',
  'NOSCRIPT',
  'TEMPLATE',
  'SVG',
  'CANVAS',
  'VIDEO',
  'AUDIO',
  'IFRAME',
  'IMG',
  'PICTURE',
  'BR',
  'HR',
  'INPUT',
  'TEXTAREA',
  'SELECT',
  'OPTION',
])

const ENTER_ATTR = 'data-lang-text-enter'
const EXIT_ATTR = 'data-lang-text-exit'
const CLONE_OUT_ATTR = 'data-lang-clone-out'
const CLONE_ATTR = 'data-lang-transition-clone'

const TRANSITION_STYLES = `
@keyframes calpulliLangEnter {
  from { opacity: 0; filter: blur(${BLUR}px); }
  to { opacity: 1; filter: blur(0px); }
}
@keyframes calpulliLangExit {
  from { opacity: 1; filter: blur(0px); }
  to { opacity: 0; filter: blur(${BLUR}px); }
}
@keyframes calpulliLangCloneOut {
  from { opacity: 1; }
  to { opacity: 0; }
}
[${ENTER_ATTR}] {
  animation: calpulliLangEnter ${ENTER_MS}ms ${EASE} ${ENTER_DELAY_MS}ms both;
}
[${EXIT_ATTR}] {
  animation: calpulliLangExit ${EXIT_MS}ms ${EASE} both;
}
[${CLONE_OUT_ATTR}] {
  animation: calpulliLangCloneOut ${EXIT_MS}ms ${EASE} both;
}
@media (prefers-reduced-motion: reduce) {
  [${ENTER_ATTR}], [${EXIT_ATTR}], [${CLONE_OUT_ATTR}] {
    animation-duration: 1ms !important;
    animation-delay: 0ms !important;
  }
}
`

export function prefersReducedMotion() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function getTransitionSections() {
  if (typeof document === 'undefined') return []

  const candidates = [
    ...Array.from(document.querySelectorAll('main > *')),
    ...Array.from(document.querySelectorAll('footer')),
  ]

  return Array.from(new Set(candidates)).filter((el) => {
    if (!el || SKIP_TAGS.has(el.tagName)) return false
    if (el.hasAttribute('data-lang-transition-skip')) return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  })
}

/**
 * Collects the topmost elements that own visible text. Descendants are not
 * visited once a text owner is found: its whole text run fades as one block,
 * so inline markup keeps a single, coherent transition.
 */
function collectTextBlocks(root, out) {
  if (!root || !root.children) return out

  const walk = (el) => {
    if (!el || el.nodeType !== 1) return
    if (SKIP_TAGS.has(el.tagName)) return
    if (el.hasAttribute('data-lang-transition-skip')) return
    // The clone root is marked aria-hidden on purpose: it is the snapshot
    // layer, not decorative content, so it must still be inspected.
    if (el !== root && el.getAttribute('aria-hidden') === 'true') return

    let ownsText = false
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim()) {
        ownsText = true
        break
      }
    }

    if (ownsText) {
      const rect = el.getBoundingClientRect()
      const styles = window.getComputedStyle(el)
      const visible =
        rect.width > 0 &&
        rect.height > 0 &&
        styles.display !== 'none' &&
        styles.visibility !== 'hidden' &&
        Number(styles.opacity) > 0

      if (visible) out.push(el)
      return
    }

    for (const child of el.children) walk(child)
  }

  walk(root)
  return out
}

/**
 * @param {() => void} commit - applies the new language synchronously
 * @param {() => void} [onDone] - called once the crossfade has finished
 */
export function runLanguageTransition(commit, onDone) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    commit()
    onDone?.()
    return
  }

  const sections = getTransitionSections()

  if (!sections.length) {
    commit()
    onDone?.()
    return
  }

  const layer = document.createElement('div')
  layer.setAttribute('aria-hidden', 'true')
  layer.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:0;z-index:30;pointer-events:none;overflow:visible;'
  document.body.appendChild(layer)

  const style = document.createElement('style')
  style.textContent = TRANSITION_STYLES
  layer.appendChild(style)

  const clones = []
  const liveTextBlocks = []

  sections.forEach((section) => {
    const rect = section.getBoundingClientRect()
    const computed = window.getComputedStyle(section)
    const clone = section.cloneNode(true)

    clone.querySelectorAll('script').forEach((script) => script.remove())
    clone.setAttribute('aria-hidden', 'true')
    clone.setAttribute('inert', '')
    clone.setAttribute(CLONE_ATTR, '')

    // Snapshot the section at its exact position and size.
    clone.style.position = 'absolute'
    clone.style.top = `${rect.top + window.scrollY}px`
    clone.style.left = `${rect.left + window.scrollX}px`
    clone.style.width = `${rect.width}px`
    clone.style.height = `${rect.height}px`
    clone.style.margin = '0'
    clone.style.zIndex = '30'
    clone.style.pointerEvents = 'none'
    clone.style.overflow = 'hidden'
    clone.style.opacity = '1'
    clone.style.fontFamily = computed.fontFamily
    clone.style.fontSize = computed.fontSize
    clone.style.lineHeight = computed.lineHeight
    clone.style.letterSpacing = computed.letterSpacing
    clone.style.color = computed.color
    clone.style.textAlign = computed.textAlign

    layer.appendChild(clone)
    clones.push(clone)

    collectTextBlocks(section, liveTextBlocks)
  })

  let cloneTextBlocks = []
  clones.forEach((clone) => {
    cloneTextBlocks = collectTextBlocks(clone, cloneTextBlocks)
  })

  try {
    commit()
  } catch (error) {
    layer.remove()
    throw error
  }

  // Applied in the same task as the commit, so the new copy never paints at
  // full opacity before its fade-in starts.
  liveTextBlocks.forEach((el) => el.setAttribute(ENTER_ATTR, ''))
  cloneTextBlocks.forEach((el) => el.setAttribute(EXIT_ATTR, ''))
  clones.forEach((clone) => clone.setAttribute(CLONE_OUT_ATTR, ''))

  window.setTimeout(() => {
    liveTextBlocks.forEach((el) => el.removeAttribute(ENTER_ATTR))
    layer.remove()
    onDone?.()
  }, CLEANUP_MS)
}
