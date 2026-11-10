/**
 * On-chain payment verification (adapted from Xoco-POS use-polling-status).
 * EVM: polls block explorer APIs (Etherscan/Basescan) for matching txs.
 * Lightning: polls a WoS-compatible API for invoice status.
 *
 * Status flow: WAITING → DETECTED → CONFIRMED (or ERROR)
 */

import { TOKEN_CONTRACTS, type CryptoAsset } from './tokens'
import { checkInvoiceSettled } from './lightning'

export type PaymentStatus = 'WAITING' | 'DETECTED' | 'CONFIRMED' | 'ERROR'

export interface ExpectedPayment {
  asset: CryptoAsset
  /** Monto mínimo aceptable en unidades base (wei / 6 decimales), ya con tolerancia. */
  minBaseUnits: string
  /** La transacción debe ser de este momento en adelante (unix, segundos). */
  notBeforeUnix: number
}

export interface VerifyConfig {
  network: 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM' | 'LIGHTNING' | 'BITCOIN'
  address?: string // business wallet
  expectedWei?: string // expected amount in wei
  txHash?: string // customer tx hash
  invoice?: string // lightning invoice
  expected?: ExpectedPayment // cotización del servidor: activo + monto + frescura
  lnVerifyUrl?: string // LUD-21: URL de verificación del invoice (cotización LN)
}

const NETWORK_MODE = process.env.NEXT_PUBLIC_CHAIN_MODE === 'MAINNET' ? 'MAINNET' : 'TESTNET'

/**
 * Exploradores (migración 2026-11-10): la API V1 de Etherscan se apagó en
 * agosto de 2025. Ethereum y Arbitrum van por Etherscan V2 (una sola key,
 * selector chainid, plan gratis). Base y Optimism quedaron de paga en V2,
 * así que van por Blockscout público: misma API compatible, SIN key.
 */
interface ExplorerCfg {
  baseUrl: string
  apiKey: string | null
  chainId: number | null
}

function explorerConfig(
  network: 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM'
): ExplorerCfg {
  const mainnet = NETWORK_MODE === 'MAINNET'
  // La key puede vivir con el nombre público (la usa también el polling del
  // navegador) o solo del lado del servidor con el nombre que Donovan ya
  // usa en sus otros proyectos (ETEHERSCAN_API / ETHERSCAN_API).
  const etherscanKey =
    process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY ||
    process.env.ETEHERSCAN_API ||
    process.env.ETHERSCAN_API ||
    null
  if (network === 'BASE') {
    return {
      baseUrl: mainnet
        ? 'https://base.blockscout.com/api'
        : 'https://base-sepolia.blockscout.com/api',
      apiKey: null,
      chainId: null,
    }
  }
  if (network === 'OPTIMISM') {
    return {
      baseUrl: mainnet
        ? 'https://optimism.blockscout.com/api'
        : 'https://optimism-sepolia.blockscout.com/api',
      apiKey: null,
      chainId: null,
    }
  }
  if (network === 'ARBITRUM') {
    return {
      baseUrl: 'https://api.etherscan.io/v2/api',
      apiKey: etherscanKey || process.env.NEXT_PUBLIC_ARBISCAN_API_KEY || null,
      chainId: mainnet ? 42161 : 421614,
    }
  }
  return {
    baseUrl: 'https://api.etherscan.io/v2/api',
    apiKey: etherscanKey,
    chainId: mainnet ? 1 : 11155111,
  }
}

function explorerParams(cfg: ExplorerCfg, entries: Record<string, string>): URLSearchParams {
  const params = new URLSearchParams(entries)
  if (cfg.chainId) params.set('chainid', String(cfg.chainId))
  if (cfg.apiKey) params.set('apikey', cfg.apiKey)
  return params
}

const MEMPOOL_BASE =
  NETWORK_MODE === 'MAINNET'
    ? 'https://mempool.space/api'
    : 'https://mempool.space/testnet/api'

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
    if (config.network === 'BITCOIN') {
      return await verifyBtcOnce(config)
    }
    return await verifyEvm(config)
  } catch {
    return { status: 'ERROR', message: 'No se pudo consultar la red. Intenta de nuevo.' }
  }
}

/**
 * Polling con caché corto — SOLO para uso en el servidor (endpoint
 * /api/bookings/crypto/status). Si el mismo hash se consulta muchas
 * veces seguidas (el checkout vigila cada 5 s, reintentos, o un abuso
 * deliberado), el explorador solo se toca una vez por ventana: así la
 * cuota gratis de la API no se quema. Un resultado CONFIRMED es
 * inmutable y se cachea 5 minutos; el resto, 20 segundos.
 */
const statusCache = new Map<
  string,
  { at: number; result: { status: PaymentStatus; message: string } }
>()

export async function pollPaymentStatus(
  config: VerifyConfig
): Promise<{ status: PaymentStatus; message: string }> {
  const key = `${config.network}|${config.txHash || ''}|${config.address || ''}|${config.invoice || ''}`
  const hit = statusCache.get(key)
  const ttl = hit?.result.status === 'CONFIRMED' ? 300_000 : 20_000
  if (hit && Date.now() - hit.at < ttl) return hit.result
  const result = await verifyPaymentOnce(config)
  if (statusCache.size > 500) statusCache.clear()
  statusCache.set(key, { at: Date.now(), result })
  return result
}

async function verifyEvm(
  config: VerifyConfig
): Promise<{ status: PaymentStatus; message: string }> {
  const cfg = explorerConfig(
    config.network as 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM'
  )
  if (!cfg.baseUrl) {
    return { status: 'ERROR', message: 'Red no configurada.' }
  }

  // If we have a tx hash, look it up directly
  if (config.txHash) {
    const params = explorerParams(cfg, {
      module: 'transaction',
      action: 'gettxreceiptstatus',
      txhash: config.txHash,
    })
    const res = await fetch(`${cfg.baseUrl}?${params}`)
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

  const params = explorerParams(cfg, {
    module: 'account',
    action: 'txlist',
    address: config.address,
    startblock: '0',
    endblock: '99999999',
    sort: 'desc',
    page: '1',
    offset: '10',
  })

  const res = await fetch(`${cfg.baseUrl}?${params}`)
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

/** Chequeo ligero del navegador para BTC on-chain (mempool.space, sin key). */
async function verifyBtcOnce(
  config: VerifyConfig
): Promise<{ status: PaymentStatus; message: string }> {
  if (!config.txHash) {
    return { status: 'WAITING', message: 'Esperando pago en la red…' }
  }
  const res = await fetch(`${MEMPOOL_BASE}/tx/${config.txHash}`)
  if (res.status === 404) {
    return { status: 'WAITING', message: 'Esperando pago en la red…' }
  }
  const tx: any = await res.json()
  const arrived =
    config.address &&
    Array.isArray(tx?.vout) &&
    tx.vout.some((o: any) => o.scriptpubkey_address === config.address)
  if (!arrived) {
    return { status: 'WAITING', message: 'Esperando pago en la red…' }
  }
  if (tx?.status?.confirmed) {
    return { status: 'CONFIRMED', message: 'Pago confirmado en la blockchain' }
  }
  return { status: 'DETECTED', message: 'Pago detectado, esperando confirmación…' }
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

interface HashTransfers {
  native: {
    to: string
    value: string
    timeStamp: number
    receiptStatus: string | null
  } | null
  tokens: { to: string; contract: string; value: string; timeStamp: number }[]
}

/** Trae las transferencias (nativa y ERC-20) de UN hash hacia la wallet. */
async function fetchTransfersForHash(
  cfg: ExplorerCfg,
  address: string,
  txHash: string
): Promise<HashTransfers> {
  const hash = txHash.toLowerCase()
  const out: HashTransfers = { native: null, tokens: [] }

  for (const action of ['txlist', 'tokentx'] as const) {
    const params = explorerParams(cfg, {
      module: 'account',
      action,
      address,
      startblock: '0',
      endblock: '99999999',
      sort: 'desc',
      page: '1',
      offset: '100',
    })

    try {
      const data = await (await fetch(`${cfg.baseUrl}?${params}`)).json()
      if (data?.status !== '1' || !Array.isArray(data.result)) continue
      for (const tx of data.result) {
        if (String(tx.hash || '').toLowerCase() !== hash) continue
        if (action === 'txlist') {
          out.native = {
            to: String(tx.to || ''),
            value: String(tx.value || '0'),
            timeStamp: Number(tx.timeStamp) || 0,
            receiptStatus:
              tx.txreceipt_status != null ? String(tx.txreceipt_status) : null,
          }
        } else {
          out.tokens.push({
            to: String(tx.to || ''),
            contract: String(tx.contractAddress || '').toLowerCase(),
            value: String(tx.value || '0'),
            timeStamp: Number(tx.timeStamp) || 0,
          })
        }
      }
    } catch {
      // Si un endpoint falla, se intenta el siguiente.
    }
  }

  return out
}

/**
 * Con cotización, no basta que el hash haya llegado a la wallet: debe ser
 * del activo cotizado, por al menos el monto cotizado (con tolerancia) y
 * posterior a la cotización. Devuelve null si todo cuadra.
 */
function expectedMismatch(
  config: VerifyConfig,
  transfers: HashTransfers
): { status: PaymentStatus; message: string } | null {
  const expected = config.expected!
  const wallet = String(config.address || '').toLowerCase()
  let received: bigint | null = null
  let timeStamp = 0

  if (expected.asset === 'ETH') {
    if (transfers.native && transfers.native.to.toLowerCase() === wallet) {
      received = BigInt(transfers.native.value || '0')
      timeStamp = transfers.native.timeStamp
    }
  } else {
    const contract =
      TOKEN_CONTRACTS[config.network as keyof typeof TOKEN_CONTRACTS]?.[expected.asset]
    if (contract) {
      let sum = 0n
      for (const t of transfers.tokens) {
        if (t.to.toLowerCase() === wallet && t.contract === contract) {
          sum += BigInt(t.value || '0')
          timeStamp = Math.max(timeStamp, t.timeStamp)
        }
      }
      if (sum > 0n) received = sum
    }
  }

  if (received === null) {
    return {
      status: 'DETECTED',
      message: 'La transacción no llegó a la wallet del negocio en el activo de la cotización.',
    }
  }
  if (timeStamp > 0 && timeStamp < expected.notBeforeUnix) {
    return {
      status: 'DETECTED',
      message: 'La transacción es anterior a la cotización; haz un pago nuevo.',
    }
  }
  if (received < BigInt(expected.minBaseUnits)) {
    return {
      status: 'DETECTED',
      message: 'El monto recibido es menor al de la cotización.',
    }
  }
  return null
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
    // Camino real: el invoice lo generó el servidor al cotizar (LNURL-pay) y
    // su URL de verificación (LUD-21) dice si ya se liquidó.
    if (config.lnVerifyUrl) {
      try {
        const { settled } = await checkInvoiceSettled(config.lnVerifyUrl)
        return settled
          ? {
              confirmed: true,
              status: 'CONFIRMED' as const,
              message: 'Pago Lightning confirmado (liquidado)',
            }
          : {
              confirmed: false,
              status: 'DETECTED' as const,
              message: 'El pago Lightning aún no se liquida.',
            }
      } catch {
        return {
          confirmed: false,
          status: 'ERROR' as const,
          message: 'No se pudo consultar la liquidación Lightning.',
        }
      }
    }
    const result = await verifyLightning(config.invoice)
    return { confirmed: result.status === 'CONFIRMED', ...result }
  }

  if (config.network === 'BITCOIN') {
    return verifyBtcForServer(config)
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

  const cfg = explorerConfig(
    config.network as 'ETHEREUM' | 'BASE' | 'ARBITRUM' | 'OPTIMISM'
  )

  try {
    const transfers = await fetchTransfersForHash(cfg, config.address, config.txHash)

    // Éxito de la transacción: primero el campo txreceipt_status de la
    // lista (Blockscout lo trae); si no, el endpoint de recibo (Etherscan).
    let receiptOk = transfers.native?.receiptStatus === '1'
    if (!receiptOk) {
      try {
        const receiptParams = explorerParams(cfg, {
          module: 'transaction',
          action: 'gettxreceiptstatus',
          txhash: config.txHash,
        })
        const receipt = await (await fetch(`${cfg.baseUrl}?${receiptParams}`)).json()
        receiptOk = receipt?.status === '1' && receipt.result?.status === '1'
      } catch {
        // receiptOk se queda con lo que trajo la lista.
      }
    }
    if (!receiptOk) {
      return {
        confirmed: false,
        status: 'DETECTED',
        message: 'La transacción todavía no está confirmada.',
      }
    }

    if (config.expected) {
      const mismatch = expectedMismatch(config, transfers)
      if (mismatch) {
        return { confirmed: false, ...mismatch }
      }
      return {
        confirmed: true,
        status: 'CONFIRMED',
        message: 'Pago confirmado en la blockchain por el monto cotizado',
      }
    }

    const wallet = config.address.toLowerCase()
    const arrived =
      (transfers.native && transfers.native.to.toLowerCase() === wallet) ||
      transfers.tokens.some((t) => t.to.toLowerCase() === wallet)
    if (!arrived) {
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

const BTC_TXID_RE = /^[a-fA-F0-9]{64}$/

/** BTC on-chain vía mempool.space (sin key). Se exige la primera confirmación. */
async function verifyBtcForServer(
  config: VerifyConfig
): Promise<{ confirmed: boolean; status: PaymentStatus; message: string }> {
  if (!config.address) {
    return { confirmed: false, status: 'ERROR', message: 'Wallet no configurada.' }
  }
  if (!config.txHash || !BTC_TXID_RE.test(config.txHash)) {
    return {
      confirmed: false,
      status: 'ERROR',
      message: 'El txid de Bitcoin no es válido.',
    }
  }
  try {
    const res = await fetch(`${MEMPOOL_BASE}/tx/${config.txHash}`)
    if (res.status === 404) {
      return {
        confirmed: false,
        status: 'DETECTED',
        message: 'La transacción aún no aparece en la red.',
      }
    }
    const tx: any = await res.json()
    const sats = (Array.isArray(tx?.vout) ? tx.vout : [])
      .filter((o: any) => o.scriptpubkey_address === config.address)
      .reduce((sum: number, o: any) => sum + (Number(o.value) || 0), 0)
    if (sats <= 0) {
      return {
        confirmed: false,
        status: 'DETECTED',
        message: 'La transacción no llegó a la wallet del negocio.',
      }
    }
    if (!tx?.status?.confirmed) {
      return {
        confirmed: false,
        status: 'DETECTED',
        message: 'Pago detectado, esperando la primera confirmación…',
      }
    }
    if (config.expected) {
      const blockTime = Number(tx.status.block_time) || 0
      if (blockTime > 0 && blockTime < config.expected.notBeforeUnix) {
        return {
          confirmed: false,
          status: 'DETECTED',
          message: 'La transacción es anterior a la cotización; haz un pago nuevo.',
        }
      }
      if (BigInt(sats) < BigInt(config.expected.minBaseUnits)) {
        return {
          confirmed: false,
          status: 'DETECTED',
          message: 'El monto recibido es menor al de la cotización.',
        }
      }
    }
    return {
      confirmed: true,
      status: 'CONFIRMED',
      message: 'Pago Bitcoin confirmado en la blockchain',
    }
  } catch {
    return {
      confirmed: false,
      status: 'ERROR',
      message: 'No se pudo consultar la red. Intenta de nuevo.',
    }
  }
}
