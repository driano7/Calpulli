'use client'

// Referral link generator. Allowlist destinations only; slug never editable.
import { useMemo, useState } from 'react'
import { JOURNEYS } from '@/data/journeysData'
import { PLACEMENTS, buildReferralUrl, shareText } from '@/lib/partners/links'
import QRCodeBox from './QRCodeBox'

export default function LinkGenerator({ partner }) {
  const [destination, setDestination] = useState('/journeys')
  const [placement, setPlacement] = useState('')
  const [campaign, setCampaign] = useState('')
  const [content, setContent] = useState('')

  const url = useMemo(
    () =>
      buildReferralUrl({
        ref: partner?.slug || 'hostal-mx',
        path: destination,
        placement,
        campaign,
        content,
        origin: typeof window !== 'undefined' ? window.location.origin : undefined,
      }),
    [partner?.slug, destination, placement, campaign, content]
  )

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      void 0
    }
  }

  const share = async () => {
    const text = shareText(partner?.name || 'us', partner?.guestDiscountPct, url)
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Calpulli CDMX', text, url })
        return
      } catch {
        void 0
      }
    }
    await copy()
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white/80 p-5 dark:border-white/10 dark:bg-zinc-900/50">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs">
            <span className="text-zinc-500">Destino (permitido)</span>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="mt-1 w-full rounded-lg border px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
            >
              <option value="/">Home</option>
              <option value="/journeys">Journeys listing</option>
              <option value="/local">Local Recommendations</option>
              <option value="/custom-journey">Custom Journey request</option>
              {JOURNEYS.map((j) => (
                <option key={j.slug} value={`/journeys/${j.slug}`}>
                  {(j.title_es || j.title_en || j.slug).slice(0, 40)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-zinc-500">Placement</span>
            <select
              value={placement}
              onChange={(e) => setPlacement(e.target.value)}
              className="mt-1 w-full rounded-lg border px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
            >
              <option value="">—</option>
              {PLACEMENTS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs">
            <span className="text-zinc-500">utm_campaign (opcional)</span>
            <input
              value={campaign}
              onChange={(e) => setCampaign(e.target.value)}
              placeholder="fall-2026"
              className="mt-1 w-full rounded-lg border px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
            />
          </label>
          <label className="text-xs">
            <span className="text-zinc-500">utm_content (opcional)</span>
            <input
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="card-a"
              className="mt-1 w-full rounded-lg border px-2.5 py-2 text-sm dark:border-white/10 dark:bg-zinc-950"
            />
          </label>
        </div>
        <div className="rounded-xl bg-zinc-100 p-3 dark:bg-zinc-800">
          <p className="break-all font-mono text-xs">{url}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void copy()}
            className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Copy Link
          </button>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Preview
          </a>
          <button
            type="button"
            onClick={() => void share()}
            className="rounded-xl border px-4 py-2 text-sm font-semibold"
          >
            Share
          </button>
        </div>
        <p className="text-[11px] text-zinc-400">
          Referral code: <span className="font-mono font-bold">{partner?.referralCode}</span> —
          controlled by Amaxing.
        </p>
      </div>

      <QRCodeBox url={url} partner={partner} placement={placement} />
    </div>
  )
}
