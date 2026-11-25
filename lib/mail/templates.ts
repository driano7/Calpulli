// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Plantillas de correo. El contenido vive en la BD (email_templates) para que
// el admin lo edite desde el panel; aquí solo están los valores por defecto y
// la metadata que alimenta ese editor.
//
// Las plantillas nuevas (welcome, email_verification, password_reset) son
// bilingües (es / en): subject, html y text pueden ser un string (español
// por defecto) o un objeto { es, en }. getTemplate(key, locale) resuelve el
// idioma correcto.
import { BRAND } from '../brand'

export interface TemplateMeta {
  key: string
  label: string
  description: string
  variables: string[]
}

type LocalizedString = string | { es: string; en: string }

interface LocalizedTemplate {
  subject: LocalizedString
  html: LocalizedString
  text: LocalizedString
}

/** Resuelve un string localizado a partir del locale ('es' | 'en'). */
export function resolveLocalized(value: LocalizedString, locale: string): string {
  if (typeof value === 'string') return value
  return value[locale === 'en' ? 'en' : 'es']
}

const FONT_BODY = `'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif`
const FONT_HEADING = `'Fraunces', Georgia, 'Times New Roman', serif`

const COLORS = {
  hueso: '#FAF3EA',
  huesoCard: '#FFFFFF',
  huesoBorder: '#E7DDD0',
  grafito: '#2E2E33',
  grafitoCard: '#242429',
  grafitoBorder: '#3F3F46',
  rosa: BRAND.color.primary, // #E4007C
  rosaDark: BRAND.color.secondary, // #BE1588
  textLight: '#2E2E33',
  mutedLight: '#5C5854',
  textDark: '#FAF3EA',
  mutedDark: '#D4CEC6',
}

const EMAIL_HEAD = `<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Nunito:wght@400;600;700;800&display=swap');
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      .email-bg {
        background-color: #1F1F23 !important;
      }
      .email-card {
        background-color: ${COLORS.grafito} !important;
        border-color: ${COLORS.grafitoBorder} !important;
      }
      .email-header {
        background-color: ${COLORS.grafito} !important;
        border-bottom-color: ${COLORS.grafitoBorder} !important;
      }
      .email-body {
        background-color: ${COLORS.grafito} !important;
      }
      .email-heading {
        color: ${COLORS.textDark} !important;
      }
      .email-text {
        color: ${COLORS.textDark} !important;
      }
      .email-muted {
        color: ${COLORS.mutedDark} !important;
      }
      .email-surface {
        background-color: ${COLORS.grafitoCard} !important;
        border-color: ${COLORS.grafitoBorder} !important;
      }
      .email-dark-block {
        background-color: #1C1C20 !important;
      }
      .email-mosaic-card {
        background-color: ${COLORS.grafito} !important;
        border-color: ${COLORS.grafitoBorder} !important;
      }
      .email-footer {
        background-color: ${COLORS.grafitoCard} !important;
        border-top-color: ${COLORS.grafitoBorder} !important;
      }
      .email-btn {
        background-color: ${COLORS.rosa} !important;
        color: #FFFFFF !important;
      }
    }
  </style>
</head>`

const renderFooter = (lang: 'es' | 'en' | 'bilingual' = 'bilingual') => {
  const notice =
    lang === 'en'
      ? `You received this email because you have an account at ${BRAND.name}.`
      : lang === 'es'
      ? `Recibiste este correo porque tienes una cuenta en ${BRAND.name}.`
      : `Recibiste este correo porque eres parte de ${BRAND.name}. / You received this email because you are part of ${BRAND.name}.`

  return `<tr>
    <td class="email-footer" bgcolor="${COLORS.hueso}" style="padding:22px 28px;background-color:${COLORS.hueso};border-top:1px solid ${COLORS.huesoBorder};font-family:${FONT_BODY}">
      <p class="email-text" style="margin:0;font-size:13px;font-weight:700;color:${COLORS.textLight};line-height:1.6">
        ${BRAND.name}
      </p>
      <p class="email-muted" style="margin:6px 0 0;font-size:12px;color:${COLORS.mutedLight};line-height:1.7">
        <a href="${BRAND.social.email}" style="color:${COLORS.rosa};text-decoration:none;font-weight:600">${BRAND.email}</a>
        &nbsp;·&nbsp;
        <a href="${BRAND.social.whatsapp}" style="color:${COLORS.rosa};text-decoration:none;font-weight:600">WhatsApp ${BRAND.whatsapp}</a>
        &nbsp;·&nbsp;
        <a href="${BRAND.social.instagram}" style="color:${COLORS.rosa};text-decoration:none;font-weight:600">Instagram</a>
      </p>
      <p class="email-muted" style="margin:10px 0 0;font-size:11px;color:${COLORS.mutedLight};line-height:1.5">
        ${notice}
      </p>
    </td>
  </tr>`
}

const wrap = (body: string) => `<!doctype html>
<html lang="{{lang}}">
${EMAIL_HEAD}
<body class="email-bg" style="margin:0;padding:0;background-color:${
  COLORS.hueso
};font-family:${FONT_BODY};color:${COLORS.textLight}">
  <table role="presentation" class="email-bg" width="100%" cellpadding="0" cellspacing="0" bgcolor="${
    COLORS.hueso
  }" style="background-color:${COLORS.hueso};padding:28px 16px">
    <tr><td align="center">
      <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" bgcolor="${
        COLORS.huesoCard
      }" style="max-width:600px;background-color:${
  COLORS.huesoCard
};border-radius:16px;overflow:hidden;border:1px solid ${COLORS.huesoBorder}">
        <tr><td style="background-color:${COLORS.rosa};background:linear-gradient(135deg,${
  COLORS.rosa
},${COLORS.rosaDark});padding:24px 32px">
          <h1 style="margin:0;color:#FFFFFF;font-family:${FONT_HEADING};font-size:22px;font-weight:700;letter-spacing:-0.01em">${
  BRAND.name
}</h1>
          <p style="margin:4px 0 0;color:#FAF3EA;font-family:${FONT_BODY};font-size:13px">${
  BRAND.tagline
}</p>
        </td></tr>
        <tr><td class="email-body" bgcolor="${
          COLORS.huesoCard
        }" style="padding:28px 32px;background-color:${COLORS.huesoCard};color:${
  COLORS.textLight
};font-family:${FONT_BODY}">
          ${body}
        </td></tr>
        ${renderFooter('bilingual')}
      </table>
    </td></tr>
  </table>
</body>
</html>`

const btn = (href: string, text: string) =>
  `<a href="${href}" class="email-btn" style="display:inline-block;margin-top:20px;background-color:${COLORS.rosa};color:#FFFFFF;padding:13px 26px;border-radius:10px;font-family:${FONT_BODY};font-weight:700;text-decoration:none;font-size:14px;line-height:1.2">${text}</a>`

interface JourneyMosaicCard {
  slug: string
  title: string
  subtitle: string
  imagePath: string
}

function buildEditorialJourneyEmail(opts: {
  lang: 'es' | 'en'
  heroImagePath: string
  heroAlt: string
  heading: string
  bodyText: string
  primaryCtaText: string
  primaryCtaHref: string
  mosaicEyebrow: string
  mosaicTitle: string
  mosaicCards: JourneyMosaicCard[]
  secondaryCtaText: string
}): string {
  const tagline = opts.lang === 'en' ? 'Authentic stories & walks in Mexico City' : BRAND.tagline

  const renderCard = (card: JourneyMosaicCard) => `
    <td width="50%" valign="top" style="padding:6px">
      <table role="presentation" class="email-mosaic-card" width="100%" cellpadding="0" cellspacing="0" bgcolor="${COLORS.grafitoCard}" style="background-color:${COLORS.grafitoCard};border:1px solid ${COLORS.grafitoBorder};border-radius:12px;overflow:hidden">
        <tr><td style="padding:0;background-color:${COLORS.grafitoCard}">
          <a href="{{siteUrl}}/journeys/${card.slug}" style="display:block;text-decoration:none">
            <img src="{{siteUrl}}${card.imagePath}" alt="${card.title}" width="260" style="display:block;width:100%;height:132px;object-fit:cover;border:0;outline:none" />
          </a>
        </td></tr>
        <tr><td style="padding:12px 14px;background-color:${COLORS.grafitoCard}">
          <a href="{{siteUrl}}/journeys/${card.slug}" style="text-decoration:none;color:${COLORS.textDark}">
            <p style="margin:0;font-family:${FONT_HEADING};font-size:15px;font-weight:700;color:${COLORS.textDark};line-height:1.3">${card.title}</p>
            <p style="margin:4px 0 0;font-family:${FONT_BODY};font-size:12px;color:${COLORS.mutedDark};line-height:1.45">${card.subtitle}</p>
          </a>
        </td></tr>
      </table>
    </td>`

  const rows: string[] = []
  for (let i = 0; i < opts.mosaicCards.length; i += 2) {
    const first = opts.mosaicCards[i]
    const second = opts.mosaicCards[i + 1]
    rows.push(
      `<tr>${renderCard(first)}${second ? renderCard(second) : '<td width="50%"></td>'}</tr>`
    )
  }

  return `<!doctype html>
<html lang="${opts.lang}">
${EMAIL_HEAD}
<body class="email-bg" style="margin:0;padding:0;background-color:${
    COLORS.hueso
  };font-family:${FONT_BODY};color:${COLORS.textLight}">
  <table role="presentation" class="email-bg" width="100%" cellpadding="0" cellspacing="0" bgcolor="${
    COLORS.hueso
  }" style="background-color:${COLORS.hueso};padding:24px 12px">
    <tr><td align="center">
      <table role="presentation" class="email-card" width="100%" cellpadding="0" cellspacing="0" bgcolor="${
        COLORS.huesoCard
      }" style="max-width:600px;background-color:${
    COLORS.huesoCard
  };border-radius:16px;overflow:hidden;border:1px solid ${COLORS.huesoBorder}">
        <!-- 1. Header limpio con marca -->
        <tr><td class="email-header" bgcolor="${
          COLORS.huesoCard
        }" style="padding:20px 28px;background-color:${COLORS.huesoCard};border-bottom:2px solid ${
    COLORS.rosa
  }">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle">
                <span class="email-heading" style="font-family:${FONT_HEADING};font-size:20px;font-weight:700;color:${
    COLORS.textLight
  };letter-spacing:-0.01em">${BRAND.name}</span>
              </td>
              <td align="right" valign="middle">
                <span class="email-muted" style="font-family:${FONT_BODY};font-size:11px;font-weight:700;color:${
    COLORS.rosa
  };text-transform:uppercase;letter-spacing:0.08em">Journeys CDMX</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:4px">
                <span class="email-muted" style="font-family:${FONT_BODY};font-size:12px;color:${
    COLORS.mutedLight
  }">${tagline}</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- 2. Fotografía protagonista sin texto encima -->
        <tr><td style="padding:0;background-color:${COLORS.grafito}">
          <a href="${opts.primaryCtaHref}" style="display:block;text-decoration:none">
            <img src="{{siteUrl}}${opts.heroImagePath}" alt="${
    opts.heroAlt
  }" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;outline:none;text-decoration:none" />
          </a>
        </td></tr>

        <!-- 3. Bloque editorial debajo de la foto -->
        <tr><td class="email-body" bgcolor="${
          COLORS.huesoCard
        }" style="padding:30px 28px 32px;background-color:${COLORS.huesoCard};color:${
    COLORS.textLight
  }">
          <h2 class="email-heading" style="margin:0 0 12px;font-family:${FONT_HEADING};font-size:24px;font-weight:700;color:${
    COLORS.textLight
  };line-height:1.25">${opts.heading}</h2>
          <p class="email-muted" style="margin:0;font-family:${FONT_BODY};font-size:15px;color:${
    COLORS.mutedLight
  };line-height:1.7">${opts.bodyText}</p>
          ${btn(opts.primaryCtaHref, opts.primaryCtaText)}
        </td></tr>

        <!-- 4. Bloque oscuro con mosaico de journeys reales -->
        <tr><td class="email-dark-block" bgcolor="${
          COLORS.grafito
        }" style="padding:28px 22px 32px;background-color:${COLORS.grafito};color:${
    COLORS.textDark
  }">
          <p style="margin:0 0 4px;padding:0 6px;font-family:${FONT_BODY};font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:${
    COLORS.rosa
  }">${opts.mosaicEyebrow}</p>
          <h3 style="margin:0 0 16px;padding:0 6px;font-family:${FONT_HEADING};font-size:20px;font-weight:700;color:${
    COLORS.textDark
  };line-height:1.3">${opts.mosaicTitle}</h3>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            ${rows.join('\n')}
          </table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-top:16px">
              ${btn('{{siteUrl}}/journeys', opts.secondaryCtaText)}
            </td></tr>
          </table>
        </td></tr>

        <!-- 5. Footer bilingüe -->
        ${renderFooter(opts.lang)}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export const TEMPLATE_META: TemplateMeta[] = [
  {
    key: 'welcome',
    label: 'Bienvenida',
    description: 'Se envía al crear la cuenta.',
    variables: ['firstName', 'siteUrl', 'lang'],
  },
  {
    key: 'journeys_discovery',
    label: 'Descubrimiento de Journeys',
    description: 'Correo editorial de descubrimiento y reactivación de /journeys.',
    variables: ['firstName', 'siteUrl', 'lang'],
  },
  {
    key: 'email_verification',
    label: 'Verificación de correo',
    description: 'Se envía al crear la cuenta para verificar el email.',
    variables: ['firstName', 'verifyUrl', 'lang'],
  },
  {
    key: 'booking_confirmed',
    label: 'Reserva confirmada (tarjeta)',
    description: 'Pago confirmado. Incluye el QR.',
    variables: [
      'firstName',
      'bookingReference',
      'experienceTitle',
      'startDate',
      'startTime',
      'guests',
      'total',
      'currency',
      'meetingPoint',
      'ticketUrl',
      'ticketsList',
    ],
  },
  {
    key: 'booking_cash_reserved',
    label: 'Reserva en efectivo',
    description: 'Reserva guardada, pago pendiente en el punto de encuentro.',
    variables: [
      'firstName',
      'bookingReference',
      'experienceTitle',
      'startDate',
      'startTime',
      'guests',
      'meetingPoint',
      'whatsappUrl',
    ],
  },
  {
    key: 'ticket_participant',
    label: 'Ticket individual (participante)',
    description: 'Se envía a cada participante con su propio QR/ticket.',
    variables: [
      'firstName',
      'bookingReference',
      'experienceTitle',
      'startDate',
      'startTime',
      'meetingPoint',
      'ticketUrl',
      'ticketCode',
    ],
  },
  {
    key: 'booking_reminder',
    label: 'Recordatorio del tour',
    description: 'Se envía antes de la salida.',
    variables: ['firstName', 'experienceTitle', 'startDate', 'startTime', 'meetingPoint'],
  },
  {
    key: 'check_in_done',
    label: 'Check-in realizado',
    description: 'Avisa al cliente que ya está registrado.',
    variables: ['firstName', 'experienceTitle', 'bookingReference'],
  },
  {
    key: 'referral_converted',
    label: 'Referido convertido',
    description: 'Alguien se registró y reservó con tu código.',
    variables: ['firstName', 'referralCode', 'bookingReference', 'total', 'currency'],
  },
  {
    key: 'password_reset',
    label: 'Recuperar contraseña',
    description: 'Enlace temporal para restablecer la contraseña.',
    variables: ['firstName', 'resetUrl', 'expiresMinutes', 'lang'],
  },
  {
    key: 'partner_report',
    label: 'Reporte de socios y equipo',
    description: 'Reporte diario, semanal o mensual con datos reales de Turso.',
    variables: [
      'recipientName',
      'audienceLabel',
      'periodLabel',
      'periodTypeLabel',
      'sections',
      'sectionsText',
      'dashboardUrl',
    ],
  },
]

export const TEMPLATE_KEYS = TEMPLATE_META.map((t) => t.key)

export const DEFAULT_TEMPLATES: Record<string, LocalizedTemplate> = {
  welcome: {
    subject: {
      es: `Bienvenido a ${BRAND.name} — Tus journeys en CDMX`,
      en: `Welcome to ${BRAND.name} — Your CDMX journeys`,
    },
    html: {
      es: buildEditorialJourneyEmail({
        lang: 'es',
        heroImagePath: '/static/images/journeys/chapultepec/castillo-aereo.jpg',
        heroAlt: 'Chapultepec — De los Dioses a Emperadores',
        heading: '¡Hola {{firstName}}, la ciudad te espera!',
        bodyText:
          'Tu cuenta en Calpulli CDMX ya está lista. Explora nuestros journeys editoriales por la Ciudad de México: recorridos por capas de historia, arquitectura, mercados y cultura local.',
        primaryCtaText: 'Explorar journeys',
        primaryCtaHref: '{{siteUrl}}/journeys',
        mosaicEyebrow: 'Capítulos destacados',
        mosaicTitle: 'Elige por dónde empezar en CDMX',
        mosaicCards: [
          {
            slug: 'centro',
            title: 'Centro Histórico',
            subtitle: 'El futuro se pintó aquí',
            imagePath: '/static/images/journeys/centro/madero.jpg',
          },
          {
            slug: 'luchas',
            title: 'Luchas',
            subtitle: 'Dos arenas, un mismo oficio',
            imagePath: '/static/images/journeys/luchas/mural-historia-lucha.jpg',
          },
          {
            slug: 'jamaica',
            title: 'Jamaica',
            subtitle: 'Mirar más allá de las flores',
            imagePath: '/static/images/journeys/jamaica/puesto.jpg',
          },
          {
            slug: 'roma',
            title: 'Roma–Condesa',
            subtitle: 'La ciudad que se puso de moda',
            imagePath: '/static/images/journeys/roma/plaza-rio-de-janeiro.jpg',
          },
        ],
        secondaryCtaText: 'Explorar journeys',
      }),
      en: buildEditorialJourneyEmail({
        lang: 'en',
        heroImagePath: '/static/images/journeys/chapultepec/castillo-aereo.jpg',
        heroAlt: 'Chapultepec — From Gods to Emperors',
        heading: 'Hello {{firstName}}, Mexico City awaits!',
        bodyText:
          'Your Calpulli CDMX account is ready. Explore our editorial journeys through Mexico City: layered walks across history, architecture, markets, and local culture.',
        primaryCtaText: 'Explore journeys',
        primaryCtaHref: '{{siteUrl}}/journeys',
        mosaicEyebrow: 'Featured chapters',
        mosaicTitle: 'Choose where to begin in CDMX',
        mosaicCards: [
          {
            slug: 'centro',
            title: 'Historic Centre',
            subtitle: 'The Future Was Painted Here',
            imagePath: '/static/images/journeys/centro/madero.jpg',
          },
          {
            slug: 'luchas',
            title: 'Luchas',
            subtitle: 'Two arenas, one same trade',
            imagePath: '/static/images/journeys/luchas/mural-historia-lucha.jpg',
          },
          {
            slug: 'jamaica',
            title: 'Jamaica',
            subtitle: 'Looking beyond the flowers',
            imagePath: '/static/images/journeys/jamaica/puesto.jpg',
          },
          {
            slug: 'roma',
            title: 'Roma–Condesa',
            subtitle: 'The city that became fashionable',
            imagePath: '/static/images/journeys/roma/plaza-rio-de-janeiro.jpg',
          },
        ],
        secondaryCtaText: 'Explore journeys',
      }),
    },
    text: {
      es: `¡Hola {{firstName}}! Tu cuenta en ${BRAND.name} ya está lista. Explora nuestros journeys en CDMX: {{siteUrl}}/journeys`,
      en: `Hello {{firstName}}! Your account at ${BRAND.name} is ready. Explore our CDMX journeys: {{siteUrl}}/journeys`,
    },
  },
  journeys_discovery: {
    subject: {
      es: `Descubre nuevos journeys en CDMX · ${BRAND.name}`,
      en: `Discover new journeys in CDMX · ${BRAND.name}`,
    },
    html: {
      es: buildEditorialJourneyEmail({
        lang: 'es',
        heroImagePath: '/static/images/journeys/centro/madero.jpg',
        heroAlt: 'Centro Histórico — El futuro se pintó aquí',
        heading: 'Hola {{firstName}}, vuelve a caminar la ciudad',
        bodyText:
          'Cada barrio de la Ciudad de México guarda capas que no se ven a primera vista. Descubre el Centro Histórico y otros recorridos curados para mirar la ciudad con calma.',
        primaryCtaText: 'Ver Centro Histórico',
        primaryCtaHref: '{{siteUrl}}/journeys/centro',
        mosaicEyebrow: 'Más journeys para ti',
        mosaicTitle: 'Cuatro rutas para tu próxima salida',
        mosaicCards: [
          {
            slug: 'chapultepec',
            title: 'Chapultepec',
            subtitle: 'De los Dioses a Emperadores',
            imagePath: '/static/images/journeys/chapultepec/castillo-aereo.jpg',
          },
          {
            slug: 'luchas',
            title: 'Luchas',
            subtitle: 'Dos arenas, un mismo oficio',
            imagePath: '/static/images/journeys/luchas/mural-historia-lucha.jpg',
          },
          {
            slug: 'antropologia',
            title: 'Antropología',
            subtitle: 'Un viaje por el tiempo y las costumbres',
            imagePath: '/static/images/journeys/antropologia/patio-exterior-1974.jpg',
          },
          {
            slug: 'roma',
            title: 'Roma–Condesa',
            subtitle: 'La ciudad que se puso de moda',
            imagePath: '/static/images/journeys/roma/plaza-rio-de-janeiro.jpg',
          },
        ],
        secondaryCtaText: 'Explorar journeys',
      }),
      en: buildEditorialJourneyEmail({
        lang: 'en',
        heroImagePath: '/static/images/journeys/centro/madero.jpg',
        heroAlt: 'Historic Centre — The Future Was Painted Here',
        heading: 'Hi {{firstName}}, walk the city again',
        bodyText:
          'Every neighborhood in Mexico City holds layers hidden from plain sight. Discover the Historic Centre and other curated journeys designed to read the city slowly.',
        primaryCtaText: 'View Historic Centre',
        primaryCtaHref: '{{siteUrl}}/journeys/centro',
        mosaicEyebrow: 'More journeys for you',
        mosaicTitle: 'Four routes for your next walk',
        mosaicCards: [
          {
            slug: 'chapultepec',
            title: 'Chapultepec',
            subtitle: 'From Gods to Emperors',
            imagePath: '/static/images/journeys/chapultepec/castillo-aereo.jpg',
          },
          {
            slug: 'luchas',
            title: 'Luchas',
            subtitle: 'Two arenas, one same trade',
            imagePath: '/static/images/journeys/luchas/mural-historia-lucha.jpg',
          },
          {
            slug: 'antropologia',
            title: 'Anthropology',
            subtitle: 'A journey through time & customs',
            imagePath: '/static/images/journeys/antropologia/patio-exterior-1974.jpg',
          },
          {
            slug: 'roma',
            title: 'Roma–Condesa',
            subtitle: 'The city that became fashionable',
            imagePath: '/static/images/journeys/roma/plaza-rio-de-janeiro.jpg',
          },
        ],
        secondaryCtaText: 'Explore journeys',
      }),
    },
    text: {
      es: `Hola {{firstName}}, descubre el Centro Histórico y más journeys en CDMX: {{siteUrl}}/journeys`,
      en: `Hi {{firstName}}, discover Historic Centre and more CDMX journeys: {{siteUrl}}/journeys`,
    },
  },
  email_verification: {
    subject: {
      es: 'Verifica tu correo electrónico',
      en: 'Verify your email address',
    },
    html: {
      es: wrap(`
        <h2 style="margin:0 0 12px;font-size:20px">¡Hola {{firstName}}!</h2>
        <p style="margin:0;color:#57534e;line-height:1.7">Casi estás listo. Haz clic en el botón para verificar tu correo y activar tu cuenta.</p>
        ${btn('{{verifyUrl}}', 'Verificar correo')}
        <p style="margin:18px 0 0;font-size:13px;color:#a8a29e">Si no creaste esta cuenta, ignora este mensaje.</p>
      `),
      en: wrap(`
        <h2 style="margin:0 0 12px;font-size:20px">Hello {{firstName}}!</h2>
        <p style="margin:0;color:#57534e;line-height:1.7">You're almost ready. Click the button to verify your email and activate your account.</p>
        ${btn('{{verifyUrl}}', 'Verify email')}
        <p style="margin:18px 0 0;font-size:13px;color:#a8a29e">If you did not create this account, please ignore this message.</p>
      `),
    },
    text: {
      es: `Hola {{firstName}}. Verifica tu correo: {{verifyUrl}}`,
      en: `Hello {{firstName}}. Verify your email: {{verifyUrl}}`,
    },
  },
  booking_confirmed: {
    subject: `Reserva confirmada · {{bookingReference}}`,
    html: wrap(`
      <h2 style="margin:0 0 4px;font-size:20px">Reserva confirmada</h2>
      <p style="margin:0 0 20px;color:#78716c;font-size:13px">Referencia <strong>{{bookingReference}}</strong></p>
      <table role="presentation" width="100%" style="background:#fafaf9;border-radius:12px;padding:18px">
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Experiencia</td><td align="right" style="padding:4px 0;font-weight:700">{{experienceTitle}}</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Fecha</td><td align="right" style="padding:4px 0;font-weight:700">{{startDate}} · {{startTime}}</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Personas</td><td align="right" style="padding:4px 0;font-weight:700">{{guests}}</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Punto de encuentro</td><td align="right" style="padding:4px 0;font-weight:700">{{meetingPoint}}</td></tr>
        <tr><td style="padding:10px 0 4px;color:#78716c;font-size:13px;border-top:1px solid #e7e5e4;padding-top:12px">Total</td><td align="right" style="padding:10px 0 4px;font-weight:800;border-top:1px solid #e7e5e4;padding-top:12px">{{total}} {{currency}}</td></tr>
      </table>
      <p style="margin:20px 0 0;color:#57534e;line-height:1.7">Cada persona tiene su propio ticket con su código QR. Muéstralo al llegar.</p>
      {{ticketsList}}
      ${btn('{{ticketUrl}}', 'Ver mi ticket')}
    `),
    text: `Reserva confirmada {{bookingReference}}\n{{experienceTitle}}\n{{startDate}} {{startTime}} · {{guests}} personas\n{{meetingPoint}}\nTotal: {{total}} {{currency}}\nTicket: {{ticketUrl}}`,
  },
  ticket_participant: {
    subject: {
      es: 'Tu ticket para {{experienceTitle}} · {{bookingReference}}',
      en: 'Your ticket for {{experienceTitle}} · {{bookingReference}}',
    },
    html: {
      es: wrap(`
        <h2 style="margin:0 0 4px;font-size:20px">Tu ticket</h2>
        <p style="margin:0 0 20px;color:#78716c;font-size:13px">Referencia <strong>{{bookingReference}}</strong> · Código <strong>{{ticketCode}}</strong></p>
        <table role="presentation" width="100%" style="background:#fafaf9;border-radius:12px;padding:18px">
          <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Experiencia</td><td align="right" style="padding:4px 0;font-weight:700">{{experienceTitle}}</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Fecha</td><td align="right" style="padding:4px 0;font-weight:700">{{startDate}} · {{startTime}}</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Punto de encuentro</td><td align="right" style="padding:4px 0;font-weight:700">{{meetingPoint}}</td></tr>
        </table>
        <p style="margin:20px 0 0;color:#57534e;line-height:1.7">Muestra este QR al llegar. Es tu ticket individual.</p>
        ${btn('{{ticketUrl}}', 'Ver mi ticket con QR')}
      `),
      en: wrap(`
        <h2 style="margin:0 0 4px;font-size:20px">Your ticket</h2>
        <p style="margin:0 0 20px;color:#78716c;font-size:13px">Reference <strong>{{bookingReference}}</strong> · Code <strong>{{ticketCode}}</strong></p>
        <table role="presentation" width="100%" style="background:#fafaf9;border-radius:12px;padding:18px">
          <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Experience</td><td align="right" style="padding:4px 0;font-weight:700">{{experienceTitle}}</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Date</td><td align="right" style="padding:4px 0;font-weight:700">{{startDate}} · {{startTime}}</td></tr>
          <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Meeting point</td><td align="right" style="padding:4px 0;font-weight:700">{{meetingPoint}}</td></tr>
        </table>
        <p style="margin:20px 0 0;color:#57534e;line-height:1.7">Show this QR when you arrive. This is your individual ticket.</p>
        ${btn('{{ticketUrl}}', 'View my ticket with QR')}
      `),
    },
    text: {
      es: `Tu ticket {{ticketCode}} · {{bookingReference}}\n{{experienceTitle}}\n{{startDate}} {{startTime}}\n{{meetingPoint}}\nTicket: {{ticketUrl}}`,
      en: `Your ticket {{ticketCode}} · {{bookingReference}}\n{{experienceTitle}}\n{{startDate}} {{startTime}}\n{{meetingPoint}}\nTicket: {{ticketUrl}}`,
    },
  },
  booking_cash_reserved: {
    subject: `Reserva guardada · pagas en el punto · {{bookingReference}}`,
    html: wrap(`
      <h2 style="margin:0 0 4px;font-size:20px">Reserva guardada</h2>
      <p style="margin:0 0 20px;color:#78716c;font-size:13px">Referencia <strong>{{bookingReference}}</strong></p>
      <table role="presentation" width="100%" style="background:#fafaf9;border-radius:12px;padding:18px">
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Experiencia</td><td align="right" style="padding:4px 0;font-weight:700">{{experienceTitle}}</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Fecha</td><td align="right" style="padding:4px 0;font-weight:700">{{startDate}} · {{startTime}}</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Personas</td><td align="right" style="padding:4px 0;font-weight:700">{{guests}}</td></tr>
        <tr><td style="padding:4px 0;color:#78716c;font-size:13px">Punto de encuentro</td><td align="right" style="padding:4px 0;font-weight:700">{{meetingPoint}}</td></tr>
      </table>
      <p style="margin:20px 0 0;color:#57534e;line-height:1.7">
        <strong>Aún no has pagado.</strong> Pagas en efectivo al llegar. Te confirmamos por WhatsApp antes de la salida.
      </p>
      ${btn('{{whatsappUrl}}', 'Escribir por WhatsApp')}
    `),
    text: `Reserva guardada {{bookingReference}} (pagas en efectivo al llegar)\n{{experienceTitle}}\n{{startDate}} {{startTime}} · {{guests}} personas\n{{meetingPoint}}\nTe confirmamos por WhatsApp: {{whatsappUrl}}`,
  },
  booking_reminder: {
    subject: `Tu tour es mañana · {{startTime}}`,
    html: wrap(`
      <h2 style="margin:0 0 12px;font-size:20px">Tu tour es mañana</h2>
      <p style="margin:0;color:#57534e;line-height:1.7">
        <strong>{{experienceTitle}}</strong><br />
        {{startDate}} a las <strong>{{startTime}}</strong><br />
        Punto de encuentro: <strong>{{meetingPoint}}</strong>
      </p>
      <p style="margin:16px 0 0;color:#57534e;line-height:1.7">Llega 15 minutos antes y ten el QR listo.</p>
    `),
    text: `Tu tour es mañana: {{experienceTitle}}\n{{startDate}} {{startTime}}\nPunto: {{meetingPoint}}\nLlega 15 min antes con tu QR.`,
  },
  check_in_done: {
    subject: `Check-in registrado · {{bookingReference}}`,
    html: wrap(`
      <h2 style="margin:0 0 12px;font-size:20px">Ya estás registrado</h2>
      <p style="margin:0;color:#57534e;line-height:1.7">
        Registramos tu llegada para <strong>{{experienceTitle}}</strong>.<br />Tu guía te espera.
      </p>
    `),
    text: `Check-in registrado para {{experienceTitle}} ({{bookingReference}}). Tu guía te espera.`,
  },
  referral_converted: {
    subject: `Tu referido reservó · {{bookingReference}}`,
    html: wrap(`
      <h2 style="margin:0 0 12px;font-size:20px">¡Gracias por compartir!</h2>
      <p style="margin:0;color:#57534e;line-height:1.7">
        Alguien usando tu código <strong>{{referralCode}}</strong> acaba de reservar.<br />
        Monto de la reserva: <strong>{{total}} {{currency}}</strong>.
      </p>
    `),
    text: `Tu referido {{referralCode}} reservó {{total}} {{currency}} ({{bookingReference}}).`,
  },
  password_reset: {
    subject: {
      es: 'Restablecer tu contraseña',
      en: 'Reset your password',
    },
    html: {
      es: wrap(`
        <h2 style="margin:0 0 12px;font-size:20px">Restablecer contraseña</h2>
        <p style="margin:0;color:#57534e;line-height:1.7">
          Hola {{firstName}}. Este enlace sirve una sola vez y expira en {{expiresMinutes}} minutos.
        </p>
        ${btn('{{resetUrl}}', 'Cambiar contraseña')}
        <p style="margin:18px 0 0;font-size:13px;color:#a8a29e">Si no lo pediste, ignora este correo.</p>
      `),
      en: wrap(`
        <h2 style="margin:0 0 12px;font-size:20px">Reset your password</h2>
        <p style="margin:0;color:#57534e;line-height:1.7">
          Hi {{firstName}}. This link can be used once and expires in {{expiresMinutes}} minutes.
        </p>
        ${btn('{{resetUrl}}', 'Reset password')}
        <p style="margin:18px 0 0;font-size:13px;color:#a8a29e">If you did not request this, ignore this email.</p>
      `),
    },
    text: {
      es: `Restablecer contraseña (expira en {{expiresMinutes}} min): {{resetUrl}}`,
      en: `Reset your password (expires in {{expiresMinutes}} min): {{resetUrl}}`,
    },
  },
  partner_report: {
    subject: 'Reporte {{periodTypeLabel}} · {{periodLabel}}',
    html: wrap(`
      <h2 style="margin:0 0 4px;font-size:20px">Reporte {{periodTypeLabel}}</h2>
      <p style="margin:0 0 20px;color:#78716c;font-size:13px">{{periodLabel}} · {{audienceLabel}}</p>
      <p style="margin:0 0 20px;color:#57534e;line-height:1.7">Hola {{recipientName}}, este es el reporte de operación y ventas del periodo.</p>
      {{sections}}
      ${btn('{{dashboardUrl}}', 'Abrir panel')}
      <p style="margin:18px 0 0;font-size:12px;color:#a8a29e">Reporte interno generado automáticamente con datos de Turso.</p>
    `),
    text: `Hola {{recipientName}}

Reporte {{periodTypeLabel}} · {{periodLabel}}
{{audienceLabel}}

{{sectionsText}}

Panel: {{dashboardUrl}}`,
  },
}

/** Sustituye {{variable}} por su valor. Los datos del usuario NO se escapan. */
export function renderTemplate(body: string, vars: Record<string, string | number>): string {
  return body.replace(/\{\{\s*(\w+)\s*\}\}/g, (_match, key: string) => {
    const value = vars[key]
    if (value === undefined || value === null) return ''
    return String(value)
  })
}

/** Extrae los {{variables}} que una plantilla usa. */
export function extractVariables(body: string): string[] {
  return [...new Set([...body.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))]
}
