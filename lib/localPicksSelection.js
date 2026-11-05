// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Seleccion de los Local Picks. MODULO PURO: no lee el disco, para que la
 * pagina pueda importarlo sin arrastrar `fs` al bundle del navegador.
 *
 * El listado final son los fijados (3 festividades: Dia de Muertos,
 * Independencia y Recomendaciones del Mes) + los que rotan.
 *
 * Reglas de rotacion:
 *   - Los que rotan se renuevan cada 3 meses (no cada mes).
 *   - Las 3 fijadas nunca se quitan: Dia de Muertos, Independencia y
 *     Recomendaciones del Mes (esta ultima se actualiza mensualmente).
 */

export const PINNED_PICKS_COUNT = 3
export const ROTATING_PICKS_COUNT = 8

export function getCurrentMonthKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}
const currentMonthKey = getCurrentMonthKey

/** Los fijados, en el orden en que se declararon. */
export function getPinnedLocalPicks(picks = []) {
  return picks
    .filter((pick) => pick.pinned === true && pick.isMonthlyGuide !== true)
    .sort(
      (a, b) =>
        (a.pinnedOrder ?? 99) - (b.pinnedOrder ?? 99) ||
        new Date(b.date || 0) - new Date(a.date || 0)
    )
}

/**
 * Los que rotan: los mas recientes que no estan fijados, filtrados por los
 * ultimos 3 meses para que la rotacion sea trimestral, no mensual.
 */
export function getRotatingLocalPicks(picks = [], limit = ROTATING_PICKS_COUNT) {
  const threeMonthsAgo = new Date()
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)

  return (
    picks
      .filter((pick) => pick.pinned !== true && pick.isMonthlyGuide !== true)
      .filter((pick) => {
        if (!pick.date) return false
        return new Date(pick.date) >= threeMonthsAgo
      })
      // No adelantar meses futuros: si el contenido de diciembre ya existe,
      // espera a que llegue diciembre para aparecer como "este mes".
      .filter((pick) => !pick.month || pick.month <= currentMonthKey())
      .slice(0, limit)
  )
}

/**
 * El listado completo: primero los fijados, despues los que rotan.
 * Es lo que se pinta en /local.
 */
export function getFeaturedLocalPicks(picks = [], { rotating = ROTATING_PICKS_COUNT } = {}) {
  return [...getPinnedLocalPicks(picks), ...getRotatingLocalPicks(picks, rotating)]
}
