/**
 * Tipo de cambio MXN por activo, del lado del servidor (CoinGecko, sin key).
 * Se usa SOLO al crear la cotización: el monto queda fijo en la cotización
 * y la verificación compara contra ese monto, no contra el precio en vivo.
 */
import { ASSET_DECIMALS, type CryptoAsset } from './tokens'

const COINGECKO_IDS: Record<CryptoAsset, string> = {
  ETH: 'ethereum',
  USDT: 'tether',
  USDC: 'usd-coin',
  BTC: 'bitcoin',
}

const CACHE_MS = 60_000
const cache = new Map<CryptoAsset, { rateMxn: number; at: number }>()

export async function getMxnRate(asset: CryptoAsset): Promise<number> {
  const hit = cache.get(asset)
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.rateMxn

  const id = COINGECKO_IDS[asset]
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=mxn`,
    { headers: { accept: 'application/json' } }
  )
  if (!res.ok) throw new Error(`CoinGecko respondió ${res.status}`)
  const data: any = await res.json()
  const rate = Number(data?.[id]?.mxn)
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('Tipo de cambio no disponible')
  cache.set(asset, { rateMxn: rate, at: Date.now() })
  return rate
}

/**
 * Convierte un total en MXN al monto en cripto de la cotización.
 * baseUnits se redondea HACIA ARRIBA: el redondeo nunca deja la cotización
 * por debajo del total en pesos.
 */
export function quoteAmount(fiatMxn: number, asset: CryptoAsset, rateMxn: number) {
  const decimals = ASSET_DECIMALS[asset]
  const raw = fiatMxn / rateMxn
  const factor = 10 ** decimals
  const baseUnits = BigInt(Math.ceil(raw * factor)).toString()
  // En BTC el monto que el cliente paga se expresa en sats (la unidad base).
  const cryptoAmount =
    asset === 'BTC'
      ? baseUnits
      : (Number(baseUnits) / factor).toFixed(asset === 'ETH' ? 8 : 6)
  return { rateMxn, cryptoAmount, baseUnits, decimals }
}
