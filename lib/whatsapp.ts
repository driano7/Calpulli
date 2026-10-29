// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Utilidades del boton de WhatsApp: numero oficial y mensaje contextual
// segun la pagina en la que esta el visitante.

import { BRAND } from '@/lib/brand'

/** Numero oficial de Calpulli CDMX (sin parametros de consulta). */
export const WHATSAPP_URL = String(BRAND.whatsappUrl || '').split('?')[0]

/** Titulos cortos de los journeys para el mensaje precargado. */
const JOURNEY_TITLES: Record<string, { es: string; en: string }> = {
  luchas: { es: 'Luchas', en: 'Luchas' },
  chapultepec: { es: 'Chapultepec', en: 'Chapultepec' },
  jamaica: { es: 'Jamaica', en: 'Jamaica' },
  centro: { es: 'Centro Histórico', en: 'Historic Centre' },
  roma: { es: 'Roma–Condesa', en: 'Roma–Condesa' },
  antropologia: { es: 'Museo de Antropología', en: 'Museum of Anthropology' },
}

/**
 * Mensaje que se escribe solo en WhatsApp segun la pagina actual.
 * Asi quien llega desde un journey pregunta por ese journey y quien
 * llega al inicio pregunta en general.
 */
export function getWhatsAppMessage(pathname: string, isEs: boolean): string {
  const path = pathname || '/'

  if (path.startsWith('/journeys/')) {
    const slug = path.replace('/journeys/', '').split('/')[0]
    const journey = JOURNEY_TITLES[slug]
    if (slug === 'luchas') {
      return isEs
        ? 'Hola, quiero información del Journey de Luchas (Arena México / Arena Coliseo): funciones, horarios, punto de encuentro y cómo reservar.'
        : 'Hi, I would like information about the Luchas Journey (Arena Mexico / Arena Coliseo): shows, schedules, meeting point and how to book.'
    }
    if (journey) {
      return isEs
        ? `Hola, quiero información del Journey "${journey.es}": qué incluye, horarios y cómo reservar.`
        : `Hi, I would like information about the "${journey.en}" Journey: what it includes, schedules and how to book.`
    }
    return isEs
      ? 'Hola, quiero información sobre un Journey de Calpulli CDMX.'
      : 'Hi, I would like information about a Calpulli CDMX Journey.'
  }

  if (path.startsWith('/bookings') || path.startsWith('/checkout') || path.startsWith('/cart')) {
    return isEs
      ? 'Hola, necesito ayuda con mi reservación en Calpulli CDMX.'
      : 'Hi, I need help with my booking at Calpulli CDMX.'
  }

  if (path.startsWith('/local')) {
    return isEs
      ? 'Hola, quiero recomendaciones de la CDMX (Local Picks).'
      : 'Hi, I would like CDMX recommendations (Local Picks).'
  }

  if (path.startsWith('/maps')) {
    return isEs
      ? 'Hola, quiero información sobre los mapas y rutas de Calpulli CDMX.'
      : 'Hi, I would like information about Calpulli CDMX maps and routes.'
  }

  if (path.startsWith('/guides')) {
    return isEs
      ? 'Hola, quiero información sobre las guías de Calpulli CDMX.'
      : 'Hi, I would like information about Calpulli CDMX guides.'
  }

  if (path.startsWith('/about') || path.startsWith('/quienes-somos')) {
    return isEs
      ? 'Hola, quiero información sobre Calpulli CDMX, quiénes somos y qué ofrecemos.'
      : 'Hi, I would like information about Calpulli CDMX, who we are and what we offer.'
  }

  if (path.startsWith('/contact') || path.startsWith('/contacto')) {
    return isEs
      ? 'Hola, quiero contactar con Calpulli CDMX.'
      : 'Hi, I would like to contact Calpulli CDMX.'
  }

  if (path.startsWith('/pricing')) {
    return isEs
      ? 'Hola, quiero información sobre precios y tarifas de Calpulli CDMX.'
      : 'Hi, I would like information about Calpulli CDMX prices and rates.'
  }

  if (path === '/' || path === '') {
    return isEs
      ? 'Hola, tengo una duda sobre Calpulli CDMX y sus experiencias.'
      : 'Hi, I have a question about Calpulli CDMX and its experiences.'
  }

  return isEs
    ? 'Hola, tengo una duda sobre Calpulli CDMX.'
    : 'Hi, I have a question about Calpulli CDMX.'
}

/** Enlace de WhatsApp con el mensaje ya escrito. */
export function buildWhatsAppUrl(message?: string): string {
  if (!message) return WHATSAPP_URL
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}
