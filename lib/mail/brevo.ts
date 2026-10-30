// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Cliente para la API transaccional de Brevo (https://developers.brevo.com).
// Solo backend: la API key nunca se expone al frontend.

export interface BrevoSendResponse {
  messageId: string
}

export class BrevoError extends Error {
  constructor(public status: number, public body: any, message: string) {
    super(message)
    this.name = 'BrevoError'
  }
}

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email'

/**
 * Envía un correo transaccional vía Brevo.
 *
 * @param apiKey      Clave API de Brevo (BREVO_API_KEY)
 * @param senderEmail Dirección del remitente (BREVO_SENDER_EMAIL)
 * @param senderName  Nombre del remitente (BREVO_SENDER_NAME)
 * @param to          Correo del destinatario
 * @param subject     Asunto
 * @param html        Contenido HTML
 * @param text        Contenido texto plano (opcional)
 */
export async function sendBrevoEmail({
  apiKey,
  senderEmail,
  senderName,
  to,
  subject,
  html,
  text,
}: {
  apiKey: string
  senderEmail: string
  senderName: string
  to: string
  subject: string
  html: string
  text?: string
}): Promise<BrevoSendResponse> {
  if (!apiKey) {
    throw new BrevoError(401, null, 'BREVO_API_KEY no configurada')
  }

  const payload = {
    sender: { email: senderEmail, name: senderName },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 10000)

  try {
    const response = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const body = (await response.json().catch(() => ({}))) as any

    if (!response.ok) {
      throw new BrevoError(
        response.status,
        body,
        body.message || `Brevo API error: ${response.status}`
      )
    }

    return { messageId: body.messageId ?? '' }
  } catch (error) {
    clearTimeout(timeout)

    if (error instanceof BrevoError) throw error
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new BrevoError(408, null, 'Brevo request timeout')
    }
    throw new BrevoError(0, null, error instanceof Error ? error.message : String(error))
  }
}
