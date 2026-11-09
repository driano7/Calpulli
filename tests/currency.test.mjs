// Money path: lib/currency.ts — USD->MXN conversion and formatting.
// Run with: npm test
//
// Business rules locked here:
//  - The whole site displays (and charges) in MXN, in BOTH languages.
//  - The offline fallback rate is 18.65 MXN per USD; the live rate is
//    served by /api/exchange-rate and only replaces this on the client.
//  - Journey amounts are already MXN and must go through formatPriceMXN
//    (no conversion); tour amounts are USD and go through convertPrice.
import test from 'node:test'
import assert from 'node:assert/strict'

const {
  MXN_PER_USD,
  getCurrencyForLocale,
  getCurrencyRate,
  convertPrice,
  formatPriceByLocale,
  formatPriceMXN,
  formatPrice,
} = await import('../lib/currency.ts')

test('fallback rate is 18.65 MXN per USD', () => {
  assert.equal(MXN_PER_USD, 18.65)
  assert.equal(getCurrencyRate('es'), 18.65)
  assert.equal(getCurrencyRate('en'), 18.65)
})

test('display currency is MXN in both locales', () => {
  assert.equal(getCurrencyForLocale('es'), 'MXN')
  assert.equal(getCurrencyForLocale('en'), 'MXN')
})

test('convertPrice multiplies USD by the fallback rate', () => {
  // 18.65 has no exact binary representation: compare to the cent.
  assert.ok(Math.abs(convertPrice(100, 'es') - 1865) < 0.001)
  assert.equal(convertPrice(65, 'en'), 1212.25)
  assert.equal(convertPrice(0, 'es'), 0)
})

test('formatPriceByLocale converts then formats with no cents', () => {
  assert.equal(formatPrice(120, 'es'), '$2,238')
  // Intl renders MXN in en-US with an "MX$" prefix (vs plain "$" in es-MX).
  assert.equal(formatPriceByLocale(65, 'en'), 'MX$1,212')
})

test('formatPriceMXN does NOT convert: the amount is already pesos', () => {
  assert.equal(formatPriceMXN(999, 'es'), '$999')
  assert.equal(formatPriceMXN(3996, 'es'), '$3,996')
  assert.equal(formatPriceMXN(649, 'en'), 'MX$649')
})
