// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Read-only demo dashboard. Same chart components as real dashboard, but ONLY
// illustrative fixture data. Never touches production analytics/bookings.
import Head from 'next/head'
import DashboardLayout from '@/components/partners/dashboard/DashboardLayout'
import {
  StatCard,
  SequentialBarChart,
  SequentialLineChart,
} from '@/components/charts/AnimatedCharts'
import {
  DEMO_OVERVIEW,
  DEMO_SERIES,
  DEMO_BREAKDOWNS,
  DEMO_BOOKINGS,
  DEMO_COMMISSIONS,
  DEMO_LABEL,
} from '@/lib/partners/demoFixture'
import { formatPriceMXN } from '@/lib/currency'

export default function DemoDashboardPreview() {
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
          <SequentialBarChart
            data={DEMO_SERIES.map((s) => ({ label: s.day.slice(5), visits: s.visits }))}
            title="Visitas por día (ejemplo)"
            dataKey="visits"
            nameKey="label"
            pngFilename="demo-visits"
          />
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
        <p className="mt-4 text-xs text-zinc-500">
          Reservas ilustrativas: {DEMO_BOOKINGS.map((b) => b.bookingReference).join(', ')}.
          Comisiones: {DEMO_COMMISSIONS.map((c) => c.status).join(' · ')}.
        </p>
      </DashboardLayout>
    </>
  )
}
