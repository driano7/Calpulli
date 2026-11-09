// Money path: partner economics at the REAL launch prices
// (lib/partners/pricing.js composed the way pages/api/bookings/cash.js
// composes it: discounted unit price x people = charged total, and the
// attribution keeps original unit price x people).
// Run with: npm test
//
// IMPORTANT — how the code actually rounds (verified, Nov 2026):
// amounts are INTEGER pesos on the storefront. applyDiscount rounds the
// discount to whole pesos, so on a $999 journey the guest pays $899
// (discount $100), NOT $899.10. Commission is then 10% of the discounted
// base, rounded to cents: $89.90 per person on Luchas. These tests assert
// the code's real behavior; if finance ever decides the guest should pay
// $899.10, this file is where the change shows up first.
//
// The generic pricing rules (clamps, slugs, URLs, refunds) are already
// covered by tests/partners.test.mjs — this file only adds the real
// price points and the cash-booking composition.
import test from 'node:test'
import assert from 'node:assert/strict'
import { register } from 'node:module'

register(new URL('./helpers/hooks.mjs', import.meta.url))

const { applyDiscount, calcCommission } = await import('../lib/partners/pricing.js')

// price -> [discountAmount, finalAmount, commissionPerPerson]
const CASES = [
  [999, 100, 899, 89.9], // Luchas
  [699, 70, 629, 62.9], // Centro
  [849, 85, 764, 76.4], // Antropología / Chapultepec / Coyoacán
  [649, 65, 584, 58.4], // Roma / Jamaica
]

test('10% guest discount + 10% commission at every launch price', () => {
  for (const [price, discount, final, commission] of CASES) {
    const d = applyDiscount(price, 0.1)
    assert.equal(d.discountAmount, discount, `discount on ${price}`)
    assert.equal(d.finalAmount, final, `final on ${price}`)
    assert.equal(calcCommission(d.finalAmount, 0.1), commission, `commission on ${price}`)
  }
})

test('cash-booking composition: discounted unit x people, commission on the discounted total', () => {
  // Mirrors pages/api/bookings/cash.js: totalAmount = discountedUnit * peopleCount
  const unit = 999 // Luchas
  const people = 4
  const discountedUnit = applyDiscount(unit, 0.1).finalAmount
  assert.equal(discountedUnit * people, 3596) // what the group pays
  assert.equal(unit * people, 3996) // attribution originalAmount
  assert.equal(calcCommission(discountedUnit * people, 0.1), 359.6) // partner earns
})

test('no partner percentages -> no discount, no commission', () => {
  assert.equal(applyDiscount(999, 0).finalAmount, 999)
  assert.equal(calcCommission(899, 0), 0)
})

test('percentages are capped at 90% by design', () => {
  const d = applyDiscount(1000, 1.5) // a partner configured above the cap
  assert.equal(d.discountPct, 0.9)
  assert.equal(d.finalAmount, 100)
})
