// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { getFileBySlug, bundleMdxSource } from '@/lib/mdx'
import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { getAllLocalPickSlugs, getLocalPickBySlug, getAllLocalPicks } from '@/lib/localPicks'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { Reveal } from '@/components/journeys/Reveal'
import Head from 'next/head'
import Link from '@/components/Link'
import Image from '@/components/Image'
import { PageSEO, BlogSEO } from '@/components/SEO'

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

  // recomendaciones-mes: actividades del mes actual (página MDX estática)
  if (slug === 'recomendaciones-mes') {
    const loadMonthPost = async (fileName) => {
      try {
        return await getFileBySlug('local-picks', fileName)
      } catch (err) {
        console.error(`[recomendaciones-mes] no se pudo compilar ${fileName}:`, err)
        return null
      }
    }
    const [postEs, postEn] = await Promise.all([
      loadMonthPost('recomendaciones-mes-es'),
      loadMonthPost('recomendaciones-mes-en'),
    ])
    const picksEs = getAllLocalPicks('es')
    const picksEn = getAllLocalPicks('en')
    const month = new Date().toISOString().slice(0, 7)
    const monthEs = picksEs.filter((p) => p.month === month && !p.pinned)
    const monthEn = picksEn.filter((p) => p.month === month && !p.pinned)
    return {
      props: {
        slug: 'recomendaciones-mes',
        isMonthPage: true,
        month,
        postEs,
        postEn,
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
  const isEs = currentLanguage === 'es'

  // Página de recomendaciones mensuales (MDX estático)
  if (isMonthPage) {
    const post = isEs ? postEs || postEn : postEn || postEs
    if (!post) return null
    const { mdxSource, frontMatter } = post
    frontMatter.slug = frontMatter.slug.replace(/[.-](en|es)$/, '')
    const canonicalEs = `https://donovan-amx.vercel.app/local/recomendaciones-mes`
    const canonicalEn = `https://donovan-amx.vercel.app/local/recomendaciones-mes`
    return (
      <>
        <Head>
          <link rel="alternate" hreflang="es" href={canonicalEs} />
          <link rel="alternate" hreflang="en" href={canonicalEn} />
          <link rel="alternate" hreflang="x-default" href={canonicalEs} />
        </Head>
        <BlogSEO
          title={frontMatter.title}
          summary={frontMatter.summary || ''}
          date={frontMatter.date}
          lastmod={frontMatter.date}
          images={frontMatter.images || []}
          author={frontMatter.author || 'Donovan Riaño'}
          canonicalUrl={isEs ? canonicalEs : canonicalEn}
        />
        <Reveal once={false} className="mb-8">
          <MDXLayoutRenderer layout="PostLayout" mdxSource={mdxSource} frontMatter={frontMatter} />
        </Reveal>
      </>
    )
  }

  // Página de detalle de un pick individual (MDX)
  const post = isEs ? postEs || postEn : postEn || postEs
  if (!post) return null
  const { mdxSource, frontMatter } = post
  frontMatter.slug = frontMatter.slug.replace(/[.-](en|es)$/, '')
  return (
    <Reveal once={false} className="mb-8">
      <MDXLayoutRenderer layout="PostLayout" mdxSource={mdxSource} frontMatter={frontMatter} />
    </Reveal>
  )
}
