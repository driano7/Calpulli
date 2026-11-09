// Money path: the cash booking folio (lib/booking/reference.ts).
// Run with: npm test
//
// The folio is what the guest shows and what staff scan at the meeting
// point, so its format is a contract: "CDMX-" + 6 chars from an alphabet
// with NO ambiguous characters (no 0/O, 1/I, 5/S confusion at a glance).
import test from 'node:test'
import assert from 'node:assert/strict'

const { generateBookingReference } = await import('../lib/booking/reference.ts')

const FOLIO_RE = /^CDMX-[A-HJ-NP-RT-Z2-9]{6}$/

test('folio format: CDMX-XXXXXX from the unambiguous alphabet', () => {
  for (let i = 0; i < 200; i++) {
    const ref = generateBookingReference()
    assert.match(ref, FOLIO_RE, `bad folio: ${ref}`)
    assert.equal(ref.length, 11)
    assert.ok(!/[01IOS]/.test(ref.slice(5)), `ambiguous char in ${ref}`)
  }
})

test('folios are unique in practice', () => {
  const seen = new Set()
  for (let i = 0; i < 200; i++) seen.add(generateBookingReference())
  assert.equal(seen.size, 200)
})
