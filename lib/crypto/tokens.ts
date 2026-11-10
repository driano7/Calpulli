/**
 * Activos aceptados para liquidar pagos y sus contratos canónicos.
 * La verificación del servidor compara contra ESTAS direcciones: un token
 * con el mismo nombre pero otro contrato vale cero para liquidar.
 */

export type CryptoAsset = 'ETH' | 'USDT' | 'USDC' | 'BTC'

export const ASSET_DECIMALS: Record<CryptoAsset, number> = {
  ETH: 18,
  USDT: 6,
  USDC: 6,
  BTC: 8, // la unidad pagable es el satoshi: baseUnits = sats
}

type EvmNetwork = 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM'

/** Contratos oficiales de USDT/USDC por red (minúsculas para comparar). */
export const TOKEN_CONTRACTS: Record<EvmNetwork, Partial<Record<CryptoAsset, string>>> = {
  ETHEREUM: {
    USDT: '0xdac17f958d2ee523a2206206994597c13d831ec7',
    USDC: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  BASE: {
    USDT: '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2',
    USDC: '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913',
  },
  ARBITRUM: {
    USDT: '0xfd086bc7cd5c481dcc9c85ebe478a1c0b69fcbb9',
    USDC: '0xaf88d065e77c8cc2239327c5edb3a432268e5831',
  },
  OPTIMISM: {
    USDT: '0x94b008aa00579c1307b0ef2c499ad98a8ce58e58',
    USDC: '0x0b2c639c533813f4aa9d7837caf62653d097ff85',
  },
}

export function isCryptoAsset(value: unknown): value is CryptoAsset {
  return value === 'ETH' || value === 'USDT' || value === 'USDC' || value === 'BTC'
}
