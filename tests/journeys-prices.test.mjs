// Money path: journey launch prices (data/journeysData) and the chatbot
// quoting math (lib/chatbot/sales.js quoteFor).
// Run with: npm test
//
// Launch prices, MXN per person (Donovan, Nov 2026):
//   Luchas $999 · Centro $699 · Antropología $849 · Chapultepec $849
//   Roma $649 · Jamaica $649 · Coyoacán $849 (draft, Casa Azul included)
// If a launch price changes on purpose, update this table AND the data
// module in the same commit — this test is the tripwire, not the source.
import test from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

register(new URL('./helpers/hooks.mjs', import.meta.url))

const { JOURNEYS, JOURNEY_PRICE_MXN } = await import('../data/journeysData.js')
const { quoteFor } = await import('../lib/chatbot/sales.js')

const LAUNCH_PRICES = {
  luchas: 999,
  centro: 699,
  antropologia: 849,
  chapultepec: 849,
  roma: 649,
  jamaica: 649,
  coyoacan: 849,
}

const bySlug = (slug) => JOURNEYS.find((j) => j.slug === slug)

test('every launch journey resolves its launch price', () => {
  for (const [slug, price] of Object.entries(LAUNCH_PRICES)) {
    const j = bySlug(slug)
    assert.ok(j, `journey missing from registry: ${slug}`)
    assert.equal(j.price, price, `${slug} price drifted`)
  }
})

test('no journey falls back to the placeholder price', () => {
  // JOURNEY_PRICE_MXN (100) is only a fallback for a module that forgot
  // to declare its price; no real journey may ever quote it.
  assert.equal(JOURNEY_PRICE_MXN, 100)
  for (const j of JOURNEYS) {
    assert.notEqual(j.price, JOURNEY_PRICE_MXN, `${j.slug} is using the fallback price`)
    assert.ok(Number.isInteger(j.price) && j.price > 0, `${j.slug} price must be a positive integer`)
  }
})

test('quoteFor multiplies the per-person price by guests', () => {
  assert.deepEqual(quoteFor(bySlug('luchas'), 4), { unit: 999, guests: 4, total: 3996 })
  assert.deepEqual(quoteFor(bySlug('roma'), 2), { unit: 649, guests: 2, total: 1298 })
  assert.deepEqual(quoteFor(bySlug('centro'), 1), { unit: 699, guests: 1, total: 699 })
  assert.deepEqual(quoteFor(bySlug('jamaica'), 20), { unit: 649, guests: 20, total: 12980 })
})

test('quoteFor guards: guests below 1 counts as 1; missing journey quotes 0', () => {
  assert.deepEqual(quoteFor(bySlug('luchas'), 0), { unit: 999, guests: 1, total: 999 })
  assert.deepEqual(quoteFor(null, 3), { unit: 0, guests: 3, total: 0 })
})
