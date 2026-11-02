// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Genera las "Recomendaciones del Mes" (pinned en /local) usando OpenRouter + NewsAPI + FRED
// Correr: node scripts/generate-recomendaciones-mes.mjs [YYYY-MM]
import { generateRecommendationsMonth } from '../lib/localPicks/generator-recomendaciones-mes.js'

const month = process.argv[2]
const date = month ? new Date(`${month}-15T12:00:00Z`) : new Date()

console.log(`Generando Recomendaciones del Mes para ${date.toISOString().slice(0, 7)}...`)

generateRecommendationsMonth(date)
  .then((result) => {
    if (result.created > 0) {
      console.log(`\nCreados ${result.created} archivos:`)
      result.files.forEach((f) => console.log(`  ${f}`))
    } else {
      console.log(`\nNo se generó nada nuevo: ${result.reason}`)
    }
  })
  .catch((error) => {
    console.error('\nError generando Recomendaciones del Mes:', error.message)
    process.exit(1)
  })