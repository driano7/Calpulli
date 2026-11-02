// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Async version of local picks that uses Turso (server-side only).
import { getLocalPicks } from './localPicksTurso'
import { getAllLocalPicks } from './localPicksClient'

export async function getAllLocalPicksAsync(locale = 'en') {
  try {
    const picks = await getLocalPicks(locale)
    if (picks.length) return picks
  } catch (error) {
    console.warn('[local-picks] Turso no respondio, se usa el disco:', error.message)
  }
  return getAllLocalPicks(locale)
}
