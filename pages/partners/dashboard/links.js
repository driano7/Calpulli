// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import LinkGenerator from '@/components/partners/LinkGenerator'

export default function LinksPage() {
  const router = useRouter()
  const [partner, setPartner] = useState(null)
  const partnerId = router.query.partnerId || ''

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const token = localStorage.getItem('authToken')
        const q = new URLSearchParams()
        if (partnerId) q.set('partnerId', partnerId)
        const res = await fetch(`/api/partners/dashboard/settings?${q}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' },
        })
        const json = await res.json().catch(() => null)
        if (!cancelled && res.ok) setPartner(json.partner)
      } catch {
        void 0
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [partnerId])

  return (
    <DashboardLayout>
      {partner ? (
        <LinkGenerator partner={partner} />
      ) : (
        <p className="text-sm text-zinc-500">Cargando…</p>
      )}
    </DashboardLayout>
  )
}
