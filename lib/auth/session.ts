import { NextApiRequest, NextApiResponse } from 'next'

interface AuthUser {
  id: string
  email: string
  firstName?: string
  lastName?: string
  avatar?: string
}

export interface AuthSession {
  user: AuthUser
  token: string
}

export async function getSession(req: NextApiRequest): Promise<AuthSession | null> {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }
  const token = authHeader.substring(7).trim()
  if (!token) return null

  // Soporte para x-demo-email (desarrollo) — ver lib/roles.ts
  const demoEmail = req.headers['x-demo-email']
  if (typeof demoEmail === 'string' && demoEmail.includes('@')) {
    return { user: { id: 'demo-user', email: demoEmail }, token }
  }

  // Sesiones reales de Turso (lib/auth.createSession): token hex de 64 chars.
  // Sin esto, reservas/cash/crypto trataban al usuario logueado como invitado
  // (userId null, sin límite 3/journey por usuario, sin historial).
  if (!token.includes('.') && !token.startsWith('mock_')) {
    try {
      const { getSessionUser } = await import('../auth')
      const user = await getSessionUser(token)
      if (user) {
        return {
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
          },
          token,
        }
      }
    } catch {
      // Turso caído: seguir como invitado, no tumbar el checkout
    }
  }

  // Si es un JWT real (contiene '.'), decodificar payload sin verificar firma (solo claims)
  // Para mock_jwt_token_* no hay payload, se retorna null -> el caller tratará como invitado
  if (token.includes('.')) {
    try {
      const payloadB64 = token.split('.')[1]
      const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf-8')
      const payload = JSON.parse(payloadJson)
      const email = payload.email || payload.sub || ''
      const id = payload.sub || payload.id || payload.userId || email || token
      if (email || id) {
        return {
          user: {
            id: String(id),
            email: String(email || `${id}@guest.local`),
            firstName: payload.firstName || payload.given_name || undefined,
            lastName: payload.lastName || payload.family_name || undefined,
          },
          token,
        }
      }
    } catch {
      // token malformado -> guest
    }
  }

  // Para tokens mock (mock_jwt_token_*) intentamos recuperar usuario desde
  // un header opcional o dejamos que el caller use body.customerEmail como fallback.
  // No usamos localStorage en servidor (no existe en Node) — ver bug previo.
  return null
}

export async function getSessionOptional(req: NextApiRequest): Promise<AuthSession | null> {
  try {
    return await getSession(req)
  } catch {
    return null
  }
}

export async function requireAuth(
  req: NextApiRequest,
  res: NextApiResponse
): Promise<AuthSession | null> {
  const session = await getSession(req)
  if (!session) {
    res.status(401).json({ error: 'No autorizado' })
    return null
  }
  return session
}
