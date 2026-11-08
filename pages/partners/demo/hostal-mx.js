// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Sales demo for Hostal MX. Uses the REAL referral infra (no fake data in DB).
// SEO: noindex, nofollow. Mobile-first (WhatsApp delivery).
import Head from 'next/head'
import Link from '@/components/Link'
import QRCodeBox from '@/components/partners/QRCodeBox'
import { DEMO_PARTNER, DEMO_OVERVIEW, DEMO_LABEL } from '@/lib/partners/demoFixture'
import { buildReferralUrl } from '@/lib/partners/links'
import { JOURNEYS, pickLocalized } from '@/data/journeysData'
import { formatPriceMXN } from '@/lib/currency'

const DEMO_SLUG = DEMO_PARTNER.slug

export default function HostalMxDemo() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://donovan-amx.vercel.app'
  const journeysUrl = buildReferralUrl({ ref: DEMO_SLUG, path: '/journeys', origin })
  const twoJourneys = JOURNEYS.slice(0, 2)

  const gross = DEMO_OVERVIEW.gross
  const discounts = DEMO_OVERVIEW.discounts
  const net = DEMO_OVERVIEW.net

  return (
    <>
      <Head>
        <title>Tu alianza con Calpulli CDMX — Hostal MX (demo para socios)</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="mx-auto max-w-4xl px-5 py-12">
        {/* HERO */}
        <h1 className="text-4xl font-black leading-tight text-zinc-900 dark:text-white sm:text-5xl">
          Tu alianza con Calpulli CDMX
        </h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-300">
          Dale a tus huéspedes otra forma de vivir la Ciudad de México.
        </p>
        <ul className="mt-4 space-y-1 text-sm text-zinc-700 dark:text-zinc-300">
          <li>
            • Tus huéspedes reciben <strong>10% de descuento</strong> en los journeys de Calpulli CDMX.
          </li>
          <li>
            • Tu propiedad recibe <strong>10% de comisión</strong> sobre las reservas elegibles completadas.
          </li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href={journeysUrl}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            Ver la experiencia del huésped
          </a>
          <Link
            href="/partners/demo/hostal-mx/dashboard"
            className="rounded-xl border px-5 py-3 font-semibold"
          >
            Ver el tablero del socio
          </Link>
          <a
            href={buildReferralUrl({
              ref: DEMO_SLUG,
              path: '/journeys',
              placement: 'front-desk',
              origin,
            })}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl border px-5 py-3 font-semibold"
          >
            Ver tu QR
          </a>
        </div>
        <p className="mt-2 text-[11px] text-zinc-400">
          {DEMO_LABEL} — guest links below use the real referral infrastructure.
        </p>

        {/* HOW IT WORKS */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">Cómo funciona</h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              'Comparte tu enlace o QR personalizado.',
              'Tus huéspedes descubren los journeys de Calpulli CDMX.',
              'Su descuento del 10% se aplica automáticamente.',
              'Las reservas y comisiones aparecen en tu tablero de socio.',
            ].map((step, i) => (
              <li key={step} className="rounded-2xl bg-zinc-100 p-4 text-sm dark:bg-zinc-800">
                <p className="text-xl font-black text-orange-500">{i + 1}</p>
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* REAL GUEST EXPERIENCE */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">Lo que ve tu huésped</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Enlace real:{' '}
            <a className="font-mono underline" href={journeysUrl} target="_blank" rel="noreferrer">
              {journeysUrl}
            </a>
          </p>
          <div className="mt-3 rounded-2xl bg-emerald-50 p-4 text-sm dark:bg-emerald-500/10">
            <p className="font-bold">Recomendado para huéspedes de Hostal MX Demo</p>
            <p>Explora los journeys seleccionados para tu estancia en la Ciudad de México.</p>
            <p className="mt-1 font-semibold">
              Tu descuento de huésped del 10% ya está activo. — Hostal MX Demo
            </p>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Los precios muestran el precio original tachado, el precio con descuento y el ahorro
            (p. ej., Lucha Libre: $999 → $899 MXN por persona).
          </p>
        </section>

        {/* DIRECT JOURNEY EXAMPLES */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">Ejemplos directos de journeys</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {twoJourneys.map((j) => {
              const url = buildReferralUrl({ ref: DEMO_SLUG, path: `/journeys/${j.slug}`, origin })
              const title = pickLocalized(j.title_es, j.title_en, true)
              const disc = formatPriceMXN(Math.round((j.price || 100) * 0.9), 'es')
              return (
                <article
                  key={j.slug}
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-white/10"
                >
                  <p className="font-bold">{title}</p>
                  <p className="text-xs">
                    <s className="text-zinc-400">{formatPriceMXN(j.price, 'es')}</s>{' '}
                    <span className="font-bold text-emerald-600">{disc} MXN</span>
                  </p>
                  <p className="mt-2 break-all font-mono text-[11px]">{url}</p>
                  <div className="mt-2 flex gap-2">
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-orange-500 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Ver como huésped
                    </a>
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(url)}
                      className="rounded border px-3 py-1 text-xs font-semibold"
                    >
                      Copiar enlace de referido
                    </button>
                  </div>
                  <div className="mt-3">
                    <QRCodeBox
                      url={url}
                      partner={{
                        slug: DEMO_SLUG,
                        referralCode: DEMO_PARTNER.referralCode,
                        name: DEMO_PARTNER.name,
                        guestDiscountPct: 0.1,
                      }}
                      placement={undefined}
                    />
                  </div>
                </article>
              )
            })}
          </div>
        </section>

        {/* CHECKOUT DEMO (read-only) */}
        <section className="mt-12 rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-800">
          <h2 className="text-xl font-black">Vista previa del checkout (demo)</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Vista de solo lectura. Desde esta página no se crea ningún pago real.
          </p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Beneficio</dt>
              <dd>Hostal MX Demo — beneficio de huésped del 10% aplicado</dd>
            </div>
            <div className="flex justify-between">
              <dt>Importe regular</dt>
              <dd>{formatPriceMXN(gross, 'es')}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Descuento del 10%</dt>
              <dd>−{formatPriceMXN(discounts, 'es')}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Importe final</dt>
              <dd className="font-bold">{formatPriceMXN(net, 'es')}</dd>
            </div>
          </dl>
          <a
            href={journeysUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-block rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Abrir el checkout real con tu referido (modo de prueba)
          </a>
        </section>

        {/* DEMO DASHBOARD */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">Vista previa de tu tablero</h2>
          <p className="mt-2 text-sm">
            Visitas {DEMO_OVERVIEW.visits} · Reservas {DEMO_OVERVIEW.confirmedBookings} · Ingresos{' '}
            {formatPriceMXN(DEMO_OVERVIEW.net, 'es')} · Comisión{' '}
            {formatPriceMXN(DEMO_OVERVIEW.paidCommission + DEMO_OVERVIEW.payableCommission, 'es')}
          </p>
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            {DEMO_LABEL}
          </p>
          <Link
            href="/partners/demo/hostal-mx/dashboard"
            className="mt-3 inline-block rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white"
          >
            Ver tu tablero de socio
          </Link>
        </section>

        {/* ROI */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">ROI, sin humo</h2>
          <ul className="mt-2 list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
            <li>Clics sin reservas: sin efecto financiero.</li>
            <li>Clics sin reservas pagadas: sin comisión.</li>
            <li>Reserva elegible completada: se genera comisión.</li>
            <li>No hay mínimo de ventas. No prometemos ingresos garantizados.</li>
          </ul>
        </section>

        {/* PARTNER LINKS */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">Links del socio</h2>
          <ul className="mt-2 space-y-1 break-all font-mono text-xs">
            <li>
              <a
                className="underline"
                href={buildReferralUrl({ ref: DEMO_SLUG, path: '/journeys', origin })}
                target="_blank"
                rel="noreferrer"
              >
                /journeys?ref=hostal-mx-demo
              </a>
            </li>
            <li>
              <a
                className="underline"
                href={buildReferralUrl({
                  ref: DEMO_SLUG,
                  path: `/journeys/${twoJourneys[0]?.slug || 'centro'}`,
                  origin,
                })}
                target="_blank"
                rel="noreferrer"
              >
                /journeys/{twoJourneys[0]?.slug}?ref=hostal-mx-demo
              </a>
            </li>
            <li>
              <a
                className="underline"
                href={buildReferralUrl({ ref: DEMO_SLUG, path: '/local', origin })}
                target="_blank"
                rel="noreferrer"
              >
                /recommendations?ref=hostal-mx-demo (→ /local)
              </a>
            </li>
            <li>
              <a
                className="underline"
                href={buildReferralUrl({ ref: DEMO_SLUG, path: '/custom-journey', origin })}
                target="_blank"
                rel="noreferrer"
              >
                /custom-journey?ref=hostal-mx-demo
              </a>
            </li>
            <li>
              <a
                className="underline"
                href={buildReferralUrl({
                  ref: DEMO_SLUG,
                  path: '/journeys',
                  placement: 'front-desk',
                  origin,
                })}
                target="_blank"
                rel="noreferrer"
              >
                /journeys?ref=hostal-mx-demo&amp;placement=front-desk
              </a>
            </li>
            <li>
              <a
                className="underline"
                href={buildReferralUrl({
                  ref: DEMO_SLUG,
                  path: '/journeys',
                  placement: 'check-in-card-a',
                  origin,
                })}
                target="_blank"
                rel="noreferrer"
              >
                /journeys?ref=hostal-mx-demo&amp;placement=check-in-card-a
              </a>
            </li>
            <li>
              <a
                className="underline"
                href={buildReferralUrl({
                  ref: DEMO_SLUG,
                  path: '/journeys',
                  placement: 'whatsapp',
                  origin,
                })}
                target="_blank"
                rel="noreferrer"
              >
                /journeys?ref=hostal-mx-demo&amp;placement=whatsapp
              </a>
            </li>
          </ul>
        </section>

        {/* QR + MATERIALS */}
        <section className="mt-12">
          <h2 className="text-2xl font-black">QR y materiales</h2>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {['front-desk', 'check-in-card-a', 'sticker', 'whatsapp'].map((pl) => (
              <QRCodeBox
                key={pl}
                url={buildReferralUrl({ ref: DEMO_SLUG, path: '/journeys', placement: pl, origin })}
                partner={{
                  slug: DEMO_SLUG,
                  referralCode: DEMO_PARTNER.referralCode,
                  name: DEMO_PARTNER.name,
                  guestDiscountPct: 0.1,
                }}
                placement={pl}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Guest cards, sticker, WhatsApp e Instagram usan tu nombre, código HOSTALMXDEMO y 10% de
            descuento.
          </p>
        </section>

        {/* PILOT */}
        <section className="mt-12 rounded-2xl bg-zinc-100 p-5 dark:bg-zinc-800">
          <h2 className="text-xl font-black">Piloto de 60 días</h2>
          <ul className="mt-2 list-inside list-disc text-sm">
            <li>Sin costo de instalación · Sin exclusividad · Sin mínimo de ventas</li>
            <li>10% descuento elegible · 10% comisión en completadas</li>
            <li>Enlaces personalizados · QR · Dashboard · Reportes mensuales</li>
            <li>Journeys personalizados bajo pedido · Transporte no incluido</li>
          </ul>
          <Link
            href="/partners/apply"
            className="mt-4 inline-block rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white"
          >
            Iniciar un piloto de alianza de 60 días
          </Link>
        </section>
      </div>
    </>
  )
}
