// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { getFileBySlug, bundleMdxSource } from '@/lib/mdx'
import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { PageSEO } from '@/components/SEO'
import { buildMapGuideEntity, buildWebPageEntity, buildBreadcrumbList } from '@/lib/seo'
import { useLanguage } from '@/lib/hooks/useLanguage'

export async function getStaticPaths() {
  const slugs = [
    'comida-tradicional',
    'zonas-precaucion',
    'vida-nocturna',
    'joyas-escondidas',
    'top-atracciones',
  ]
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const { slug } = params
  const loadOne = async (locale) => {
    const suffix = locale === 'en' ? '.en' : ''
    const cands = locale === 'en' ? [`${slug}.en`, `${slug}`] : [slug, `${slug}.en`]
    // Try data/maps first, then content/maps
    for (const cand of cands) {
      try {
        const p = await getFileBySlug('maps', cand)
        if (p) return p
      } catch (e) {
        void e
      }
    }
    // Fallback direct fs for both data and content
    try {
      const fs = await import('fs')
      const path = await import('path')
      const possible =
        locale === 'en' ? [`${slug}.en.mdx`, `${slug}.mdx`] : [`${slug}.mdx`, `${slug}.en.mdx`]
      const dirs = [
        path.join(process.cwd(), 'data', 'maps'),
        path.join(process.cwd(), 'content', 'maps'),
      ]
      for (const dir of dirs) {
        for (const file of possible) {
          const full = path.join(dir, file)
          if (fs.existsSync(full)) {
            const raw = fs.readFileSync(full, 'utf8')
            const bundled = await bundleMdxSource(raw, slug, file)
            return {
              mdxSource: bundled.mdxSource,
              toc: bundled.toc,
              frontMatter: bundled.frontMatter,
            }
          }
        }
      }
    } catch (e) {
      void e
    }
    return null
  }
  const postEs = await loadOne('es')
  const postEn = await loadOne('en')
  if (!postEs && !postEn) return { notFound: true }
  return { props: { postEs, postEn }, revalidate: 3600 }
}

export default function MapDetailPage({ postEs, postEn }) {
  const { currentLanguage } = useLanguage()
  const isEn = currentLanguage === 'en'
  const post = isEn ? postEn || postEs : postEs || postEn
  if (!post) return null
  const { mdxSource, frontMatter } = post
  const slug = String(frontMatter.slug || '').replace(/[.-](en|es)$/, '')
  const title = frontMatter.title || slug
  const description = frontMatter.summary || frontMatter.description || title
  const images = Array.isArray(frontMatter.images)
    ? frontMatter.images
    : frontMatter.images
    ? [frontMatter.images]
    : []
  return (
    <>
      <PageSEO
        title={`${title} — Mapa CDMX | Calpulli CDMX`}
        description={description}
        canonicalUrl={slug ? `/maps/${slug}` : '/maps'}
        ogImage={images[0] || undefined}
        jsonLd={[
          buildMapGuideEntity({
            slug,
            title,
            description,
            locale: isEn ? 'en' : 'es',
            image: images[0],
          }),
          buildWebPageEntity({
            title: `${title} — Mapa CDMX | Calpulli CDMX`,
            description,
            path: slug ? `/maps/${slug}` : '/maps',
          }),
          buildBreadcrumbList([
            { name: isEn ? 'Home' : 'Inicio', path: '/' },
            { name: 'Maps', path: '/maps' },
            { name: title, path: slug ? `/maps/${slug}` : '/maps' },
          ]),
        ]}
      />
      <MDXLayoutRenderer layout="PostLayout" mdxSource={mdxSource} frontMatter={frontMatter} />
    </>
  )
}
