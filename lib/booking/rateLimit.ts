// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Rate limiter para proteger endpoints de reserva contra bots/crapping.
//
// Usa Redis (Vercel KV o Upstash/Redis genérico) cuando las variables de
// entorno están presentes, con fallback a memoria local para desarrollo.
//
// Variables de entorno soportadas:
//   KV_REST_API_URL + KV_REST_API_TOKEN   -> Vercel KV (REST API)
//   REDIS_URL                             -> Upstash o cualquier Redis compatible
//
// En producción serverless (Vercel con múltiples instancias), Redis es
// obligatorio para compartir el contador entre instancias.

const MAX_REQUESTS = 50            // Máximo de reservas permitidas
const WINDOW_MS = 10 * 60 * 1000   // Ventana de 10 minutos
const BLOCK_MS = 60 * 60 * 1000    // Bloqueo de 1 hora si se excede

// IP -> { timestamps: number[], blockedUntil: number }  (fallback memoria)
const ipRecords = new Map()

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return String(forwarded).split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

/* ─── Redis / Vercel KV client ─── */
let redisClient: any = null
let redisReady = false

function initRedis() {
  if (redisReady) return redisClient

  const kvUrl = process.env.KV_REST_API_URL
  const kvToken = process.env.KV_REST_API_TOKEN
  const redisUrl = process.env.REDIS_URL

  if (kvUrl && kvToken) {
    // Vercel KV REST API (no requiere paquete npm adicional)
    redisClient = {
      type: 'vercel-kv',
      base: kvUrl.replace(/\/$/, ''),
      headers: { Authorization: `Bearer ${kvToken}` },
    }
    redisReady = true
    return redisClient
  }

  if (redisUrl) {
    try {
      // Intento de importar ioredis (paquete opcional: npm i ioredis)
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const IORedis = require('ioredis')
      redisClient = new IORedis(redisUrl)
      redisClient.on('error', () => void 0)
      redisReady = true
      return redisClient
    } catch {
      // ioredis no instalado: caer a memoria local
      redisClient = null
      redisReady = true
      return null
    }
  }

  redisReady = true
  return null
}

async function redisIncr(key: string): Promise<number | null> {
  const client = initRedis()
  if (!client) return null

  if (client.type === 'vercel-kv') {
    // Vercel KV REST: INCR via /{key} con método POST y body type=incr
    try {
      const res = await fetch(`${client.base}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { ...client.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'incr' }),
      })
      if (!res.ok) return null
      const data = await res.json()
      return typeof data?.result === 'number' ? data.result : null
    } catch {
      return null
    }
  }

  // ioredis
  try {
    return await client.incr(key)
  } catch {
    return null
  }
}

async function redisExpire(key: string, seconds: number): Promise<void> {
  const client = initRedis()
  if (!client) return

  if (client.type === 'vercel-kv') {
    try {
      await fetch(`${client.base}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { ...client.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'expire', seconds }),
      })
    } catch {
      void 0
    }
    return
  }

  try {
    await client.expire(key, seconds)
  } catch {
    void 0
  }
}

async function redisSetex(key: string, seconds: number, value: string): Promise<void> {
  const client = initRedis()
  if (!client) return

  if (client.type === 'vercel-kv') {
    try {
      await fetch(`${client.base}/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: { ...client.headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'set', value, ex: seconds }),
      })
    } catch {
      void 0
    }
    return
  }

  try {
    await client.setex(key, seconds, value)
  } catch {
    void 0
  }
}

async function redisGet(key: string): Promise<string | null> {
  const client = initRedis()
  if (!client) return null

  if (client.type === 'vercel-kv') {
    try {
      const res = await fetch(`${client.base}/${encodeURIComponent(key)}`, {
        headers: client.headers,
      })
      if (!res.ok) return null
      const data = await res.json()
      return data?.result ?? null
    } catch {
      return null
    }
  }

  try {
    return await client.get(key)
  } catch {
    return null
  }
}

/* ─── Interfaz de resultado ─── */

interface RateLimitResult {
  allowed: boolean
  reason?: 'rate_limited' | 'blocked'
  remaining?: number        // Cuántas peticiones quedan en la ventana
  remainingSeconds?: number // Segundos de bloqueo restante
  limit?: number
  reset?: number            // Timestamp Unix cuando se resetea la ventana
  message?: string
}

interface RateLimitHeaders {
  'RateLimit-Limit': string
  'RateLimit-Remaining': string
  'RateLimit-Reset': string
  'Retry-After'?: string
}

/* ─── Función principal (async por Redis) ─── */

export async function checkRateLimit(req): Promise<RateLimitResult> {
  const ip = getClientIP(req)
  const now = Date.now()
  const windowStart = Math.floor(now / WINDOW_MS)
  const key = `ratelimit:${ip}`
  const blockKey = `block:${ip}`

  // 1. Verificar si la IP está bloqueada (Redis o memoria)
  let blockedUntil = 0
  const blockRaw = await redisGet(blockKey)
  if (blockRaw !== null && blockRaw !== '') {
    blockedUntil = Number(blockRaw)
  } else {
    const mem = ipRecords.get(ip)
    if (mem?.blockedUntil > now) blockedUntil = mem.blockedUntil
  }

  if (blockedUntil > now) {
    const remainingSeconds = Math.ceil((blockedUntil - now) / 1000)
    return {
      allowed: false,
      reason: 'blocked',
      remainingSeconds,
      limit: MAX_REQUESTS,
      reset: windowStart * 1000 + WINDOW_MS,
      message: `Demasiadas solicitudes. IP bloqueada por 1 hora. Intenta de nuevo en ${remainingSeconds}s.`,
    }
  }

  // 2. Incrementar contador en la ventana actual
  let count: number | null = null
  const memRecord = ipRecords.get(ip) || { timestamps: [], blockedUntil: 0 }

  // Limpiar timestamps viejos de memoria (solo para fallback)
  memRecord.timestamps = memRecord.timestamps.filter((t) => now - t < WINDOW_MS)

  count = await redisIncr(key)
  if (count === null) {
    // Fallback a memoria local
    memRecord.timestamps.push(now)
    ipRecords.set(ip, memRecord)
    count = memRecord.timestamps.length
  }

  // Establecer expiración de la clave en Redis (solo la primera vez de la ventana)
  if (count === 1) {
    await redisExpire(key, Math.ceil(WINDOW_MS / 1000))
  }

  // 3. Verificar si se excedió el límite
  if (count >= MAX_REQUESTS) {
    await redisSetex(blockKey, Math.ceil(BLOCK_MS / 1000), '1')
    if (!initRedis()) {
      ipRecords.get(ip)!.blockedUntil = now + BLOCK_MS
    }
    return {
      allowed: false,
      reason: 'rate_limited',
      remaining: 0,
      limit: MAX_REQUESTS,
      reset: windowStart * 1000 + WINDOW_MS,
      remainingSeconds: Math.ceil(BLOCK_MS / 1000),
      message: `Se ha excedido el límite de ${MAX_REQUESTS} reservas por ${WINDOW_MS / 60000} minutos. IP bloqueada por 1 hora.`,
    }
  }

  return {
    allowed: true,
    remaining: Math.max(0, MAX_REQUESTS - count),
    limit: MAX_REQUESTS,
    reset: windowStart * 1000 + WINDOW_MS,
  }
}

/* ─── Generar headers RateLimit-* para la respuesta 429 ─── */

export function rateLimitHeaders(result: RateLimitResult): RateLimitHeaders {
  const headers: RateLimitHeaders = {
    'RateLimit-Limit': String(result.limit ?? MAX_REQUESTS),
    'RateLimit-Remaining': String(result.remaining ?? 0),
    'RateLimit-Reset': String(Math.floor((result.reset ?? Date.now()) / 1000)),
  }
  if (!result.allowed && result.remainingSeconds) {
    headers['Retry-After'] = String(result.remainingSeconds)
  }
  return headers
}

export async function getRateLimitStatus(req): Promise<RateLimitResult> {
  return checkRateLimit(req)
}

/* Nota: para usar esto en las API routes, cambiar checkRateLimit(req) por
 * await checkRateLimit(req) y agregar los headers RateLimit-* en la respuesta 429:
 *
 *   const rl = await checkRateLimit(req)
 *   if (!rl.allowed) {
 *     return res.status(429).json({
 *       error: rl.message,
 *       ...rateLimitHeaders(rl),
 *     })
 *   }
 */
