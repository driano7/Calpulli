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
import PartnerBadge from '@/components/partners/PartnerBadge'

// Fotos alusivas libres de derechos (Unsplash). Sin Getty: tiene
// copyright y no se usa.
const MONTH_PHOTOS = [
  {
    src: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=900&q=80',
    alt: { es: 'Tacos y comida callejera de la CDMX', en: 'CDMX street food and tacos' },
  },
  {
    src: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=900&q=80',
    alt: { es: 'Arquitectura del Centro Histórico', en: 'Historic Centre architecture' },
  },
  {
    src: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=900&q=80',
    alt: { es: 'Vida de barrio en Roma–Condesa', en: 'Neighborhood life in Roma–Condesa' },
  },
  {
    src: 'https://images.unsplash.com/photo-1526772661822-98a872d3e7a6?w=900&q=80',
    alt: { es: 'Paseo en Chapultepec', en: 'Stroll in Chapultepec' },
  },
  {
    src: 'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=900&q=80',
    alt: { es: 'Mercados y artesanía local', en: 'Markets and local crafts' },
  },
  {
    src: 'https://images.unsplash.com/photo-1476514525535-07fb6b4ae8dd?w=900&q=80',
    alt: { es: 'Trajineras en Xochimilco', en: 'Trajineras in Xochimilco' },
  },
]

function MonthPhotoGallery({ isEs }) {
  const heading = isEs ? 'Fotos del mes' : 'Photos of the month'
  const note = isEs
    ? 'Fotos alusivas de las actividades. Créditos: Unsplash (uso libre).'
    : 'Allusive photos of the activities. Credits: Unsplash (free to use).'
  return (
    <section className="mx-auto mt-10 w-full max-w-5xl">
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">{heading}</h2>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">{note}</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MONTH_PHOTOS.map((photo) => (
          <figure
            key={photo.src}
            className="group relative h-56 overflow-hidden rounded-2xl border border-zinc-200/50 dark:border-white/10"
          >
            <Image
              src={photo.src}
              alt={isEs ? photo.alt.es : photo.alt.en}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-3 text-xs font-medium text-white">
              {isEs ? photo.alt.es : photo.alt.en}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

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
        <div className="mb-4 flex justify-center">
          <PartnerBadge />
        </div>
        <Reveal once={false} className="mb-8">
          <MDXLayoutRenderer layout="PostLayout" mdxSource={mdxSource} frontMatter={frontMatter} />
        </Reveal>
        <MonthPhotoGallery isEs={isEs} />
      </>
    )
  }

  // Página de detalle de un pick individual (MDX)
  const post = isEs ? postEs || postEn : postEn || postEs
  if (!post) return null
  const { mdxSource, frontMatter } = post
  frontMatter.slug = frontMatter.slug.replace(/[.-](en|es)$/, '')
  return (
    <>
      <div className="mb-4 flex justify-center">
        <PartnerBadge />
      </div>
      <Reveal once={false} className="mb-8">
        <MDXLayoutRenderer layout="PostLayout" mdxSource={mdxSource} frontMatter={frontMatter} />
      </Reveal>
      <MonthPhotoGallery isEs={isEs} />
    </>
  )
}
