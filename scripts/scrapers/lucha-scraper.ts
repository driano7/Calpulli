// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Scraper for Lucha Libre events from Arena México and Arena Coliseo
 * Runs every 3 days via cron job
 */

// playwright import handled dynamically in API handler
let browser = null
import { upsertLuchaEvent, initLuchaEventsTable } from '../../lib/db/schema'

const ARENA_SOURCES = {
  mexico: {
    name: 'Arena México',
    url: 'https://www.cmll.com/arena-mexico/',
    ticketUrl: 'https://www.cmll.com/tickets/',
    selectors: {
      eventContainer: '.evento, .funcion, .card-evento, [class*="evento"]',
      title: '.titulo, .evento-titulo, h3, h4, .title',
      date: '.fecha, .evento-fecha, .date, [class*="fecha"]',
      time: '.hora, .evento-hora, .time, [class*="hora"]',
      luchadores: '.luchadores, .cartelera, .participantes, [class*="luchador"]',
      cartelera: '.cartelera-completa, .detalle-cartelera, .full-card',
      price: '.precio, .price, .costo',
      ticketLink: 'a[href*="ticket"], a[href*="bolet"], a[href*="compra"]',
    },
  },
  coliseo: {
    name: 'Arena Coliseo',
    url: 'https://www.cmll.com/arena-coliseo/',
    ticketUrl: 'https://www.cmll.com/tickets/',
    selectors: {
      eventContainer: '.evento, .funcion, .card-evento, [class*="evento"]',
      title: '.titulo, .evento-titulo, h3, h4, .title',
      date: '.fecha, .evento-fecha, .date, [class*="fecha"]',
      time: '.hora, .evento-hora, .time, [class*="hora"]',
      luchadores: '.luchadores, .cartelera, .participantes, [class*="luchador"]',
      cartelera: '.cartelera-completa, .detalle-cartelera, .full-card',
      price: '.precio, .price, .costo',
      ticketLink: 'a[href*="ticket"], a[href*="bolet"], a[href*="compra"]',
    },
  },
}

function parseDate(dateStr: string): string | null {
  // Try various date formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{1,2})\s+de\s+(\w+)\s+(\d{4})/i, // DD de Mes YYYY
    /(\w+)\s+(\d{1,2}),\s*(\d{4})/i, // Mes DD, YYYY
  ]

  for (const fmt of formats) {
    const match = dateStr.match(fmt)
    if (match) {
      if (fmt === formats[0]) {
        return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`
      }
      if (fmt === formats[1]) {
        return `${match[1]}-${match[2]}-${match[3].padStart(2, '0')}`
      }
      // For text dates, would need month parsing
    }
  }
  return null
}

function parseTime(timeStr: string): string {
  // Try to extract HH:MM format
  const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i)
  if (match) {
    let hour = parseInt(match[1])
    const minute = match[2]
    const ampm = match[3]?.toLowerCase()

    if (ampm === 'pm' && hour !== 12) hour += 12
    if (ampm === 'am' && hour === 12) hour = 0

    return `${hour.toString().padStart(2, '0')}:${minute}`
  }
  return '20:30' // default
}

function localIsoDate(date: Date): string {
  // La fecha del calendario local, sin pasar por UTC (toISOString puede
  // devolver el día anterior en México).
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function extractLuchadores(text: string): string[] {
  // Extract wrestler names from cartelera text
  // Common patterns: "Nombre Apellido", "Nombre 'Apodo' Apellido"
  const names = text
    .split(/[,;|\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3 && s.length < 50)
    .filter((s) => /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+\s+[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(s))
    .slice(0, 10)
  return [...new Set(names)] // deduplicate
}

async function scrapeArena(arenaKey: 'mexico' | 'coliseo') {
  const config = ARENA_SOURCES[arenaKey]
  console.log(`🔍 Scraping ${config.name}...`)

  // Playwright may not be available in all environments
  if (!browser) {
    console.log('Playwright not available, returning empty events')
    return []
  }
  const browserInstance = browser
  const page = await browser.newPage()

  try {
    await page.goto(config.url, { waitUntil: 'networkidle', timeout: 30000 })

    // Wait for content to load
    await page.waitForTimeout(3000)

    // Try to find events
    const events = await page.evaluate((selectors) => {
      const containers = document.querySelectorAll(selectors.eventContainer)
      const events = []

      containers.forEach((container, index) => {
        const titleEl = container.querySelector(selectors.title)
        const dateEl = container.querySelector(selectors.date)
        const timeEl = container.querySelector(selectors.time)
        const luchadoresEl = container.querySelector(selectors.luchadores)
        const carteleraEl = container.querySelector(selectors.cartelera)
        const priceEl = container.querySelector(selectors.price)
        const linkEl = container.querySelector(selectors.ticketLink)

        const title = titleEl?.textContent?.trim() || `Función ${index + 1}`
        const date = dateEl?.textContent?.trim() || ''
        const time = timeEl?.textContent?.trim() || ''
        const luchadoresText = luchadoresEl?.textContent?.trim() || ''
        const carteleraText = carteleraEl?.textContent?.trim() || ''
        const priceText = priceEl?.textContent?.trim() || ''
        const ticketUrl = linkEl?.getAttribute('href') || ''

        if (date) {
          events.push({
            title,
            date,
            time,
            luchadoresText,
            carteleraText,
            priceText,
            ticketUrl,
          })
        }
      })

      return events
    }, config.selectors)

    return events
  } catch (error) {
    console.error(`❌ Error scraping ${config.name}:`, error)
    return []
  } finally {
    await browser.close()
  }
}

// Fallback: Use static data from CMLL known schedule
function getStaticEvents(): any[] {
  const today = new Date()
  const events = []

  // Arena México: Tue 19:30, Fri 20:30, Sun 17:00
  // Arena Coliseo: Thu 19:00, Sat 19:30

  for (let i = 0; i < 12; i++) {
    // Next 12 weeks
    const weekStart = new Date()
    weekStart.setDate(today.getDate() + i * 7 + ((1 - today.getDay() + 7) % 7)) // Next Monday

    // Arena México events
    const tue = new Date(weekStart)
    tue.setDate(weekStart.getDate() + 1) // Tuesday
    events.push({
      arena: 'mexico',
      title: 'Función de Lucha Libre - Arena México',
      date: localIsoDate(tue),
      time: '19:30',
      luchadores: ['Pendiente de cartelera oficial'],
      cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
      price_min: 200,
      price_max: 1500,
      ticket_url: 'https://www.cmll.com/tickets/',
      status: 'scheduled',
    })

    const fri = new Date(weekStart)
    fri.setDate(weekStart.getDate() + 4) // Friday
    events.push({
      arena: 'mexico',
      title: 'Viernes Espectacular - Arena México',
      date: localIsoDate(fri),
      time: '20:30',
      luchadores: ['Pendiente de cartelera oficial'],
      cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
      price_min: 300,
      price_max: 2000,
      ticket_url: 'https://www.cmll.com/tickets/',
      status: 'scheduled',
    })

    const sun = new Date(weekStart)
    sun.setDate(weekStart.getDate() + 6) // Sunday
    events.push({
      arena: 'mexico',
      title: 'Domingo Familiar - Arena México',
      date: localIsoDate(sun),
      time: '17:00',
      luchadores: ['Pendiente de cartelera oficial'],
      cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
      price_min: 150,
      price_max: 1000,
      ticket_url: 'https://www.cmll.com/tickets/',
      status: 'scheduled',
    })

    // Arena Coliseo events
    const thu = new Date(weekStart)
    thu.setDate(weekStart.getDate() + 3) // Thursday
    events.push({
      arena: 'coliseo',
      title: 'Función de Lucha Libre - Arena Coliseo',
      date: localIsoDate(thu),
      time: '19:00',
      luchadores: ['Pendiente de cartelera oficial'],
      cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
      price_min: 150,
      price_max: 800,
      ticket_url: 'https://www.cmll.com/tickets/',
      status: 'scheduled',
    })

    const sat = new Date(weekStart)
    sat.setDate(weekStart.getDate() + 5) // Saturday
    events.push({
      arena: 'coliseo',
      title: 'Sábado de Lucha - Arena Coliseo',
      date: localIsoDate(sat),
      time: '19:30',
      luchadores: ['Pendiente de cartelera oficial'],
      cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
      price_min: 200,
      price_max: 1200,
      ticket_url: 'https://www.cmll.com/tickets/',
      status: 'scheduled',
    })
  }

  return events
}

export async function runLuchaScraper() {
  console.log('🚀 Starting Lucha Libre scraper...')

  await initLuchaEventsTable()

  // Try to scrape live data
  let allEvents: any[] = []

  try {
    const mexicoEvents = await scrapeArena('mexico')
    const coliseoEvents = await scrapeArena('coliseo')
    allEvents = [...mexicoEvents, ...coliseoEvents]
  } catch (error) {
    console.log('⚠️ Live scraping failed, using static schedule...')
  }

  // Fallback to static schedule if scraping failed
  if (allEvents.length === 0) {
    console.log('📅 Using static schedule based on CMLL known calendar...')
    allEvents = getStaticEvents()
  }

  console.log(`📥 Processing ${allEvents.length} events...`)

  let inserted = 0
  let updated = 0

  for (const event of allEvents) {
    try {
      const id = await upsertLuchaEvent(event)
      if (id.startsWith('lucha-')) {
        inserted++
      } else {
        updated++
      }
    } catch (error) {
      console.error('Error upserting event:', error)
    }
  }

  console.log(`✅ Done! Inserted: ${inserted}, Updated: ${updated}`)
}

// Run if executed directly
if (require.main === module) {
  runLuchaScraper()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Scraper failed:', err)
      process.exit(1)
    })
}

export { scrapeArena, getStaticEvents }
