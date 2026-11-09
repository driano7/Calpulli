// Money path: the chatbot's deterministic sales layer (lib/chatbot/sales.js).
// Run with: npm test
//
// This layer is the ONLY source of prices in chat (the LLM is forbidden
// from quoting). These tests lock: guest parsing, quote totals, the
// 20-guest per-departure cap, and the WhatsApp handoff carrying the quote.
import test from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

register(new URL('./helpers/hooks.mjs', import.meta.url))

const sales = await import('../lib/chatbot/sales.js')
const { handleSalesMessage, parseGuests, parseDate, formatMoney, buildWhatsAppHandoff, MAX_GROUP_GUESTS } =
  sales
const { JOURNEYS } = await import('../data/journeysData.js')
const luchas = JOURNEYS.find((j) => j.slug === 'luchas')

test('group cap constant is 20', () => {
  assert.equal(MAX_GROUP_GUESTS, 20)
})

test('parseGuests reads digits and words, ES and EN', () => {
  assert.equal(parseGuests('somos 4 personas'), 4)
  assert.equal(parseGuests('para 2'), 2)
  assert.equal(parseGuests('party of 6'), 6)
  assert.equal(parseGuests('cuatro personas'), 4)
  assert.equal(parseGuests('ten people'), 10)
  assert.equal(parseGuests('hola, buenas tardes'), null)
})

test('parseDate is deterministic given an explicit today', () => {
  assert.equal(parseDate('mañana', '2026-11-09'), '2026-11-10')
  assert.equal(parseDate('15 de diciembre', '2026-11-09'), '2026-12-15')
  // A date already past this year rolls to next year.
  assert.equal(parseDate('5 de enero', '2026-11-09'), '2027-01-05')
  assert.equal(parseDate('December 24', '2026-11-09'), '2026-12-24')
})

test('ES price question quotes per-person and exact total', () => {
  const r = handleSalesMessage({
    message: '¿cuánto cuesta el tour de luchas para 4 personas?',
    history: [],
    isEs: true,
  })
  assert.equal(r.filtered, 'sales-quote')
  assert.equal(r.action.unitPrice, 999)
  assert.equal(r.action.guests, 4)
  assert.equal(r.action.total, 3996)
  assert.equal(r.action.currency, 'MXN')
  assert.ok(r.reply.includes('$3,996'), 'reply must carry the exact total')
})

test('EN price question quotes the same math', () => {
  const r = handleSalesMessage({
    message: 'how much is the Roma tour for 2 people?',
    history: [],
    isEs: false,
  })
  assert.equal(r.filtered, 'sales-quote')
  assert.equal(r.action.unitPrice, 649)
  assert.equal(r.action.total, 1298)
})

test('price question without a journey lists the real prices', () => {
  const r = handleSalesMessage({ message: '¿cuánto cuesta?', history: [], isEs: true })
  assert.equal(r.filtered, 'sales-list')
  assert.ok(r.reply.includes('$999'))
  assert.ok(r.reply.includes('$649'))
})

test('cap: 20 guests still quotes; 21 does NOT quote and goes to WhatsApp', () => {
  const atCap = handleSalesMessage({
    message: 'quiero reservar las luchas para 20 personas',
    history: [],
    isEs: true,
  })
  assert.equal(atCap.filtered, 'sales-quote')
  assert.equal(atCap.action.total, 19980)

  const overCap = handleSalesMessage({
    message: 'quiero reservar las luchas para 21 personas',
    history: [],
    isEs: true,
  })
  assert.equal(overCap.filtered, 'sales-group')
  assert.equal(overCap.action, undefined)
})

test('no sales intent -> null (the conversation stays with the LLM)', () => {
  const r = handleSalesMessage({
    message: 'hola, ¿qué es el centro histórico?',
    history: [],
    isEs: true,
  })
  assert.equal(r, null)
})

test('formatMoney formats MXN totals', () => {
  assert.equal(formatMoney(3996), '$3,996 MXN')
  assert.equal(formatMoney(999), '$999 MXN')
})

test('WhatsApp handoff carries the quote to the official number', () => {
  const url = buildWhatsAppHandoff({
    journey: luchas,
    date: '2026-11-15',
    guests: 4,
    total: 3996,
    unit: 999,
    isEs: true,
  })
  assert.ok(url.startsWith('https://wa.me/525512291607?text='))
  const text = decodeURIComponent(url.split('?text=')[1])
  assert.ok(text.includes('$3,996'))
  assert.ok(text.includes('Personas: 4'))
})
