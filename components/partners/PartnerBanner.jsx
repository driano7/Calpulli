'use client'

// Partner message — ONLY on Journeys, Journey detail, Checkout,
// Reservations (/bookings) and Local recommendations (/local).
// Never on homepage, /maps, editorial blog, partner login or dashboards.
import { useRouter } from 'next/router'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { usePartnerReferral } from '@/lib/partners/usePartnerReferral'
import { Tag } from 'lucide-react'

const ALLOWED_PREFIXES = ['/journeys', '/checkout', '/bookings', '/local']

function isAllowed(pathname) {
  if (!pathname) return false
  return ALLOWED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))
}

export default function PartnerBanner({ compact = false, className = '' }) {
  const router = useRouter()
  const { currentLanguage } = useLanguage()
  const referral = usePartnerReferral()
  const isEs = currentLanguage === 'es'

  if (!isAllowed(router.pathname) && !isAllowed(router.asPath?.split('?')[0])) return null
  const partner = referral?.partner
  if (!partner) return null
  const pct = Math.round((Number(partner.guestDiscountPct) || 0) * 100)
  if (!pct) return null

  return (
    <div
      data-partner-banner="1"
      className={`flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 ${
        compact ? '' : 'mb-4'
      } ${className}`}
    >
      <Tag className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span>
        {isEs
          ? `Reservando a través de ${partner.name} — ${pct}% de descuento aplicado a tu total.`
          : `Booking via ${partner.name} — ${pct}% special discount applied to your total.`}
      </span>
    </div>
  )
}
