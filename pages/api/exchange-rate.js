// GET /api/exchange-rate
//
// Tasa USD -> MXN viva para el sitio, sin llave y sin dependencias:
// consulta open.er-api.com (gratis) y cachea la respuesta 1 hora
// (memoria del proceso + Cache-Control para el borde de Vercel).
// Si la fuente falla, devuelve la tasa de respaldo de lib/currency.ts.
//
// Respuesta: { base: 'USD', quote: 'MXN', rate, source, fetched_at }

import { MXN_PER_USD } from '../../lib/currency'

let cache = { rate: null, at: 0 }
const ONE_HOUR = 3600 * 1000

export default async function handler(req, res) {
  const now = Date.now()

  if (cache.rate && now - cache.at < ONE_HOUR) {
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({
      base: 'USD',
      quote: 'MXN',
      rate: cache.rate,
      source: 'cache',
      fetched_at: new Date(cache.at).toISOString(),
    })
  }

  try {
    const r = await fetch('https://open.er-api.com/v6/latest/USD')
    const data = await r.json()
    const rate = data && data.rates && data.rates.MXN
    if (!rate) throw new Error('Respuesta sin tasa MXN')
    cache = { rate, at: now }
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).json({
      base: 'USD',
      quote: 'MXN',
      rate,
      source: 'open.er-api.com',
      fetched_at: new Date(now).toISOString(),
    })
  } catch (e) {
    res.setHeader('Cache-Control', 'public, s-maxage=300')
    return res.status(200).json({
      base: 'USD',
      quote: 'MXN',
      rate: MXN_PER_USD,
      source: 'fallback',
      fetched_at: new Date(cache.at || now).toISOString(),
    })
  }
}
