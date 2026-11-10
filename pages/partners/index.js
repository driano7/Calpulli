// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'

export default function PartnersHome() {
  return (
    <>
      <PageSEO
        title="Partner with Calpulli CDMX"
        description="Partner program for hotels and hostels. Guest discount, commission and dashboard."
      />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-4xl font-black text-zinc-900 dark:text-white">Partner with Calpulli CDMX</h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">
          Ofrecemos a tus huéspedes Journeys de la Ciudad de México con descuento y a tu propiedad
          una comisión por reservas elegibles completadas.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/partners/apply"
            className="rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white"
          >
            Apply / Solicitar
          </Link>
          <Link href="/partners/login" className="rounded-xl border px-6 py-3 font-semibold">
            Partner login
          </Link>
          <Link href="/partners/terms" className="rounded-xl border px-6 py-3 font-semibold">
            Partner terms
          </Link>
        </div>
        <p className="mt-6 text-xs text-zinc-400">
          Las cuentas de socio son por invitación. El acceso es solo a tu propiedad.
        </p>
      </div>
    </>
  )
}
