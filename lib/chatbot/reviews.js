// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Ocelote AI — lib/chatbot/reviews.js
 *
 * Prueba social del chatbot, gobernada por datos.
 *
 * REGLA DURA: aquí solo entran reseñas REALES y verificables, copiadas
 * tal cual de donde se publicaron (Google, Viator, GetYourGuide,
 * Airbnb Experiences...), con su autor y su fuente. Mientras la lista
 * esté vacía, el chatbot NO cita ninguna reseña: jamás se inventa una.
 *
 * Formato de cada entrada:
 * {
 *   journey: '<slug del journey>' o '*' si es del negocio en general,
 *   quote_es: 'texto breve de la reseña en español',
 *   quote_en: 'short review text in English',
 *   author: 'Nombre o inicial del autor, como aparece en la fuente',
 *   source: 'Google' | 'Viator' | 'GetYourGuide' | 'Airbnb' | ...
 * }
 */
export const CHATBOT_REVIEWS = []

/**
 * Devuelve la línea de prueba social lista para agregar a una respuesta
 * del chat, o null si no hay reseñas reales para ese journey. Primero
 * busca una del journey; si no hay, usa una general ('*').
 */
export function socialProofLine(journeySlug, isEs) {
  if (!Array.isArray(CHATBOT_REVIEWS) || CHATBOT_REVIEWS.length === 0) return null
  const entry =
    CHATBOT_REVIEWS.find((r) => r && r.journey === journeySlug) ||
    CHATBOT_REVIEWS.find((r) => r && r.journey === '*') ||
    null
  if (!entry) return null
  const quote = isEs ? entry.quote_es || entry.quote_en : entry.quote_en || entry.quote_es
  if (!quote) return null
  const attribution = [entry.author, entry.source].filter(Boolean).join(', ')
  return isEs
    ? `Lo que dicen de nosotros: “${quote}” — ${attribution}`
    : `What people say about us: “${quote}” — ${attribution}`
}
