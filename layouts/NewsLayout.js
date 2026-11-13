import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import { BlogSEO } from '@/components/SEO'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import SupportBanner from '@/components/SupportBanner'
import ProseReveal from '@/components/ProseReveal'
import siteMetadata from '@/data/siteMetadata'

const postDateTemplate = { year: 'numeric', month: 'long', day: 'numeric' }

export default function NewsLayout({ frontMatter, children }) {
  const { slug, date, title, summary, tags, image, images, sourceUrl, lang } = frontMatter
  const cover = image || (Array.isArray(images) ? images[0] : null)
  const otherLocale = lang === 'es' ? 'en' : 'es'
  const otherLabel = otherLocale === 'es' ? '🇲🇽 Español' : '🇺🇸 English'

  return (
    <SectionContainer>
      <BlogSEO
        url={`${siteMetadata.siteUrl}/news/${slug}`}
        title={title}
        summary={summary}
        date={date}
        images={cover || []}
        {...frontMatter}
      />
      <article>
        <header className="pt-6 pb-6 text-center">
          <div className="space-y-4">
            {date && (
              <time
                dateTime={date}
                className="text-base font-medium leading-6 text-gray-500 dark:text-gray-400"
              >
                {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
              </time>
            )}
            <PageTitle>{title}</PageTitle>
            {summary && (
              <p className="mx-auto max-w-2xl text-lg text-zinc-600 dark:text-gray-400">
                {summary}
              </p>
            )}
            <div className="flex items-center justify-center gap-3">
              <Link
                href={`/news/${slug}?lang=${otherLocale}`}
                className="rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1 text-sm font-medium text-orange-500 transition-colors hover:bg-orange-500 hover:text-white"
              >
                {otherLabel}
              </Link>
              {sourceUrl && (
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border border-zinc-300 px-4 py-1 text-sm font-medium text-zinc-600 transition-colors hover:border-orange-500/50 hover:text-orange-500 dark:border-white/10 dark:text-gray-300"
                >
                  {lang === 'es' ? 'Ver fuente original ↗' : 'View original source ↗'}
                </a>
              )}
            </div>
          </div>
        </header>

        {cover && (
          <div className="relative mb-8 h-72 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10 md:h-96">
            <Image src={cover} alt={title} fill className="object-cover" sizes="100vw" />
          </div>
        )}

        <ProseReveal className="prose prose-zinc max-w-none pb-8 dark:prose-dark">
          {children}
        </ProseReveal>

        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t border-zinc-200 pt-6 dark:border-white/10">
            {tags.map((tag) => (
              <Tag key={tag} text={tag} />
            ))}
          </div>
        )}

        <div className="pt-6">
          <Link
            href="/news"
            style={{
              background:
                'linear-gradient(135deg, #6A0568 0%, #7B2BD9 25%, #9F0E7F 50%, #BE1588 75%, #E4007C 100%)',
            }}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            &larr; {lang === 'es' ? 'Volver a noticias' : 'Back to news'}
          </Link>
        </div>

        <div className="pt-12">
          <SupportBanner />
        </div>
      </article>
    </SectionContainer>
  )
}
