import siteMetadata from '@/data/siteMetadata'

// Adaptación del kit SEO de Banff Studio (App Router) al pages router de Next 12.
// Centraliza la configuración, las URLs canónicas y los builders de JSON-LD.

export function getSiteUrl() {
  return (siteMetadata.siteUrl || '').replace(/\/+$/, '')
}

function stripTrailingSlash(url) {
  if (url.pathname !== '/' && url.pathname.endsWith('/')) {
    url.pathname = url.pathname.replace(/\/+$/, '')
  }
  url.search = ''
  url.hash = ''
  return url.pathname === '/' ? url.origin : url.toString()
}

function normalizePath(path) {
  const trimmed = (path || '').trim()
  if (!trimmed) return '/'
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

export function buildCanonicalUrl(path) {
  const base = getSiteUrl()
  if (!path || path === '/') {
    return stripTrailingSlash(new URL(base))
  }
  try {
    return stripTrailingSlash(new URL(path))
  } catch {
    return stripTrailingSlash(new URL(normalizePath(path), base))
  }
}

export function escapeJsonLd(value) {
  return String(value).replace(/</g, '\\u003c')
}

export function serializeJsonLd(value) {
  return escapeJsonLd(JSON.stringify(value))
}

export function normalizeJsonLdInput(value) {
  return Array.isArray(value) ? value : [value]
}

// ---- Entidades schema.org (basadas en entities.ts de banff) ----

export function buildOrganizationEntity() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${getSiteUrl()}#organization`,
    name: siteMetadata.headerTitle || siteMetadata.title,
    url: getSiteUrl(),
    logo: {
      '@type': 'ImageObject',
      url: buildCanonicalUrl(siteMetadata.siteLogo),
    },
    image: buildCanonicalUrl(siteMetadata.socialBanner),
    sameAs: [
      siteMetadata.instagram,
      siteMetadata.youtube,
      siteMetadata.tiktok,
      siteMetadata.twitter,
      siteMetadata.facebook,
      siteMetadata.linkedin,
    ].filter(Boolean),
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteMetadata.email,
      contactType: 'customer service',
    },
  }
}

export function buildWebSiteEntity() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${getSiteUrl()}#website`,
    url: getSiteUrl(),
    name: siteMetadata.title,
    inLanguage: siteMetadata.language || 'en-US',
    publisher: {
      '@id': `${getSiteUrl()}#organization`,
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: `${getSiteUrl()}/blog?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function buildBreadcrumbList(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: (items || []).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.path ? buildCanonicalUrl(item.path) : undefined,
    })),
  }
}

export function buildBlogPostingEntity({
  title,
  summary,
  date,
  lastmod,
  url,
  images = [],
  author,
}) {
  const imagesArr =
    images.length === 0
      ? [siteMetadata.socialBanner]
      : typeof images === 'string'
      ? [images]
      : images
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url || buildCanonicalUrl('/'),
    },
    headline: title,
    image: imagesArr.map((img) => ({
      '@type': 'ImageObject',
      url: img.includes('http') ? img : buildCanonicalUrl(img),
    })),
    datePublished: new Date(date).toISOString(),
    dateModified: new Date(lastmod || date).toISOString(),
    author: {
      '@type': 'Person',
      name: author || siteMetadata.author,
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${getSiteUrl()}#organization`,
    },
    description: summary,
    inLanguage: siteMetadata.language || 'en-US',
  }
}

export function buildTourEntity(tour, locale = 'en') {
  const priceCurrency = 'USD'
  const description = locale === 'es' && tour.descriptionEs ? tour.descriptionEs : tour.description
  const name = locale === 'es' && tour.titleEs ? tour.titleEs : tour.title
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    description,
    url: buildCanonicalUrl(`/tours/${tour.id}`),
    image: tour.imageUrl ? buildCanonicalUrl(tour.imageUrl) : undefined,
    provider: {
      '@id': `${getSiteUrl()}#organization`,
    },
    ...(tour.price
      ? {
          offers: {
            '@type': 'Offer',
            price: tour.price,
            priceCurrency,
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    ...(tour.duration
      ? {
          duration: `PT${tour.duration}H`,
        }
      : {}),
  }
}

export function buildFAQPageEntity(faqs) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: (faqs || []).map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  }
}

export function buildItemListEntity(items, listName) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    itemListElement: (items || []).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url ? buildCanonicalUrl(item.url) : undefined,
      name: item.name,
    })),
  }
}

export function buildWebPageEntity({ title, description, path }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url: buildCanonicalUrl(path),
    isPartOf: {
      '@id': `${getSiteUrl()}#website`,
    },
    about: {
      '@id': `${getSiteUrl()}#organization`,
    },
  }
}

export function buildCollectionPageEntity({ title, description, path, items = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description,
    url: buildCanonicalUrl(path),
    isPartOf: { '@id': `${getSiteUrl()}#website` },
    about: { '@id': `${getSiteUrl()}#organization` },
    hasPart: (items || []).map((item) => ({
      '@type': 'ListItem',
      url: item.url ? buildCanonicalUrl(item.url) : undefined,
      name: item.name,
    })),
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: (items || []).map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: item.url ? buildCanonicalUrl(item.url) : undefined,
        name: item.name,
      })),
    },
  }
}

export function buildJourneyEntity(journey, locale = 'es') {
  const pick = (es, en) => (locale === 'es' && es ? es : en || es)
  const name = pick(journey.title_es, journey.title_en)
  const description =
    pick(journey.subtitle_es, journey.subtitle_en) || pick(journey.intro_es, journey.intro_en)
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name,
    description,
    url: buildCanonicalUrl(`/journeys/${journey.slug}`),
    image: journey.heroImage ? buildCanonicalUrl(journey.heroImage) : undefined,
    provider: { '@id': `${getSiteUrl()}#organization` },
    ...(journey.price
      ? {
          offers: {
            '@type': 'Offer',
            price: journey.price,
            priceCurrency: 'MXN',
            availability: 'https://schema.org/InStock',
          },
        }
      : {}),
    touristType: ['Cultural', 'Walking'],
    itinerary: {
      '@type': 'ItemList',
      itemListElement: (journey.moments || []).map((moment, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: pick(moment.title_es, moment.title_en) || `Momento ${index + 1}`,
      })),
    },
  }
}

export function buildMapGuideEntity({ slug, title, description, locale = 'es', image }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristAttraction',
    name: title,
    description,
    url: buildCanonicalUrl(`/maps/${slug}`),
    image: image ? buildCanonicalUrl(image) : buildCanonicalUrl(siteMetadata.socialBanner),
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Ciudad de México',
      addressCountry: 'MX',
    },
    isAccessibleForFree: true,
    inLanguage: locale === 'es' ? 'es-419' : 'en-US',
  }
}
