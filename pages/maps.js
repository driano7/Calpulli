// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { PageSEO } from '@/components/SEO'
import { buildCollectionPageEntity, buildWebPageEntity, buildBreadcrumbList } from '@/lib/seo'
import CDMXInteractiveExperience from '@/components/CDMXInteractiveExperience'

const MAPS = [
  {
    slug: 'comida-tradicional',
    name: 'Comida tradicional en CDMX',
    description: 'Fondas sin tacos y mercados curados.',
  },
  {
    slug: 'zonas-precaucion',
    name: 'Zonas de precaución CDMX',
    description: 'Zonas con datos oficiales para caminar seguro.',
  },
  {
    slug: 'vida-nocturna',
    name: 'Vida nocturna CDMX',
    description: 'Mixología, bares y antros curados.',
  },
  {
    slug: 'joyas-escondidas',
    name: 'Joyas escondidas CDMX',
    description: 'Lugares fuera del circuito turístico.',
  },
  {
    slug: 'top-atracciones',
    name: 'Top atracciones CDMX 2026',
    description: 'Las atracciones que no puedes perderte.',
  },
]

export default function MapsPage() {
  const title = 'Mapas interactivos CDMX — Guía 2026 | Calpulli CDMX'
  const description =
    'Cinco mapas interactivos curados: fondas sin tacos, zonas de precaución con datos oficiales, mixología, joyas escondidas y top atracciones. Cada punto verificado para visitantes de 2 a 7 días.'
  return (
    <>
      <PageSEO
        title={title}
        description={description}
        canonicalUrl="/maps"
        jsonLd={[
          buildCollectionPageEntity({
            title,
            description,
            path: '/maps',
            items: MAPS.map((map) => ({ name: map.name, url: `/maps/${map.slug}` })),
          }),
          buildWebPageEntity({ title, description, path: '/maps' }),
          buildBreadcrumbList([
            { name: 'Inicio', path: '/' },
            { name: 'Maps', path: '/maps' },
          ]),
        ]}
      />
      <CDMXInteractiveExperience />
    </>
  )
}
