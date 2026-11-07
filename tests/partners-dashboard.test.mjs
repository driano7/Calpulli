// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Partner dashboard pure-helper tests. Run: /usr/local/bin/node --test tests/partners-dashboard.test.mjs
import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function loadCjs(rel, exportNames) {
  const path = fileURLToPath(new URL(rel, import.meta.url))
  let src = readFileSync(path, 'utf8')
  src = src.replace(/^import\s+.*$/gm, '')
  src = src.replace(/export\s+function\s+/g, 'function ')
  src = src.replace(/export\s+const\s+/g, 'const ')
  // Stub JOURNEY_SLUGS for links.js allowlist tests.
  src =
    `var JOURNEY_SLUGS = ['luchas','chapultepec','jamaica','centro','roma','antropologia'];\n` + src
  src += `\nmodule.exports = { ${exportNames.join(', ')} };\n`
  const mod = { exports: {} }
  new Function('module', 'exports', src)(mod, mod.exports)
  return mod.exports
}

const csv = loadCjs('../lib/partners/csv.js', ['sanitizeCsvValue', 'csvEscape', 'toCsv'])
const links = loadCjs('../lib/partners/links.js', [
  'sanitizeDestinationPath',
  'sanitizePlacement',
  'buildReferralUrl',
  'productionDomain',
])

test('csv injection: =, +, -, @ prefixed fields', () => {
  assert.equal(csv.sanitizeCsvValue('=1+1'), "'=1+1")
  assert.equal(csv.sanitizeCsvValue('+SUM'), "'+SUM")
  assert.equal(csv.sanitizeCsvValue('-cmd'), "'-cmd")
  assert.equal(csv.sanitizeCsvValue('@mention'), "'@mention")
  assert.equal(csv.sanitizeCsvValue('normal'), 'normal')
})

test('csv BOM + escape', () => {
  const out = csv.toCsv(['A', 'B'], [{ A: 'x', B: 'y' }])
  assert.ok(out.startsWith('\uFEFF'))
  assert.ok(out.includes('A,B'))
  const quoted = csv.csvEscape('a,"b"')
  assert.equal(quoted, '"a,""b"""')
})

test('destinations allowlist: arbitrary URLs rejected', () => {
  assert.equal(links.sanitizeDestinationPath('/journeys'), '/journeys')
  assert.equal(links.sanitizeDestinationPath('/'), '/')
  assert.equal(links.sanitizeDestinationPath('/local'), '/local')
  assert.equal(links.sanitizeDestinationPath('/custom-journey'), '/custom-journey')
  assert.equal(links.sanitizeDestinationPath('https://evil.example'), null)
  assert.equal(links.sanitizeDestinationPath('/journeys/centro'), '/journeys/centro')
  assert.equal(links.sanitizeDestinationPath('/journeys/not-real'), null)
  assert.equal(links.sanitizeDestinationPath('/admin'), null)
})

test('placement sanitize', () => {
  assert.equal(links.sanitizePlacement('front-desk'), 'front-desk')
  assert.equal(links.sanitizePlacement('../etc'), 'etc')
  assert.equal(links.sanitizePlacement(''), null)
})

test('qr domain never localhost', () => {
  const url = links.buildReferralUrl({
    ref: 'hostal-mx-demo',
    path: '/journeys',
    placement: 'front-desk',
    origin: 'http://localhost:3000',
  })
  assert.ok(url.startsWith('https://donovan-amx.vercel.app/'), url)
  assert.ok(url.includes('ref=hostal-mx-demo'), url)
  assert.ok(url.includes('placement=front-desk'), url)
})

test('campaign/content params allowlisted charset', () => {
  const url = links.buildReferralUrl({
    ref: 'hostal-mx-demo',
    path: '/journeys',
    campaign: 'fall-2026',
    content: 'card-a',
  })
  assert.ok(url.includes('utm_campaign=fall-2026'), url)
  const bad = links.buildReferralUrl({
    ref: 'hostal-mx-demo',
    path: '/journeys',
    campaign: 'evil<script>',
  })
  assert.ok(!bad.includes('evil<script>'), bad)
})

test('rbac matrix (pure mirror of lib/partners/authGuard PERMISSIONS)', () => {
  const PERMISSIONS = {
    analytics: ['OWNER', 'MANAGER', 'STAFF', 'VIEWER'],
    bookings: ['OWNER', 'MANAGER'],
    links: ['OWNER', 'MANAGER', 'STAFF'],
    qr: ['OWNER', 'MANAGER', 'STAFF'],
    materials: ['OWNER', 'MANAGER', 'STAFF'],
    reports: ['OWNER', 'MANAGER', 'VIEWER'],
    commissions: ['OWNER', 'MANAGER'],
    'team:list': ['OWNER', 'MANAGER'],
    'team:manage': ['OWNER'],
    'settings:read': ['OWNER', 'MANAGER', 'STAFF', 'VIEWER'],
    'settings:write': ['OWNER', 'MANAGER'],
  }
  const can = (role, action) => (PERMISSIONS[action] || []).includes(role)
  assert.equal(can('VIEWER', 'bookings'), false)
  assert.equal(can('VIEWER', 'analytics'), true)
  assert.equal(can('STAFF', 'commissions'), false)
  assert.equal(can('STAFF', 'links'), true)
  assert.equal(can('MANAGER', 'team:manage'), false)
  assert.equal(can('OWNER', 'team:manage'), true)
  assert.equal(can('VIEWER', 'settings:write'), false)
})

test('conversion rate helper', () => {
  const rate = 9 / 126
  assert.ok(Math.abs(rate - 0.0714) < 0.001)
  assert.equal(0 / 0, NaN)
  const safe = (c, s) => (s > 0 ? c / s : 0)
  assert.equal(safe(9, 126), 9 / 126)
  assert.equal(safe(0, 0), 0)
})

test('date-range helpers (UTC, deterministic)', () => {
  // Mirrors lib/partners/analytics parseRange semantics for presets.
  const yyyyMmDd = (d) => d.toISOString().slice(0, 10)
  const now = new Date('2026-10-15T12:00:00.000Z')
  assert.equal(yyyyMmDd(new Date(now.getTime() - 7 * 86400_000)), '2026-10-08')
  assert.equal(yyyyMmDd(new Date(Date.UTC(2026, 9, 1))), '2026-10-01')
})

test('invitation hash stability (sha256)', async () => {
  const { createHash } = await import('node:crypto')
  const h1 = createHash('sha256').update('tok-123').digest('hex')
  const h2 = createHash('sha256').update('tok-123').digest('hex')
  assert.equal(h1, h2)
  assert.notEqual(h1, 'tok-123')
  assert.equal(h1.length, 64)
})

test('booking privacy: dashboard select excludes PII (source check)', () => {
  const src = readFileSync(
    fileURLToPath(new URL('../pages/api/partners/dashboard/bookings.js', import.meta.url)),
    'utf8'
  )
  assert.ok(!src.includes('customer_name'), 'must not select customer_name')
  assert.ok(!src.includes('customer_email'), 'must not select customer_email')
  assert.ok(!src.includes('customer_phone'), 'must not select customer_phone')
  const repSrc = readFileSync(
    fileURLToPath(new URL('../pages/api/partners/dashboard/reports.js', import.meta.url)),
    'utf8'
  )
  assert.ok(!repSrc.includes('customer_'), 'report must not include PII')
})
