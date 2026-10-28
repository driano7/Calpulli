// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Sitemap dinámico (Pages Router, Next 12): rutas estáticas + tours + guides +
// maps + local picks + posts del blog. Sin dependencias nuevas (fs + gray-matter,
// ambas ya usadas en lib/mdx). Cacheado 24h en CDN vía s-maxage.
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import siteMetadata from '@/data/siteMetadata'
import { getAllLocalPickSlugs } from '@/lib/localPicks'

const SITE = (siteMetadata.siteUrl || 'https://donovan-amx.vercel.app').replace(/\/+$/, '')

function listFilesRecursive(dir, exts = ['.mdx', '.md']) {
  const out = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFilesRecursive(full, exts))
    else if (exts.includes(path.extname(entry.name))) out.push(full)
  }
  return out
}

function lastmodOf(file) {
  try {
    const { data } = matter(fs.readFileSync(file, 'utf8'))
    if (data?.draft === true) return null
    if (data?.date) return new Date(data.date).toISOString().slice(0, 10)
    return fs.statSync(file).mtime.toISOString().slice(0, 10)
  } catch {
    return null
  }
}

function slugFromFile(base, file) {
  return path
    .relative(base, file)
    .replace(/\\/g, '/')
    .replace(/\.(mdx|md)$/, '')
}

export default function Sitemap() {
  return null
}

export async function getServerSideProps({ res }) {
  const root = process.cwd()
  const today = new Date().toISOString().slice(0, 10)
  const urls = []

  // Rutas estáticas canónicas (sin redirects ni zonas privadas)
  for (const route of [
    '/',
    '/journeys',
    '/guides',
    '/maps',
    '/local',
    '/blog',
    '/projects',
    '/about',
    '/pricing',
  ]) {
    urls.push({ loc: `${SITE}${route === '/' ? '' : route}`, lastmod: today })
  }

  // La seccion /tours se retiro: sus URLs redirigen a /journeys.

  // Guides (data/guides/*.mdx, sin drafts)
  const guidesDir = path.join(root, 'data', 'guides')
  for (const file of listFilesRecursive(guidesDir)) {
    const lastmod = lastmodOf(file)
    if (!lastmod) continue
    urls.push({ loc: `${SITE}/guides/${slugFromFile(guidesDir, file)}`, lastmod })
  }

  // Maps (content/maps/*.mdx: base + .en — el slug es la base sin sufijo de idioma)
  const mapsDir = path.join(root, 'content', 'maps')
  const mapSlugs = new Set()
  for (const file of listFilesRecursive(mapsDir)) {
    const raw = slugFromFile(mapsDir, file).replace(/\.(en|es)$/, '')
    if (lastmodOf(file)) mapSlugs.add(raw)
  }
  for (const slug of mapSlugs) {
    urls.push({ loc: `${SITE}/maps/${slug}`, lastmod: today })
  }

  // Local picks (slugs vía lib/localPicks, hyphen-aware)
  try {
    for (const slug of getAllLocalPickSlugs()) {
      urls.push({ loc: `${SITE}/local/${slug}`, lastmod: today })
    }
  } catch {
    /* sin picks: se omite sin romper el sitemap */
  }

  // Blog (data/blog/**/*.mdx, sin drafts; el slug incluye subcarpeta Info/)
  const blogDir = path.join(root, 'data', 'blog')
  for (const file of listFilesRecursive(blogDir)) {
    const lastmod = lastmodOf(file)
    if (!lastmod) continue
    urls.push({ loc: `${SITE}/blog/${slugFromFile(blogDir, file)}`, lastmod })
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') +
    `\n</urlset>`

  res.setHeader('Content-Type', 'text/xml')
  res.setHeader('Cache-Control', 'public, s-maxage=86400, stale-while-revalidate')
  res.write(xml)
  res.end()

  return { props: {} }
}
