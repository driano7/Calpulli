// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Autenticación real sobre Turso: hashing scrypt + sesiones persistidas + roles.
import { createHash, randomBytes, scrypt as _scrypt, timingSafeEqual } from 'crypto'
import { promisify } from 'util'
import { turso } from './turso'
import { encryptRowFields, isPepperConfigured } from './gdpr-crypto'
import { ageBandFrom, normalizeCountry, normalizeGender } from './booking/turso'
import { normalizeAgeBand } from './demographics-shared'

const scrypt = promisify(_scrypt) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>

const KEYLEN = 64
export const SESSION_TTL_DAYS = 7

export interface AuthUser {
  id: string
  email: string
  firstName: string
  lastName: string
  phone: string | null
  role: 'admin' | 'employee' | 'client'
  isEmailVerified: boolean
}

export type Role = AuthUser['role']

// ---------------------------------------------------------------------------
// Passwords
// ---------------------------------------------------------------------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex')
  const derived = await scrypt(password, salt, KEYLEN)
  return `scrypt$${salt}$${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  if (!stored) return false
  const [scheme, salt, expected] = stored.split('$')
  if (scheme !== 'scrypt' || !salt || !expected) return false
  const derived = await scrypt(password, salt, KEYLEN)
  const expectedBuf = Buffer.from(expected, 'hex')
  if (expectedBuf.length !== derived.length) return false
  return timingSafeEqual(derived, expectedBuf)
}

// ---------------------------------------------------------------------------
// Sessions
// ---------------------------------------------------------------------------

export function generateSessionToken(): string {
  return randomBytes(32).toString('hex')
}

export async function createSession(
  userId: string,
  meta: { ip?: string; userAgent?: string } = {}
): Promise<{ token: string; expiresAt: string }> {
  const token = generateSessionToken()
  const id = randomBytes(16).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400_000).toISOString()

  await turso.execute({
    sql: `INSERT INTO sessions (id, "userId", token, "expiresAt", "ipAddress", "userAgent", "lastActivityAt")
          VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
    args: [id, userId, token, expiresAt, meta.ip ?? null, meta.userAgent ?? null],
  })

  await turso.execute({
    sql: `UPDATE users SET last_login_at = datetime('now'), failed_login_attempts = 0 WHERE id = ?`,
    args: [userId],
  })

  return { token, expiresAt }
}

// ---------------------------------------------------------------------------
// Recuperacion de contrasena
// ---------------------------------------------------------------------------

/** El enlace de reset vive 30 minutos. */
export const PASSWORD_RESET_TTL_MINUTES = 30

const hashResetToken = (token: string) => createHash('sha256').update(token).digest('hex')

/**
 * Crea un token de reset. El token crudo se devuelve una sola vez (para
 * mandarlo por correo); en la base solo queda su hash.
 */
export async function createPasswordResetToken(
  userId: string
): Promise<{ token: string; expiresAt: string }> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashResetToken(token)
  const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60_000).toISOString()

  // Un token vivo por usuario: el anterior deja de servir.
  await turso.execute({
    sql: `UPDATE password_reset_tokens SET is_used = 1
          WHERE user_id = ? AND is_used = 0`,
    args: [userId],
  })

  await turso.execute({
    sql: `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
          VALUES (?, ?, ?)`,
    args: [userId, tokenHash, expiresAt],
  })

  return { token, expiresAt }
}

/**
 * Resuelve el token y cambia la contrasena. Devuelve un motivo si no se
 * pudo: 'invalido' (token desconocido o ya usado), 'expirado' o 'usuario'.
 */
export async function resetPasswordWithToken(
  token: string,
  newPasswordHash: string
): Promise<'ok' | 'invalido' | 'expirado' | 'usuario'> {
  if (!token || !newPasswordHash) return 'invalido'
  const tokenHash = hashResetToken(token)

  const result = await turso.execute({
    sql: `SELECT id, user_id, expires_at, is_used
          FROM password_reset_tokens
          WHERE token_hash = ?`,
    args: [tokenHash],
  })

  const row: any = result.rows[0]
  if (!row) return 'invalido'
  if (Number(row.is_used) === 1) return 'invalido'
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await turso.execute({
      sql: 'UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?',
      args: [row.id],
    })
    return 'expirado'
  }

  const user = await turso.execute({
    sql: 'SELECT id FROM users WHERE id = ? AND is_active = 1',
    args: [row.user_id],
  })
  if (!user.rows.length) return 'usuario'

  await turso.execute({
    sql: `UPDATE users SET password = ?, failed_login_attempts = 0 WHERE id = ?`,
    args: [newPasswordHash, row.user_id],
  })
  await turso.execute({
    sql: 'UPDATE password_reset_tokens SET is_used = 1 WHERE id = ?',
    args: [row.id],
  })
  // Cambiar la contrasena cierra las sesiones abiertas: quien tenga la
  // sesion vieja, entra de nuevo.
  await turso.execute({ sql: 'DELETE FROM sessions WHERE "userId" = ?', args: [row.user_id] })

  return 'ok'
}

/** El enlace de verificación de correo vive 24 horas. */
export const EMAIL_VERIFICATION_TTL_HOURS = 24

const hashVerificationToken = (token: string) => createHash('sha256').update(token).digest('hex')

/**
 * Crea un token de verificación de correo. El token crudo se devuelve una
 * sola vez (para mandarlo por correo); en la base solo queda su hash.
 * Un token vivo por usuario: el anterior deja de servir.
 */
export async function createEmailVerificationToken(
  userId: string
): Promise<{ token: string; expiresAt: string }> {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashVerificationToken(token)
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_HOURS * 60 * 60_000).toISOString()

  await turso.execute({
    sql: `UPDATE email_verification_tokens SET is_used = 1
          WHERE user_id = ? AND is_used = 0`,
    args: [userId],
  })

  await turso.execute({
    sql: `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
          VALUES (?, ?, ?)`,
    args: [userId, tokenHash, expiresAt],
  })

  return { token, expiresAt }
}

/**
 * Valida el token de verificación y marca el email como verificado.
 * Devuelve 'ok' si se verificó, 'invalido' si el token es desconocido o
 * ya se usó, 'expirado' si pasó su vigencia, o 'usuario' si el usuario
 * no existe o está inactivo.
 */
export async function verifyEmailWithToken(
  token: string
): Promise<'ok' | 'invalido' | 'expirado' | 'usuario'> {
  if (!token) return 'invalido'
  const tokenHash = hashVerificationToken(token)

  const result = await turso.execute({
    sql: `SELECT id, user_id, expires_at, is_used
          FROM email_verification_tokens
          WHERE token_hash = ?`,
    args: [tokenHash],
  })

  const row: any = result.rows[0]
  if (!row) return 'invalido'
  if (Number(row.is_used) === 1) return 'invalido'
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await turso.execute({
      sql: 'UPDATE email_verification_tokens SET is_used = 1 WHERE id = ?',
      args: [row.id],
    })
    return 'expirado'
  }

  const user = await turso.execute({
    sql: 'SELECT id FROM users WHERE id = ? AND is_active = 1',
    args: [row.user_id],
  })
  if (!user.rows.length) return 'usuario'

  await turso.execute({
    sql: `UPDATE users SET is_email_verified = 1 WHERE id = ?`,
    args: [row.user_id],
  })
  await turso.execute({
    sql: 'UPDATE email_verification_tokens SET is_used = 1 WHERE id = ?',
    args: [row.id],
  })

  return 'ok'
}

export async function destroySession(token: string): Promise<void> {
  await turso.execute({ sql: 'DELETE FROM sessions WHERE token = ?', args: [token] })
}

/** Resuelve el usuario de una sesión válida, o null. */
export async function getSessionUser(token: string | null): Promise<AuthUser | null> {
  if (!token) return null

  const result = await turso.execute({
    sql: `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role,
                 u.is_email_verified, u.is_active, s."expiresAt"
          FROM sessions s
          JOIN users u ON u.id = s."userId"
          WHERE s.token = ?`,
    args: [token],
  })

  const row: any = result.rows[0]
  if (!row) return null
  if (Number(row.is_active) !== 1) return null
  if (new Date(row.expiresAt).getTime() < Date.now()) {
    await destroySession(token)
    return null
  }

  await turso.execute({
    sql: `UPDATE sessions SET "lastActivityAt" = datetime('now') WHERE token = ?`,
    args: [token],
  })

  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone ?? null,
    role: await resolveRole(row.id, row.email, row.role),
    isEmailVerified: Number(row.is_email_verified) === 1,
  }
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

const FALLBACK_PERMISSIONS: Record<Role, Record<string, boolean>> = {
  admin: {
    canViewProfile: true,
    canOperateTours: true,
    canViewAdmin: true,
    canManageUsers: true,
    canViewClientPii: true,
    canDecryptSensitiveFields: true,
    canManageAdmins: true,
    canViewBookingsOwn: true,
    canViewBookingsAll: true,
    canManageBookings: true,
    canViewPayments: true,
    canViewBasicMetrics: true,
    canViewPassiveAnalytics: true,
    canViewAdvancedMetrics: true,
    canExportGDPR: true,
  },
  employee: {
    canViewProfile: true,
    canOperateTours: true,
    canViewAdmin: false,
    canManageUsers: false,
    canViewClientPii: true,
    canDecryptSensitiveFields: false,
    canManageAdmins: false,
    canViewBookingsOwn: true,
    canViewBookingsAll: true,
    canManageBookings: true,
    canViewPayments: false,
    canViewBasicMetrics: true,
    canViewPassiveAnalytics: true,
    canViewAdvancedMetrics: false,
    canExportGDPR: false,
  },
  client: {
    canViewProfile: true,
    canOperateTours: false,
    canViewAdmin: false,
    canManageUsers: false,
    canViewClientPii: false,
    canDecryptSensitiveFields: false,
    canManageAdmins: false,
    canViewBookingsOwn: true,
    canViewBookingsAll: false,
    canManageBookings: false,
    canViewPayments: false,
    canViewBasicMetrics: false,
    canViewPassiveAnalytics: false,
    canViewAdvancedMetrics: false,
    canExportGDPR: false,
  },
}

export interface RolePermissions extends Record<string, boolean> {
  panels: string[]
}

/** La BD usa snake_case; el resto del código consume camelCase. */
const PERMISSION_ALIASES: Record<string, string> = {
  can_export_gdpr: 'canExportGDPR',
}

/** Lee la matriz de permisos desde Turso. Cachea 60s. */
let permissionsCache: { at: number; data: Record<Role, RolePermissions> } | null = null

export async function getRolePermissions(role: Role): Promise<RolePermissions> {
  const cached = permissionsCache?.data?.[role]
  if (cached && permissionsCache && Date.now() - permissionsCache.at < 60_000) {
    return cached
  }

  const result = await turso.execute({
    sql: 'SELECT * FROM role_permissions WHERE role = ? AND is_active = 1',
    args: [role],
  })

  const row: any = result.rows[0]
  if (!row) {
    console.warn(`[auth] Rol "${role}" sin fila en role_permissions; usando fallback local`)
    const fallback = FALLBACK_PERMISSIONS[role] ?? FALLBACK_PERMISSIONS.client
    return { ...fallback, panels: panelsFor(role) }
  }

  const perms: Record<string, boolean> = {}
  for (const [key, value] of Object.entries(row)) {
    // Solo los flags de permiso; el resto (rank, label, timestamps) no aplica.
    if (!/^can_/i.test(key)) continue
    if (typeof value === 'number' || value === '0' || value === '1') {
      const camel =
        PERMISSION_ALIASES[key] ?? key.replace(/_([a-z])/g, (_m, c: string) => c.toUpperCase())
      perms[camel] = Number(value) === 1
    }
  }

  let panels: string[] = panelsFor(role)
  try {
    const parsed = typeof row.panels === 'string' ? JSON.parse(row.panels) : row.panels
    if (Array.isArray(parsed) && parsed.length) panels = parsed
  } catch {
    /* usar panelsFor */
  }

  const data = { ...(permissionsCache?.data ?? ({} as any)), [role]: { ...perms, panels } }
  permissionsCache = { at: Date.now(), data }
  return data[role]
}

/** Permisos por rol — se leen de la BD (con fallback local si Turso no responde). */
export async function permissionsFor(role: Role): Promise<RolePermissions> {
  try {
    return await getRolePermissions(role)
  } catch (error) {
    console.error('[auth] Fallback de permisos:', error)
    const fallback = FALLBACK_PERMISSIONS[role] ?? FALLBACK_PERMISSIONS.client
    return { ...fallback, panels: panelsFor(role) }
  }
}

/** Versión síncrona para gating en UI; usa la caché de la última lectura. */
export function permissionsForSync(role: Role): RolePermissions {
  const cached = permissionsCache?.data?.[role]
  if (cached) return cached
  const fallback = FALLBACK_PERMISSIONS[role] ?? FALLBACK_PERMISSIONS.client
  return { ...fallback, panels: panelsFor(role) }
}

export function panelsFor(role: Role): string[] {
  if (role === 'admin') return ['/profile', '/empleados', '/admin']
  if (role === 'employee') return ['/profile', '/empleados']
  return ['/profile']
}

function envEmails(name: string): string[] {
  return (process.env[name] || '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

/**
 * Prioridad: ADMIN_EMAILS / EMPLOYEE_EMAILS (efecto inmediato) →
 * tabla user_roles (persistente) → users.role → client.
 */
export async function resolveRole(
  userId: string,
  email: string,
  usersRole?: string
): Promise<Role> {
  const normalized = (email || '').toLowerCase()

  if (envEmails('ADMIN_EMAILS').includes(normalized)) return 'admin'
  if (envEmails('EMPLOYEE_EMAILS').includes(normalized)) return 'employee'

  const result = await turso.execute({
    sql: `SELECT ur.role
          FROM user_roles ur
          LEFT JOIN role_permissions rp ON rp.role = ur.role
          WHERE ur."userId" = ? OR ur.email = ? COLLATE NOCASE
          ORDER BY COALESCE(rp.rank, 0) DESC
          LIMIT 1`,
    args: [userId, normalized],
  })

  const row: any = result.rows[0]
  if (row?.role === 'admin' || row?.role === 'employee' || row?.role === 'client') {
    return row.role
  }

  if (usersRole === 'admin' || usersRole === 'guide') return 'admin'
  if (usersRole === 'employee') return 'employee'
  return 'client'
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export async function findUserByEmail(email: string): Promise<any | null> {
  const result = await turso.execute({
    sql: `SELECT id, email, password_hash, first_name, last_name, phone, role,
                 is_email_verified, is_active, failed_login_attempts, account_locked_until
          FROM users WHERE email = ? COLLATE NOCASE`,
    args: [email.trim()],
  })
  return (result.rows[0] as any) ?? null
}

export async function registerUser(input: {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string | null
  /** Código de referido que trajo al cliente (atribución de una vez). */
  referredBy?: string | null
  /** Demografía opcional. Solo alimenta métricas agregadas. */
  country?: string | null
  gender?: string | null
  state?: string | null
  ageBand?: string | null
}): Promise<AuthUser> {
  const email = input.email.trim().toLowerCase()
  const passwordHash = await hashPassword(input.password)

  const encrypted = isPepperConfigured()
    ? encryptRowFields(
        {
          first_name: input.firstName,
          last_name: input.lastName,
          phone: input.phone ?? '',
        },
        email
      )
    : {}

  const result = await turso.execute({
    sql: `INSERT INTO users (
            email, password_hash, first_name, last_name, phone,
            first_nameEncrypted, first_nameIv, first_nameTag, first_nameSalt,
            last_nameEncrypted, last_nameIv, last_nameTag, last_nameSalt,
            phoneEncrypted, phoneIv, phoneTag, phoneSalt,
            pii_encrypted_at, is_email_verified, country, gender, state, age_band
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING id`,
    args: [
      email,
      passwordHash,
      input.firstName.trim(),
      input.lastName.trim(),
      input.phone ?? null,
      encrypted.first_nameEncrypted ?? null,
      encrypted.first_nameIv ?? null,
      encrypted.first_nameTag ?? null,
      encrypted.first_nameSalt ?? null,
      encrypted.last_nameEncrypted ?? null,
      encrypted.last_nameIv ?? null,
      encrypted.last_nameTag ?? null,
      encrypted.last_nameSalt ?? null,
      encrypted.phoneEncrypted ?? null,
      encrypted.phoneIv ?? null,
      encrypted.phoneTag ?? null,
      encrypted.phoneSalt ?? null,
      isPepperConfigured() ? new Date().toISOString() : null,
      0,
      normalizeCountry(input.country),
      normalizeGender(input.gender),
      input.state ?? null,
      normalizeAgeBand(input.ageBand),
    ],
  })

  const row: any = result.rows[0]
  const id = row?.id ?? row?.['id']
  if (!id) throw new Error('Could not create user')

  // Alta: 'client' por defecto. Si el correo está en ADMIN_EMAILS o
  // EMPLOYEE_EMAILS se auto-asigna ese rol, así la cuenta de.bootstrap no
  // depende de que alguien la promueva a mano después.
  try {
    const admins = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase())
    const employees = (process.env.EMPLOYEE_EMAILS || '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
    const role: Role = admins.includes(email)
      ? 'admin'
      : employees.includes(email)
      ? 'employee'
      : 'client'

    await turso.execute({
      sql: `INSERT OR IGNORE INTO user_roles ("userId", email, role, note)
            VALUES (?, ?, ?, ?)`,
      args: [id, email, role, role === 'client' ? 'Alta automática' : 'Bootstrap por .env'],
    })

    if (role !== 'customer') {
      await turso.execute({
        sql: 'UPDATE users SET role = ? WHERE id = ?',
        args: [role === 'admin' ? 'admin' : 'guide', id],
      })
    }
  } catch (error) {
    console.error('[auth] No se pudo registrar el rol inicial:', error)
  }

  // El alta queda auditada: saber quién se creó una cuenta y con qué demografía.
  try {
    await turso.execute({
      sql: `INSERT INTO access_audit_logs
              (id, actor_id, actor_email, actor_role, action, target_email, details)
            VALUES (lower(hex(randomblob(16))), ?, ?, 'client', 'register', ?, ?)`,
      args: [
        id,
        email,
        email,
        JSON.stringify({
          hasCountry: Boolean(normalizeCountry(input.country)),
          hasGender: Boolean(normalizeGender(input.gender)),
          referred: Boolean(input.referredBy),
        }),
      ],
    })
  } catch (error) {
    console.error('[auth] No se pudo auditar el alta:', error)
  }

  // Atribución de referido: solo si vino uno válido y no es el mismo usuario.
  if (input.referredBy) {
    try {
      const { findByCode, attributeUser } = await import('./referrals')
      const referral = await findByCode(input.referredBy)
      if (referral && referral.userId !== id) {
        await attributeUser({ referral, referredUserId: id, source: 'registro' })
      }
    } catch (error) {
      console.error('[auth] No se pudo atribuir el referido:', error)
    }
  }

  return {
    id,
    email,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: null,
    role: 'client',
    isEmailVerified: false,
  }
}

export async function recordFailedLogin(email: string): Promise<void> {
  await turso.execute({
    sql: `UPDATE users
          SET failed_login_attempts = failed_login_attempts + 1,
              account_locked_until = CASE
                WHEN failed_login_attempts + 1 >= 5 THEN datetime('now', '+15 minutes')
                ELSE account_locked_until END
          WHERE email = ? COLLATE NOCASE`,
    args: [email],
  })
}

export async function logAccess(params: {
  actorId: string | null
  actorEmail: string | null
  actorRole: string
  action: string
  targetEmail?: string | null
  details?: Record<string, unknown>
  ip?: string | null
}): Promise<void> {
  await turso.execute({
    sql: `INSERT INTO access_audit_logs
            (id, actor_id, actor_email, actor_role, action, target_email, details, ip)
          VALUES (lower(hex(randomblob(16))), ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      params.actorId,
      params.actorEmail,
      params.actorRole,
      params.action,
      params.targetEmail ?? null,
      JSON.stringify(params.details ?? {}),
      params.ip ?? null,
    ],
  })
}
