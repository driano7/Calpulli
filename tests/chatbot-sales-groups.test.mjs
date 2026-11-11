// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Chatbot sales layer — group/private triggers (2026-11-11).
// Run: node --test tests/chatbot-sales-groups.test.mjs
// NOTE: lib/chatbot/sales.js is ESM for Next.js with "@/…" imports, so
// plain Node cannot import it directly. We load it by evaluating a
// CJS-transpiled copy with the three imports replaced by stubs (same
// trick as tests/partners.test.mjs).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
function loadSales() {
  const path = fileURLToPath(new URL('../lib/chatbot/sales.js', import.meta.url))
  let src = readFileSync(path, 'utf8')
  src = src.replace(
    /import \{ JOURNEYS, pickLocalized \} from '@\/data\/journeysData'/,
    `const JOURNEYS = [
      { slug: 'luchas', title_es: 'Lucha Libre', title_en: 'Lucha Libre', price: 999, experience: 'luchas' },
      { slug: 'centro', title_es: 'Centro Histórico', title_en: 'Historic Center', price: 699, experience: 'centro' },
      { slug: 'roma', title_es: 'Roma–Condesa', title_en: 'Roma–Condesa', price: 649, experience: 'roma' },
    ]
     const pickLocalized = (es, en, isEs) => (isEs ? es || en : en || es)`
  )
  src = src.replace(
    /import \{ BRAND \} from '@\/lib\/brand'/,
    `const BRAND = { whatsappUrl: 'https://wa.me/525512291607' }`
  )
  src = src.replace(
    /import \{ socialProofLine \} from '@\/lib\/chatbot\/reviews'/,
    `const socialProofLine = () => null`
  )
  src = src.replace(/^export\s+/gm, '')
  src += `\nmodule.exports = { handleSalesMessage, groupPitchLine, MAX_GROUP_GUESTS };\n`
  const mod = { exports: {} }
  const fn = new Function('module', 'exports', src)
  fn(mod, mod.exports)
  return mod.exports
}

const { handleSalesMessage } = loadSales()
const say = (message, isEs = true, history = []) =>
  handleSalesMessage({ message, history, isEs })

test('disparador fuerte ES: "tour privado" responde grupos + WhatsApp, sin precios', () => {
  const r = say('¿Hacen tours privados?')
  assert.equal(r.filtered, 'sales-group-private')
  assert.match(r.reply, /en privado/)
  assert.match(r.reply, /wa\.me\/525512291607/)
  assert.doesNotMatch(r.reply, /\$\s?\d/)
})

test('disparador fuerte ES: ocasión (cumpleaños) con journey detectado', () => {
  const r = say('Es el cumpleaños de mi novia y queremos ir a las luchas')
  assert.equal(r.filtered, 'sales-group-private')
  assert.match(r.reply, /wa\.me\/525512291607/)
})

test('disparador fuerte EN: private + birthday', () => {
  const r = say('Do you offer private tours for a birthday?', false)
  assert.equal(r.filtered, 'sales-group-private')
  assert.match(r.reply, /run privately/)
  assert.doesNotMatch(r.reply, /\$\s?\d/)
})

test('disparador débil ES: "grupo" sin cotización en curso dispara grupos', () => {
  const r = say('¿Cómo es eso para grupos?')
  assert.equal(r.filtered, 'sales-group-private')
})

test('disparador débil NO se traga una cotización: precio para grupo de 8 cotiza y trae la línea 7+', () => {
  const r = say('¿Cuánto cuesta el centro para un grupo de 8?')
  assert.equal(r.filtered, 'sales-quote')
  assert.equal(r.action.guests, 8)
  assert.match(r.reply, /\$5,592/)
  assert.match(r.reply, /igual o más barato/)
})

test('línea 7+ en continuación de cotización (historial con journey, "somos 9")', () => {
  const history = [
    { role: 'user', content: 'Me interesa el journey de Roma' },
    { role: 'assistant', content: '¡Claro! ¿Cuántas personas son?' },
  ]
  const r = say('somos 9', true, history)
  assert.equal(r.filtered, 'sales-quote')
  assert.match(r.reply, /siendo 7 o más/)
})

test('cotización de menos de 7 NO trae la línea del privado', () => {
  const r = say('¿Cuánto cuesta el centro para 5 personas?')
  assert.equal(r.filtered, 'sales-quote')
  assert.doesNotMatch(r.reply, /siendo 7 o más/)
})

test('disparador fuerte con 7+ (empresa, 10 personas) suma la línea 7+', () => {
  const r = say('Somos 10 y es una salida de empresa, ¿qué opciones hay?')
  assert.equal(r.filtered, 'sales-group-private')
  assert.match(r.reply, /siendo 7 o más/)
})

test('flujo normal intacto: precio sin journey ni grupo sigue siendo sales-list/sales-quote sin línea de privado', () => {
  const r = say('¿Cuánto cuesta el centro?')
  assert.equal(r.filtered, 'sales-quote')
  assert.doesNotMatch(r.reply, /en privado puede salirles/)
})

test('EN 7+: quote in English carries the pitch line', () => {
  const r = say('How much is Roma for 9 people?', false)
  assert.equal(r.filtered, 'sales-quote')
  assert.match(r.reply, /\$5,841/)
  assert.match(r.reply, /same or cheaper/)
})
