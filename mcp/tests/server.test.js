// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Tests para MCP server: inputs válidos/inválidos, filtros, datos faltantes, secretos, consistencia.
// Uso: node --test mcp/tests/
const { test } = require('node:test')
const assert = require('node:assert')
const { spawn } = require('child_process')
const path = require('path')

const root = path.join(__dirname, '..', '..')

function startServer() {
  const proc = spawn('node', [path.join(root, 'mcp', 'server.js')], {
    stdio: ['pipe', 'pipe', 'inherit'],
  })
  let buffer = ''
  const pending = new Map()
  let nextId = 1

  proc.stdout.on('data', (chunk) => {
    buffer += chunk.toString()
    const lines = buffer.split('\n')
    buffer = lines.pop()
    for (const line of lines) {
      if (!line.trim()) continue
      try {
        const msg = JSON.parse(line)
        if (msg.id && pending.has(msg.id)) {
          pending.get(msg.id)(msg)
          pending.delete(msg.id)
        }
      } catch {
        /* noop */
      }
    }
  })

  function call(method, params) {
    const id = nextId++
    return new Promise((resolve, reject) => {
      pending.set(id, resolve)
      proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
      setTimeout(() => {
        if (pending.has(id)) {
          pending.delete(id)
          reject(new Error(`Timeout for ${method}`))
        }
      }, 10000)
    })
  }

  return { proc, call }
}

test('initialize returns protocol version and capabilities', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('initialize', {})
    // Sin version declarada, el servidor ofrece la mas reciente que soporta.
    assert.equal(res.result.protocolVersion, '2025-06-18')
    // Y si se pide una version concreta que soporta, la respeta.
    const older = await call('initialize', { protocolVersion: '2024-11-05' })
    assert.equal(older.result.protocolVersion, '2024-11-05')
    assert.equal(res.result.serverInfo.name, 'calpulli-mcp')
    assert.ok(res.result.capabilities.tools)
    assert.ok(res.result.capabilities.resources)
    assert.ok(res.result.capabilities.prompts)
  } finally {
    proc.kill()
  }
})

test('tools/list returns every tool with schemas', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/list', {})
    const names = res.result.tools.map((t) => t.name)
    assert.equal(names.length, 20)
    assert.ok(names.includes('search_journeys'))
    assert.ok(names.includes('get_journey_details'))
    for (const t of res.result.tools) {
      assert.ok(t.description, `${t.name} sin descripción`)
      assert.ok(t.inputSchema, `${t.name} sin inputSchema`)
      assert.equal(t.inputSchema.type, 'object')
    }
  } finally {
    proc.kill()
  }
})

test('search_tours with valid filters returns results with provenance', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'search_tours',
      arguments: { language: 'en', limit: 5 },
    })
    assert.equal(res.result.schemaVersion, '1.0.0')
    assert.ok(res.result.retrievedAt)
    assert.ok(res.result.attribution)
    assert.ok(Array.isArray(res.result.data))
    assert.ok(res.result.data.length > 0)
    assert.ok(res.result.data.length <= 5)
    for (const tour of res.result.data) {
      assert.ok(tour.id)
      assert.ok(tour.name)
      assert.ok(tour.provenance)
      assert.ok(tour.provenance.sourceType)
      assert.ok(tour.provenance.freshnessStatus)
    }
  } finally {
    proc.kill()
  }
})

test('search_tours with incompatible filters returns empty + warnings', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'search_tours',
      arguments: { neighborhood: 'NonExistentNeighborhood', language: 'en' },
    })
    assert.equal(res.result.data.length, 0)
    assert.ok(
      res.result.warnings.length > 0 ||
        res.result.missingData.length > 0 ||
        res.result.appliedFilters
    )
  } finally {
    proc.kill()
  }
})

test('get_tour_details with valid id returns full entity', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', { name: 'get_tour_details', arguments: { id: '1' } })
    assert.ok(res.result.id)
    assert.ok(res.result.name)
    assert.ok(res.result.provenance)
    assert.ok(res.result.relations)
  } finally {
    proc.kill()
  }
})

test('get_tour_details with invalid id returns error', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', { name: 'get_tour_details', arguments: { id: '9999' } })
    assert.ok(res.result.error)
    assert.ok(res.result.missingData)
  } finally {
    proc.kill()
  }
})

test('build_half_day_plan returns plan with explanation', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'build_half_day_plan',
      arguments: { neighborhood: 'Roma', language: 'en' },
    })
    assert.ok(res.result.schemaVersion)
    assert.ok(res.result.retrievedAt)
    assert.ok(res.result.options || res.result.alternatives || res.result.appliedRules)
  } finally {
    proc.kill()
  }
})

test('combine_tours_and_places returns related entities', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'combine_tours_and_places',
      arguments: { tourId: 'tour:1', language: 'en' },
    })
    assert.ok(res.result.entity)
    assert.ok(res.result.before || res.result.after || res.result.related)
  } finally {
    proc.kill()
  }
})

test('suggest_for_weather returns filtered results', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'suggest_for_weather',
      arguments: { condition: 'rainy', language: 'en' },
    })
    assert.ok(res.result.appliedWeather)
    assert.ok(res.result.note)
  } finally {
    proc.kill()
  }
})

test('explain_recommendation returns matched/missed filters', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'explain_recommendation',
      arguments: { tourId: 'tour:1', userPreferences: { interests: ['history'], language: 'en' } },
    })
    assert.ok(Array.isArray(res.result.matched))
    assert.ok(Array.isArray(res.result.missed))
    assert.ok(res.result.note)
  } finally {
    proc.kill()
  }
})

test('resources/list returns all resources', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('resources/list', {})
    const uris = res.result.resources.map((r) => r.uri)
    assert.ok(uris.includes('calpulli://tours'))
    assert.ok(uris.includes('calpulli://taxonomies'))
    assert.ok(uris.includes('calpulli://knowledge-graph'))
    assert.ok(uris.includes('calpulli://data-policy'))
    assert.ok(uris.includes('calpulli://attribution'))
  } finally {
    proc.kill()
  }
})

test('resources/read calpulli://tours returns tour list', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('resources/read', { uri: 'calpulli://tours' })
    assert.ok(res.result.entity === 'tours' || res.result.items)
  } finally {
    proc.kill()
  }
})

test('prompts/list returns 5 prompts', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('prompts/list', {})
    assert.equal(res.result.prompts.length, 5)
    const names = res.result.prompts.map((p) => p.name)
    assert.ok(names.includes('plan-first-visit-to-cdmx'))
    assert.ok(names.includes('build-half-day-plan'))
    assert.ok(names.includes('combine-tour-with-nearby-activities'))
    assert.ok(names.includes('explain-tour-match'))
    assert.ok(names.includes('plan-around-existing-booking'))
  } finally {
    proc.kill()
  }
})

test('prompts/get returns prompt with tools and resources', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('prompts/get', {
      name: 'plan-first-visit-to-cdmx',
      arguments: { days: 3 },
    })
    assert.ok(res.result.tools)
    assert.ok(res.result.resources)
    assert.ok(res.result.instructions)
  } finally {
    proc.kill()
  }
})

test('unknown tool returns error', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', { name: 'nonexistent_tool', arguments: {} })
    assert.ok(res.error)
    assert.equal(res.error.code, -32602)
  } finally {
    proc.kill()
  }
})

test('unknown method returns error', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('nonexistent/method', {})
    assert.ok(res.error)
    assert.equal(res.error.code, -32601)
  } finally {
    proc.kill()
  }
})

test('no secrets in any response', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'search_tours',
      arguments: { language: 'en', limit: 3 },
    })
    const raw = JSON.stringify(res.result)
    assert.ok(!/sk-[A-Za-z0-9]{10,}/.test(raw), 'possible API key leak')
    assert.ok(!/ghp_[A-Za-z0-9]+/.test(raw), 'possible GitHub token leak')
    assert.ok(!/TURSO_|STRIPE_SECRET|OPENROUTER_API_KEY/.test(raw), 'admin key leak')
  } finally {
    proc.kill()
  }
})

test('results have no opaque scores', async () => {
  const { proc, call } = startServer()
  try {
    const res = await call('tools/call', {
      name: 'search_tours',
      arguments: { language: 'en', limit: 5 },
    })
    const raw = JSON.stringify(res.result)
    assert.ok(!/score["']?\s*:\s*\d/.test(raw), 'opaque score found')
    assert.ok(!/bestMatch/.test(raw), 'bestMatch found')
    assert.ok(!/authenticity/.test(raw), 'authenticity score found')
  } finally {
    proc.kill()
  }
})
