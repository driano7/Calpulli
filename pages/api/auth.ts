// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// POST /api/auth — login | register | forgot (Turso, sin mocks)
import {
  createEmailVerificationToken,
  createPasswordResetToken,
  createSession,
  findUserByEmail,
  hashPassword,
  PASSWORD_RESET_TTL_MINUTES,
  recordFailedLogin,
  registerUser,
  resetPasswordWithToken,
  verifyEmailWithToken,
  verifyPassword,
} from '@/lib/auth'
import { isValidAgeBand, isValidCountry, isValidGender, isValidState } from '@/lib/demographics'
import { validatePassword } from '@/lib/password'
import { sendMail } from '@/lib/mail/service'

function readRefCookie(req): string | null {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === 'calpulli_ref') {
      return decodeURIComponent(part.slice(index + 1).trim()) || null
    }
  }
  return null
}

function readLocale(req): string {
  const header = req.headers.cookie || ''
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === 'NEXT_LOCALE') {
      const value = decodeURIComponent(part.slice(index + 1).trim())
      if (value === 'es' || value === 'en') return value
    }
  }
  return 'es'
}

function clientMeta(req) {
  return {
    ip: (req.headers['x-forwarded-for']?.split(',')[0] || '').trim() || undefined,
    userAgent: req.headers['user-agent'],
  }
}

export default async function handler(req, res) {
  if (req.method === 'GET' && String(req.query?.mode) === 'verify-email') {
    return handleVerifyEmail(req, res)
  }
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const locale = readLocale(req)

  const {
    mode = 'login',
    email,
    password,
    firstName,
    lastName,
    referredBy,
    country,
    gender,
    state,
    ageBand,
  } = req.body ?? {}

  // El reset de contraseña se identifica con el token del enlace, no con un
  // correo: por eso la validación de correo no aplica a ese modo.
  if (mode !== 'reset' && (!email || typeof email !== 'string' || !email.includes('@'))) {
    return res.status(400).json({ message: 'Email inválido' })
  }

  try {
    if (mode === 'register') {
      if (!firstName || !lastName) {
        return res.status(400).json({ message: 'Nombre y apellido son obligatorios' })
      }
      // Mismas reglas que el formulario, por si alguien lo salta.
      const pwError = validatePassword(String(password))
      if (pwError) return res.status(400).json({ message: pwError })
      if (await findUserByEmail(email)) {
        return res.status(409).json({ message: 'Ese correo ya está registrado' })
      }

      const user = await registerUser({
        email,
        password: String(password),
        firstName: String(firstName),
        lastName: String(lastName),
        referredBy: readRefCookie(req) || (typeof referredBy === 'string' ? referredBy : null),
        country: isValidCountry(country) ? country : undefined,
        gender: isValidGender(gender) ? gender : undefined,
        state: country === 'MX' && isValidState(state) ? state : undefined,
        ageBand: isValidAgeBand(ageBand) ? ageBand : undefined,
      })
      const session = await createSession(user.id, clientMeta(req))

      // Envía bienvenida y verificación de correo (sin bloquear el registro
      // si el correo falla: trySend nunca lanza).
      try {
        const base =
          (req.headers.origin && String(req.headers.origin)) ||
          process.env.NEXT_PUBLIC_SITE_URL ||
          'http://localhost:3000'
        const { token: verifyToken } = await createEmailVerificationToken(user.id)
        const verifyUrl = `${base}/verify-email?token=${verifyToken}`
        const firstName = user.first_name || user.firstName || ''
        await sendMail('welcome', {
          to: user.email,
          userId: user.id,
          locale,
          vars: { firstName, siteUrl: base, lang: locale },
        })
        await sendMail('email_verification', {
          to: user.email,
          userId: user.id,
          locale,
          vars: { firstName, verifyUrl, lang: locale },
        })
      } catch (error) {
        console.error('[auth.register] error enviando correos de bienvenida/verificación:', error)
      }

      return res.status(201).json({ user, token: session.token, expiresAt: session.expiresAt })
    }

    if (mode === 'forgot') {
      // No revelamos si el correo existe: la respuesta es la misma siempre.
      const user = await findUserByEmail(email)
      if (user) {
        try {
          const { token, expiresAt } = await createPasswordResetToken(user.id)
          const base =
            (req.headers.origin && String(req.headers.origin)) ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            'http://localhost:3000'
          const resetUrl = `${base}/reset-password?token=${token}`
          const result = await sendMail('password_reset', {
            to: user.email,
            userId: user.id,
            locale,
            vars: {
              firstName: user.first_name || user.firstName || '',
              resetUrl,
              expiresMinutes: PASSWORD_RESET_TTL_MINUTES,
              lang: locale,
            },
          })
          console.log('[auth.forgot] correo de reset:', result.status, result.reason || '')
        } catch (error) {
          console.error('[auth.forgot] error generando el reset:', error)
        }
      }
      return res.status(200).json({
        message: 'Si el correo existe, recibirás instrucciones',
        sent: true,
      })
    }

    if (mode === 'reset') {
      const token = String(req.body?.token || '')
      const newPassword = String(password || '')
      if (!token) {
        return res.status(400).json({ message: 'Falta el enlace de recuperación' })
      }
      const pwError = validatePassword(newPassword)
      if (pwError) return res.status(400).json({ message: pwError })
      const result = await resetPasswordWithToken(token, await hashPassword(newPassword))
      if (result === 'ok') {
        return res.status(200).json({ message: 'Tu contraseña se actualizó' })
      }
      if (result === 'expirado') {
        return res.status(400).json({ message: 'El enlace expiró. Pide uno nuevo.' })
      }
      return res.status(400).json({ message: 'El enlace no es válido' })
    }

    if (!password) return res.status(400).json({ message: 'Contraseña requerida' })

    const row = await findUserByEmail(email)
    if (!row) return res.status(401).json({ message: 'Credenciales inválidas' })

    if (Number(row.is_active) !== 1) {
      return res.status(403).json({ message: 'Cuenta desactivada' })
    }

    if (
      row.account_locked_until &&
      new Date(`${row.account_locked_until}Z`).getTime() > Date.now()
    ) {
      return res
        .status(429)
        .json({ message: 'Cuenta bloqueada temporalmente por intentos fallidos' })
    }

    const valid = await verifyPassword(String(password), row.password_hash)
    if (!valid) {
      await recordFailedLogin(email)
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }

    const session = await createSession(row.id, clientMeta(req))

    return res.status(200).json({
      user: {
        id: row.id,
        email: row.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone ?? null,
      },
      token: session.token,
      expiresAt: session.expiresAt,
    })
  } catch (error) {
    console.error('Auth error:', error)
    return res.status(500).json({ message: 'Error de autenticación' })
  }
}

async function handleVerifyEmail(req, res) {
  const token = String(req.query?.token || '')
  if (!token) {
    return res.status(400).json({ message: 'Falta el token de verificación' })
  }

  try {
    const result = await verifyEmailWithToken(token)

    if (result === 'ok') {
      return res.status(200).json({
        message: 'Tu correo se verificó correctamente. Ya puedes iniciar sesión.',
        verified: true,
      })
    }
    if (result === 'expirado') {
      return res.status(410).json({
        message: 'El enlace de verificación expiró. Pide uno nuevo iniciando sesión.',
        verified: false,
        expired: true,
      })
    }
    return res.status(400).json({
      message: 'El enlace de verificación no es válido o ya se usó.',
      verified: false,
    })
  } catch (error) {
    console.error('Verify email error:', error)
    return res.status(500).json({ message: 'Error al verificar el correo' })
  }
}
