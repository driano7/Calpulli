// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Transcripción de voz — pages/api/transcribe.js
 *
 * POST /api/transcribe?lang=es|en
 * Body: el audio CRUDO (no multipart): el blob que produce MediaRecorder
 * en el navegador, con su Content-Type real (audio/webm, audio/mp4, …).
 * Así el endpoint no necesita parsear multipart ni dependencias nuevas:
 * lee el stream, arma el multipart que pide Groq del lado del servidor
 * y devuelve { text }.
 *
 * Proveedor: Groq Whisper (whisper-large-v3) vía su API compatible con
 * OpenAI. La llave se lee de GROQ_API_KEY en CADA request (misma llave
 * que ya usa el fallback de chat en lib/openrouter.js; nunca va al
 * navegador). Sin llave configurada responde 503 { error:
 * 'not_configured' } y el frontend cae solo al dictado del navegador.
 *
 * Límites: audio de dictado corto — máx. 10 MB y throttle simple por IP
 * en memoria (20/min), porque el endpoint es público y gasta cuota.
 */

export const config = {
  api: {
    bodyParser: false,
  },
}

const GROQ_TRANSCRIBE_URL = 'https://api.groq.com/openai/v1/audio/transcriptions'
const MAX_AUDIO_BYTES = 10 * 1024 * 1024 // 10 MB (~varios minutos de dictado)
const REQUEST_TIMEOUT_MS = 30000
const PER_IP_PER_MINUTE = 20

// Extensión que entiende Whisper según el Content-Type que manda el navegador.
const EXT_BY_MIME = {
  'audio/webm': 'webm',
  'audio/mp4': 'mp4',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/flac': 'flac',
}

// Throttle en memoria por IP (ventana de 1 min). Suficiente para un
// endpoint de dictado; el límite serio es la cuota de Groq.
const hitsByIp = new Map()
function isThrottled(ip) {
  const now = Date.now()
  const hits = (hitsByIp.get(ip) || []).filter((t) => now - t < 60 * 1000)
  hits.push(now)
  hitsByIp.set(ip, hits)
  return hits.length > PER_IP_PER_MINUTE
}

function getClientIp(req) {
  return (
    (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0
    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_AUDIO_BYTES) {
        reject(Object.assign(new Error('audio_too_large'), { code: 'TOO_LARGE' }))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' })
  }

  // La llave se lee por request, no al cargar el módulo (lección ya
  // aprendida en lib/openrouter.js con las llaves de Gemini).
  const apiKey = process.env.GROQ_API_KEY || ''
  if (!apiKey) {
    return res.status(503).json({ error: 'not_configured' })
  }

  if (isThrottled(getClientIp(req))) {
    return res.status(429).json({ error: 'rate_limited' })
  }

  let audio
  try {
    audio = await readRawBody(req)
  } catch (err) {
    if (err && err.code === 'TOO_LARGE') {
      return res.status(413).json({ error: 'audio_too_large' })
    }
    return res.status(400).json({ error: 'bad_audio' })
  }
  if (!audio || audio.length === 0) {
    return res.status(400).json({ error: 'empty_audio' })
  }

  const mime = String(req.headers['content-type'] || 'audio/webm')
    .split(';')[0]
    .trim()
    .toLowerCase()
  const ext = EXT_BY_MIME[mime] || 'webm'
  const langParam = String(req.query?.lang || '')
    .slice(0, 2)
    .toLowerCase()
  const language = langParam === 'es' || langParam === 'en' ? langParam : null

  const form = new FormData()
  form.append('file', new Blob([audio], { type: mime }), `dictado.${ext}`)
  form.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3')
  form.append('response_format', 'json')
  if (language) form.append('language', language)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  let groqRes
  try {
    groqRes = await fetch(GROQ_TRANSCRIBE_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}` },
      body: form,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    console.error('[transcribe] Groq network error:', err?.message?.slice?.(0, 200) || err)
    return res.status(502).json({ error: 'transcription_failed' })
  }
  clearTimeout(timer)

  if (!groqRes.ok) {
    const body = await groqRes.text().catch(() => '')
    console.error('[transcribe] Groq API error:', groqRes.status, body.slice(0, 200))
    return res.status(502).json({ error: 'transcription_failed' })
  }

  const data = await groqRes.json().catch(() => ({}))
  const text = typeof data.text === 'string' ? data.text.trim() : ''
  return res.status(200).json({ text })
}
