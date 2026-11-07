// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// /recommendations -> /local (real Local Recommendations), preserving query.
import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function RecommendationsRedirect() {
  const router = useRouter()
  useEffect(() => {
    const qs = router.asPath.includes('?') ? router.asPath.slice(router.asPath.indexOf('?')) : ''
    void router.replace(`/local${qs}`)
  }, [router])
  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-zinc-500">
      Redirigiendo a Local Recommendations…
    </div>
  )
}
