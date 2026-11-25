// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Mail rendering & resilience regression tests.
// Run: node --test tests/mail-rendering-regression.test.cjs
const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const Module = require('node:module')
const ts = require('typescript')

const ROOT = path.resolve(__dirname, '..')

function createMailTestHarness({
  tursoExecute,
  brevoSend,
  env = {},
} = {}) {
  const prevEnv = { ...process.env }
  Object.assign(process.env, {
    MAIL_ENABLED: 'true',
    MAIL_PROVIDER: 'brevo',
    BREVO_API_KEY: 'test-brevo-key',
    BREVO_SENDER_EMAIL: 'hola@calpulli-cdmx.com',
    BREVO_SENDER_NAME: 'Calpulli CDMX',
    NEXT_PUBLIC_SITE_URL: 'https://calpulli-cdmx.com',
    ...env,
  })

  const cache = new Map()
  const originalLoad = Module._load

  function loadTsFile(absPath) {
    if (cache.has(absPath)) return cache.get(absPath).exports
    const source = fs.readFileSync(absPath, 'utf8')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
      fileName: absPath,
    })
    const mod = new Module(absPath)
    mod.filename = absPath
    mod.paths = Module._nodeModulePaths(path.dirname(absPath))
    cache.set(absPath, mod)
    mod._compile(outputText, absPath)
    return mod.exports
  }

  Module._load = function patchedLoad(request, parent, isMain) {
    if (request === '../turso' || request.endsWith('/lib/turso')) {
      return {
        turso: {
          execute: tursoExecute || (async () => ({ rows: [] })),
        },
      }
    }
    if (request === './brevo' || request.endsWith('/lib/mail/brevo')) {
      return {
        BrevoError: class BrevoError extends Error {},
        sendBrevoEmail:
          brevoSend || (async () => ({ messageId: '<test-msg-id@brevo.test>' })),
      }
    }
    if (request === 'nodemailer') {
      return {
        createTransport: () => ({
          sendMail: async () => ({ messageId: '<smtp-test@local>' }),
        }),
      }
    }

    if (parent && parent.filename && parent.filename.startsWith(ROOT)) {
      const baseDir = path.dirname(parent.filename)
      const resolvedTs = path.resolve(baseDir, `${request}.ts`)
      if (request.startsWith('.') && fs.existsSync(resolvedTs)) {
        return loadTsFile(resolvedTs)
      }
    }
    return originalLoad.apply(this, arguments)
  }

  try {
    const service = loadTsFile(path.join(ROOT, 'lib/mail/service.ts'))
    const bookingNotice = loadTsFile(path.join(ROOT, 'lib/mail/bookingNotice.ts'))
    const brand = loadTsFile(path.join(ROOT, 'lib/brand.ts'))
    return {
      service,
      bookingNotice,
      brand,
      restore: () => {
        Module._load = originalLoad
        process.env = prevEnv
      },
    }
  } catch (err) {
    Module._load = originalLoad
    process.env = prevEnv
    throw err
  }
}

test('getTemplate() preserves {{firstName}} and {{siteUrl}} from fallback (no DB row)', async () => {
  const harness = createMailTestHarness({
    tursoExecute: async () => ({ rows: [] }),
  })
  try {
    const tpl = await harness.service.getTemplate('welcome', 'es')
    assert.ok(tpl)
    assert.match(tpl.html, /\{\{firstName\}\}/)
    assert.match(tpl.html, /\{\{siteUrl\}\}/)
    assert.match(tpl.text, /\{\{firstName\}\}/)
    assert.match(tpl.text, /\{\{siteUrl\}\}/)
    assert.ok(tpl.html.includes('color-scheme'))
    assert.ok(tpl.html.includes('prefers-color-scheme: dark'))
  } finally {
    harness.restore()
  }
})

test('getTemplate() preserves {{firstName}} and {{siteUrl}} from DB row', async () => {
  const harness = createMailTestHarness({
    tursoExecute: async ({ sql }) => {
      if (sql.includes('FROM email_templates')) {
        return {
          rows: [
            {
              key: 'welcome',
              label: 'Bienvenida',
              description: 'desc',
              subject: 'Hola {{firstName}} en {{siteUrl}}',
              html: '<p>Hola {{firstName}}, visita <a href="{{siteUrl}}/journeys">aquí</a></p>',
              text: 'Hola {{firstName}} -> {{siteUrl}}/journeys',
              is_active: 1,
              updated_at: null,
            },
          ],
        }
      }
      return { rows: [] }
    },
  })
  try {
    const tpl = await harness.service.getTemplate('welcome', 'es')
    assert.ok(tpl)
    assert.match(tpl.subject, /\{\{firstName\}\}/)
    assert.match(tpl.subject, /\{\{siteUrl\}\}/)
    assert.match(tpl.html, /\{\{firstName\}\}/)
    assert.match(tpl.html, /\{\{siteUrl\}\}/)
    assert.match(tpl.text, /\{\{firstName\}\}/)
    assert.match(tpl.text, /\{\{siteUrl\}\}/)
  } finally {
    harness.restore()
  }
})

test('sendMail() renders subject, html and text with variables and sends via Brevo', async () => {
  let captured = null
  const harness = createMailTestHarness({
    tursoExecute: async ({ sql }) => {
      if (sql.includes('FROM email_templates')) {
        return {
          rows: [
            {
              key: 'welcome',
              label: 'Bienvenida',
              description: 'desc',
              subject: 'Bienvenido {{firstName}}',
              html: '<p>Hola {{firstName}}, explora {{siteUrl}}/journeys</p>',
              text: 'Hola {{firstName}} en {{siteUrl}}/journeys',
              is_active: 1,
              updated_at: null,
            },
          ],
        }
      }
      return { rows: [] }
    },
    brevoSend: async (payload) => {
      captured = payload
      return { messageId: '<msg-123@brevo>' }
    },
  })
  try {
    const res = await harness.service.sendMail('welcome', {
      to: 'viajera@example.com',
      locale: 'es',
      vars: {
        firstName: 'Isis',
        siteUrl: 'https://calpulli-cdmx.com',
      },
    })
    assert.equal(res.status, 'sent')
    assert.equal(res.providerId, '<msg-123@brevo>')
    assert.ok(captured)
    assert.equal(captured.subject, 'Bienvenido Isis')
    assert.equal(captured.html, '<p>Hola Isis, explora https://calpulli-cdmx.com/journeys</p>')
    assert.equal(captured.text, 'Hola Isis en https://calpulli-cdmx.com/journeys')
  } finally {
    harness.restore()
  }
})

test('sendMail() returns status: "failed" without throwing when Turso read fails', async () => {
  const harness = createMailTestHarness({
    tursoExecute: async () => {
      throw new Error('Turso connection refused')
    },
  })
  try {
    const res = await harness.service.sendMail('welcome', {
      to: 'viajera@example.com',
      vars: { firstName: 'Isis' },
    })
    assert.equal(res.status, 'failed')
    assert.match(res.reason || '', /Turso connection refused/)
  } finally {
    harness.restore()
  }
})

test('notifyBooking() uses BRAND.social.whatsapp and real booking.meetingPoint when present', async () => {
  const sentPayloads = []
  const harness = createMailTestHarness({
    tursoExecute: async () => ({ rows: [] }),
    brevoSend: async (payload) => {
      sentPayloads.push(payload)
      return { messageId: '<booking-msg@brevo>' }
    },
  })
  try {
    await harness.bookingNotice.notifyBooking(
      {
        bookingReference: 'CDMX-999',
        customerName: 'Ana López',
        experienceTitle: 'Centro Histórico — El futuro se pintó aquí',
        startDate: '2026-12-01',
        time: '10:00',
        guests: 2,
        totalAmount: 200,
        currency: 'MXN',
        meetingPoint: 'Palacio de Bellas Artes, puerta principal',
        tickets: [{ ticketCode: 'TKT-1', participantName: 'Ana López', isResponsible: true }],
      },
      {
        paymentMethod: 'cash',
        customerPhone: '+525599998888',
        userEmail: 'ana@example.com',
        locale: 'es',
      }
    )
    assert.equal(sentPayloads.length, 1)
    assert.ok(sentPayloads[0].html.includes(harness.brand.BRAND.social.whatsapp))
    assert.ok(!sentPayloads[0].html.includes('525599998888'))
    assert.ok(sentPayloads[0].html.includes('Palacio de Bellas Artes, puerta principal'))
  } finally {
    harness.restore()
  }
})
