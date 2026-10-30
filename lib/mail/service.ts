// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Servicio centralizado de envío de correo.
// Por defecto usa Brevo (API transaccional). Mantiene SMTP/Mailgun como
// fallback si así se configura. Sin credenciales válidas funciona en modo
// "skip": registra el intento en email_log pero no envía, y la app nunca se
// cae por correo.
import nodemailer, { type Transporter } from 'nodemailer'
import { turso } from '../turso'
import { DEFAULT_TEMPLATES, TEMPLATE_META, extractVariables, renderTemplate } from './templates'
import { getMailConfigFromEnv, isMailConfigured as isProviderConfigured } from './config'
import { sendBrevoEmail, BrevoError } from './brevo'
import { BRAND } from '../brand'

let cached: Transporter | null = null

const DUPLICATE_WINDOW_MINUTES = 10

export interface MailConfig {
  host: string
  port: number
  secure: boolean
  user: string
  pass: string
  from: string
  fromName: string
}

export function getMailConfig(): MailConfig | null {
  const config = getMailConfigFromEnv()
  if (config.provider !== 'smtp') return null
  const host = config.smtp.host
  const user = config.smtp.user
  const pass = config.smtp.pass
  if (!host || !user || !pass) return null

  const port = config.smtp.port
  return {
    host,
    port,
    secure: config.smtp.secure,
    user,
    pass,
    from: config.fromEmail,
    fromName: config.fromName,
  }
}

export function isMailConfigured(): boolean {
  return isProviderConfigured(getMailConfigFromEnv())
}

/**
 * Interruptor maestro. Aunque existan claves, no se manda nada hasta que
 * se ponga MAIL_ENABLED=true. Así ninguna notificación sale sin que lo pidas.
 */
export function isMailEnabled(): boolean {
  return process.env.MAIL_ENABLED === 'true' && isMailConfigured()
}

function transporter(): Transporter {
  const config = getMailConfig()
  if (!config) throw new Error('SMTP no configurado')
  if (!cached) {
    cached = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: { user: config.user, pass: config.pass },
    })
  }
  return cached
}

// ---------------------------------------------------------------------------
// Plantillas: la BD manda, el código es el valor por defecto
// ---------------------------------------------------------------------------

export interface EffectiveTemplate {
  key: string
  label: string
  description: string
  subject: string
  html: string
  text: string
  isActive: boolean
  updatedAt: string | null
}

/** Inserta las plantillas por defecto que falten. Idempotente. */
export async function seedTemplates(): Promise<void> {
  for (const meta of TEMPLATE_META) {
    const fallback = DEFAULT_TEMPLATES[meta.key]
    if (!fallback) continue

    const existing = await turso.execute({
      sql: 'SELECT key FROM email_templates WHERE key = ?',
      args: [meta.key],
    })
    if (existing.rows[0]) continue

    await turso.execute({
      sql: `INSERT INTO email_templates (key, subject, html, text, label, description, variables)
            VALUES (?,?,?,?,?,?,?)`,
      args: [
        meta.key,
        fallback.subject,
        fallback.html,
        fallback.text,
        meta.label,
        meta.description,
        JSON.stringify(meta.variables),
      ],
    })
  }
}

export async function getTemplate(key: string): Promise<EffectiveTemplate | null> {
  const meta = TEMPLATE_META.find((t) => t.key === key)
  const fallback = DEFAULT_TEMPLATES[key]

  const result = await turso.execute({
    sql: 'SELECT * FROM email_templates WHERE key = ?',
    args: [key],
  })
  const row: any = result.rows[0]

  if (!row) {
    if (!meta || !fallback) return null
    return {
      key,
      label: meta.label,
      description: meta.description,
      subject: fallback.subject,
      html: fallback.html,
      text: fallback.text,
      isActive: true,
      updatedAt: null,
    }
  }

  return {
    key,
    label: row.label || meta?.label || key,
    description: row.description || meta?.description || '',
    subject: row.subject,
    html: row.html,
    text: row.text,
    isActive: Number(row.is_active) === 1,
    updatedAt: row.updated_at ?? null,
  }
}

export async function listTemplates(): Promise<EffectiveTemplate[]> {
  await seedTemplates()
  const out: EffectiveTemplate[] = []
  for (const meta of TEMPLATE_META) {
    const template = await getTemplate(meta.key)
    if (template) out.push(template)
  }
  return out
}

// ---------------------------------------------------------------------------
// Envío
// ---------------------------------------------------------------------------

export interface SendResult {
  status: 'sent' | 'skipped' | 'failed'
  reason?: string
  providerId?: string
}

export interface SendOptions {
  to: string
  userId?: string | null
  vars?: Record<string, string | number>
}

/**
 * Envía una plantilla. Nunca lanza: un correo que falla no puede tumbar un
 * checkout. Todo queda registrado en email_log.
 */
export async function sendMail(key: string, options: SendOptions): Promise<SendResult> {
  const template = await getTemplate(key)
  if (!template) return { status: 'skipped', reason: `plantilla desconocida: ${key}` }
  if (!template.isActive) return { status: 'skipped', reason: 'plantilla desactivada' }
  if (!options.to || !options.to.includes('@')) {
    return { status: 'skipped', reason: 'destinatario inválido' }
  }

  const vars = options.vars ?? {}
  const subject = renderTemplate(template.subject, vars)
  const html = renderTemplate(template.html, vars)
  const text = renderTemplate(template.text, vars)

  const logId = randomHex()

  // Control de duplicados: si ya enviamos esta misma plantilla a este mismo
  // correo con éxito en la ventana de tiempo, no reenviamos.
  const duplicate = await checkDuplicateSend(key, options.to, DUPLICATE_WINDOW_MINUTES)
  if (duplicate) {
    await logMail({
      id: logId,
      key,
      to: options.to,
      userId: options.userId ?? null,
      subject,
      status: 'skipped',
      error: 'duplicate within window',
    })
    return { status: 'skipped', reason: 'duplicate within window' }
  }

  if (!isMailEnabled()) {
    const reason = !isMailConfigured() ? 'no proveedor configurado' : 'MAIL_ENABLED != true'
    await logMail({
      id: logId,
      key,
      to: options.to,
      userId: options.userId ?? null,
      subject,
      status: 'skipped',
      error: reason,
    })
    return { status: 'skipped', reason }
  }

  const config = getMailConfigFromEnv()

  try {
    if (config.provider === 'brevo') {
      if (!config.brevo.apiKey || !config.brevo.senderEmail) {
        throw new Error('Brevo no está completamente configurado')
      }
      const { messageId } = await sendBrevoEmail({
        apiKey: config.brevo.apiKey,
        senderEmail: config.brevo.senderEmail,
        senderName: config.brevo.senderName || config.fromName,
        to: options.to,
        subject,
        html,
        text,
      })

      await logMail({
        id: logId,
        key,
        to: options.to,
        userId: options.userId ?? null,
        subject,
        status: 'sent',
        providerId: messageId ?? null,
      })
      return { status: 'sent', providerId: messageId ?? undefined }
    }

    // SMTP / Mailgun vía nodemailer (mantiene compatibilidad con configuraciones previas)
    const smtpConfig = getMailConfig()
    if (!smtpConfig) {
      throw new Error('SMTP no configurado')
    }
    const info = await transporter().sendMail({
      from: { name: smtpConfig.fromName, address: smtpConfig.from },
      to: options.to,
      subject,
      html,
      text,
    })

    await logMail({
      id: logId,
      key,
      to: options.to,
      userId: options.userId ?? null,
      subject,
      status: 'sent',
      providerId: info.messageId ?? null,
    })
    return { status: 'sent', providerId: info.messageId ?? undefined }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    await logMail({
      id: logId,
      key,
      to: options.to,
      userId: options.userId ?? null,
      subject,
      status: 'failed',
      error: message.slice(0, 500),
    })
    return { status: 'failed', reason: message }
  }
}

function randomHex(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex')
}

/**
 * Devuelve true si ya existe un envío exitoso de la misma plantilla al mismo
 * correo dentro de la ventana de minutos indicada. Sirve para evitar
 * duplicados accidentales (doble clic, reintentos, etc.).
 */
async function checkDuplicateSend(
  templateKey: string,
  toEmail: string,
  windowMinutes: number
): Promise<boolean> {
  try {
    const result = await turso.execute({
      sql: `SELECT id FROM email_log
            WHERE template_key = ?
              AND to_email = ?
              AND status = 'sent'
              AND created_at >= datetime('now', ?)
            LIMIT 1`,
      args: [templateKey, toEmail, `-${windowMinutes} minutes`],
    })
    return result.rows.length > 0
  } catch {
    // Si la tabla aún no existe o falla la consulta, no bloqueamos el envío.
    return false
  }
}

async function logMail(entry: {
  id: string
  key: string
  to: string
  userId: string | null
  subject: string
  status: SendResult['status']
  error?: string | null
  providerId?: string | null
}) {
  try {
    await turso.execute({
      sql: `INSERT INTO email_log
              (id, template_key, to_email, user_id, subject, status, error, provider_id, sent_at)
            VALUES (?,?,?,?,?,?,?,?,?)`,
      args: [
        entry.id,
        entry.key,
        entry.to,
        entry.userId,
        entry.subject,
        entry.status,
        entry.error ?? null,
        entry.providerId ?? null,
        entry.status === 'sent' ? new Date().toISOString() : null,
      ],
    })
  } catch (error) {
    console.error('[mail] no se pudo registrar el envío:', error)
  }
}

/** Envía solo si el usuario tiene correo. Nunca propaga errores. */
export async function trySend(
  key: string,
  to: string | null | undefined,
  userId: string | null | undefined,
  vars: Record<string, string | number>
): Promise<void> {
  if (!to) return
  try {
    await sendMail(key, { to, userId, vars })
  } catch (error) {
    console.error(`[mail] fallo preparando ${key}:`, error)
  }
}

export { extractVariables }
