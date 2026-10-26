// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { getFileBySlug, bundleMdxSource } from '@/lib/mdx'
import { MDXLayoutRenderer } from '@/components/MDXComponents'
import { getAllLocalPickSlugs, getLocalPickBySlug } from '@/lib/localPicks'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { Reveal } from '@/components/journeys/Reveal'

export async function getStaticPaths() {
  const slugs = getAllLocalPickSlugs()
  return {
    paths: slugs.map((slug) => ({ params: { slug } })),
    fallback: false,
  }
}

export async function getStaticProps({ params }) {
  const { slug } = params
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
  return { props: { postEs, postEn }, revalidate: 3600 }
}

export default function LocalPickPage({ postEs, postEn }) {
  const { currentLanguage } = useLanguage()
  const isEn = currentLanguage === 'en'
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
