// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Referidos — modelo de Cripte adaptado a Turso/SQLite.
import { randomBytes } from 'crypto'
import { turso } from '../turso'
import { trySend } from '../mail/service'

/** Sin vocales ni caracteres ambiguos: se lee al teléfono sin equivocarse. */
const ALPHABET = 'BCDFGHJKLMNPQRSTVWXYZ23456789'

/** Genera un código único. Formato: CALP-XXXXXX */
export function generateReferralCode(): string {
  const bytes = randomBytes(6)
  let out = ''
  for (let i = 0; i < 6; i++) out += ALPHABET[bytes[i] % ALPHABET.length]
  return `CALP-${out}`
}

export function normalizeRef(ref: unknown): string {
  return String(ref ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .slice(0, 40)
}

export interface ReferralCode {
  id: string
  userId: string
  email: string
  referralCode: string
  displayName: string | null
  commissionRate: number
  status: string
}

/** Crea (o devuelve) el código de referido de una persona. */
export async function ensureReferralCode(
  userId: string,
  email: string,
  displayName?: string | null
): Promise<ReferralCode> {
  const existing = await turso.execute({
    sql: 'SELECT * FROM referral_codes WHERE user_id = ?',
    args: [userId],
  })

  const row: any = existing.rows[0]
  if (row) {
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      referralCode: row.referral_code,
      displayName: row.display_name,
      commissionRate: row.commission_rate,
      status: row.status,
    }
  }

  // Colisión improbable, pero se reintenta por si acaso.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateReferralCode()
    try {
      await turso.execute({
        sql: `INSERT INTO referral_codes (user_id, email, referral_code, display_name)
              VALUES (?, ?, ?, ?)`,
        args: [userId, email, code, displayName ?? null],
      })

      const created = await turso.execute({
        sql: 'SELECT * FROM referral_codes WHERE user_id = ?',
        args: [userId],
      })
      const r: any = created.rows[0]
      return {
        id: r.id,
        userId: r.user_id,
        email: r.email,
        referralCode: r.referral_code,
        displayName: r.display_name,
        commissionRate: r.commission_rate,
        status: r.status,
      }
    } catch (error: any) {
      if (
        !String(error?.message || '')
          .toUpperCase()
          .includes('UNIQUE')
      )
        throw error
    }
  }

  throw new Error('No se pudo generar un código de referido único')
}

export async function findByCode(ref: unknown): Promise<ReferralCode | null> {
  const code = normalizeRef(ref)
  if (!code) return null

  const result = await turso.execute({
    sql: "SELECT * FROM referral_codes WHERE referral_code = ? AND status = 'active'",
    args: [code],
  })

  const row: any = result.rows[0]
  if (!row) return null

  return {
    id: row.id,
    userId: row.user_id,
    email: row.email,
    referralCode: row.referral_code,
    displayName: row.display_name,
    commissionRate: row.commission_rate,
    status: row.status,
  }
}

/** Registra el clic. Nunca lanza: si falla el clic, no se rompe la navegación. */
export async function recordVisit(params: {
  referral: ReferralCode
  visitUrl?: string | null
  referrerUrl?: string | null
  ip?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    await turso.execute({
      sql: `INSERT INTO referral_visits
              (referral_code_id, referral_code, visit_url, referrer_url, ip, user_agent)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        params.referral.id,
        params.referral.referralCode,
        params.visitUrl ?? null,
        params.referrerUrl ?? null,
        params.ip ?? null,
        (params.userAgent ?? '').slice(0, 250) || null,
      ],
    })
  } catch (error) {
    console.error('[referrals] visit no registrada:', error)
  }
}

/**
 * Atribuye un usuario a un referido. La atribución es de una sola vez:
 * el primer referido que trae al cliente es el que cuenta (modelo Cripte).
 */
export async function attributeUser(params: {
  referral: ReferralCode
  referredUserId: string
  campaign?: string | null
  source?: string
  metadata?: Record<string, unknown>
}): Promise<boolean> {
  try {
    await turso.execute({
      sql: `INSERT OR IGNORE INTO referral_attributions
              (referral_code_id, referred_user_id, referral_code, campaign, source, metadata)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        params.referral.id,
        params.referredUserId,
        params.referral.referralCode,
        params.campaign ?? null,
        params.source ?? 'link',
        JSON.stringify(params.metadata ?? {}),
      ],
    })
    return true
  } catch (error) {
    console.error('[referrals] atribución fallida:', error)
    return false
  }
}

/** Registra la conversión de una reserva atribuida. Idempotente por booking_id. */
export async function recordConversion(params: {
  bookingId: string
  referredUserId?: string | null
  stripeSessionId?: string | null
  paymentIntentId?: string | null
  amount?: number
  currency?: string
  status?: string
}): Promise<boolean> {
  const attribution = await turso.execute({
    sql: 'SELECT * FROM referral_attributions WHERE referred_user_id = ?',
    args: [params.referredUserId ?? null],
  })

  const row: any = attribution.rows[0]
  if (!row) return false // la reserva no vino de un referido

  const inserted = await turso.execute({
    sql: `INSERT OR IGNORE INTO referral_conversions
            (referral_code_id, referred_user_id, booking_id, referral_code,
             stripe_session_id, payment_intent_id, amount, currency, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      row.referral_code_id,
      params.referredUserId ?? null,
      params.bookingId,
      row.referral_code,
      params.stripeSessionId ?? null,
      params.paymentIntentId ?? null,
      Number(params.amount) || 0,
      params.currency || 'USD',
      params.status ?? 'paid',
    ],
  })

  // Solo se avisa cuando la conversión es nueva: un reintento no debe
  // volver a felicitar al referente por la misma reserva.
  if (inserted.rowsAffected) {
    try {
      const [codeRow, bookingRow] = await Promise.all([
        turso.execute({
          sql: 'SELECT user_id, email, display_name FROM referral_codes WHERE id = ?',
          args: [row.referral_code_id],
        }),
        turso.execute({
          sql: 'SELECT booking_reference FROM bookings WHERE id = ?',
          args: [params.bookingId],
        }),
      ])
      const referrer: any = codeRow.rows[0]
      const booking: any = bookingRow.rows[0]
      if (referrer?.email) {
        const displayName = String(referrer.display_name || referrer.email.split('@')[0])
        await trySend('referral_converted', referrer.email, referrer.user_id, {
          firstName: displayName.split(' ')[0],
          referralCode: row.referral_code,
          bookingReference: booking?.booking_reference || params.bookingId,
          total: Number(params.amount) || 0,
          currency: params.currency || 'USD',
        })
      }
    } catch (error) {
      console.error('[referrals] aviso de conversión no enviado:', error)
    }
  }

  return true
}

export interface ReferralStats {
  referralCode: string
  visits: number
  attributedUsers: number
  conversions: number
  revenue: number
  currency: string
  commission: number
  commissionRate: number
  recent: Array<{
    bookingReference: string | null
    amount: number
    currency: string
    status: string | null
    convertedAt: string
  }>
}

/** Métricas del referido. Solo se llama si el rol tiene canViewReferralStats. */
export async function getReferralStats(referralCodeId: string): Promise<ReferralStats | null> {
  const codeRow = await turso.execute({
    sql: 'SELECT * FROM referral_codes WHERE id = ?',
    args: [referralCodeId],
  })
  const code: any = codeRow.rows[0]
  if (!code) return null

  const [visits, attributions, conversions] = await Promise.all([
    turso.execute({
      sql: 'SELECT COUNT(*) AS n FROM referral_visits WHERE referral_code_id = ?',
      args: [referralCodeId],
    }),
    turso.execute({
      sql: 'SELECT COUNT(*) AS n FROM referral_attributions WHERE referral_code_id = ?',
      args: [referralCodeId],
    }),
    turso.execute({
      sql: `SELECT COUNT(*) AS n, COALESCE(SUM(amount), 0) AS revenue,
                   COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid_revenue
            FROM referral_conversions WHERE referral_code_id = ?`,
      args: [referralCodeId],
    }),
  ])

  const recent = await turso.execute({
    sql: `SELECT c.booking_id, c.amount, c.currency, c.status, c.converted_at,
                 b.booking_reference
          FROM referral_conversions c
          LEFT JOIN bookings b ON b.id = c.booking_id
          WHERE c.referral_code_id = ?
          ORDER BY c.converted_at DESC
          LIMIT 20`,
    args: [referralCodeId],
  })

  const revenue = Number((conversions.rows[0] as any)?.revenue) || 0
  const rate = Number(code.commission_rate) || 0

  return {
    referralCode: code.referral_code,
    visits: Number((visits.rows[0] as any)?.n) || 0,
    attributedUsers: Number((attributions.rows[0] as any)?.n) || 0,
    conversions: Number((conversions.rows[0] as any)?.n) || 0,
    revenue,
    currency: 'USD',
    commission: Math.round(revenue * rate * 100) / 100,
    commissionRate: rate,
    recent: recent.rows.map((r: any) => ({
      bookingReference: r.booking_reference,
      amount: r.amount,
      currency: r.currency,
      status: r.status,
      convertedAt: r.converted_at,
    })),
  }
}
