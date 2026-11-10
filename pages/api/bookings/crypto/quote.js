// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * POST /api/bookings/crypto/quote
 *
 * Cotización de pago cripto del lado del servidor: calcula el total en MXN
 * desde los precios reales (con descuento de socio si aplica), lo convierte
 * al activo elegido con el tipo de cambio del momento y lo guarda 30 min.
 * La confirmación (POST /api/bookings/crypto) exige que el pago recibido
 * cumpla esta cotización: mismo activo, monto suficiente y fecha posterior.
 */
import { checkRateLimit, rateLimitHeaders } from '@/lib/booking/rateLimit'
import { WALLETS } from '@/lib/crypto/addresses'
import { isCryptoAsset } from '@/lib/crypto/tokens'
import { getMxnRate, quoteAmount } from '@/lib/crypto/rates'
import { createQuote, computeFiatTotal, fingerprintItems } from '@/lib/crypto/quotes'
import { fetchLnurlPayParams, requestLnInvoice } from '@/lib/crypto/lightning'
import { resolvePartnerForRequest } from '@/lib/partners'

export const config = { runtime: 'nodejs' }

const EVM_NETWORKS = ['ETHEREUM', 'BASE', 'ARBITRUM', 'OPTIMISM']

export default async function handler(req, res) {
  const rl = await checkRateLimit(req)
  if (!rl.allowed) {
    return res.status(429).json({
      error: rl.message || 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
      blocked: rl.reason === 'blocked',
      retryAfter: rl.remainingSeconds,
      ...rateLimitHeaders(rl),
    })
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { network, items, locale } = req.body || {}
  const isLightning = network === 'LIGHTNING'
  const asset = isLightning
    ? 'BTC'
    : isCryptoAsset(req.body?.asset)
      ? req.body.asset
      : 'ETH'
  const en = locale === 'en'

  if (!isLightning && !EVM_NETWORKS.includes(network)) {
    return res.status(400).json({ error: en ? 'Unsupported network' : 'Red no soportada' })
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: en ? 'Empty cart' : 'No hay reservas por cotizar' })
  }

  const wallet = WALLETS.find((w) => w.network === network)
  if (!wallet) {
    return res.status(400).json({ error: 'Wallet no configurada para esa red' })
  }

  try {
    const partner = await resolvePartnerForRequest(req, req.body || {})
    const fiatTotal = computeFiatTotal(items, partner)
    if (!(fiatTotal > 0)) {
      return res.status(400).json({ error: en ? 'Invalid total' : 'Total no válido' })
    }

    let rate
    try {
      rate = await getMxnRate(asset)
    } catch {
      return res.status(503).json({
        error: en
          ? 'Exchange rate unavailable. Try again in a moment.'
          : 'Tipo de cambio no disponible. Intenta en un momento.',
      })
    }

    const q = quoteAmount(fiatTotal, asset, rate)

    // Lightning: el servidor genera el invoice real por el monto cotizado
    // (LNURL-pay) y guarda su URL de verificación para la confirmación.
    let lnInvoice = null
    let lnVerifyUrl = null
    if (isLightning) {
      try {
        const params = await fetchLnurlPayParams(wallet.address)
        const issued = await requestLnInvoice(params, Number(q.baseUnits))
        lnInvoice = issued.invoice
        lnVerifyUrl = issued.verifyUrl
      } catch (err) {
        return res.status(502).json({
          error:
            err?.message ||
            (en
              ? 'The Lightning wallet did not issue an invoice.'
              : 'La wallet Lightning no emitió el invoice.'),
        })
      }
      if (!lnVerifyUrl) {
        return res.status(502).json({
          error: en
            ? 'The Lightning wallet does not offer automatic settlement verification.'
            : 'La wallet Lightning no ofrece verificación automática de liquidación.',
        })
      }
    }

    const quote = await createQuote({
      network,
      asset,
      wallet: wallet.address,
      fiatTotal,
      cryptoAmount: q.cryptoAmount,
      baseUnits: q.baseUnits,
      rateMxn: rate,
      fingerprint: fingerprintItems(items),
      partnerId: partner?.id ? String(partner.id) : null,
      lnInvoice,
      lnVerifyUrl,
    })

    return res.status(200).json({
      ok: true,
      quoteId: quote.id,
      network,
      asset,
      wallet: wallet.address,
      fiatTotal,
      fiatCurrency: 'MXN',
      cryptoAmount: quote.cryptoAmount,
      invoice: lnInvoice || undefined,
      expiresAt: quote.expiresAt,
    })
  } catch (error) {
    console.error('[crypto.quote] error:', error)
    return res.status(500).json({ error: 'No pudimos generar la cotización' })
  }
}
