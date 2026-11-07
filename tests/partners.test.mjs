// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner referral pricing + validation unit tests.
// Run: /usr/local/bin/node --test tests/partners.test.mjs  (Node 18)
// NOTE: lib/partners/pricing.js is ESM for Next.js (no "type": "module"
// in package.json), so plain Node cannot import it directly. We load it by
// evaluating a CJS-transpiled copy (strip `export`, append module.exports).
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
function loadPricing() {
  const path = fileURLToPath(new URL('../lib/partners/pricing.js', import.meta.url))
  let src = readFileSync(path, 'utf8')
  src = src.replace(/export\s+function\s+/g, 'function ')
  src += `\nmodule.exports = { clampPct, normalizeSlug, normalizeCode, applyDiscount, calcCommission, commissionAfterPartialRefund, isValidWebsiteUrl, isValidLogoUrl, isPartnerActive };\n`
  const mod = { exports: {} }
  const fn = new Function('module', 'exports', src)
  fn(mod, mod.exports)
  return mod.exports
}

const {
  normalizeSlug,
  applyDiscount,
  calcCommission,
  commissionAfterPartialRefund,
  isValidWebsiteUrl,
  isValidLogoUrl,
  isPartnerActive,
  clampPct,
} = loadPricing()

test('slug normalization: lower, dash, strip unsafe', () => {
  assert.equal(normalizeSlug(' Hostal MX '), 'hostal-mx')
  assert.equal(normalizeSlug('hostal--mx'), 'hostal-mx')
  assert.equal(normalizeSlug('javascript:alert(1)'), 'javascriptalert1')
})

test('discount math: 10% off 100 MXN', () => {
  const d = applyDiscount(100, 0.1)
  assert.equal(d.originalAmount, 100)
  assert.equal(d.discountAmount, 10)
  assert.equal(d.finalAmount, 90)
})

test('commission: 10% on discounted base', () => {
  assert.equal(calcCommission(90, 0.1), 9)
  assert.equal(calcCommission(100, 0.1), 10)
  assert.equal(calcCommission(0, 0.1), 0)
})

test('pct clamping: negative -> 0, >90% -> 0.9', () => {
  assert.equal(clampPct(-0.5), 0)
  assert.equal(clampPct(2), 0.9)
  assert.equal(clampPct('nope', 0), 0)
})

test('partial refund: proportional commission', () => {
  // final 90, commission 9, refund 45 -> commission 4.5
  assert.equal(
    commissionAfterPartialRefund({ commissionAmount: 9, finalAmount: 90, refundedAmount: 45 }),
    4.5
  )
  assert.equal(
    commissionAfterPartialRefund({ commissionAmount: 9, finalAmount: 90, refundedAmount: 0 }),
    9
  )
  assert.equal(
    commissionAfterPartialRefund({ commissionAmount: 9, finalAmount: 90, refundedAmount: 90 }),
    0
  )
})

test('website URL: http/https only', () => {
  assert.equal(isValidWebsiteUrl('https://hostal.example'), true)
  assert.equal(isValidWebsiteUrl('http://hostal.example'), true)
  assert.equal(isValidWebsiteUrl('javascript:alert(1)'), false)
  assert.equal(isValidWebsiteUrl('data:text/html,hi'), false)
  assert.equal(isValidWebsiteUrl('not-a-url'), false)
  assert.equal(isValidWebsiteUrl(''), false)
})

test('logo URL: http/https or site-relative', () => {
  assert.equal(isValidLogoUrl('/partners/hostal.svg'), true)
  assert.equal(isValidLogoUrl('https://cdn.example/logo.png'), true)
  assert.equal(isValidLogoUrl('javascript:alert(1)'), false)
  assert.equal(isValidLogoUrl('//evil.example/x.svg'), false)
})

test('partner active: only ACTIVE generates benefits', () => {
  assert.equal(isPartnerActive({ status: 'ACTIVE' }), true)
  assert.equal(isPartnerActive({ status: 'active' }), true)
  assert.equal(isPartnerActive({ status: 'PAUSED' }), false)
  assert.equal(isPartnerActive({ status: 'INACTIVE' }), false)
  assert.equal(isPartnerActive(null), false)
})

test('journey snapshot: original 100, discount 10, final 90, commission 9', () => {
  const original = 100
  const pct = 0.1
  const d = applyDiscount(original, pct)
  const commission = calcCommission(d.finalAmount, 0.1)
  assert.deepEqual(
    { original: d.originalAmount, discount: d.discountAmount, final: d.finalAmount, commission },
    { original: 100, discount: 10, final: 90, commission: 9 }
  )
})
