/**
 * On-chain payment verification (adapted from Xoco-POS use-polling-status).
 * EVM: polls block explorer APIs (Etherscan/Basescan) for matching txs.
 * Lightning: polls a WoS-compatible API for invoice status.
 *
 * Status flow: WAITING → DETECTED → CONFIRMED (or ERROR)
 */

export type PaymentStatus = 'WAITING' | 'DETECTED' | 'CONFIRMED' | 'ERROR'

export interface VerifyConfig {
  network: 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM' | 'LIGHTNING'
  address?: string // business wallet
  expectedWei?: string // expected amount in wei
  txHash?: string // customer tx hash
  invoice?: string // lightning invoice
}

const NETWORK_MODE = process.env.NEXT_PUBLIC_CHAIN_MODE === 'MAINNET' ? 'MAINNET' : 'TESTNET'

function explorerConfig(network: 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM') {
  if (network === 'BASE') {
    return {
      baseUrl:
        NETWORK_MODE === 'TESTNET'
          ? 'https://api-sepolia.basescan.org/api'
          : 'https://api.basescan.org/api',
      apiKey: process.env.NEXT_PUBLIC_BASESCAN_API_KEY || null,
    }
  }
  if (network === 'ARBITRUM') {
    return {
      baseUrl:
        NETWORK_MODE === 'TESTNET'
          ? 'https://api-sepolia.arbiscan.io/api'
          : 'https://api.arbiscan.io/api',
      apiKey: process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || null,
    }
  }
  if (network === 'OPTIMISM') {
    return {
      baseUrl:
        NETWORK_MODE === 'TESTNET'
          ? 'https://api-sepolia-optimistic.etherscan.io/api'
          : 'https://api-optimistic.etherscan.io/api',
      apiKey: process.env.NEXT_PUBLIC_OPTIMISM_API_KEY || null,
    }
  }
  return {
    baseUrl:
      NETWORK_MODE === 'TESTNET'
        ? 'https://api-sepolia.etherscan.io/api'
        : 'https://api.etherscan.io/api',
    apiKey: process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY || null,
  }
}

/**
 * Poll once: check current on-chain status.
 * Call this from a setInterval(5s) in the UI.
 */
const MOCK_ADDRESSES = [
  '0x1111111111111111111111111111111111111111',
  '0x2222222222222222222222222222222222222222',
]
const isMock = (v?: string) =>
  !!v &&
  (MOCK_ADDRESSES.includes(v) ||
    v.toLowerCase().includes('mock') ||
    v.toLowerCase().includes('test'))

export async function verifyPaymentOnce(config: VerifyConfig): Promise<{
  status: PaymentStatus
  message: string
}> {
  // Mock testing: cualquier referencia que contenga mock/test confirma al instante
  if (isMock(config.address) || isMock(config.txHash) || isMock(config.invoice)) {
    if (config.txHash || config.invoice) {
      return { status: 'CONFIRMED', message: 'Pago mock confirmado (testing) ✓' }
    }
    return {
      status: 'DETECTED',
      message: 'Dirección mock detectada — pega un hash mock para confirmar',
    }
  }
  try {
    if (config.network === 'LIGHTNING') {
      return await verifyLightning(config.invoice)
    }
    return await verifyEvm(config)
  } catch {
    return { status: 'ERROR', message: 'No se pudo consultar la red. Intenta de nuevo.' }
  }
}

async function verifyEvm(
  config: VerifyConfig
): Promise<{ status: PaymentStatus; message: string }> {
  const { baseUrl, apiKey } = explorerConfig(
    config.network as 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM'
  )
  if (!baseUrl) {
    return { status: 'ERROR', message: 'Red no configurada.' }
  }

  // If we have a tx hash, look it up directly
  if (config.txHash) {
    const params = new URLSearchParams({
      module: 'transaction',
      action: 'gettxreceiptstatus',
      txhash: config.txHash,
    })
    if (apiKey) params.set('apikey', apiKey)
    const res = await fetch(`${baseUrl}?${params}`)
    const data = await res.json()
    if (data?.status === '1' && data.result?.status === '1') {
      return { status: 'CONFIRMED', message: 'Pago confirmado en la blockchain' }
    }
    return { status: 'DETECTED', message: 'Transacción encontrada, esperando confirmaciones…' }
  }

  // Otherwise poll the business wallet for incoming txs matching amount
  if (!config.address) {
    return { status: 'ERROR', message: 'Wallet no configurada.' }
  }

  const params = new URLSearchParams({
    module: 'account',
    action: 'txlist',
    address: config.address,
    startblock: '0',
    endblock: '99999999',
    sort: 'desc',
    page: '1',
    offset: '10',
  })
  if (apiKey) params.set('apikey', apiKey)

  const res = await fetch(`${baseUrl}?${params}`)
  const data = await res.json()

  if (data?.status !== '1' || !Array.isArray(data.result)) {
    return { status: 'WAITING', message: 'Esperando pago en la red…' }
  }

  for (const tx of data.result) {
    const toMatches = config.address && tx.to?.toLowerCase() === config.address.toLowerCase()
    const amountMatches = !config.expectedWei || tx.value === config.expectedWei
    if (toMatches && amountMatches) {
      return { status: 'DETECTED', message: 'Pago detectado en mempool' }
    }
  }

  return { status: 'WAITING', message: 'Esperando pago en la red…' }
}

async function verifyLightning(
  invoice?: string
): Promise<{ status: PaymentStatus; message: string }> {
  if (!invoice) {
    return { status: 'ERROR', message: 'Factura Lightning no especificada.' }
  }
  const apiUrl =
    process.env.NEXT_PUBLIC_LN_API_URL_MAINNET || process.env.NEXT_PUBLIC_LN_API_URL_TESTNET
  if (!apiUrl) {
    // Without LN API configured, trust manual confirmation in demo mode
    return { status: 'DETECTED', message: 'API Lightning no configurada — confirma manualmente.' }
  }
  const apiKey = process.env.NEXT_PUBLIC_LN_API_KEY_MAINNET
  const res = await fetch(
    `${apiUrl}/wos-api/invoice-status?invoice=${encodeURIComponent(invoice)}`,
    {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined,
    }
  )
  const data = await res.json()
  if (data.status === 'settled' || data.paid === true) {
    return { status: 'CONFIRMED', message: 'Pago Lightning confirmado' }
  }
  if (data.status === 'pending' || data.status === 'in-flight') {
    return { status: 'DETECTED', message: 'Pago LN en ruta' }
  }
  return { status: 'WAITING', message: 'Esperando pago Lightning…' }
}

// ---------------------------------------------------------------------------
// Verificación del lado del servidor
// ---------------------------------------------------------------------------
// El navegador no es confiable: cualquiera puede llamar al endpoint de
// confirmación con un hash inventado. Aquí se vuelve a consultar la red y,
// además, se comprueba que la transacción haya llegado a la wallet del
// negocio. El modo mock solo se acepta fuera de mainnet (o con una bandera
// explícita) para no regalar tickets en producción.

const TX_HASH_RE = /^0x[a-fA-F0-9]{64}$/

function mockAllowed(): boolean {
  return process.env.CRYPTO_ALLOW_MOCK === 'true' || NETWORK_MODE !== 'MAINNET'
}

/** Busca el hash entre las transferencias nativas y ERC-20 recibidas. */
async function hashBelongsToWallet(
  baseUrl: string,
  apiKey: string | null,
  address: string,
  txHash: string
): Promise<boolean> {
  const hash = txHash.toLowerCase()
  const wallet = address.toLowerCase()

  for (const action of ['txlist', 'tokentx'] as const) {
    const params = new URLSearchParams({
      module: 'account',
      action,
      address,
      startblock: '0',
      endblock: '99999999',
      sort: 'desc',
      page: '1',
      offset: '100',
    })
    if (apiKey) params.set('apikey', apiKey)

    try {
      const data = await (await fetch(`${baseUrl}?${params}`)).json()
      if (data?.status !== '1' || !Array.isArray(data.result)) continue
      const match = data.result.some(
        (tx: any) =>
          String(tx.hash || '').toLowerCase() === hash &&
          String(tx.to || '').toLowerCase() === wallet
      )
      if (match) return true
    } catch {
      // Si un endpoint falla, se intenta el siguiente.
    }
  }

  return false
}

/**
 * Verificación autoritativa para el endpoint de confirmación. Devuelve
 * `confirmed: true` solo si el pago existe y llegó a la wallet del negocio.
 */
export async function verifyPaymentForServer(config: VerifyConfig): Promise<{
  confirmed: boolean
  status: PaymentStatus
  message: string
}> {
  const mock = isMock(config.address) || isMock(config.txHash) || isMock(config.invoice)
  if (mock) {
    if (!mockAllowed()) {
      return {
        confirmed: false,
        status: 'ERROR',
        message: 'El modo de prueba está deshabilitado en este entorno.',
      }
    }
    if (config.txHash || config.invoice) {
      return { confirmed: true, status: 'CONFIRMED', message: 'Pago mock confirmado' }
    }
    return {
      confirmed: false,
      status: 'DETECTED',
      message: 'Falta el hash o la factura para confirmar.',
    }
  }

  if (config.network === 'LIGHTNING') {
    const result = await verifyLightning(config.invoice)
    return { confirmed: result.status === 'CONFIRMED', ...result }
  }

  if (!config.address) {
    return { confirmed: false, status: 'ERROR', message: 'Wallet no configurada.' }
  }
  if (!config.txHash || !TX_HASH_RE.test(config.txHash)) {
    return {
      confirmed: false,
      status: 'ERROR',
      message: 'El hash de la transacción no es válido.',
    }
  }

  const { baseUrl, apiKey } = explorerConfig(config.network)

  try {
    const receiptParams = new URLSearchParams({
      module: 'transaction',
      action: 'gettxreceiptstatus',
      txhash: config.txHash,
    })
    if (apiKey) receiptParams.set('apikey', apiKey)
    const receipt = await (await fetch(`${baseUrl}?${receiptParams}`)).json()

    if (!(receipt?.status === '1' && receipt.result?.status === '1')) {
      return {
        confirmed: false,
        status: 'DETECTED',
        message: 'La transacción todavía no está confirmada.',
      }
    }

    const received = await hashBelongsToWallet(baseUrl, apiKey, config.address, config.txHash)
    if (!received) {
      return {
        confirmed: false,
        status: 'DETECTED',
        message: 'La transacción no llegó a la wallet del negocio.',
      }
    }

    return { confirmed: true, status: 'CONFIRMED', message: 'Pago confirmado en la blockchain' }
  } catch {
    return {
      confirmed: false,
      status: 'ERROR',
      message: 'No se pudo consultar la red. Intenta de nuevo.',
    }
  }
}
