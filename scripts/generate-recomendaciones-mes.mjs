// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Genera las "Recomendaciones del Mes" (pinned en /local) usando OpenRouter + NewsAPI
// Correr: node scripts/generate-recomendaciones-mes.mjs [YYYY-MM]
// Siempre SOBREESCRIBE recomendaciones-mes-es.mdx y recomendaciones-mes-en.mdx (misma URL)
import { generateRecommendationsMonth } from '../lib/localPicks/generator-recomendaciones-mes.js'

const month = process.argv[2]
const date = month ? new Date(`${month}-15T12:00:00Z`) : new Date()

console.log(`Generando Recomendaciones del Mes para ${date.toISOString().slice(0, 7)}...`)

generateRecommendationsMonth(date)
  .then((result) => {
    console.log(`\nSobrescritos ${result.created} archivos:`)
    result.files.forEach((f) => console.log(`  ${f}`))
  })
  .catch((error) => {
    console.error('\nError generando Recomendaciones del Mes:', error.message)
    process.exit(1)
  })
