/**
 * Calpulli CDMX Assistant — lib/openrouter.js (Gemini-first)
 * Cliente IA del asistente: Gemini (Google AI Studio) como proveedor principal,
 * con reintentos y rotación de modelos. Groq queda solo como fallback forzado
 * por env (AI_PROVIDER=groq). OpenRouter se retiró: su modelo gratis ya no
 * existe y solo generaba errores 404.
 *
 * Consumo tokens (antes: ~3000 tokens/request):
 *  - maxTokens 1200 -> 420 (respuestas concisas)
 *  - catálogo completo 12 tours detallado -> compacto (título+categoría+precio)
 *  - history 8 -> 6 mensajes
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY || ''
const GROQ_MODEL = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
// La API key se lee de env (GEMINI_API_KEY / GEMINI_KEY) en cada llamada:
// los scripts cargan .env.local después de importar, así que capturarla
// arriba dejaba la key vacía.
function getGeminiApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GEMINI_KEY || process.env.GOOGLE_API_KEY || ''
}
const GEMINI_API_KEY = getGeminiApiKey()
// Gemini es el default. AI_PROVIDER solo se respeta si es 'groq' para forzar el fallback.
const AI_PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase()
const GEMINI_MODEL_FLASH = process.env.GEMINI_MODEL_FLASH || 'gemini-flash-lite-latest'

// Orden de intento. Los alias "-latest" son los que Google mantiene vivos;
// los modelos con versión fija se jubilan para cuentas nuevas (404).
const GEMINI_FALLBACK_MODELS = [
  'gemini-flash-lite-latest',
  'gemini-3.5-flash-lite',
  'gemini-flash-latest',
]

// Estados que vale la pena reintentar contra el mismo modelo.
const RETRYABLE_STATUS = new Set([408, 429, 500, 502, 503, 504])
// Velocidad: menos reintentos y timeout más corto para que el bot responda rápido.
const MAX_ATTEMPTS_PER_MODEL = 2
const REQUEST_TIMEOUT_MS = 12000

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function buildGeminiPayload({ messages, maxTokens, temperature }) {
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  const systemInstruction = messages.find((m) => m.role === 'system')?.content

  return {
    contents,
    systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
    generationConfig: { maxOutputTokens: maxTokens, temperature },
  }
}

/**
 * Limpia el texto devuelto por Gemini: algunos modelos exponen su razonamiento
 * ("Draft 1", "Self-Correction", "Final Plan") antes de la respuesta real.
 */
function cleanGeminiContent(raw) {
  let content = typeof raw === 'string' ? raw : ''

  if (content.includes('*Revised Draft:*')) {
    const idx = content.indexOf('*Revised Draft:*')
    content = content.slice(idx + '*Revised Draft:*'.length).trim()
    content = content.replace(/^[*"\s]+/, '').trim()
  }

  if (content.trim().toLowerCase().startsWith('thought')) {
    content = content.replace(/^thought\s*/i, '').trim()
  }

  if (content.trim().startsWith('*Final Plan:') || content.trim().startsWith('*Wait,')) {
    const afterPlan = content.split('\n\n').slice(-2).join('\n\n')
    if (afterPlan.length > 20 && !afterPlan.includes('*Final Plan:')) content = afterPlan
    else content = content.replace(/^\*Final Plan:[^\n]*\n+/s, '').trim()
  }

  const hasReasoning =
    content.includes('Calpulli CDMX AI (Gemini') ||
    content.includes('Recommend gastronomy tours') ||
    content.includes('Draft 1') ||
    content.includes('Internal Monologue') ||
    content.includes('Self-Correction') ||
    content.includes('Max 2 paragraphs') ||
    content.includes('*Wait,') ||
    content.includes('*Final Polish') ||
    content.includes('*Final Plan:')

  if (hasReasoning) {
    const markers = [
      '¡Claro que sí!',
      '¡Hola!',
      'Hello!',
      '¡Perfecto!',
      '¡Genial!',
      '¡Por supuesto!',
    ]
    let start = -1
    // Buscar el PRIMER saludo (respuesta real), no el último pulido.
    for (const m of markers) {
      const idx = content.indexOf(m)
      if (idx !== -1 && (start === -1 || idx < start)) start = idx
    }

    if (start !== -1) {
      let cleaned = content.slice(start)
      const cutMarkers = ['\n*Wait,', '\n*Final Polish', '\n    *Wait,', '\n    *Final']
      for (const cm of cutMarkers) {
        const ci = cleaned.indexOf(cm)
        if (ci !== -1) cleaned = cleaned.slice(0, ci)
      }
      cleaned = cleaned
        .split('\n')
        .filter((line) => {
          const t = line.trim()
          if (
            t.startsWith('*') &&
            (t.includes('Max 2') ||
              t.includes('Concise') ||
              t.includes('Draft') ||
              t.includes('Self-Correction'))
          )
            return false
          if (t.startsWith('*') && t.includes('Calpulli CDMX AI')) return false
          if (t.includes('Self-Correction during drafting')) return false
          if (
            t.startsWith('*   Includes') ||
            t.startsWith('*   Asks') ||
            t.startsWith('*   Mentions')
          )
            return false
          return true
        })
        .join('\n')
        .trim()
        .replace(/^["')\s\].]+/, '')
        .trim()

      const paras = cleaned.split('\n\n').filter((p) => p.trim())
      if (paras.length > 2) {
        const real = paras
          .filter((p) => p.includes('¡') || p.includes('🌮') || p.includes('🏛️') || p.length > 60)
          .slice(0, 2)
        if (real.length >= 2) cleaned = real.join('\n\n')
      }

      if (cleaned.length < 20 && content.length > 50) {
        const lastPara = content
          .split('\n\n')
          .filter((p) => p.trim() && p.length > 50)
          .slice(-2)
          .join('\n\n')
        if (lastPara.length > cleaned.length) cleaned = lastPara
      }
      content = cleaned
    } else {
      const paras = content
        .split('\n\n')
        .filter((p) => p.trim() && !p.includes('Calpulli CDMX AI (Gemini'))
      if (paras.length >= 2) content = paras.slice(-2).join('\n\n')
    }
  }

  if (content.includes('*   Max 2') || content.includes('Self-Correction')) {
    content = content
      .split('\n')
      .filter((l) => {
        const t = l.trim()
        return (
          !t.startsWith('*   Max') && !t.startsWith('*   Concise') && !t.includes('Self-Correction')
        )
      })
      .join('\n')
      .trim()
  }

  return content.replace(/^["']\s*/, '').trim()
}

/**
 * Una llamada a un modelo concreto. Lanza un Error con `status` para que el
 * orquestador decida si reintenta el mismo modelo o pasa al siguiente.
 */
async function callGeminiModel({ model, messages, maxTokens, temperature }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  let res
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${getGeminiApiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeminiPayload({ messages, maxTokens, temperature })),
        signal: controller.signal,
      }
    )
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
    const body = await res.text().catch(() => '')
    const e = new Error(`Gemini API error: ${res.status} ${body.slice(0, 200)}`)
    e.status = res.status
    throw e
  }

  const json = await res.json()
  const parts = json.candidates?.[0]?.content?.parts || []
  const text =
    parts.find((p) => !p.thought)?.text || parts[parts.length - 1]?.text || parts[0]?.text || ''

  return cleanGeminiContent(text)
}

/**
 * Gemini con reintentos + rotación de modelos.
 * - 404 / 400 / 403: el modelo no sirve para esta cuenta, pasa al siguiente.
 * - 429 / 5xx / red / timeout / respuesta vacía: reintenta con backoff y,
 *   si se agota, pasa al siguiente modelo.
 */
async function callGemini({ messages, model, maxTokens, temperature }) {
  const models = [
    ...new Set([model, GEMINI_MODEL_FLASH, ...GEMINI_FALLBACK_MODELS].filter(Boolean)),
  ]
  let lastError = null

  for (const geminiModel of models) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const content = await callGeminiModel({
          model: geminiModel,
          messages,
          maxTokens,
          temperature,
        })
        if (content) return content
        lastError = new Error(`Gemini devolvió una respuesta vacía (${geminiModel})`)
        lastError.status = 503
      } catch (err) {
        lastError = err
        const status = err?.status
        // 404 puede ser un modelo retirado o un fallo transitorio de Google.
        if (status === 404 && attempt >= 2) break
        if (status !== 404 && !RETRYABLE_STATUS.has(status)) break
      }

      if (attempt < MAX_ATTEMPTS_PER_MODEL) {
        await sleep(400 * attempt + Math.floor(Math.random() * 150))
      }
    }
  }

  throw lastError || new Error('Gemini no devolvió respuesta')
}

/**
 * Streaming: llama a Gemini con streamGenerateContent y devuelve un
 * ReadableStream de texto (chunks parciales ya limpios). Incluye reintentos
 * y rotación de modelos igual que la versión no-streaming.
 */
async function callGeminiModelStream({ model, messages, maxTokens, temperature }) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS * 2) // más tiempo para stream

  let res
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${getGeminiApiKey()}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildGeminiPayload({ messages, maxTokens, temperature })),
        signal: controller.signal,
      }
    )
  } catch (err) {
    clearTimeout(timer)
    const e = new Error(
      controller.signal.aborted
        ? `Gemini stream timeout (${model})`
        : `Gemini stream network error: ${err instanceof Error ? err.message : String(err)}`
    )
    e.status = 0
    throw e
  }

  if (!res.ok) {
    clearTimeout(timer)
    const body = await res.text().catch(() => '')
    const e = new Error(`Gemini stream API error: ${res.status} ${body.slice(0, 200)}`)
    e.status = res.status
    throw e
  }

  // Devuelve el response body como stream; el caller procesará las líneas SSE.
  clearTimeout(timer)
  return res.body
}

async function callGeminiStream({ messages, model, maxTokens, temperature }) {
  const models = [
    ...new Set([model, GEMINI_MODEL_FLASH, ...GEMINI_FALLBACK_MODELS].filter(Boolean)),
  ]
  let lastError = null

  for (const geminiModel of models) {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS_PER_MODEL; attempt++) {
      try {
        const body = await callGeminiModelStream({
          model: geminiModel,
          messages,
          maxTokens,
          temperature,
        })
        if (body) return body
        lastError = new Error(`Gemini stream devolvió respuesta vacía (${geminiModel})`)
        lastError.status = 503
      } catch (err) {
        lastError = err
        const status = err?.status
        if (status === 404 && attempt >= 2) break
        if (status !== 404 && !RETRYABLE_STATUS.has(status)) break
      }

      if (attempt < MAX_ATTEMPTS_PER_MODEL) {
        await sleep(400 * attempt + Math.floor(Math.random() * 150))
      }
    }
  }

  throw lastError || new Error('Gemini stream no devolvió respuesta')
}

/**
 * calpulliChatStream — versión streaming del chat de Calpulli.
 * Devuelve un ReadableStream (fetch body) con SSE de Gemini.
 * El caller debe parsear las líneas `data: {...}` de Gemini SSE.
 */
export async function calpulliChatStream({ messages, model, maxTokens = 500, temperature = 0.4 }) {
  const useGemini =
    Boolean(getGeminiApiKey()) && AI_PROVIDER !== 'groq' && AI_PROVIDER !== 'openrouter'

  if (useGemini) {
    return await callGeminiStream({ messages, model, maxTokens, temperature })
  }

  // Si no hay Gemini, fallback a no-streaming: el caller deberá manejar
  // que recibe un string en vez de un stream.
  const reply = await calpulliChat({ messages, model, maxTokens, temperature })
  return reply
}

/**
 * @param {{ messages: Array<{role:string,content:string}>, model?:string, maxTokens?:number, temperature?:number }}
 */
export async function calpulliChat({ messages, model, maxTokens = 500, temperature = 0.4 }) {
  const useGemini =
    Boolean(getGeminiApiKey()) && AI_PROVIDER !== 'groq' && AI_PROVIDER !== 'openrouter'
  let geminiError = null

  if (useGemini) {
    try {
      return await callGemini({ messages, model, maxTokens, temperature })
    } catch (err) {
      geminiError = err
      console.warn(
        'Gemini falló tras reintentos:',
        err instanceof Error ? err.message : String(err)
      )
    }
  }

  // Fallback Groq: solo si se fuerza explícitamente por env.
  if (GROQ_API_KEY && (AI_PROVIDER === 'groq' || AI_PROVIDER === 'groq-fallback')) {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: model || GROQ_MODEL,
        messages,
        max_tokens: maxTokens,
        temperature,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => 'unknown')
      throw new Error(`Groq API error: ${res.status} ${body}`)
    }
    const json = await res.json()
    const content = json.choices?.[0]?.message?.content
    return typeof content === 'string' ? content : ''
  }

  if (geminiError) throw geminiError
  throw new Error('GEMINI_API_KEY is not configured')
}
