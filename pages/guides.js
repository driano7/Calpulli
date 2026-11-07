// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { PageSEO } from '@/components/SEO'
import { buildCollectionPageEntity, buildWebPageEntity, buildBreadcrumbList } from '@/lib/seo'
import InteractiveGuidesSplitScroll from '@/components/InteractiveGuidesSplitScroll'

const GUIDES = [
  { slug: 'condesa-walk', name: 'Condesa a pie' },
  { slug: 'condesa-a-pie', name: 'Condesa a pie (ES)' },
  { slug: 'historic-center-palaces', name: 'Centro histórico y palacios' },
  { slug: 'centro-palacios', name: 'Centro y palacios (ES)' },
  { slug: 'chapultepec-agua', name: 'Chapultepec y el agua' },
  { slug: 'chimalistac-bridges', name: 'Chimalistac y puentes' },
  { slug: 'chimalistac-puentes', name: 'Chimalistac y puentes (ES)' },
  { slug: 'unam-murals', name: 'UNAM y los murales' },
  { slug: 'unam-murales', name: 'UNAM y los murales (ES)' },
]

export default function GuidesPage() {
  const title = 'Guides — 5 Journeys de Cultura Fácil | Calpulli CDMX'
  const description =
    'Cinco recorridos autoguiados de 60-90 min: Condesa, Centro, Chapultepec II, Chimalistac y UNAM. Cultura fácil para caminar solo.'
  return (
    <>
      <PageSEO
        title={title}
        description={description}
        canonicalUrl="/guides"
        jsonLd={[
          buildCollectionPageEntity({
            title,
            description,
            path: '/guides',
            items: GUIDES.map((guide) => ({ name: guide.name, url: `/guides/${guide.slug}` })),
          }),
          buildWebPageEntity({ title, description, path: '/guides' }),
          buildBreadcrumbList([
            { name: 'Inicio', path: '/' },
            { name: 'Guides', path: '/guides' },
          ]),
        ]}
      />
      <InteractiveGuidesSplitScroll />
    </>
  )
}
