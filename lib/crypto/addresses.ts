/**
 * Business crypto wallets for receiving payments.
 * Addresses come from env vars (user will provide API keys/addresses later).
 * Graceful fallbacks for demo mode.
 */

export type NetworkKey = 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM' | 'LIGHTNING'

export interface WalletConfig {
  network: NetworkKey
  label: string
  address: string
  icon: string
  hint: string
}

const EVM_WALLET =
  process.env.NEXT_PUBLIC_CRYPTO_WALLET_EVM || '0xd717d02a2434f8506b14143f60d998337d6f5649'
const LIGHTNING_WALLET =
  process.env.NEXT_PUBLIC_CRYPTO_WALLET_LIGHTNING || 'calpulli@walletofsatoshi.com'

export const WALLETS: WalletConfig[] = [
  {
    network: 'ETHEREUM',
    label: 'Ethereum (EVM)',
    address: EVM_WALLET,
    icon: '⟠',
    hint: 'ETH y stablecoins USDT / USDC (ERC-20) en mainnet',
  },
  {
    network: 'BASE',
    label: 'Base',
    address: EVM_WALLET,
    icon: '🔵',
    hint: 'Comisiones mínimas, ideal para montos pequeños. USDT / USDC soportados.',
  },
  {
    network: 'ARBITRUM',
    label: 'Arbitrum',
    address: EVM_WALLET,
    icon: '🔷',
    hint: 'ETH y stablecoins USDT / USDC en Arbitrum One',
  },
  {
    network: 'OPTIMISM',
    label: 'Optimism',
    address: EVM_WALLET,
    icon: '🔴',
    hint: 'ETH y stablecoins USDT / USDC en Optimism',
  },
  {
    network: 'LIGHTNING',
    label: 'Lightning Network (BTC)',
    address: LIGHTNING_WALLET,
    icon: '⚡',
    hint: 'Pagos instantáneos con Bitcoin, casi sin comisión',
  },
]

export const MOCK_WALLETS: WalletConfig[] = [
  {
    network: 'ETHEREUM',
    label: 'Ethereum (MOCK TEST)',
    address: '0x1111111111111111111111111111111111111111',
    icon: '🧪',
    hint: 'Dirección mock — cualquier hash con prefijo mock/test confirma al instante',
  },
  {
    network: 'BASE',
    label: 'Base Sepolia (MOCK)',
    address: '0x2222222222222222222222222222222222222222',
    icon: '🧪',
    hint: 'Testnet Base Sepolia — usa hash mock para simular',
  },
  {
    network: 'ARBITRUM',
    label: 'Arbitrum Sepolia (MOCK)',
    address: '0x3333333333333333333333333333333333333333',
    icon: '🧪',
    hint: 'Testnet Arbitrum — usa hash mock para simular',
  },
  {
    network: 'OPTIMISM',
    label: 'Optimism Sepolia (MOCK)',
    address: '0x4444444444444444444444444444444444444444',
    icon: '🧪',
    hint: 'Testnet Optimism — usa hash mock para simular',
  },
  {
    network: 'LIGHTNING',
    label: 'Lightning (MOCK)',
    address: 'lnbc1mock_calpulli_test_invoice',
    icon: '🧪',
    hint: 'Invoice mock — pega cualquier lnbc mock y se confirma',
  },
]

export const isMockAddress = (address: string): boolean =>
  address === '0x1111111111111111111111111111111111111111' ||
  address === '0x2222222222222222222222222222222222222222' ||
  address.toLowerCase().includes('mock')

// ---------- Reference validation (from Xoco-POS patterns) ----------

export function looksLikeEvmAddress(value: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(value.trim())
}

export function looksLikeEnsName(value: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.(eth|xyz|luxe)$/i.test(value.trim())
}

export function looksLikeLightningInvoice(value: string): boolean {
  const v = value.trim().toLowerCase()
  return v.startsWith('lnbc') || v.startsWith('lntb') || v.startsWith('lnurl')
}

export function looksLikeTxHash(value: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(value.trim())
}

export function classifyPaymentReference(
  value: string
): 'evm_address' | 'ens_name' | 'lightning_invoice' | 'tx_hash' | 'unknown' {
  if (looksLikeTxHash(value)) return 'tx_hash'
  if (looksLikeEvmAddress(value)) return 'evm_address'
  if (looksLikeEnsName(value)) return 'ens_name'
  if (looksLikeLightningInvoice(value)) return 'lightning_invoice'
  return 'unknown'
}
