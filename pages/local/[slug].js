// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { getFileBySlug, bundleMdxSource } from '@/lib/mdx'
import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { getAllLocalPicksAsync, getAllLocalPickSlugs, getLocalPickBySlug } from '@/lib/localPicks'
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
  const isEn = currentLanguage === 'en'

  // Página de recomendaciones mensuales
  if (isMonthPage) {
    const t = isEn
      ? {
          title: 'Activities of the Month in CDMX',
          subtitle: 'What to do this month in Mexico City — curated by locals',
          empty: 'No activities for this month yet. Check back soon!',
          readMore: 'Read More',
          neighborhood: 'Neighborhood',
          budget: 'Budget',
          monthHeading: 'This Month in CDMX',
          monthNote:
            'Six to eight activities curated by chilangos, updated on the 1st of every month.',
        }
      : {
          title: 'Actividades del Mes en CDMX',
          subtitle: 'Qué hacer este mes en la CDMX — curado por chilangos',
          empty: 'Todavía no hay actividades para este mes. ¡Vuelve pronto!',
          readMore: 'Leer Más',
          neighborhood: 'Colonia',
          budget: 'Presupuesto',
          monthHeading: 'Este Mes en CDMX',
          monthNote:
            'Seis a ocho actividades curadas por chilangos, actualizadas el día 1 de cada mes.',
        }
    const picks = isEn ? monthEn : monthEs
    const allPicks = isEn ? picksEn : picksEs

    return (
      <>
        <PageSEO title={t.title} description={t.subtitle} />
        <Reveal once={false} className="mb-8">
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 dark:border-amber-500/20 dark:bg-amber-500/5 sm:p-10">
            <div className="mb-4 flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span className="text-2xl">📅</span>
              <span className="text-xs font-bold uppercase tracking-widest">
                {isEn ? 'Activities of the Month' : 'Actividades del Mes'}
              </span>
            </div>
            <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
            <p className="mb-4 max-w-2xl text-gray-600 dark:text-gray-300">{t.subtitle}</p>
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-500 dark:text-amber-400">
              {t.monthNote}
            </p>
          </div>

          {picks.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {picks.map((pick) => (
                <Link
                  key={pick.id}
                  href={`/local/${pick.slug}`}
                  className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-zinc-200 border-amber-200/50 bg-white/70 backdrop-blur-md transition-all duration-300 hover:scale-[1.02] hover:border-amber-500/40 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-black/40 dark:hover:bg-zinc-900/70"
                >
                  <div className="mb-3 h-32 overflow-hidden rounded-lg border border-zinc-200 dark:border-white/10">
                    {pick.images?.[0] ? (
                      <Image
                        src={pick.images[0]}
                        alt={pick.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 320px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-zinc-100 dark:bg-zinc-800">
                        <span className="text-sm text-zinc-400 dark:text-zinc-500">
                          {t.monthHeading}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex-col p-4">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                      {pick.neighborhood || (isEn ? 'CDMX' : 'CDMX')}
                    </p>
                    <h3 className="line-clamp-1 mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-amber-600 dark:text-white dark:group-hover:text-amber-400">
                      {pick.title}
                    </h3>
                    <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                      <span>{pick.budget || '$'}</span>
                      <span>•</span>
                      <span>{pick.tags?.slice(0, 2).join(' · ') || ''}</span>
                    </div>
                    <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {pick.summary || ''}
                    </p>
                    <div className="mt-auto flex items-center justify-between">
                      <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {t.readMore}
                      </span>
                      <span className="text-xs text-zinc-400 dark:text-zinc-500">
                        {pick.budget || '$'}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500 dark:border-zinc-800/20 dark:bg-zinc-900/50 dark:text-zinc-400">
              <p className="text-sm font-medium">{t.empty}</p>
            </div>
          )}

          {allPicks.length > picks.length && (
            <div className="mt-8 flex justify-center">
              <Link
                href="/local"
                className="inline-flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/20 px-6 py-2.5 text-sm font-semibold text-amber-600 backdrop-blur-sm transition-all hover:bg-amber-500 hover:text-white dark:text-amber-400"
              >
                {isEn ? 'View all Local Picks →' : 'Ver toda la Selección Local →'}
              </Link>
            </div>
          )}
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
