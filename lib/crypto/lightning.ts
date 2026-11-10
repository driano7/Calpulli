/**
 * Lightning vía LNURL-pay (LUD-16/06) con verificación LUD-21.
 *
 * En vez de pedirle al cliente que "pegue un invoice" (que al pagar a una
 * Lightning Address ni siquiera ve), el servidor genera el invoice real:
 * resuelve la dirección del negocio (usuario@dominio) contra su servidor
 * LNURL, pide un invoice por el monto exacto de la cotización y guarda la
 * URL de verificación que el propio servidor LNURL devuelve. Al confirmar,
 * se consulta esa URL: `settled: true` es la prueba de liquidación.
 */

export interface LnurlPayParams {
  callback: string
  minSendable: number // millisats
  maxSendable: number // millisats
}

export function parseLightningAddress(
  address: string
): { user: string; domain: string } | null {
  const m = /^([a-z0-9._+-]+)@([a-z0-9.-]+\.[a-z]{2,})$/i.exec(String(address || '').trim())
  if (!m) return null
  return { user: m[1].toLowerCase(), domain: m[2].toLowerCase() }
}

export async function fetchLnurlPayParams(address: string): Promise<LnurlPayParams> {
  const parsed = parseLightningAddress(address)
  if (!parsed) throw new Error('La Lightning Address del negocio no es válida.')
  const url = `https://${parsed.domain}/.well-known/lnurlp/${parsed.user}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  const data: any = await res.json().catch(() => null)
  if (!res.ok || !data || data.status === 'ERROR' || typeof data.callback !== 'string') {
    throw new Error(
      `El servidor Lightning no reconoció la dirección del negocio (${data?.reason || res.status}).`
    )
  }
  return {
    callback: data.callback,
    minSendable: Number(data.minSendable) || 0,
    maxSendable: Number(data.maxSendable) || Number.MAX_SAFE_INTEGER,
  }
}

export async function requestLnInvoice(
  params: LnurlPayParams,
  sats: number
): Promise<{ invoice: string; verifyUrl: string | null }> {
  const msats = Math.round(sats) * 1000
  if (msats < params.minSendable || msats > params.maxSendable) {
    throw new Error('El monto queda fuera de los límites de la wallet Lightning del negocio.')
  }
  const sep = params.callback.includes('?') ? '&' : '?'
  const res = await fetch(`${params.callback}${sep}amount=${msats}`, {
    headers: { accept: 'application/json' },
  })
  const data: any = await res.json().catch(() => null)
  if (!res.ok || !data || data.status === 'ERROR' || typeof data.pr !== 'string') {
    throw new Error(`El servidor Lightning no emitió el invoice (${data?.reason || res.status}).`)
  }
  return {
    invoice: data.pr,
    verifyUrl: typeof data.verify === 'string' ? data.verify : null,
  }
}

/** LUD-21: la URL de verificación del propio invoice dice si ya se liquidó. */
export async function checkInvoiceSettled(
  verifyUrl: string
): Promise<{ settled: boolean; preimage: string | null }> {
  const res = await fetch(verifyUrl, { headers: { accept: 'application/json' } })
  const data: any = await res.json().catch(() => null)
  return {
    settled: data?.settled === true,
    preimage: typeof data?.preimage === 'string' ? data.preimage : null,
  }
}
