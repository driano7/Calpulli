// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Cliente Gemini (Google AI Studio) para generación de contenido.
 * Reemplaza a OpenRouter en los generadores de Local Picks y noticias.
 *
 * Uso:
 *   const { callGemini, GEMINI_MODEL_FLASH, GEMINI_MODEL_PRO } = require('./gemini')
 *   const texto = await callGemini(prompt, { model: GEMINI_MODEL_PRO, maxTokens: 3000 })
 *
 * Endpoint: generativelanguage.googleapis.com (API key de AI Studio, empieza con AIza...)
 */

// La key se lee en cada llamada: los scripts cargan .env.local después de
// requerir este módulo, y capturarla al importar dejaba la key vacía.
function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || ''
}
const GEMINI_PROJECT =
  process.env.GEMINI_PROJECT || process.env.PROJECT || process.env.NUMBER_PROJECT || ''

/** Modelo rápido para el chat del asistente. */
const GEMINI_MODEL_FLASH = process.env.GEMINI_MODEL_FLASH || 'gemini-flash-lite-latest'
/** Modelo para artículos largos (blog, recomendaciones). Flash-Lite: Pro no está en free tier. */
const GEMINI_MODEL_PRO = process.env.GEMINI_MODEL_PRO || 'gemini-flash-lite-latest'

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'

const FALLBACK_MODELS = ['gemini-flash-lite-latest', 'gemini-3.5-flash-lite', 'gemini-flash-latest']
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
const MAX_ATTEMPTS = 4
const REQUEST_TIMEOUT_MS = 60000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function requestModel({ model, prompt, maxTokens, temperature }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res
  try {
    res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${getGeminiApiKey()}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature },
      }),
      signal: controller.signal,
    })
  } catch (err) {
    const e = new Error(
      controller.signal.aborted
        ? `Gemini timeout after ${REQUEST_TIMEOUT_MS}ms (${model})`
        : `Gemini network error: ${err instanceof Error ? err.message : String(err)}`
    )
    e.status = 0
    throw e
  } finally {
    clearTimeout(timer)
  }

  if (!res.ok) {
    const body = await res.text().catch(() => 'unknown')
    const e = new Error(`Gemini error: ${res.status} ${body.slice(0, 200)}`)
    e.status = res.status
    throw e
  }

  const json = await res.json()
  const parts = json.candidates?.[0]?.content?.parts || []
  // Gemini puede devolver partes de "thought"; tomamos la primera sin thought.
  const content =
    parts.find((p) => !p.thought)?.text || parts[parts.length - 1]?.text || parts[0]?.text || ''
  return typeof content === 'string' ? content.trim() : ''
}

/**
 * Genera texto con Gemini, con reintentos y rotación de modelos.
 * @param {string} prompt
 * @param {{ model?: string, maxTokens?: number, temperature?: number }} [options]
 * @returns {Promise<string>}
 */
async function callGemini(prompt, options = {}) {
  if (!getGeminiApiKey()) throw new Error('GEMINI_API_KEY not set')
  const models = [
    ...new Set([options.model || GEMINI_MODEL_PRO, ...FALLBACK_MODELS].filter(Boolean)),
  ]
  const maxTokens = options.maxTokens || 3000
  const temperature = options.temperature ?? 0.7
  let lastError = null

  for (const model of models) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const content = await requestModel({ model, prompt, maxTokens, temperature })
        if (content) return content
        lastError = new Error(`Gemini devolvió una respuesta vacía (${model})`)
        lastError.status = 503
      } catch (err) {
        lastError = err
        const status = err?.status
        // 404 puede ser un modelo retirado o un fallo transitorio de Google:
        // damos un segundo intento y, si persiste, pasamos al siguiente modelo.
        if (status === 404 && attempt >= 2) break
        if (status !== 404 && !RETRYABLE_STATUS.has(status)) break
      }

      if (attempt < MAX_ATTEMPTS) {
        await sleep(1500 * attempt + Math.floor(Math.random() * 500))
      }
    }
  }

  throw lastError || new Error('Gemini no devolvió respuesta')
}

module.exports = {
  callGemini,
  GEMINI_MODEL_FLASH,
  GEMINI_MODEL_PRO,
  getGeminiApiKey,
}
