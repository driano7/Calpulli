// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Database schema for lucha events
 */
import { turso } from './turso'

export interface LuchaEvent {
  id: string
  arena: 'mexico' | 'coliseo'
  title: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  luchadores: string[] // array of wrestler names
  cartelera: string // full card description
  price_min: number
  price_max: number
  ticket_url: string
  status: 'scheduled' | 'cancelled' | 'completed'
  created_at: string
  updated_at: string
}

export interface LuchaWeek {
  week_start: string // YYYY-MM-DD (Monday)
  week_end: string // YYYY-MM-DD (Sunday)
  arena: 'mexico' | 'coliseo'
  events: LuchaEvent[]
}

export async function initLuchaEventsTable() {
  await turso.execute({
    sql: `
      CREATE TABLE IF NOT EXISTS lucha_events (
        id TEXT PRIMARY KEY,
        arena TEXT NOT NULL CHECK (arena IN ('mexico', 'coliseo')),
        title TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        luchadores TEXT NOT NULL, -- JSON array
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

  await turso.execute({
    sql: `
      CREATE INDEX IF NOT EXISTS idx_lucha_events_arena_date
      ON lucha_events (arena, date)
    `,
  })

  await turso.execute({
    sql: `
      CREATE INDEX IF NOT EXISTS idx_lucha_events_date
      ON lucha_events (date)
    `,
  })
}

export async function upsertLuchaEvent(event: LuchaEvent) {
  const now = new Date().toISOString()
  // Id determinista: la misma función (arena + fecha + hora) actualiza la fila
  // existente en vez de acumular duplicados cada vez que corre el cron.
  const id =
    event.id || `lucha-${event.arena}-${event.date}-${String(event.time || '').replace(/\D/g, '')}`

  await turso.execute({
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
      event.cartelera || '',
      event.price_min,
      event.price_max,
      event.ticket_url || '',
      event.status,
      event.created_at || now,
      now,
    ],
  })

  return id
}

export async function getLuchaEvents(
  arena?: 'mexico' | 'coliseo',
  fromDate?: string,
  toDate?: string
): Promise<LuchaEvent[]> {
  let sql = 'SELECT * FROM lucha_events WHERE status = "scheduled"'
  const args: any[] = []

  if (arena) {
    sql += ' AND arena = ?'
    args.push(arena)
  }

  if (fromDate) {
    sql += ' AND date >= ?'
    args.push(fromDate)
  }

  if (toDate) {
    sql += ' AND date <= ?'
    args.push(toDate)
  }

  sql += ' ORDER BY date ASC, time ASC'

  const result = await turso.execute({ sql, args })
  return result.rows.map((row) => ({
    ...row,
    luchadores: JSON.parse(row.luchadores as string),
  })) as LuchaEvent[]
}

export async function getLuchaEventsByWeek(): Promise<Record<string, LuchaWeek[]>> {
  const events = await getLuchaEvents()
  const weeks: Record<string, LuchaWeek[]> = { mexico: [], coliseo: [] }

  const weekMap = new Map<string, LuchaWeek>()

  for (const event of events) {
    const date = new Date(event.date)
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday
    const monday = new Date(date.setDate(diff))
    const weekStart = monday.toISOString().split('T')[0]

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const weekEnd = sunday.toISOString().split('T')[0]

    const key = `${event.arena}-${weekStart}`

    if (!weekMap.has(key)) {
      weekMap.set(key, {
        week_start: weekStart,
        week_end: weekEnd,
        arena: event.arena,
        events: [],
      })
    }

    weekMap.get(key)!.events.push(event)
  }

  for (const [key, week] of weekMap) {
    weeks[week.arena].push(week)
  }

  // Sort weeks by start date
  weeks.mexico.sort((a, b) => a.week_start.localeCompare(b.week_start))
  weeks.coliseo.sort((a, b) => a.week_start.localeCompare(b.week_start))

  return weeks
}

export async function deleteOldLuchaEvents(beforeDate: string) {
  await turso.execute({
    sql: 'DELETE FROM lucha_events WHERE date < ? AND status != "scheduled"',
    args: [beforeDate],
  })
}
