// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Database schema for lucha events.
 *
 * Turso en prod usa la tabla legacy (arena_mexico/coliseo, event_date,
 * start_time, title_es/en). El código histórico creaba otra tabla con
 * (mexico/coliseo, date, time...) y fallaba con "no such column: time".
 * initLuchaEventsTable() migra in-place: agrega las columnas que espera el
 * código, sincroniza columnas legacy <-> nuevas y mapea arena.
 * La API pública (LuchaEvent) sigue usando mexico|coliseo + date/time.
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

const toDbArena = (arena: string) =>
  arena === 'mexico' || arena === 'arena_mexico' ? 'arena_mexico' : 'arena_coliseo'

const fromDbArena = (arena: string): 'mexico' | 'coliseo' =>
  arena === 'arena_mexico' || arena === 'mexico' ? 'mexico' : 'coliseo'

let _initPromise: Promise<void> | null = null

export async function initLuchaEventsTable(): Promise<void> {
  if (_initPromise) return _initPromise
  _initPromise = (async () => {
    // Tabla fresh (sin CHECK legacy). Si ya existe la legacy, CREATE IF NOT
    // EXISTS es no-op y la migración de abajo la alinea.
    await turso.execute({
      sql: `
        CREATE TABLE IF NOT EXISTS lucha_events (
          id TEXT PRIMARY KEY,
          arena TEXT NOT NULL CHECK (arena IN ('arena_mexico', 'arena_coliseo', 'mexico', 'coliseo')),
          title TEXT,
          title_es TEXT,
          title_en TEXT,
          date TEXT,
          event_date TEXT,
          time TEXT,
          start_time TEXT,
          end_time TEXT,
          day_of_week TEXT,
          luchadores TEXT,
          cartelera TEXT,
          description_es TEXT,
          description_en TEXT,
          price_min INTEGER NOT NULL DEFAULT 0,
          price_max INTEGER NOT NULL DEFAULT 0,
          ticket_url TEXT,
          url TEXT,
          published_at TEXT,
          source TEXT,
          status TEXT NOT NULL DEFAULT 'scheduled',
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      `,
    })

    // Migración para BDs ya creadas (legacy: sin date/time/title/status...).
    const columnsToAdd: Array<[string, string]> = [
      ['title', 'TEXT'],
      ['date', 'TEXT'],
      ['time', 'TEXT'],
      ['luchadores', 'TEXT'],
      ['cartelera', 'TEXT'],
      ['price_min', 'INTEGER NOT NULL DEFAULT 0'],
      ['price_max', 'INTEGER NOT NULL DEFAULT 0'],
      ['ticket_url', 'TEXT'],
      ['status', "TEXT NOT NULL DEFAULT 'scheduled'"],
      ['event_date', 'TEXT'],
      ['start_time', 'TEXT'],
      ['title_es', 'TEXT'],
      ['title_en', 'TEXT'],
      ['url', 'TEXT'],
      ['published_at', 'TEXT'],
      ['source', 'TEXT'],
      ['day_of_week', 'TEXT'],
      ['end_time', 'TEXT'],
      ['description_es', 'TEXT'],
      ['description_en', 'TEXT'],
    ]
    try {
      const info = await turso.execute({ sql: 'PRAGMA table_info(lucha_events)' })
      const existing = new Set(info.rows.map((r: any) => String(r.name)))
      for (const [name, def] of columnsToAdd) {
        if (!existing.has(name)) {
          try {
            await turso.execute({ sql: `ALTER TABLE lucha_events ADD COLUMN ${name} ${def}` })
          } catch {
            // columna duplicada: ya existe
          }
        }
      }
    } catch {
      // PRAGMA no disponible: intentar ALTERs idempotentes
      for (const [name, def] of columnsToAdd) {
        try {
          await turso.execute({ sql: `ALTER TABLE lucha_events ADD COLUMN ${name} ${def}` })
        } catch {
          /* ya existe */
        }
      }
    }

    // Sincronizar columnas legacy <-> nuevas (cuando alguien wrote solo una).
    const syncs = [
      'UPDATE lucha_events SET date = event_date WHERE (date IS NULL OR date = "") AND event_date IS NOT NULL',
      'UPDATE lucha_events SET event_date = date WHERE (event_date IS NULL OR event_date = "") AND date IS NOT NULL',
      'UPDATE lucha_events SET time = start_time WHERE (time IS NULL OR time = "") AND start_time IS NOT NULL',
      'UPDATE lucha_events SET start_time = time WHERE (start_time IS NULL OR start_time = "") AND time IS NOT NULL',
      'UPDATE lucha_events SET title = COALESCE(title_es, title_en) WHERE (title IS NULL OR title = "") AND (title_es IS NOT NULL OR title_en IS NOT NULL)',
      'UPDATE lucha_events SET title_es = title WHERE (title_es IS NULL OR title_es = "") AND title IS NOT NULL',
      'UPDATE lucha_events SET title_en = title WHERE (title_en IS NULL OR title_en = "") AND title IS NOT NULL',
      'UPDATE lucha_events SET ticket_url = url WHERE (ticket_url IS NULL OR ticket_url = "") AND url IS NOT NULL',
      'UPDATE lucha_events SET url = ticket_url WHERE (url IS NULL OR url = "") AND ticket_url IS NOT NULL',
      "UPDATE lucha_events SET status = 'scheduled' WHERE status IS NULL OR status = ''",
      "UPDATE lucha_events SET published_at = datetime('now') WHERE published_at IS NULL OR published_at = ''",
    ]
    for (const sql of syncs) {
      try {
        await turso.execute({ sql })
      } catch {
        /* columna destino aún no existe en BD muy antigua */
      }
    }

    for (const sql of [
      'CREATE INDEX IF NOT EXISTS idx_lucha_events_arena_date ON lucha_events (arena, date)',
      'CREATE INDEX IF NOT EXISTS idx_lucha_events_date ON lucha_events (date)',
      'CREATE INDEX IF NOT EXISTS idx_lucha_events_event_date ON lucha_events (event_date)',
    ]) {
      try {
        await turso.execute({ sql })
      } catch {
        /* índice duplicado */
      }
    }
  })()
  try {
    await _initPromise
  } catch (error) {
    _initPromise = null
    throw error
  }
}

export async function upsertLuchaEvent(
  event: Partial<LuchaEvent> & {
    arena: 'mexico' | 'coliseo'
    title?: string
    date?: string
    time?: string
  }
) {
  await initLuchaEventsTable()
  const now = new Date().toISOString()
  const date = String(event.date || (event as any).event_date || '').slice(0, 10)
  const time = String(event.time || (event as any).start_time || '20:30').slice(0, 5)
  const title = String(event.title || (event as any).title_es || 'Función de Lucha Libre')
  const arenaDb = toDbArena(String(event.arena))
  const id = event.id || `lucha-${fromDbArena(arenaDb)}-${date}-${String(time).replace(/\D/g, '')}`
  const luchadores = Array.isArray(event.luchadores)
    ? event.luchadores
    : String((event as any).luchadores || '[]')
  const cartelera = String(event.cartelera || (event as any).description_es || '')
  const ticketUrl = String(
    event.ticket_url || (event as any).url || 'https://www.cmll.com/tickets/'
  )
  const status = event.status || 'scheduled'

  await turso.execute({
    sql: `
      INSERT INTO lucha_events (id, arena, title, title_es, title_en, date, event_date, time, start_time, luchadores, cartelera, description_es, description_en, price_min, price_max, ticket_url, url, published_at, source, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        arena = excluded.arena,
        title = excluded.title,
        title_es = excluded.title_es,
        title_en = excluded.title_en,
        date = excluded.date,
        event_date = excluded.event_date,
        time = excluded.time,
        start_time = excluded.start_time,
        luchadores = excluded.luchadores,
        cartelera = excluded.cartelera,
        description_es = excluded.description_es,
        description_en = excluded.description_en,
        price_min = excluded.price_min,
        price_max = excluded.price_max,
        ticket_url = excluded.ticket_url,
        url = excluded.url,
        status = excluded.status,
        updated_at = excluded.updated_at
    `,
    args: [
      id,
      arenaDb,
      title,
      title,
      title,
      date,
      date,
      time,
      time,
      JSON.stringify(luchadores),
      cartelera,
      cartelera,
      cartelera,
      Number(event.price_min ?? (event as any).priceMin ?? 0) || 0,
      Number(event.price_max ?? (event as any).priceMax ?? 0) || 0,
      ticketUrl,
      ticketUrl,
      (event as any).published_at || now,
      (event as any).source || 'cmll-static',
      status,
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
  await initLuchaEventsTable()
  const conditions = ["COALESCE(status, 'scheduled') = 'scheduled'"]
  const args: any[] = []

  if (arena) {
    // Aceptar ambas representaciones en BD (legacy arena_mexico / código mexico)
    conditions.push('(arena = ? OR arena = ?)')
    args.push(toDbArena(arena), arena)
  }

  if (fromDate) {
    conditions.push("COALESCE(NULLIF(date, ''), event_date) >= ?")
    args.push(String(fromDate).slice(0, 10))
  }

  if (toDate) {
    conditions.push("COALESCE(NULLIF(date, ''), event_date) <= ?")
    args.push(String(toDate).slice(0, 10))
  }

  const sql = `
    SELECT id, arena,
      COALESCE(NULLIF(title, ''), title_es, title_en, 'Función de Lucha Libre') AS title,
      COALESCE(NULLIF(date, ''), event_date, '') AS date,
      COALESCE(NULLIF(time, ''), start_time, '20:30') AS time,
      luchadores, cartelera,
      COALESCE(description_es, description_en, '') AS description_es,
      price_min, price_max,
      COALESCE(NULLIF(ticket_url, ''), url, 'https://www.cmll.com/tickets/') AS ticket_url,
      COALESCE(status, 'scheduled') AS status,
      created_at, updated_at
    FROM lucha_events
    WHERE ${conditions.join(' AND ')}
    ORDER BY COALESCE(NULLIF(date, ''), event_date) ASC, COALESCE(NULLIF(time, ''), start_time) ASC
  `

  const result = await turso.execute({ sql, args })
  return result.rows.map((row: any) => {
    let luchadores: string[] = []
    try {
      const raw = row.luchadores
      luchadores = typeof raw === 'string' ? JSON.parse(raw) : Array.isArray(raw) ? raw : []
      if (!Array.isArray(luchadores)) luchadores = []
    } catch {
      luchadores = []
    }
    return {
      id: String(row.id),
      arena: fromDbArena(String(row.arena)),
      title: String(row.title || 'Función de Lucha Libre'),
      date: String(row.date || '').slice(0, 10),
      time: String(row.time || '20:30').slice(0, 5),
      luchadores,
      cartelera: String(row.cartelera || row.description_es || ''),
      price_min: Number(row.price_min ?? 0) || 0,
      price_max: Number(row.price_max ?? 0) || 0,
      ticket_url: String(row.ticket_url || 'https://www.cmll.com/tickets/'),
      status: (row.status as LuchaEvent['status']) || 'scheduled',
      created_at: String(row.created_at || new Date().toISOString()),
      updated_at: String(row.updated_at || new Date().toISOString()),
    } as LuchaEvent
  })
}

export async function getLuchaEventsByWeek(): Promise<Record<string, LuchaWeek[]>> {
  const events = await getLuchaEvents()
  const weeks: Record<string, LuchaWeek[]> = { mexico: [], coliseo: [] }

  const weekMap = new Map<string, LuchaWeek>()

  for (const event of events) {
    if (!event.date) continue
    const date = new Date(`${event.date}T12:00:00`)
    if (Number.isNaN(date.getTime())) continue
    const day = date.getDay()
    const diff = date.getDate() - day + (day === 0 ? -6 : 1) // Monday
    const monday = new Date(date)
    monday.setDate(diff)
    const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(monday.getDate()).padStart(2, '0')}`

    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    const weekEnd = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(sunday.getDate()).padStart(2, '0')}`

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
  await initLuchaEventsTable()
  await turso.execute({
    sql: "DELETE FROM lucha_events WHERE COALESCE(NULLIF(date, ''), event_date) < ? AND COALESCE(status, 'scheduled') != 'scheduled'",
    args: [beforeDate],
  })
}

/**
 * Límite server-side de checkout para Luchas: si la tabla tiene funciones,
 * la fecha debe ser una de ellas. Si está vacía (sin semilla), se permite
 * (para no bloquear el checkout en entornos sin cron).
 */
export async function isLuchaDateValid(date: string): Promise<boolean> {
  const normalized = String(date || '').slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return false
  try {
    await initLuchaEventsTable()
    const { rows } = await turso.execute({
      sql: "SELECT COALESCE(NULLIF(date, ''), event_date) AS d FROM lucha_events WHERE COALESCE(status, 'scheduled') = 'scheduled'",
      args: [],
    })
    const dates = new Set(rows.map((r: any) => String(r.d || '').slice(0, 10)).filter(Boolean))
    if (dates.size === 0) return true // sin funciones sembradas: no bloquear
    return dates.has(normalized)
  } catch {
    return true // Turso caído: no bloquear el cobro
  }
}
