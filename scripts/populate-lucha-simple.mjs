// Script para poblar lucha_events en Turso con datos de ejemplo
import { createClient } from '@libsql/client'

const url = process.env.TURSO_URL || process.env.TURSO_DATABASE_URL
const authToken = process.env.TURSO_API_KEY || process.env.TURSO_AUTH_TOKEN

const client = createClient({ url, authToken })

const today = new Date()
today.setHours(0, 0, 0, 0)

const events = []

// Arena México: Martes 19:30, Viernes 20:30, Domingo 17:00
for (let i = 0; i < 12; i++) {
  const weekStart = new Date(today)
  weekStart.setDate(weekStart.getDate() + ((1 - weekStart.getDay() + 7) % 7))

  // Martes
  const tue = new Date(weekStart)
  tue.setDate(weekStart.getDate() + 1)
  events.push({
    arena: 'mexico',
    title: 'Función de Lucha Libre - Arena México',
    date: tue.toISOString().slice(0, 10),
    time: '19:30',
    luchadores: ['Pendiente de cartelera oficial'],
    cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
    price_min: 200,
    price_max: 1500,
    ticket_url: 'https://www.cmll.com/tickets/',
    status: 'scheduled',
  })

  // Viernes
  const fri = new Date(weekStart)
  fri.setDate(weekStart.getDate() + 4)
  events.push({
    arena: 'mexico',
    title: 'Viernes Espectacular - Arena México',
    date: fri.toISOString().slice(0, 10),
    time: '20:30',
    luchadores: ['Pendiente de cartelera oficial'],
    cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
    price_min: 300,
    price_max: 2000,
    ticket_url: 'https://www.cmll.com/tickets/',
    status: 'scheduled',
  })

  // Domingo
  const sun = new Date(weekStart)
  sun.setDate(weekStart.getDate() + 6)
  events.push({
    arena: 'mexico',
    title: 'Domingo Familiar - Arena México',
    date: sun.toISOString().slice(0, 10),
    time: '17:00',
    luchadores: ['Pendiente de cartelera oficial'],
    cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
    price_min: 150,
    price_max: 1000,
    ticket_url: 'https://www.cmll.com/tickets/',
    status: 'scheduled',
  })

  // Arena Coliseo: Jueves 19:00, Sábado 19:30
  const thu = new Date(weekStart)
  thu.setDate(weekStart.getDate() + 3)
  events.push({
    arena: 'coliseo',
    title: 'Función de Lucha Libre - Arena Coliseo',
    date: thu.toISOString().slice(0, 10),
    time: '19:00',
    luchadores: ['Pendiente de cartelera oficial'],
    cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
    price_min: 150,
    price_max: 800,
    ticket_url: 'https://www.cmll.com/tickets/',
    status: 'scheduled',
  })

  const sat = new Date(weekStart)
  sat.setDate(weekStart.getDate() + 5)
  events.push({
    arena: 'coliseo',
    title: 'Sábado de Lucha - Arena Coliseo',
    date: sat.toISOString().slice(0, 10),
    time: '19:30',
    luchadores: ['Pendiente de cartelera oficial'],
    cartelera: 'Cartelera por confirmar en sitio oficial CMLL',
    price_min: 200,
    price_max: 1200,
    ticket_url: 'https://www.cmll.com/tickets/',
    status: 'scheduled',
  })
}

async function main() {
  // Crear tabla
  await client.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS lucha_events (
        id TEXT PRIMARY KEY,
        arena TEXT NOT NULL CHECK (arena IN ('mexico', 'coliseo')),
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        luchadores TEXT NOT NULL,
        cartelera TEXT,
        price_min INTEGER NOT NULL,
        price_max INTEGER NOT NULL,
        ticket_url TEXT,
        status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled', 'completed')),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )
    `,
  })
  console.log('Tabla lucha_events creada/verificada')

  // Insertar eventos
  const now = new Date().toISOString()
  for (const event of events) {
    const id = `lucha-${event.arena}-${event.date}-${event.time.replace(/:/g, '')}`
    await client.execute({
      sql: `
        INSERT INTO lucha_events (id, arena, title, date, time, luchadores, cartelera, price_min, price_max, ticket_url, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          arena = excluded.arena,
          title = excluded.title,
          date = excluded.date,
          time = excluded.time,
          luchadores = excluded.luchadores,
          cartelera = excluded.cartelera,
          price_min = excluded.price_min,
          price_max = excluded.price_max,
          ticket_url = excluded.ticket_url,
          status = excluded.status,
          updated_at = excluded.updated_at
      `,
      args: [
        id,
        event.arena,
        event.title,
        event.date,
        event.time,
        JSON.stringify(event.luchadores),
        event.cartelera,
        event.price_min,
        event.price_max,
        event.ticket_url,
        event.status,
        now,
        now,
      ],
    })
  }
  console.log(`Insertados ${events.length} eventos de lucha`)
}

main().catch(e => {
  console.error('Error:', e.message)
  process.exit(1)
})
