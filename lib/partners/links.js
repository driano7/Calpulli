// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Referral link generation + QR helpers. Pure (client + server safe).
// Slug is controlled by Amaxing (never editable by partner).
// Destinations are an allowlist — no arbitrary redirect URLs.

import { JOURNEY_SLUGS } from '../../data/journeysData'

export const PLACEMENTS = [
  'front-desk',
  'check-in-card-a',
  'check-in-card-b',
  'sticker',
  'common-area',
  'whatsapp',
  'instagram-story',
  'instagram-post',
]

export function sanitizePlacement(value) {
  const v = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
  return v || null
}

function sanitizeParam(value) {
  const v = String(value || '')
    .trim()
    .slice(0, 80)
  return /^[A-Za-z0-9 _-]+$/.test(v) ? v : null
}

/**
 * Validate a destination path against the allowlist.
 * Allowed: '/', '/journeys', '/journeys/<real-slug>', '/local', '/custom-journey'
 * Returns normalized path or null.
 */
export function sanitizeDestinationPath(pathname) {
  const p = String(pathname || '').trim()
  if (!p) return null
  if (p === '/' || p === '/journeys' || p === '/local' || p === '/custom-journey') return p
  if (p.startsWith('/journeys/')) {
    const slug = p.slice('/journeys/'.length)
    if (JOURNEY_SLUGS.includes(slug)) return `/journeys/${slug}`
    return null
  }
  return null
}

export function productionDomain(originHint = null) {
  const raw =
    (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_SITE_URL) ||
    originHint ||
    null
  if (raw) {
    const v = String(raw).trim().replace(/\/+$/, '')
    // Never emit localhost QRs in production.
    if (v.includes('localhost') || v.includes('127.0.0.1')) {
      return 'https://donovan-amx.vercel.app'
    }
    return v
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    const o = window.location.origin
    if (o.includes('localhost') || o.includes('127.0.0.1')) {
      return 'https://donovan-amx.vercel.app'
    }
    return o
  }
  return 'https://donovan-amx.vercel.app'
}

/**
 * Build an absolute referral URL.
 * @param {{ref:string, path:string, placement?:string, campaign?:string, content?:string, origin?:string}} opts
 */
export function buildReferralUrl({ ref, path, placement, campaign, content, origin }) {
  const cleanRef = String(ref || '')
    .trim()
    .toLowerCase()
    .slice(0, 60)
  const dest = sanitizeDestinationPath(path) || '/journeys'
  const base = productionDomain(origin)
  const params = new URLSearchParams()
  params.set('ref', cleanRef)
  const pl = sanitizePlacement(placement)
  if (pl) params.set('placement', pl)
  const c = sanitizeParam(campaign || '')
  if (c) params.set('utm_campaign', c)
  const ct = sanitizeParam(content || '')
  if (ct) params.set('utm_content', ct)
  return `${base}${dest}?${params.toString()}`
}

export function shareText(partnerName, discountPct, url) {
  const pct = Math.round((Number(discountPct) || 0) * 100)
  return `Explore Mexico City with Calpulli CDMX via ${partnerName} — ${pct}% off eligible walking Journeys: ${url}`
}
