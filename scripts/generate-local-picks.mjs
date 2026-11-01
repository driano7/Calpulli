// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Genera los 8 Local Picks que rotan cada mes, con OpenRouter.
 *
 *   node scripts/generate-local-picks.mjs [YYYY-MM]
 *
 * El generador escribe un archivo por pick y por idioma (8 picks x 2 idiomas
 * = 16 archivos + guía mensual), descarga una foto iconica de Unsplash para
 * cada uno, y poda los meses viejos que ya no salen en el listado.
 */
import { generateLocalPicks } from '../lib/localPicks/generator.js'

const month = process.argv[2]
const date = month ? new Date(`${month}-15T12:00:00Z`) : new Date()

console.log(`Generando Local Picks para ${date.toISOString().slice(0, 7)}...`)

generateLocalPicks(date)
  .then((result) => {
    if (result.files && result.files.length) {
      console.log(`\nCreados ${result.files.length} archivos:`)
      result.files.forEach((f) => console.log(`  ${f}`))
    } else {
      console.log(`\nNo se genero nada nuevo: ${result.reason}`)
    }
    if (result.pruned && result.pruned.length) {
      console.log(`\nPodados ${result.pruned.length} archivos viejos:`)
      result.pruned.forEach((f) => console.log(`  ${f}`))
    }
  })
  .catch((error) => {
    console.error('\nError generando Local Picks:', error.message)
    process.exit(1)
  })
