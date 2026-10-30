// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Utilidades del boton de WhatsApp: numero oficial y mensaje contextual
// segun la pagina en la que esta el visitante.

import { BRAND } from '@/lib/brand'

/** Numero oficial de Calpulli CDMX (sin parametros de consulta). */
export const WHATSAPP_URL = String(BRAND.whatsappUrl || '').split('?')[0]

/** Idiomas soportados para los mensajes de WhatsApp. */
export type WhatsAppLang = 'es' | 'en' | 'fr' | 'it' | 'pt'

/** Titulos cortos de los journeys para el mensaje precargado. */
const JOURNEY_TITLES: Record<string, Record<WhatsAppLang, string>> = {
  luchas: { es: 'Luchas', en: 'Luchas', fr: 'Luchas', it: 'Luchas', pt: 'Luchas' },
  chapultepec: {
    es: 'Chapultepec',
    en: 'Chapultepec',
    fr: 'Chapultepec',
    it: 'Chapultepec',
    pt: 'Chapultepec',
  },
  jamaica: { es: 'Jamaica', en: 'Jamaica', fr: 'Jamaica', it: 'Jamaica', pt: 'Jamaica' },
  centro: {
    es: 'Centro Histórico',
    en: 'Historic Centre',
    fr: 'Centre Historique',
    it: 'Centro Storico',
    pt: 'Centro Histórico',
  },
  roma: {
    es: 'Roma–Condesa',
    en: 'Roma–Condesa',
    fr: 'Roma–Condesa',
    it: 'Roma–Condesa',
    pt: 'Roma–Condesa',
  },
  antropologia: {
    es: 'Museo de Antropología',
    en: 'Museum of Anthropology',
    fr: "Musée d'Anthropologie",
    it: 'Museo di Antropologia',
    pt: 'Museu de Antropologia',
  },
}

/**
 * Mensaje que se escribe solo en WhatsApp segun la pagina actual.
 * Idiomas: es, en, fr, it, pt. Cualquier otro idioma usa inglés.
 */
export function getWhatsAppMessage(pathname: string, lang: WhatsAppLang | string = 'es'): string {
  const path = pathname || '/'
  const l: WhatsAppLang = ['es', 'en', 'fr', 'it', 'pt'].includes(lang)
    ? (lang as WhatsAppLang)
    : 'en'

  const t = (es: string, en: string, fr: string, it: string, pt: string) => {
    const dict: Record<WhatsAppLang, string> = { es, en, fr, it, pt }
    return dict[l]
  }

  if (path.startsWith('/journeys/')) {
    const slug = path.replace('/journeys/', '').split('/')[0]
    const journey = JOURNEY_TITLES[slug]

    if (slug === 'luchas') {
      return t(
        'Hola, quiero información del Journey de Luchas (Arena México / Arena Coliseo): funciones, horarios, punto de encuentro y cómo reservar.',
        'Hi, I would like information about the Luchas Journey (Arena Mexico / Arena Coliseo): shows, schedules, meeting point and how to book.',
        'Bonjour, je voudrais des informations sur le Journey de Luchas (Arena Mexico / Arena Coliseo): spectacles, horaires, point de rendez-vous et comment réserver.',
        "Ciao, vorrei informazioni sul Journey di Luchas (Arena Mexico / Arena Coliseo): spettacoli, orari, punto d'incontro e come prenotare.",
        'Olá, gostaria de informações sobre o Journey de Luchas (Arena México / Arena Coliseo): funções, horários, ponto de encontro e como reservar.'
      )
    }
    if (journey) {
      return t(
        `Hola, quiero información del Journey "${journey.es}": qué incluye, horarios y cómo reservar.`,
        `Hi, I would like information about the "${journey.en}" Journey: what it includes, schedules and how to book.`,
        `Bonjour, je voudrais des informations sur le Journey "${journey.fr}": quoi inclut-il, horaires et comment réserver.`,
        `Ciao, vorrei informazioni sul Journey "${journey.it}": cosa include, orari e come prenotare.`,
        `Olá, gostaria de informações sobre o Journey "${journey.pt}": o que inclui, horários e como reservar.`
      )
    }
    return t(
      'Hola, quiero información sobre un Journey de Calpulli CDMX.',
      'Hi, I would like information about a Calpulli CDMX Journey.',
      'Bonjour, je voudrais des informations sur un Journey de Calpulli CDMX.',
      'Ciao, vorrei informazioni su un Journey di Calpulli CDMX.',
      'Olá, gostaria de informações sobre um Journey do Calpulli CDMX.'
    )
  }

  if (path.startsWith('/bookings') || path.startsWith('/checkout') || path.startsWith('/cart')) {
    return t(
      'Hola, necesito ayuda con mi reservación en Calpulli CDMX.',
      'Hi, I need help with my booking at Calpulli CDMX.',
      "Bonjour, j'ai besoin d'aide pour ma réservation chez Calpulli CDMX.",
      'Ciao, ho bisogno di aiuto per la mia prenotazione presso Calpulli CDMX.',
      'Olá, preciso de ajuda com minha reserva na Calpulli CDMX.'
    )
  }

  if (path.startsWith('/local')) {
    return t(
      'Hola, quiero recomendaciones de la CDMX (Local Picks).',
      'Hi, I would like CDMX recommendations (Local Picks).',
      'Bonjour, je voudrais des recommandations pour Mexico (Local Picks).',
      'Ciao, vorrei raccomandazioni per Città del Messico (Local Picks).',
      'Olá, gostaria de recomendações da CDMX (Local Picks).'
    )
  }

  if (path.startsWith('/maps')) {
    return t(
      'Hola, quiero información sobre los mapas y rutas de Calpulli CDMX.',
      'Hi, I would like information about Calpulli CDMX maps and routes.',
      'Bonjour, je voudrais des informations sur les cartes et itinéraires de Calpulli CDMX.',
      'Ciao, vorrei informazioni sulle mappe e gli itinerari di Calpulli CDMX.',
      'Olá, gostaria de informações sobre os mapas e rotas do Calpulli CDMX.'
    )
  }

  if (path.startsWith('/guides')) {
    return t(
      'Hola, quiero información sobre las guías de Calpulli CDMX.',
      'Hi, I would like information about Calpulli CDMX guides.',
      'Bonjour, je voudrais des informations sur les guides de Calpulli CDMX.',
      'Ciao, vorrei informazioni sulle guide di Calpulli CDMX.',
      'Olá, gostaria de informações sobre os guias do Calpulli CDMX.'
    )
  }

  if (path.startsWith('/about') || path.startsWith('/quienes-somos')) {
    return t(
      'Hola, quiero información sobre Calpulli CDMX, quiénes somos y qué ofrecemos.',
      'Hi, I would like information about Calpulli CDMX, who we are and what we offer.',
      'Bonjour, je voudrais des informations sur Calpulli CDMX, qui nous sommes et ce que nous offrons.',
      'Ciao, vorrei informazioni su Calpulli CDMX, chi siamo e cosa offriamo.',
      'Olá, gostaria de informações sobre o Calpulli CDMX, quem somos e o que oferecemos.'
    )
  }

  if (path.startsWith('/contact') || path.startsWith('/contacto')) {
    return t(
      'Hola, quiero contactar con Calpulli CDMX.',
      'Hi, I would like to contact Calpulli CDMX.',
      'Bonjour, je voudrais contacter Calpulli CDMX.',
      'Ciao, vorrei contattare Calpulli CDMX.',
      'Olá, gostaria de contatar o Calpulli CDMX.'
    )
  }

  if (path.startsWith('/pricing')) {
    return t(
      'Hola, quiero información sobre precios y tarifas de Calpulli CDMX.',
      'Hi, I would like information about Calpulli CDMX prices and rates.',
      'Bonjour, je voudrais des informations sur les prix et tarifs de Calpulli CDMX.',
      'Ciao, vorrei informazioni sui prezzi e le tariffe di Calpulli CDMX.',
      'Olá, gostaria de informações sobre preços e tarifas do Calpulli CDMX.'
    )
  }

  if (path === '/' || path === '') {
    return t(
      'Hola, tengo una duda sobre Calpulli CDMX y sus experiencias.',
      'Hi, I have a question about Calpulli CDMX and its experiences.',
      "Bonjour, j'ai une question sur Calpulli CDMX et ses expériences.",
      'Ciao, ho una domanda su Calpulli CDMX e le sue esperienze.',
      'Olá, tenho uma dúvida sobre o Calpulli CDMX e suas experiências.'
    )
  }

  return t(
    'Hola, tengo una duda sobre Calpulli CDMX.',
    'Hi, I have a question about Calpulli CDMX.',
    "Bonjour, j'ai une question sur Calpulli CDMX.",
    'Ciao, ho una domanda su Calpulli CDMX.',
    'Olá, tenho uma dúvida sobre o Calpulli CDMX.'
  )
}

/** Enlace de WhatsApp con el mensaje ya escrito. */
export function buildWhatsAppUrl(message?: string): string {
  if (!message) return WHATSAPP_URL
  return `${WHATSAPP_URL}?text=${encodeURIComponent(message)}`
}
