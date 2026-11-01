'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Componente de recomendaciones mensuales (Local Picks).
// Lee las 8 actividades del mes actual desde Turso y las presenta como tarjetas,
// similar al bloque de Guides pero enfocado en planes del mes en CDMX.
import { useEffect, useState } from 'react'
import Link from '@/components/Link'
import Image from '@/components/Image'
import { useLanguage } from '@/lib/hooks/useLanguage'

interface LocalPick {
  id: string
  slug: string
  lang: string
  title: string
  festivity: string | null
  pinned: number
  pinned_order: number | null
  date: string | null
  tags: string[]
  draft: number
  summary: string
  images: string[]
  neighborhood: string | null
  budget: string | null
  category: string
  month: string | null
  pick_index: number | null
  total_picks: number | null
  is_monthly_guide: number
  body: string
  created_at: string
  updated_at: string
}

interface LocalPicksMonthlyProps {
  className?: string
}

export function LocalPicksMonthly({ className }: LocalPicksMonthlyProps) {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const [picks, setPicks] = useState<LocalPick[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const monthStamp = new Date().toISOString().slice(0, 7) // YYYY-MM

  useEffect(() => {
    let cancelled = false
    async function fetchPicks() {
      try {
        setLoading(true)
        const res = await fetch(`/api/local-picks?month=${monthStamp}&lang=${isEs ? 'es' : 'en'}`, {
          next: { revalidate: 3600 },
        })
        if (!res.ok) throw new Error('No se pudieron cargar los local picks')
        const data = await res.json()
        if (!cancelled) setPicks(data.picks || [])
      } catch (e) {
        if (!cancelled) {
          setError(e.message)
          setPicks([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void fetchPicks()
    return () => {
      cancelled = true
    }
  }, [monthStamp, isEs])

  if (loading) {
    return (
      <div className={className}>
        <div className="flex items-center justify-center py-12 text-zinc-500 dark:text-zinc-400">
          Cargando recomendaciones del mes…
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-700 dark:border-amber-900/20 dark:bg-amber-900/10 dark:text-amber-300">
          {error}
        </div>
      </div>
    )
  }

  if (!picks.length) {
    return (
      <div className={className}>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-zinc-500 dark:border-zinc-800/20 dark:bg-zinc-900/50 dark:text-zinc-400">
          <p className="text-sm font-medium">
            {isEs
              ? 'Aún no hay recomendaciones para este mes.'
              : 'No recommendations for this month yet.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="mb-6 flex items-center gap-2">
        <span className="text-2xl">📍</span>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {isEs ? 'Este mes en CDMX' : 'This month in CDMX'}
        </span>
      </div>
      <h2 className="mb-6 text-3xl font-bold text-gray-900 dark:text-white">
        {isEs ? 'Recomendaciones del mes' : 'Monthly recommendations'}
      </h2>
      <p className="mb-8 max-w-2xl text-gray-600 dark:text-gray-300">
        {isEs
          ? 'Ocho planes para este mes en la ciudad, elegidos por quién vive aquí. Mercados, exposiciones, comer y caminar.'
          : 'Eight plans for this month in the city, chosen by those who live here. Markets, exhibitions, food and walks.'}
      </p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {picks.map((pick) => (
          <Link
            key={pick.id}
            href={`/local/${pick.slug}-${isEs ? 'es' : 'en'}`}
            className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-orange-500/30 dark:border-white/10 dark:bg-zinc-900"
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
                    {isEs ? 'Foto' : 'Photo'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500 dark:text-zinc-400">
                {pick.neighborhood || (isEs ? 'CDMX' : 'CDMX')}
              </p>
              <h3 className="mb-2 text-lg font-bold text-gray-900 transition-colors group-hover:text-orange-600 dark:text-white dark:group-hover:text-orange-400">
                {pick.title}
              </h3>
              <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span>{pick.budget || '$'}</span>
                <span>•</span>
                <span>{pick.tags?.slice(0, 2).join(' · ') || ''}</span>
              </div>
              <p className="line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                {pick.summary ||
                  pick.body
                    ?.replace(/#{1,6}\s.*$/gm, '')
                    .replace(/[*_`]/g, '')
                    .slice(0, 140)}
                …
              </p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex justify-end">
        <Link
          href="/local"
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          {isEs ? 'Ver todas →' : 'View all →'}
        </Link>
      </div>
    </div>
  )
}
