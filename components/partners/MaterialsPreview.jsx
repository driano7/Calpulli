'use client'

// Guest materials — bilingual cards, sticker, WhatsApp, IG.
// Approved language only. No transport claims, no hotel-operates claims.
import QRCodeBox from './QRCodeBox'
import { buildReferralUrl } from '@/lib/partners/links'

export default function MaterialsPreview({ partner }) {
  const pct = Math.round((Number(partner?.guestDiscountPct) || 0) * 100)
  const origin = typeof window !== 'undefined' ? window.location.origin : undefined
  const journeysUrl = buildReferralUrl({ ref: partner?.slug, path: '/journeys', origin })
  const whatsappText = `¿Te quedas en ${partner?.name}? Tus huéspedes tienen ${pct}% off en walking Journeys de Calpulli CDMX: ${journeysUrl} | English: Your stay at ${partner?.name} includes ${pct}% off Calpulli CDMX walking Journeys: ${journeysUrl}`

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      void 0
    }
  }

  const Card = ({ title, placement }) => (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
      <p className="text-xs font-bold uppercase tracking-widest text-orange-600">{title}</p>
      <p className="mt-1 text-sm font-bold text-zinc-900 dark:text-white">
        Calpulli CDMX — {partner?.name}
      </p>
      <p className="text-sm text-zinc-600 dark:text-zinc-300">
        {pct}% off eligible walking Journeys / {pct}% de descuento en Journeys seleccionados
      </p>
      <div className="mt-3">
        <QRCodeBox
          url={buildReferralUrl({ ref: partner?.slug, path: '/journeys', placement, origin })}
          partner={partner}
          placement={placement}
        />
      </div>
      <p className="mt-2 text-[11px] text-zinc-400">Code: {partner?.referralCode}</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="Guest Card A / Front desk" placement="front-desk" />
        <Card title="Guest Card B / Check-in" placement="check-in-card-a" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card title="QR Sticker" placement="sticker" />
        <Card title="Instagram Story / Square" placement="instagram-story" />
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-white/10 dark:bg-zinc-900/50">
        <p className="font-bold text-zinc-900 dark:text-white">WhatsApp (ES + EN)</p>
        <p className="mt-2 whitespace-pre-wrap rounded-xl bg-zinc-100 p-3 text-xs dark:bg-zinc-800">
          {whatsappText}
        </p>
        <button
          type="button"
          onClick={() => void copy(whatsappText)}
          className="mt-3 rounded-xl bg-[#25D366] px-4 py-2 text-xs font-bold text-white"
        >
          Copy WhatsApp text
        </button>
      </div>
    </div>
  )
}
