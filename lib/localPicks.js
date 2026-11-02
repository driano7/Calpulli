// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const picksDir = path.join(process.cwd(), 'data', 'local-picks')

export function getLocalPickFiles() {
  if (!fs.existsSync(picksDir)) return []
  return fs
    .readdirSync(picksDir)
    .filter((file) => file.endsWith('.mdx'))
    .sort()
    .reverse()
}

export function pickSlugFromFile(file) {
  return file.replace(/[.-](en|es)\.mdx$/, '')
}

export function pickLocaleFromFile(file) {
  const match = file.match(/[.-](en|es)\.mdx$/)
  return match ? match[1] : 'en'
}

export function getAllLocalPicks(locale = 'en') {
  return getLocalPickFiles()
    .filter((file) => pickLocaleFromFile(file) === locale)
    .map((file) => {
      const raw = fs.readFileSync(path.join(picksDir, file), 'utf8')
      const { data } = matter(raw)
      return {
        ...data,
        slug: pickSlugFromFile(file),
        fileName: file,
        date: data.date ? new Date(data.date).toISOString() : null,
      }
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date))
}

export function getLocalPickBySlug(slug, locale = 'en') {
  const candidates = [
    `${slug}-${locale}.mdx`,
    `${slug}.${locale}.mdx`,
    `${slug}-en.mdx`,
    `${slug}.en.mdx`,
    `${slug}-es.mdx`,
    `${slug}.es.mdx`,
  ]
  for (const candidate of candidates) {
    const filePath = path.join(picksDir, candidate)
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8')
      const { data, content } = matter(raw)
      return {
        frontMatter: {
          ...data,
          slug,
          fileName: candidate,
          date: data.date ? new Date(data.date).toISOString() : null,
        },
        content,
      }
    }
  }
  return null
}

export async function getLocalPickBySlugAsync(slug, locale = 'en') {
  return getLocalPickBySlug(slug, locale)
}

export function getAllLocalPickSlugs() {
  return [...new Set(getLocalPickFiles().map(pickSlugFromFile))]
}

export function getCurrentMonthPicks(locale = 'en') {
  const month = new Date().toISOString().slice(0, 7)
  return getAllLocalPicks(locale).filter((p) => p.month === month || p.slug.startsWith(month))
}

// La seleccion vive en un modulo puro (sin `fs`) para que la pagina pueda
// importarla sin meter el sistema de archivos en el bundle del cliente.
export {
  PINNED_PICKS_COUNT,
  ROTATING_PICKS_COUNT,
  getPinnedLocalPicks,
  getRotatingLocalPicks,
  getFeaturedLocalPicks,
} from './localPicksSelection'
