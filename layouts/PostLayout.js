import Link from '@/components/Link'
import PageTitle from '@/components/PageTitle'
import SectionContainer from '@/components/SectionContainer'
import { BlogSEO } from '@/components/SEO'
import Image from '@/components/Image'
import Tag from '@/components/Tag'
import TOCInline from '@/components/TOCInline'
import Comments from '@/components/comments'
import ScrollTopAndComment from '@/components/ScrollTopAndComment'
import SupportBanner from '@/components/SupportBanner'
import ShareJourneyBlock from '@/components/ShareJourneyBlock'
import ProseReveal from '@/components/ProseReveal'
import siteMetadata from '@/data/siteMetadata'

const postDateTemplate = { year: 'numeric', month: 'long', day: 'numeric' }

export default function PostLayout({ frontMatter, authorDetails, next, prev, toc, children }) {
  const { slug, date, title, summary, tags, images, readingTime, lang } = frontMatter
  const cover = Array.isArray(images) ? images[0] : images
  const author = authorDetails?.[0] || {}

  return (
    <div className="bg-transparent text-gray-900 dark:text-gray-100">
      <SectionContainer>
        <BlogSEO
          url={`${siteMetadata.siteUrl}/blog/${slug}`}
          authorDetails={authorDetails}
          {...frontMatter}
        />
        <ScrollTopAndComment />
        <article className="rounded-2xl border border-black/5 bg-white/70 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-black/40 sm:p-8">
          <header className="pt-8 pb-6 text-center">
            <Link
              href="/blog"
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-orange-500 dark:text-gray-400 dark:hover:text-orange-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="h-4 w-4"
              >
                <path
                  fillRule="evenodd"
                  d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 011.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
                  clipRule="evenodd"
                />
              </svg>
              {siteMetadata.headerTitle}
            </Link>

            {tags && tags.length > 0 && (
              <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
                {tags.map((tag) => (
                  <Tag key={tag} text={tag} />
                ))}
              </div>
            )}

            <PageTitle>{title}</PageTitle>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-zinc-500 dark:text-gray-400">
              {author.name && (
                <span className="inline-flex items-center gap-2">
                  {author.avatar && (
                    <Image
                      src={author.avatar}
                      alt={author.name}
                      width="28px"
                      height="28px"
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  )}
                  <span className="font-medium text-zinc-800 dark:text-gray-200">
                    {author.name}
                  </span>
                </span>
              )}
              {date && (
                <time dateTime={date}>
                  {new Date(date).toLocaleDateString(siteMetadata.locale, postDateTemplate)}
                </time>
              )}
              {readingTime?.text && (
                <span className="inline-flex items-center gap-1.5">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-4 w-4 text-orange-500"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {readingTime.text}
                </span>
              )}
            </div>
          </header>

          {cover && (
            <div className="relative mb-8 h-64 w-full overflow-hidden rounded-xl border border-zinc-200 dark:border-white/10 md:h-96">
              <Image src={cover} alt={title} fill sizes="100vw" className="object-cover" />
            </div>
          )}

          {toc && toc.length > 0 && (
            <div className="mb-8">
              <details
                className="rounded-xl border border-zinc-200 bg-zinc-100/60 p-4 dark:border-white/10 dark:bg-zinc-900/60"
                open
              >
                <summary className="cursor-pointer text-sm font-semibold uppercase tracking-wide text-zinc-600 dark:text-gray-300">
                  Table of contents
                </summary>
                <div className="mt-3 border-t border-zinc-200 pt-3 dark:border-white/10">
                  <TOCInline toc={toc} />
                </div>
              </details>
            </div>
          )}

          {summary && (
            <p className="mb-8 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 text-lg leading-relaxed text-zinc-700 dark:text-gray-200">
              {summary}
            </p>
          )}

          <ProseReveal className="prose prose-zinc max-w-none pb-8 dark:prose-dark">
            {children}
          </ProseReveal>

          {/* Cierre del artículo: compartir (spec cierre-venta-secciones.md).
              Va tras el contenido y ANTES de comentarios y del SupportBanner
              de donaciones: el post ya no cierra solo pidiendo una donación. */}
          <div className="pb-8">
            <ShareJourneyBlock lang={lang} title={title} />
          </div>

          {(next || prev) && (
            <div className="grid grid-cols-1 gap-4 border-t border-zinc-200 pt-8 dark:border-white/10 sm:grid-cols-2">
              {prev && (
                <Link
                  href={`/blog/${prev.slug}`}
                  style={{
                    background:
                      'linear-gradient(135deg, #6A0568 0%, #7B2BD9 25%, #9F0E7F 50%, #BE1588 75%, #DE1D8D 100%)',
                  }}
                  className="group flex flex-col rounded-xl p-5 text-white shadow-lg transition-all duration-300 hover:shadow-xl"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-white/70">
                    &larr; Previous
                  </span>
                  <span className="mt-2 font-semibold text-white group-hover:text-white">
                    {prev.title}
                  </span>
                </Link>
              )}
              {next && (
                <Link
                  href={`/blog/${next.slug}`}
                  style={{
                    background:
                      'linear-gradient(135deg, #6A0568 0%, #7B2BD9 25%, #9F0E7F 50%, #BE1588 75%, #DE1D8D 100%)',
                  }}
                  className="group flex flex-col rounded-xl p-5 text-right text-white shadow-lg transition-all duration-300 hover:shadow-xl dark:text-white sm:col-start-2"
                >
                  <span className="text-xs font-medium uppercase tracking-wide text-white/70">
                    Next &rarr;
                  </span>
                  <span className="mt-2 font-semibold text-white group-hover:text-white">
                    {next.title}
                  </span>
                </Link>
              )}
            </div>
          )}

          <div className="pt-8">
            <Comments frontMatter={frontMatter} />
          </div>

          <div className="pt-12">
            <SupportBanner />
          </div>
        </article>
      </SectionContainer>
    </div>
  )
}
