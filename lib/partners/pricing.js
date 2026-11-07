// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Shared pricing helpers for partner referrals. Pure functions (client + server safe).
//
// Partner economics (defaults, per spec):
//  - guest discount: 10% off the public price (set per partner, 0-90%)
//  - commission: 10% on the paid-after-discount base (set per partner, 0-90%)
// All amounts are integer MXN pesos on the storefront (public price MXN).
// Commission is rounded to cents for ledger precision.

export function clampPct(value, fallback = 0) {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  if (n < 0) return 0
  if (n > 0.9) return 0.9
  return n
}

export function normalizeSlug(ref) {
  return String(ref ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

export function normalizeCode(ref) {
  return String(ref ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .slice(0, 60)
}

/**
 * Apply guest discount to an original MXN amount.
 * Returns integer pesos (storefront rounds to whole pesos).
 */
export function applyDiscount(originalAmount, discountPct) {
  const original = Math.max(0, Number(originalAmount) || 0)
  const pct = clampPct(discountPct, 0)
  const discountAmount = Math.round(original * pct)
  const finalAmount = Math.max(0, original - discountAmount)
  return { originalAmount: original, discountAmount, finalAmount, discountPct: pct }
}

/** Commission on the paid-after-discount base, rounded to cents. */
export function calcCommission(finalAmount, commissionPct) {
  const base = Math.max(0, Number(finalAmount) || 0)
  const pct = clampPct(commissionPct, 0)
  return Math.round(base * pct * 100) / 100
}

/**
 * Proportional adjustment for partial refunds.
 * commissionAfter = commission * (remaining / originalFinal)
 */
export function commissionAfterPartialRefund({ commissionAmount, finalAmount, refundedAmount }) {
  const final = Number(finalAmount) || 0
  const refunded = Math.max(0, Number(refundedAmount) || 0)
  const commission = Number(commissionAmount) || 0
  if (final <= 0) return 0
  const remaining = Math.max(0, final - refunded)
  return Math.round(commission * (remaining / final) * 100) / 100
}

export function isValidWebsiteUrl(value) {
  if (!value) return false
  let parsed
  try {
    parsed = new URL(String(value).trim())
  } catch {
    return false
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:'
}

/** Logo: allow http(s) or site-relative path (e.g. /partners/logo.svg). */
export function isValidLogoUrl(value) {
  const v = String(value ?? '').trim()
  if (!v) return false
  if (v.startsWith('/') && !v.startsWith('//')) return true
  try {
    const parsed = new URL(v)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function isPartnerActive(partner) {
  return Boolean(partner) && String(partner.status || '').toUpperCase() === 'ACTIVE'
}
