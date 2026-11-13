// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// GET /api/mcp/oauth/authorize — Authorization endpoint (RFC 6749 + PKCE RFC 7636)
import {
  getClientByClientId,
  createAuthCode,
  getAuthorizationServerMetadata,
  isValidResource,
  mcpResource,
  serverOrigin,
  SUPPORTED_SCOPES,
} from '@/lib/mcp/oauth'
import { getSessionUser } from '@/lib/auth'

function parseCookie(header, name) {
  if (!header) return null
  for (const part of header.split(';')) {
    const index = part.indexOf('=')
    if (index === -1) continue
    if (part.slice(0, index).trim() === name) {
      return decodeURIComponent(part.slice(index + 1).trim()) || null
    }
  }
  return null
}

function loginRequiredPage(clientName, returnTo) {
  const target = encodeURIComponent(returnTo)
  return `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Inicia sesión · Calpulli CDMX</title>
<style>body{font-family:system-ui,sans-serif;background:#fafaf9;color:#1c1917;display:grid;place-items:center;min-height:100vh;margin:0}
.box{background:#fff;padding:2.5rem;border-radius:1rem;max-width:26rem;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-size:1.25rem;margin:0 0 .5rem}p{color:#57534e;line-height:1.6;margin:0 0 1.5rem}
a{display:inline-block;background:#c2410c;color:#fff;padding:.75rem 1.25rem;border-radius:.5rem;text-decoration:none;font-weight:600}</style>
</head><body><div class="box"><h1>Necesitas iniciar sesión</h1>
<p><strong>${clientName}</strong> quiere conectarse a tu cuenta de Calpulli CDMX para consultar tours y reservas.</p>
<a href="/login?next=${target}">Iniciar sesión</a></div></body></html>`
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const {
    response_type,
    client_id,
    redirect_uri,
    scope = 'mcp:read',
    state,
    code_challenge,
    code_challenge_method,
    resource,
  } = req.query

  // ---- Validaciones RFC 6749 / RFC 8707 ----
  if (response_type !== 'code') {
    return redirectError(
      res,
      redirect_uri,
      'unsupported_response_type',
      state,
      'response_type must be "code"'
    )
  }

  const client = await getClientByClientId(client_id)
  if (!client) {
    return redirectError(res, redirect_uri, 'invalid_client', state, 'Unknown client_id')
  }

  // redirect_uris se guarda como JSON en TEXT: hay que parsearlo.
  let registeredUris = []
  try {
    registeredUris = JSON.parse(client.redirect_uris || '[]')
  } catch {
    registeredUris = []
  }

  // Validate redirect_uri exactly matches registered URI
  if (!registeredUris.includes(redirect_uri)) {
    return redirectError(
      res,
      redirect_uri,
      'invalid_redirect_uri',
      state,
      'redirect_uri not registered for this client'
    )
  }

  // Validate scope: lo pedido debe estar en el scope del cliente Y soportado.
  const requestedScopes = String(scope).split(' ').filter(Boolean)
  const allowedScopes = String(client.scope || 'mcp:read')
    .split(' ')
    .filter(Boolean)
  const invalidScopes = requestedScopes.filter(
    (sc) => !allowedScopes.includes(sc) || !SUPPORTED_SCOPES.includes(sc)
  )
  if (invalidScopes.length > 0) {
    return redirectError(
      res,
      redirect_uri,
      'invalid_scope',
      state,
      `Invalid scopes: ${invalidScopes.join(', ')}`
    )
  }

  // PKCE validation (RFC 7636) - REQUIRED for public clients
  if (!code_challenge) {
    return redirectError(
      res,
      redirect_uri,
      'invalid_request',
      state,
      'code_challenge is required (PKCE S256)'
    )
  }
  if (code_challenge_method && !['S256'].includes(code_challenge_method)) {
    return redirectError(
      res,
      redirect_uri,
      'invalid_request',
      state,
      'code_challenge_method must be S256'
    )
  }

  // Resource parameter (RFC 8707): debe ser este servidor o un origen
  // registrado por el cliente.
  if (resource && !isValidResource(resource, registeredUris)) {
    return redirectError(res, redirect_uri, 'invalid_target', state, 'Invalid resource parameter')
  }

  // ---- AUTENTICACIÓN REAL ----
  // Antes se emitía el token contra un "dev-user-001" fijo: cualquiera que
  // autorizaba obtenía credenciales de un usuario que no existía.
  // Ahora exige una sesión válida de Turso (Bearer o cookie de sesión).
  const authHeader = req.headers.authorization
  const bearer = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  const cookieToken = parseCookie(req.headers.cookie, 'authToken')
  const user = await getSessionUser(bearer || cookieToken)

  const approved = req.query.consent === 'approve'

  if (!user) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(401).send(loginRequiredPage(client.client_name || client_id, req.url))
  }

  if (!approved) {
    // Render consent page (simplified HTML)
    const consentHtml = generateConsentPage({
      client_name: client.client_name || client_id,
      client_id,
      redirect_uri,
      scope,
      allowedScopes,
      requestedScopes,
      state,
      code_challenge,
      code_challenge_method: code_challenge_method || 'S256',
      resource,
      approveUrl: `${req.url}${req.url.includes('?') ? '&' : '?'}consent=approve`,
    })
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(consentHtml)
  }

  // ---- CREATE AUTH CODE ----
  // OJO: client_id (el identificador MCP público), no client.id (la fila).
  const code = await createAuthCode({
    client_id: client.client_id,
    redirect_uri,
    scope: requestedScopes.filter((sc) => allowedScopes.includes(sc)).join(' '),
    user_id: user.id,
    code_challenge,
    code_challenge_method: 'S256',
    resource: resource || mcpResource(),
  })

  // ---- REDIRECT BACK TO CLIENT ----
  const redirectUrl = new URL(redirect_uri)
  redirectUrl.searchParams.set('code', code)
  if (state) redirectUrl.searchParams.set('state', state)

  // Security headers
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('Pragma', 'no-cache')
  return res.redirect(302, redirectUrl.toString())
}

/**
 * Envia un error de OAuth.
 *
 * Antes esta funcion DEVOLVIA un objeto y los call sites hacían
 * `return redirectError(...)`. En un handler de Next.js, devolver un objeto
 * plano no termina la respuesta: la peticion se queda colgada y retiene un
 * worker del servidor. Ahora responde de verdad: 302 al redirect_uri si es
 * valido, y 400 con el error en JSON si no lo es.
 */
function redirectError(res, redirectUri, error, state, description) {
  if (redirectUri) {
    try {
      const url = new URL(redirectUri)
      url.searchParams.set('error', error)
      if (description) url.searchParams.set('error_description', description)
      if (state) url.searchParams.set('state', state)
      return res.redirect(302, url.toString())
    } catch {
      /* redirect_uri no es una URL valida: se responde con JSON */
    }
  }
  return res.status(400).json({ error, error_description: description })
}

function generateConsentPage({
  client_name,
  client_id,
  redirect_uri,
  scope,
  allowedScopes = ['mcp:read'],
  requestedScopes = [],
  state,
  code_challenge,
  code_challenge_method,
  resource,
  approveUrl,
}) {
  const params = new URLSearchParams(Object.fromEntries(new URL(approveUrl).searchParams.entries()))
  params.set('consent', 'approve')

  const denyUrl = new URL(redirect_uri)
  denyUrl.searchParams.set('error', 'access_denied')
  if (state) denyUrl.searchParams.set('state', state)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Authorize ${client_name}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 60px auto; padding: 24px; background: #fafafa; color: #1a1a1a; line-height: 1.6; }
    .card { background: white; border-radius: 12px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    h1 { font-size: 24px; margin: 0 0 16px; }
    .scope-list { background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .scope-item { display: inline-block; background: #e8e8e8; padding: 4px 12px; border-radius: 20px; font-size: 14px; margin: 4px 4px 4px 0; }
    .btn { display: inline-block; width: 100%; padding: 14px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; text-decoration: none; text-align: center; }
    .btn-primary { background: #E4007C; color: white; }
    .btn-secondary { background: #f5f5f5; color: #666; margin-top: 12px; }
    .client-info { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .client-avatar { width: 48px; height: 48px; border-radius: 12px; background: linear-gradient(135deg, #E4007C, #BE1588); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="client-info">
      <div class="client-avatar">${client_name.charAt(0).toUpperCase()}</div>
      <div>
        <strong>${client_name}</strong><br>
        <small style="color: #666;">${client_id}</small>
      </div>
    </div>
    <p>solicita acceso a tu cuenta de Calpulli CDMX.</p>
    <div class="scope-list">
      <strong>Permisos solicitados:</strong><br>
      ${scope
        .split(' ')
        .map((s) => `<span class="scope-item">${s}</span>`)
        .join('')}
    </div>
    <p style="font-size: 14px; color: #666;">You can revoke this access at any time from your account settings.</p>
    <a href="?${new URLSearchParams({
      ...Object.fromEntries(new URLSearchParams(window.location.search)),
      consent: 'true',
    })}" class="btn btn-primary">Allow Access</a>
    <a href="${new URL(
      'error=access_denied',
      window.location.href
    ).toString()}" class="btn btn-secondary">Deny</a>
  </div>
  <script>
    // Auto-submit if auto_consent param is present
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('auto_consent') === 'true') {
      document.querySelector('.btn-primary').click();
    }
  </script>
</body>
</html>`
}
