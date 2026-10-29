// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Rate limiter simple en memoria para proteger endpoints de reserva contra bots/crapping.
//
// Almacena los timestamps de cada petición por IP. Si una IP hace más de
// MAX_REQUESTS dentro de WINDOW_MS, se bloquea temporalmente.
//
// Notas:
// - No persiste en disco: al reiniciar el servidor se resetea (aceptable para MVP).
// - En producción detrás de proxy (Vercel), usar req.headers['x-forwarded-for'].
// - Para algo más robusto, usar Redis (ver abajo en comentarios).

const MAX_REQUESTS = 50            // Máximo de reservas permitidas
const WINDOW_MS = 10 * 60 * 1000   // Ventana de 10 minutos
const BLOCK_MS = 60 * 60 * 1000    // Bloqueo de 1 hora si se excede

// IP -> { timestamps: number[], blockedUntil: number }
const ipRecords = new Map()

function getClientIP(req) {
  // Detrás de proxy (Vercel, Cloudflare, etc.)
  const forwarded = req.headers['x-forwarded-for']
  if (forwarded) {
    return String(forwarded).split(',')[0].trim()
  }
  return req.socket?.remoteAddress || 'unknown'
}

export function checkRateLimit(req) {
  const ip = getClientIP(req)
  const now = Date.now()
  const record = ipRecords.get(ip) || { timestamps: [], blockedUntil: 0 }

  // Si está bloqueado, verificar si ya pasó el tiempo de bloqueo
  if (record.blockedUntil > now) {
    const remainingSeconds = Math.ceil((record.blockedUntil - now) / 1000)
    return {
      allowed: false,
      reason: 'blocked',
      remainingSeconds,
      message: `Demasiadas solicitudes. IP bloqueada por 1 hora. Intenta de nuevo en ${remainingSeconds}s.`,
    }
  }

  // Filtrar timestamps fuera de la ventana
  record.timestamps = record.timestamps.filter((t) => now - t < WINDOW_MS)

  if (record.timestamps.length >= MAX_REQUESTS) {
    // Bloquear la IP
    record.blockedUntil = now + BLOCK_MS
    ipRecords.set(ip, record)
    return {
      allowed: false,
      reason: 'rate_limited',
      remainingSeconds: Math.ceil(BLOCK_MS / 1000),
      message: `Se ha excedido el límite de ${MAX_REQUESTS} reservas por ${WINDOW_MS / 60000} minutos. IP bloqueada por 1 hora.`,
    }
  }

  // Registrar la petición
  record.timestamps.push(now)
  ipRecords.set(ip, record)

  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.timestamps.length,
  }
}

export function getRateLimitStatus(req) {
  const ip = getClientIP(req)
  const record = ipRecords.get(ip)
  if (!record) return { allowed: true, remaining: MAX_REQUESTS }
  const now = Date.now()
  if (record.blockedUntil > now) {
    return { allowed: false, reason: 'blocked', remainingSeconds: Math.ceil((record.blockedUntil - now) / 1000) }
  }
  const valid = record.timestamps.filter((t) => now - t < WINDOW_MS).length
  return { allowed: true, remaining: Math.max(0, MAX_REQUESTS - valid) }
}

/*
 * Para producción con Redis (recomendado):
 * --------------------------------
 * Importar ioredis y usar INCR + EXPIRE por IP:
 *
 * const Redis = require('ioredis')
 * const redis = new Redis(process.env.REDIS_URL)
 *
 * export async function checkRateLimitRedis(req) {
 *   const ip = getClientIP(req)
 *   const key = `ratelimit:${ip}`
 *   const count = await redis.incr(key)
 *   if (count === 1) await redis.expire(key, WINDOW_MS / 1000)
 *   if (count > MAX_REQUESTS) {
 *     await redis.setex(`block:${ip}`, BLOCK_MS / 1000, '1')
 *     return { allowed: false, reason: 'blocked' }
 *   }
 *   return { allowed: true, remaining: MAX_REQUESTS - count }
 * }
 */
