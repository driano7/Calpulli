// Script para poblar lucha_events en Turso
// Uso: PATH=/usr/local/bin:/opt/homebrew/bin npx tsx scripts/populate-lucha.ts
import { initLuchaEventsTable } from '../lib/db/schema'
import { runLuchaScraper } from './scrapers/lucha-scraper'

async function main() {
  console.log('Inicializando tabla lucha_events...')
  await initLuchaEventsTable()
  console.log('Tabla creada/verificada')

  console.log('Ejecutando scraper de lucha...')
  await runLuchaScraper()
  console.log('Scraper ejecutado exitosamente')
}

main().catch((e) => {
  console.error('Error:', e.message)
  process.exit(1)
})
