import Link from '@/components/Link'
import Image from '@/components/Image'
import ProseReveal from '@/components/ProseReveal'
import { motion } from 'framer-motion'
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  Check,
  ArrowLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { PageSEO } from '@/components/SEO'

export default function StoryDetail({ story, locale }) {
  const { t, currentLanguage } = useLanguage()
  const lang = currentLanguage || locale || 'en'
  const isEs = lang === 'es'

  const formatDate = (dateStr) => {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    return date.toLocaleDateString(isEs ? 'es-MX' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  return (
    <>
      <PageSEO title={story.title} description={story.excerpt} />
      <div className="min-h-screen bg-white dark:bg-zinc-950">
        {/* Hero Image */}
        <section className="relative h-[50vh] min-h-[350px]">
          <Image
            src={story.image}
            alt={story.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/30 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto px-6 pb-12">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                className="max-w-3xl"
              >
                <div className="mb-4 flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-medium uppercase tracking-wider text-gray-200">
                    {isEs ? 'Historia' : 'Story'}
                  </span>
                </div>
                <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-white md:text-4xl lg:text-5xl">
                  {story.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-gray-200">
                  {story.author && (
                    <div className="flex items-center gap-2">
                      {story.author.avatar && (
                        <Image
                          src={story.author.avatar}
                          alt={story.author.name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <span className="font-medium">{story.author.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-orange-500" />
                    <time dateTime={story.publishedAt}>{formatDate(story.publishedAt)}</time>
                  </div>
                  {story.readTime && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span>{story.readTime}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Content */}
        <section className="py-16 px-6 lg:py-24">
          <div className="container mx-auto max-w-3xl">
            <ProseReveal className="prose prose-zinc max-w-none leading-relaxed text-gray-700 dark:text-gray-300 dark:prose-dark">
              <div dangerouslySetInnerHTML={{ __html: story.content }} />
            </ProseReveal>

            {story.tags && story.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="mt-12 border-t border-zinc-200 pt-8 dark:border-white/10"
              >
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-600 transition-colors hover:bg-orange-500/20 hover:text-orange-500 dark:bg-white/5 dark:text-gray-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Back Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-12 border-t border-zinc-200 pt-8 dark:border-white/10"
            >
              <Link
                href="/stories"
                style={{
                  background:
                    'linear-gradient(135deg, #6A0568 0%, #7B2BD9 25%, #9F0E7F 50%, #BE1588 75%, #E4007C 100%)',
                }}
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
              >
                <ArrowLeft className="h-4 w-4" />
                {isEs ? 'Volver a Historias' : 'Back to Stories'}
              </Link>
            </motion.div>
          </div>
        </section>
      </div>
    </>
  )
}

export async function getStaticPaths() {
  // These would come from your CMS or data source
  const stories = [
    { id: 'hidden-cenotes-yucatan' },
    { id: 'oaxaca-night-markets' },
    { id: 'lost-temples-palenque' },
  ]

  return {
    paths: stories.map((s) => ({ params: { slug: s.id } })),
    fallback: 'blocking',
  }
}

export async function getStaticProps({ params }) {
  const slug = params?.slug

  try {
    const { turso } = await import('@/lib/turso')
    const result = await turso.execute({
      sql: `SELECT id, slug, locale, title, summary, body, image, category, date, source_url, tags
            FROM news_notes
            WHERE slug = ? AND published = 1
            LIMIT 1`,
      args: [slug],
    })

    const story = result.rows[0]
    if (!story) {
      return { notFound: true }
    }

    let tags = []
    try {
      tags = story.tags ? JSON.parse(story.tags) : []
    } catch {
      tags = []
    }

    return {
      props: {
        story: {
          id: story.id,
          slug: story.slug,
          locale: story.locale,
          title: story.title,
          excerpt: story.summary,
          content: story.body,
          image: story.image,
          category: story.category,
          sourceUrl: story.source_url,
          publishedAt: story.date,
          readTime: 5,
          tags,
        },
      },
      revalidate: 3600,
    }
  } catch (error) {
    console.error('Failed to fetch story:', error)
    return { notFound: true }
  }
}
