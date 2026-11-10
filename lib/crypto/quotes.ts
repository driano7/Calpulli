/**
 * Cotizaciones de pago cripto (lado del servidor).
 *
 * Antes de pagar, el checkout pide una cotización: el servidor calcula el
 * total en MXN desde los precios reales (con descuento de socio si aplica),
 * lo convierte a cripto con el tipo de cambio del momento y lo guarda por
 * 30 minutos. Al confirmar, la verificación exige que la transacción
 * recibida sea de ese activo, por al menos ese monto (con tolerancia por
 * comisiones de retiro) y posterior a la cotización. Así un hash real pero
 * de centavos — o de un token cualquiera — ya no liquida una reserva.
 */
import { turso } from '../turso'
import { priceForExperience } from '../partners'
import { applyDiscount } from '../partners/pricing'
import type { CryptoAsset } from './tokens'

export interface QuoteItem {
  experienceId: string
  date?: string
  time?: string
  peopleCount?: number
}

export interface CryptoQuote {
  id: string
  network: string
  asset: CryptoAsset
  wallet: string
  fiatTotal: number
  cryptoAmount: string
  baseUnits: string
  rateMxn: number
  fingerprint: string
  partnerId: string | null
  expiresAt: string
  consumedAt: string | null
  txHash: string | null
  createdAt: string
  lnInvoice: string | null
  lnVerifyUrl: string | null
}

let schemaReady: Promise<void> | null = null

export function ensureCryptoQuoteSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await turso.execute({
        sql: `CREATE TABLE IF NOT EXISTS crypto_quotes (
          id TEXT PRIMARY KEY,
          network TEXT NOT NULL,
          asset TEXT NOT NULL,
          wallet TEXT NOT NULL,
          fiat_total REAL NOT NULL,
          crypto_amount TEXT NOT NULL,
          base_units TEXT NOT NULL,
          rate_mxn REAL NOT NULL,
          fingerprint TEXT NOT NULL,
          partner_id TEXT,
          expires_at TEXT NOT NULL,
          consumed_at TEXT,
          tx_hash TEXT,
          created_at TEXT NOT NULL,
          ln_invoice TEXT,
          ln_verify_url TEXT
        )`,
        args: [],
      })
      // Columnas Lightning para tablas creadas antes de esta versión.
      for (const col of ['ln_invoice', 'ln_verify_url']) {
        try {
          await turso.execute({
            sql: `ALTER TABLE crypto_quotes ADD COLUMN ${col} TEXT`,
            args: [],
          })
        } catch {
          // La columna ya existe: es el caso normal.
        }
      }
    })().catch((err) => {
      schemaReady = null
      throw err
    })
  }
  return schemaReady
}

/** Huella estable del carrito: mismos items ⇒ misma huella. */
export function fingerprintItems(items: QuoteItem[]): string {
  return items
    .map(
      (i) =>
        `${i.experienceId}|${String(i.date || '').slice(0, 10)}|${i.time || ''}|${Math.max(
          1,
          Number(i.peopleCount) || 1
        )}`
    )
    .sort()
    .join(';')
}

/**
 * Total en MXN del carrito con los precios REALES del servidor (nunca los
 * que mande el cliente), aplicando el descuento de socio si hay uno.
 */
export function computeFiatTotal(
  items: QuoteItem[],
  partner: { guestDiscountPct: number } | null
): number {
  let total = 0
  for (const item of items) {
    const people = Math.max(1, Number(item.peopleCount) || 1)
    const unit = priceForExperience(item.experienceId)
    const finalUnit = partner
      ? applyDiscount(unit, partner.guestDiscountPct).finalAmount
      : unit
    total += finalUnit * people
  }
  return Math.round(total * 100) / 100
}

export async function createQuote(data: {
  network: string
  asset: CryptoAsset
  wallet: string
  fiatTotal: number
  cryptoAmount: string
  baseUnits: string
  rateMxn: number
  fingerprint: string
  partnerId: string | null
  ttlMinutes?: number
  lnInvoice?: string | null
  lnVerifyUrl?: string | null
}): Promise<CryptoQuote> {
  await ensureCryptoQuoteSchema()
  const now = new Date()
  const expires = new Date(now.getTime() + (data.ttlMinutes ?? 30) * 60_000)
  const quote: CryptoQuote = {
    id: crypto.randomUUID(),
    network: data.network,
    asset: data.asset,
    wallet: data.wallet,
    fiatTotal: data.fiatTotal,
    cryptoAmount: data.cryptoAmount,
    baseUnits: data.baseUnits,
    rateMxn: data.rateMxn,
    fingerprint: data.fingerprint,
    partnerId: data.partnerId,
    expiresAt: expires.toISOString(),
    consumedAt: null,
    txHash: null,
    createdAt: now.toISOString(),
    lnInvoice: data.lnInvoice ?? null,
    lnVerifyUrl: data.lnVerifyUrl ?? null,
  }
  await turso.execute({
    sql: `INSERT INTO crypto_quotes
            (id, network, asset, wallet, fiat_total, crypto_amount, base_units,
             rate_mxn, fingerprint, partner_id, expires_at, consumed_at, tx_hash, created_at,
             ln_invoice, ln_verify_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, ?)`,
    args: [
      quote.id,
      quote.network,
      quote.asset,
      quote.wallet,
      quote.fiatTotal,
      quote.cryptoAmount,
      quote.baseUnits,
      quote.rateMxn,
      quote.fingerprint,
      quote.partnerId,
      quote.expiresAt,
      quote.createdAt,
      quote.lnInvoice,
      quote.lnVerifyUrl,
    ],
  })
  return quote
}

export async function getQuote(id: string): Promise<CryptoQuote | null> {
  await ensureCryptoQuoteSchema()
  const res = await turso.execute({
    sql: `SELECT * FROM crypto_quotes WHERE id = ?`,
    args: [id],
  })
  const row: any = res.rows[0]
  if (!row) return null
  return {
    id: String(row.id),
    network: String(row.network),
    asset: String(row.asset) as CryptoAsset,
    wallet: String(row.wallet),
    fiatTotal: Number(row.fiat_total) || 0,
    cryptoAmount: String(row.crypto_amount),
    baseUnits: String(row.base_units),
    rateMxn: Number(row.rate_mxn) || 0,
    fingerprint: String(row.fingerprint),
    partnerId: row.partner_id ? String(row.partner_id) : null,
    expiresAt: String(row.expires_at),
    consumedAt: row.consumed_at ? String(row.consumed_at) : null,
    txHash: row.tx_hash ? String(row.tx_hash) : null,
    createdAt: String(row.created_at),
    lnInvoice: row.ln_invoice ? String(row.ln_invoice) : null,
    lnVerifyUrl: row.ln_verify_url ? String(row.ln_verify_url) : null,
  }
}

/** Marca la cotización como usada. Devuelve false si ya estaba consumida. */
export async function consumeQuote(id: string, txHash: string): Promise<boolean> {
  await ensureCryptoQuoteSchema()
  const res = await turso.execute({
    sql: `UPDATE crypto_quotes SET consumed_at = ?, tx_hash = ?
          WHERE id = ? AND consumed_at IS NULL`,
    args: [new Date().toISOString(), txHash, id],
  })
  return Number((res as any).rowsAffected || 0) > 0
}
