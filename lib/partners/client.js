// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Client-side partner referral tracker. No PII in URL/localStorage/cookie:
// only the public ref slug + partner name + timestamps are stored.
'use client'

import { applyDiscount } from './pricing'

export const REFERRAL_STORAGE_KEY = 'amaxing_referral'
export const REFERral_COOKIE = 'amaxing_ref'
export const ANON_SESSION_KEY = 'amaxing_anon_session'
const DEFAULT_ATTRIBUTION_DAYS = 30

function randomId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // fallback below
  }
  return `anon-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function getAnonSessionId() {
  if (typeof window === 'undefined') return 'server'
  try {
    let id = localStorage.getItem(ANON_SESSION_KEY)
    if (!id) {
      id = randomId()
      localStorage.setItem(ANON_SESSION_KEY, id)
    }
    return id
  } catch {
    return randomId()
  }
}

function attributionMs(attributionDays) {
  const days = Number(attributionDays) > 0 ? Number(attributionDays) : DEFAULT_ATTRIBUTION_DAYS
  return Math.min(365, Math.max(1, days)) * 24 * 60 * 60 * 1000
}

function writeCookie(ref, expiresAtIso) {
  if (typeof document === 'undefined') return
  const maxAge = Math.max(0, Math.floor((new Date(expiresAtIso).getTime() - Date.now()) / 1000))
  const secure = typeof location !== 'undefined' && location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${REFERral_COOKIE}=${encodeURIComponent(
    ref
  )}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`
}

function clearCookie() {
  if (typeof document === 'undefined') return
  document.cookie = `${REFERral_COOKIE}=; Max-Age=0; Path=/; SameSite=Lax`
}

function readCookieRef() {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|; )${REFERral_COOKIE}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function parseRefFromUrl() {
  if (typeof window === 'undefined') return null
  try {
    const params = new URLSearchParams(window.location.search)
    return params.get('ref') || params.get('partner') || null
  } catch {
    return null
  }
}

function parseUtms() {
  if (typeof window === 'undefined') return {}
  try {
    const params = new URLSearchParams(window.location.search)
    const out = {}
    for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
      const v = params.get(key)
      if (v) out[key] = v.slice(0, 120)
    }
    return out
  } catch {
    return {}
  }
}

function parsePlacement() {
  if (typeof window === 'undefined') return null
  try {
    const v = new URLSearchParams(window.location.search).get('placement')
    if (!v) return null
    const clean = String(v)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .slice(0, 60)
    return clean || null
  } catch {
    return null
  }
}

function parseCampaign() {
  const utms = parseUtms()
  return utms.utm_campaign || null
}

export function getStoredReferral() {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(REFERRAL_STORAGE_KEY)
    if (!raw) {
      const cookieRef = readCookieRef()
      return cookieRef ? { ref: cookieRef, partner: null, expiresAt: null } : null
    }
    const parsed = JSON.parse(raw)
    if (parsed?.expiresAt && new Date(parsed.expiresAt).getTime() < Date.now()) {
      clearStoredReferral()
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function saveReferral({ ref, partner, attributionDays }) {
  const now = new Date()
  const existing = (() => {
    try {
      const raw = localStorage.getItem(REFERRAL_STORAGE_KEY)
      return raw ? JSON.parse(raw) : null
    } catch {
      return null
    }
  })()
  const samePartner =
    existing && existing.ref && String(existing.ref).toLowerCase() === String(ref).toLowerCase()
  const expiresAt = new Date(now.getTime() + attributionMs(attributionDays)).toISOString()
  const payload = {
    ref,
    partner: partner || null,
    firstTouchAt: samePartner && existing.firstTouchAt ? existing.firstTouchAt : now.toISOString(),
    lastTouchAt: now.toISOString(),
    expiresAt,
    attributionDays: Number(attributionDays) || DEFAULT_ATTRIBUTION_DAYS,
    utms: parseUtms(),
    placement: parsePlacement(),
    campaign: parseCampaign(),
  }
  try {
    localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(payload))
  } catch {
    // storage full/unavailable — cookie still helps server-side resolve
  }
  writeCookie(ref, expiresAt)
  try {
    window.dispatchEvent(new CustomEvent('partner-referral-change', { detail: payload }))
  } catch {
    // noop
  }
  return payload
}

export function clearStoredReferral() {
  try {
    localStorage.removeItem(REFERRAL_STORAGE_KEY)
  } catch {
    // noop
  }
  clearCookie()
  try {
    window.dispatchEvent(new CustomEvent('partner-referral-change', { detail: null }))
  } catch {
    // noop
  }
}

export function getDiscountedPrice(originalAmount, referral) {
  const pct = referral?.partner?.guestDiscountPct ?? referral?.guestDiscountPct ?? 0
  return applyDiscount(originalAmount, pct)
}

/**
 * Capture ?ref from URL, validate via resolve API (server is truth),
 * persist with LAST VALID TOUCH. Invalid links never overwrite a valid referral.
 * Safe to call on every navigation. Returns stored referral payload or null.
 */
export async function captureReferral(pathOverride) {
  if (typeof window === 'undefined') return null
  const ref = parseRefFromUrl()
  if (!ref) {
    return getStoredReferral()
  }
  let resolved = null
  try {
    const path = pathOverride || window.location.pathname || '/'
    const res = await fetch(
      `/api/partners/resolve?ref=${encodeURIComponent(ref)}&path=${encodeURIComponent(path)}`,
      { credentials: 'include' }
    )
    resolved = await res.json().catch(() => null)
  } catch {
    resolved = null
  }
  if (!resolved?.active || !resolved?.partner) {
    // Invalid / paused / inactive / expired: keep existing valid referral.
    return getStoredReferral()
  }
  const saved = saveReferral({
    ref: resolved.partner.referralCode || resolved.partner.slug || ref,
    partner: resolved.partner,
    attributionDays: resolved.attributionDays,
  })
  // Analytics event (deduplicated server-side by key).
  void trackEvent(resolved.partner, pathToEvent(pathOverride || window.location.pathname), {
    path: pathOverride || window.location.pathname,
  }).catch(() => undefined)
  return saved
}

export function getAnonSessionIdForTrack() {
  return getAnonSessionId()
}

function pathToEvent(pathname) {
  if (!pathname) return 'LANDING_VIEW'
  if (pathname.startsWith('/journeys/') || pathname === '/journeys') return 'JOURNEY_VIEW'
  return 'LANDING_VIEW'
}

/**
 * Record a partner event (CHECKOUT_STARTED, etc.) with an idempotency key.
 * Never throws; analytics must not break checkout.
 */
export async function trackEvent(partnerOrReferral, eventType, opts = {}) {
  const stored = getStoredReferral()
  const partner =
    partnerOrReferral?.partner ||
    partnerOrReferral?.partner ||
    partnerOrReferral ||
    stored?.partner ||
    null
  const ref =
    partnerOrReferral?.ref ||
    partner?.referralCode ||
    partner?.slug ||
    stored?.ref ||
    readCookieRef() ||
    null
  if (!ref || !eventType) return false
  const sessionId = opts.sessionId || getAnonSessionId()
  const eventKey =
    opts.eventKey ||
    `${ref}:${eventType}:${opts.path || ''}:${sessionId}:${opts.nonce || ''}`.slice(0, 200)
  const placement = opts.placement || stored?.placement || parsePlacement() || null
  const campaign = opts.campaign || stored?.campaign || parseCampaign() || null
  const utmContent = opts.utmContent || stored?.utms?.utm_content || null
  try {
    const res = await fetch('/api/partners/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        ref,
        eventType,
        eventKey,
        sessionId,
        placement,
        campaign,
        utmContent,
        path: opts.path || (typeof window !== 'undefined' ? window.location.pathname : null),
      }),
    })
    return res.ok
  } catch {
    return false
  }
}
