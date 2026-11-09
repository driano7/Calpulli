// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Read-only demo dashboard. Same chart components as real dashboard, but ONLY
// illustrative fixture data. Never touches production analytics/bookings.
import Head from 'next/head'
import Link from '@/components/Link'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import {
  StatCard,
  SequentialBarChart,
  SequentialLineChart,
} from '@/components/charts/AnimatedCharts'
import {
  DEMO_PARTNER,
  DEMO_OVERVIEW,
  DEMO_SERIES,
  DEMO_BREAKDOWNS,
  DEMO_BOOKINGS,
  DEMO_LABEL,
} from '@/lib/partners/demoFixture'
import { buildReferralUrl } from '@/lib/partners/links'
import { formatPriceMXN } from '@/lib/currency'

const BOOKING_STATUS_ES = {
  completed: 'Completada',
  paid: 'Pagada · por venir',
  cancelled: 'Cancelada',
}

const COMMISSION_STATUS_ES = {
  PAYABLE: 'Por pagar',
  PAID: 'Pagada',
  CONFIRMED: 'Confirmada',
  REVERSED: 'Reversada',
}

const MONTHS_ES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

const fmtDay = (iso) => {
  const parts = String(iso).split('-')
  return `${Number(parts[2])} ${MONTHS_ES[Number(parts[1]) - 1]}`
}

export default function DemoDashboardPreview() {
  const origin =
    typeof window !== 'undefined' ? window.location.origin : 'https://donovan-amx.vercel.app'
  const journeysUrl = buildReferralUrl({ ref: DEMO_PARTNER.slug, path: '/journeys', origin })

  return (
    <>
      <Head>
        <title>Demo Partner Dashboard — Hostal MX</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <DashboardLayout demo>
        <div className="mb-4 rounded-xl bg-amber-50 p-3 text-xs font-bold uppercase tracking-widest text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
          DEMONSTRATION DATA — {DEMO_LABEL}
        </div>

        {/* HOTEL INFO (dummy del socio) */}
        <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-white/10 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-serif text-xl font-bold">{DEMO_PARTNER.name}</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              {DEMO_PARTNER.type === 'HOSTEL' ? 'Hostal' : 'Socio'} · Activo
            </span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm lg:grid-cols-4">
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Código de referido</dt>
              <dd className="mt-0.5 font-mono font-bold">{DEMO_PARTNER.referralCode}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">
                Descuento al huésped
              </dt>
              <dd className="mt-0.5 font-bold">
                {Math.round(DEMO_PARTNER.guestDiscountPct * 100)}%
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Tu comisión</dt>
              <dd className="mt-0.5 font-bold">
                {Math.round(DEMO_PARTNER.commissionPct * 100)}% sobre el precio ya descontado
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-zinc-500">Atribución</dt>
              <dd className="mt-0.5 font-bold">{DEMO_PARTNER.attributionDays} días desde el clic</dd>
            </div>
          </dl>
          <p className="mt-3 break-all text-xs text-zinc-500">
            Enlace para tus huéspedes:{' '}
            <a className="font-mono underline" href={journeysUrl} target="_blank" rel="noreferrer">
              {journeysUrl}
            </a>
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Así ven tus huéspedes los precios tachados:{' '}
            <Link href="/partners/demo/hostal-mx" className="font-semibold underline">
              vista del huésped
            </Link>
          </p>
        </section>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Visitas" value={DEMO_OVERVIEW.visits} />
          <StatCard label="Journey views" value={DEMO_OVERVIEW.journeyViews} />
          <StatCard label="Checkout starts" value={DEMO_OVERVIEW.checkoutStarts} />
          <StatCard label="Reservas" value={DEMO_OVERVIEW.confirmedBookings} />
          <StatCard label="Huéspedes" value={DEMO_OVERVIEW.guestsBooked} />
          <StatCard label="Neto" value={formatPriceMXN(DEMO_OVERVIEW.net, 'es')} />
          <StatCard
            label="Comisión"
            value={formatPriceMXN(
              DEMO_OVERVIEW.payableCommission + DEMO_OVERVIEW.paidCommission,
              'es'
            )}
          />
          <StatCard
            label="Conversión"
            value={`${(DEMO_OVERVIEW.conversionRate * 100).toFixed(1)}%`}
          />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="min-w-0 overflow-hidden">
            <SequentialBarChart
              data={DEMO_SERIES.map((s) => ({ label: s.day.slice(5), visits: s.visits }))}
              title="Visitas por día (ejemplo)"
              dataKey="visits"
              nameKey="label"
              pngFilename="demo-visits"
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <SequentialLineChart
              data={DEMO_SERIES.map((s) => ({
                day: s.day.slice(5),
                revenue: s.revenue,
                commission: s.commission,
              }))}
              title="Ingresos y comisión (ejemplo)"
              lines={[
                { dataKey: 'revenue', name: 'Neto', color: '#f97316' },
                { dataKey: 'commission', name: 'Comisión', color: '#22c55e' },
              ]}
              xKey="day"
              pngFilename="demo-revenue"
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <SequentialBarChart
              data={DEMO_BREAKDOWNS.byJourney.map((r) => ({
                label: r.label.slice(0, 16),
                revenue: r.revenue,
              }))}
              title="Por Journey"
              dataKey="revenue"
              nameKey="label"
              layout="horizontal"
              pngFilename="demo-journey"
            />
          </div>
          <div className="min-w-0 overflow-hidden">
            <SequentialBarChart
              data={DEMO_BREAKDOWNS.byPlacement.map((r) => ({
                label: r.label.slice(0, 16),
                revenue: r.revenue,
              }))}
              title="Por placement"
              dataKey="revenue"
              nameKey="label"
              layout="horizontal"
              pngFilename="demo-placement"
            />
          </div>
        </div>

        {/* BOOKINGS (del ejemplo, con precios tachados) */}
        <section className="mt-6">
          <h3 className="font-serif text-lg font-bold">Reservas del ejemplo</h3>
          <p className="mt-1 text-xs text-zinc-500">
            El huésped ve el precio original tachado y paga el precio con su descuento; tu comisión
            es el 10% de lo que pagó. La reserva cancelada (DEMO-0009) no cuenta en los totales de
            arriba: su comisión se reversó.
          </p>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 dark:border-white/10">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-white/10">
                  <th className="px-3 py-2">Folio</th>
                  <th className="px-3 py-2">Journey</th>
                  <th className="px-3 py-2">Precio original</th>
                  <th className="px-3 py-2">Paga el huésped</th>
                  <th className="px-3 py-2">Tu comisión</th>
                  <th className="px-3 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {DEMO_BOOKINGS.map((b) => (
                  <tr
                    key={b.bookingReference}
                    className={`border-b border-zinc-100 last:border-0 dark:border-white/5 ${
                      b.bookingStatus === 'cancelled' ? 'opacity-60' : ''
                    }`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{b.bookingReference}</td>
                    <td className="px-3 py-2 font-semibold">
                      {b.experienceTitle}
                      <span className="block text-xs font-normal text-zinc-500">
                        {fmtDay(b.startDate)} · {b.guests} huéspedes
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <s className="text-zinc-400">{formatPriceMXN(b.originalAmount, 'es')}</s>
                    </td>
                    <td className="px-3 py-2 font-bold">{formatPriceMXN(b.finalAmount, 'es')}</td>
                    <td className="px-3 py-2 font-bold text-emerald-600 dark:text-emerald-400">
                      {b.commissionStatus === 'REVERSED'
                        ? '—'
                        : formatPriceMXN(b.commissionAmount, 'es')}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {BOOKING_STATUS_ES[b.bookingStatus] || b.bookingStatus}
                      <span className="block text-zinc-500">
                        Comisión: {COMMISSION_STATUS_ES[b.commissionStatus] || b.commissionStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </DashboardLayout>
    </>
  )
}
