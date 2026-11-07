'use client'

// Shows strikethrough original + discounted price + savings + currency.
// Regular visitors (no referral) see only the public price.
import { useLanguage } from '@/lib/hooks/useLanguage'
import { formatPriceMXN } from '@/lib/currency'
import { usePartnerReferral } from '@/lib/partners/usePartnerReferral'
import { getDiscountedPrice } from '@/lib/partners/client'

export default function PartnerPrice({ originalAmount, className = '' }) {
  const { currentLanguage } = useLanguage()
  const locale = currentLanguage === 'es' ? 'es' : 'en'
  const referral = usePartnerReferral()
  const original = Number(originalAmount) || 0

  if (!referral?.partner || original <= 0) {
    return (
      <span className={`tabular-nums ${className}`}>{formatPriceMXN(original, locale)} MXN</span>
    )
  }

  const { discountAmount, finalAmount } = getDiscountedPrice(original, referral)
  const pct = Math.round((Number(referral.partner.guestDiscountPct) || 0) * 100)
  const isEs = locale === 'es'

  return (
    <span className={`flex flex-col items-start gap-0.5 ${className}`}>
      <span className="flex items-baseline gap-2">
        <s className="text-sm tabular-nums text-zinc-400">{formatPriceMXN(original, locale)}</s>
        <span className="text-base font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
          {formatPriceMXN(finalAmount, locale)} <span className="text-xs font-semibold">MXN</span>
        </span>
      </span>
      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
        {isEs
          ? `Ahorras ${formatPriceMXN(discountAmount, locale)} (${pct}%) con ${
              referral.partner.name
            }`
          : `You save ${formatPriceMXN(discountAmount, locale)} (${pct}%) via ${
              referral.partner.name
            }`}
      </span>
    </span>
  )
}
