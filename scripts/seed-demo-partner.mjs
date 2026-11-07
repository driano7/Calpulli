// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Seed Hostal MX Demo partner (idempotent). NEVER creates bookings/events.
// Usage: SEED_DEMO_PARTNER=1 node scripts/seed-demo-partner.mjs
// Also allowed in dev/preview. In production, run only explicitly.
import { createClient } from '@libsql/client'

const url = process.env.TURSO_URL
const authToken = process.env.TURSO_API_KEY
if (!url) throw new Error('TURSO_URL required')
if (process.env.SEED_DEMO_PARTNER !== '1') {
  console.log('Refusing: set SEED_DEMO_PARTNER=1 to seed the demo partner.')
  process.exit(0)
}

const turso = createClient({ url, authToken })

await turso.execute({
  sql: `INSERT OR IGNORE INTO partners (slug, referral_code, name, type, status, guest_discount_pct, commission_pct, attribution_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  args: ['hostal-mx-demo', 'hostalmxdemo', 'Hostal MX Demo', 'HOSTEL', 'ACTIVE', 0.1, 0.1, 30],
})

const row = await turso.execute({
  sql: `SELECT slug, referral_code, status FROM partners WHERE slug = ?`,
  args: ['hostal-mx-demo'],
})
console.log('Demo partner ready:', row.rows[0] || 'unknown')
