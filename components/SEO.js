import Head from 'next/head'
import { useRouter } from 'next/router'
import siteMetadata from '@/data/siteMetadata'
import { buildCanonicalUrl, buildBlogPostingEntity } from '@/lib/seo'
import JsonLd from '@/components/JsonLd'

const CommonSEO = ({ title, description, ogType, ogImage, twImage, canonicalUrl }) => {
  const router = useRouter()
  const canonical = buildCanonicalUrl(canonicalUrl || router.asPath)
  return (
    <Head>
      <title>{title}</title>
      <meta name="robots" content="index, follow" />
      <meta name="description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={siteMetadata.title} />
      <meta property="og:description" content={description} />
      <meta property="og:title" content={title} />
      {ogImage.constructor.name === 'Array' ? (
        ogImage.map(({ url }) => <meta property="og:image" content={url} key={url} />)
      ) : (
        <meta property="og:image" content={ogImage} key={ogImage} />
      )}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content={siteMetadata.twitter} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={twImage} />
      <link rel="canonical" href={canonical} />
    </Head>
  )
}

export const PageSEO = ({
  title,
  description,
  jsonLd,
  canonicalUrl,
  ogImage,
  ogType = 'website',
}) => {
  const ogImageUrl = ogImage
    ? ogImage.startsWith('http')
      ? ogImage
      : siteMetadata.siteUrl + ogImage
    : siteMetadata.siteUrl + siteMetadata.socialBanner
  const twImageUrl = ogImageUrl
  return (
    <>
      <CommonSEO
        title={title}
        description={description}
        ogType={ogType}
        ogImage={ogImageUrl}
        twImage={twImageUrl}
        canonicalUrl={canonicalUrl}
      />
      {jsonLd ? <JsonLd data={jsonLd} /> : null}
    </>
  )
}

export const TagSEO = ({ title, description }) => {
  const ogImageUrl = siteMetadata.siteUrl + siteMetadata.socialBanner
  const twImageUrl = siteMetadata.siteUrl + siteMetadata.socialBanner
  const router = useRouter()
  return (
    <>
      <CommonSEO
        title={title}
        description={description}
        ogType="website"
        ogImage={ogImageUrl}
        twImage={twImageUrl}
      />
      <Head>
        <link
          rel="alternate"
          type="application/rss+xml"
          title={`${description} - RSS feed`}
          href={`${siteMetadata.siteUrl}${router.asPath}/feed.xml`}
        />
      </Head>
    </>
  )
}

export const BlogSEO = ({
  authorDetails,
  title,
  summary,
  date,
  lastmod,
  url,
  images = [],
  canonicalUrl,
}) => {
  const router = useRouter()
  let imagesArr =
    images.length === 0
      ? [siteMetadata.socialBanner]
      : typeof images === 'string'
      ? [images]
      : images

  const featuredImages = imagesArr.map((img) => {
    return {
      '@type': 'ImageObject',
      url: img.includes('http') ? img : siteMetadata.siteUrl + img,
    }
  })

  const structuredData = buildBlogPostingEntity({
    title,
    summary,
    date,
    lastmod,
    url: url || buildCanonicalUrl(router.asPath),
    images,
    author: authorDetails?.[0]?.name || siteMetadata.author,
  })

  const twImageUrl = featuredImages[0].url

  return (
    <>
      <CommonSEO
        title={title}
        description={summary}
        ogType="article"
        ogImage={featuredImages}
        twImage={twImageUrl}
        canonicalUrl={canonicalUrl}
      />
      <Head>
        {date && <meta property="article:published_time" content={new Date(date).toISOString()} />}
        {lastmod && (
          <meta property="article:modified_time" content={new Date(lastmod).toISOString()} />
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData, null, 2),
          }}
        />
      </Head>
    </>
  )
}
