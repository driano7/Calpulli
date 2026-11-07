'use client'

// Local recommendations (/local): small badge ONLY (no price changes here).
import { useLanguage } from '@/lib/hooks/useLanguage'
import { usePartnerReferral } from '@/lib/partners/usePartnerReferral'
import { Tag } from 'lucide-react'

export default function PartnerBadge({ className = '' }) {
  const { currentLanguage } = useLanguage()
  const referral = usePartnerReferral()
  const partner = referral?.partner
  if (!partner) return null
  const pct = Math.round((Number(partner.guestDiscountPct) || 0) * 100)
  if (!pct) return null
  const isEs = currentLanguage === 'es'
  return (
    <span
      data-partner-badge="1"
      className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400 ${className}`}
    >
      <Tag className="h-3 w-3" aria-hidden />
      {isEs ? `-${pct}% con ${partner.name}` : `-${pct}% with ${partner.name}`}
    </span>
  )
}
