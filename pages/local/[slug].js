// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { getFileBySlug, bundleMdxSource } from '@/lib/mdx'
import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { getAllLocalPickSlugs, getLocalPickBySlug } from '@/lib/localPicks'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { Reveal } from '@/components/journeys/Reveal'
import Link from '@/components/Link'
import Image from '@/components/Image'
import { PageSEO } from '@/components/SEO'

export async function getStaticPaths() {
  const slugs = getAllLocalPickSlugs()
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const { slug } = params

  // fiesta-ano-nuevo ya no existe: redirigir a recomendaciones mensuales
  if (slug === 'fiesta-ano-nuevo') {
    return {
      redirect: {
        destination: '/local/recomendaciones-mes',
        permanent: true,
      },
    }
  }

  // recomendaciones-mes: mostrar actividades del mes actual (página generada dinámicamente)
  if (slug === 'recomendaciones-mes') {
    const { getAllLocalPicksAsync } = await import('@/lib/localPicksAsync')
    const picksEs = await getAllLocalPicksAsync('es')
    const picksEn = await getAllLocalPicksAsync('en')
    const month = new Date().toISOString().slice(0, 7)
    const monthEs = picksEs.filter((p) => p.month === month && !p.pinned)
    const monthEn = picksEn.filter((p) => p.month === month && !p.pinned)
    return {
      props: {
        slug: 'recomendaciones-mes',
        isMonthPage: true,
        month,
        picksEs,
        monthEs,
        picksEn,
        monthEn,
      },
      revalidate: 3600,
    }
  }

  const loadOne = async (locale) => {
    const cands = [`${slug}-${locale}`, `${slug}.${locale}`, slug]
    for (const cand of cands) {
      try {
        const p = await getFileBySlug('local-picks', cand)
        if (p) return p
      } catch (e) {
        void e
      }
    }
    const direct = getLocalPickBySlug(slug, locale)
    if (direct) {
      const { frontMatter, content } = direct
      const bundled = await bundleMdxSource(content, slug, `${slug}.mdx`)
      return { mdxSource: bundled.mdxSource, toc: bundled.toc, frontMatter: bundled.frontMatter }
    }
    return null
  }
  const postEs = await loadOne('es')
  const postEn = await loadOne('en')
  if (!postEs && !postEn) return { notFound: true }
  return { props: { postEs, postEn, slug, isMonthPage: false }, revalidate: 3600 }
}

export default function LocalPickPage({
  postEs,
  postEn,
  slug,
  isMonthPage,
  month,
  picksEs,
  monthEs,
  picksEn,
  monthEn,
}) {
  const { currentLanguage } = useLanguage()
  const isEn = currentLanguage === 'es'

  // Página de recomendaciones mensuales (MDX estático)
  if (isMonthPage) {
    const post = isEn ? postEn || postEs : postEs || postEn
    if (!post) return null
    const { mdxSource, frontMatter } = post
    frontMatter.slug = frontMatter.slug.replace(/[.-](en|es)$/, '')
    return (
      <>
        <PageSEO title={frontMatter.title} description={frontMatter.summary || ''} />
        <Reveal once={false} className="mb-8">
          <MDXLayoutRenderer layout="PostLayout" mdxSource={mdxSource} frontMatter={frontMatter} />
        </Reveal>
      </>
    )
  }

  // Página de detalle de un pick individual (MDX)
  const post = isEn ? postEn || postEs : postEs || postEn
  if (!post) return null
  const { mdxSource, frontMatter } = post
  frontMatter.slug = frontMatter.slug.replace(/[.-](en|es)$/, '')
  return (
    <Reveal once={false} className="mb-8">
      <MDXLayoutRenderer layout="PostLayout" mdxSource={mdxSource} frontMatter={frontMatter} />
    </Reveal>
  )
}
