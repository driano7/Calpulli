// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * GET /api/bookings/crypto/status?network=BASE&reference=0x…
 *
 * Estado de un pago cripto para la vigilancia del checkout. Vive en el
 * servidor a propósito:
 *  - La llave del explorador NUNCA viaja al navegador: una variable
 *    NEXT_PUBLIC es visible en el código de la página y cualquiera
 *    podría extraerla y quemar la cuota gratis (100k consultas/día).
 *  - pollPaymentStatus cachea por hash (20 s; 5 min si ya confirmó),
 *    así ni el polling legítimo ni un abuso tocan al explorador de más.
 *  - Límite ligero propio por IP, separado del limitador de reservas
 *    para que vigilar un pago nunca bloquee la confirmación real.
 */
import { pollPaymentStatus } from '@/lib/crypto/verify'
import { WALLETS } from '@/lib/crypto/addresses'

export const config = { runtime: 'nodejs' }

const NETWORKS = ['ETHEREUM', 'BASE', 'ARBITRUM', 'OPTIMISM', 'BITCOIN']
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_IP = 240 // 10 min de polling cada 5 s = 120; margen x2
const hits = new Map()

function lightLimit(req) {
  const ip =
    String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  const now = Date.now()
  const entry = hits.get(ip)
  if (!entry || now - entry.start > WINDOW_MS) {
    hits.set(ip, { start: now, count: 1 })
    return true
  }
  entry.count += 1
  if (hits.size > 1000) hits.clear()
  return entry.count <= MAX_PER_IP
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Method not allowed' })
  }
  if (!lightLimit(req)) {
    return res
      .status(429)
      .json({ error: 'Demasiadas consultas. Espera un momento.' })
  }

  const network = String(req.query.network || '').toUpperCase()
  const reference = String(req.query.reference || '').trim()
  if (!NETWORKS.includes(network) || !reference) {
    return res.status(400).json({ error: 'Parámetros inválidos' })
  }

  const wallet = WALLETS.find((w) => w.network === network)
  const isHash =
    reference.startsWith('0x') ||
    /^[a-fA-F0-9]{64}$/.test(reference) ||
    reference.toLowerCase().includes('mock')

  const result = await pollPaymentStatus({
    network,
    address: wallet?.address,
    txHash: isHash ? reference : undefined,
  })
  return res.status(200).json(result)
}
