/**
 * Receptor de eventos de Bruno (Piso 2) — Cloudflare Worker.
 *
 * Recibe los webhooks firmados que manda la app de Calpulli
 * (lib/bruno-events.js), verifica la firma HMAC-SHA256 y agrega el
 * evento como UNA línea en events.jsonl del repo privado
 * driano7/calpulli-events, usando la API de contenidos de GitHub.
 * Bruno lee ese archivo y le reporta a Donovan. Nada más: sin base de
 * datos, sin panel.
 *
 * Variables de entorno (secrets del Worker):
 *   BRUNO_WEBHOOK_SECRET  El mismo secreto que firma en la app.
 *   GH_TOKEN              Token fino de GitHub, alcance SOLO al repo
 *                         driano7/calpulli-events, permiso Contents.
 *
 * Respuestas: 200 ok · 400 JSON inválido · 401 firma inválida ·
 * 405 método distinto de POST · 502 si GitHub no acepta la escritura.
 *
 * Nota: la escritura es leer-modificar-escribir con el SHA del archivo.
 * Con el volumen de una operadora chica los eventos casi nunca chocan;
 * si dos llegan en el mismo instante, uno puede reintentar desde la app
 * o perderse — aceptable para un canal de avisos, nunca para la venta
 * (la reserva vive en Turso, no aquí).
 */

const REPO = 'driano7/calpulli-events'
const FILE_PATH = 'events.jsonl'
const CONTENTS_API = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64) {
  const binary = atob(String(b64).replace(/\s/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function hexToBytes(hex) {
  if (!/^[0-9a-fA-F]+$/.test(hex) || hex.length % 2 !== 0) {
    throw new Error('Firma mal formada')
  }
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

async function signatureIsValid(secret, body, hexSignature) {
  if (!secret || !hexSignature) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['verify']
  )
  let signature
  try {
    signature = hexToBytes(hexSignature.trim())
  } catch {
    return false
  }
  // subtle.verify compara en tiempo constante.
  return crypto.subtle.verify('HMAC', key, signature, encoder.encode(body))
}

async function appendLine(env, line) {
  const headers = {
    Authorization: `Bearer ${env.GH_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'bruno-receiver',
  }

  const getRes = await fetch(CONTENTS_API, { headers })
  if (!getRes.ok) throw new Error(`GitHub GET respondió ${getRes.status}`)
  const file = await getRes.json()

  const current = file.content
    ? new TextDecoder().decode(base64ToBytes(file.content))
    : ''
  const prefix = current && !current.endsWith('\n') ? `${current}\n` : current
  const next = `${prefix}${line}\n`

  let eventName = 'evento'
  try {
    eventName = JSON.parse(line).event || eventName
  } catch {
    // El nombre es cosmético (mensaje del commit); si falla, se queda genérico.
  }

  const putRes = await fetch(CONTENTS_API, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `event: ${eventName}`,
      // La API de contenidos de GitHub exige el contenido en base64:
      // aquí el base64 es el formato del payload de la API, no un error.
      content: bytesToBase64(new TextEncoder().encode(next)),
      sha: file.sha,
    }),
  })
  if (!putRes.ok) throw new Error(`GitHub PUT respondió ${putRes.status}`)
}

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    const rawBody = await request.text()

    const valid = await signatureIsValid(
      env.BRUNO_WEBHOOK_SECRET,
      rawBody,
      request.headers.get('x-bruno-signature') || ''
    )
    if (!valid) {
      return new Response('Invalid signature', { status: 401 })
    }

    try {
      JSON.parse(rawBody)
    } catch {
      return new Response('Invalid JSON', { status: 400 })
    }

    try {
      // Se agrega el cuerpo tal cual llegó (una línea JSON), así el
      // archivo refleja exactamente lo que la app firmó.
      await appendLine(env, rawBody.trim())
    } catch {
      return new Response('GitHub append failed', { status: 502 })
    }

    return new Response('ok', { status: 200 })
  },
}
