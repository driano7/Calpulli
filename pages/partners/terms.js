// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
import { PageSEO } from '@/components/SEO'

export default function PartnerTerms() {
  return (
    <>
      <PageSEO title="Partner terms — Calpulli CDMX" description="Calpulli CDMX Partner Referral Agreement." />
      <div className="mx-auto max-w-3xl px-6 py-24">
        <h1 className="text-3xl font-black">Partner Referral Agreement</h1>
        <p className="mt-1 text-xs text-zinc-500">Versión 2026-09-v1</p>
        <div className="prose mt-6 max-w-none text-sm dark:prose-invert">
          <p>
            1. Enlace y slug: Calpulli CDMX controla el slug y el referralCode. El socio no puede
            modificarlos. Los enlaces deben usar destinos permitidos (no URLs arbitrarias).
          </p>
          <p>
            2. Descuento y comisión: DTO a huéspedes y comisión al socio son fijados por Calpulli CDMX por
            propiedad (defecto 10%/10%). El socio no puede cambiarlos ni marcarse pagado. Las
            comisiones se vuelven pagables solo tras Journeys elegibles completados.
          </p>
          <p>
            3. Atribución: ventana de 30 días por defecto (LAST VALID TOUCH). Eventos analíticos no
            son verdad contable; la verdad es Booking + BookingAttribution.
          </p>
          <p>
            4. Privacidad: el panel solo muestra datos agregados y referencias de reserva. Nunca
            datos personales del huésped.
          </p>
          <p>
            5. Materiales: textos y logos aprobados por Calpulli CDMX. No afirmar que el hotel opera el
            Journey ni que incluye transporte.
          </p>
          <p>
            6. Pagos: Calpulli CDMX paga comisiones elegibles según proceso interno. Este acuerdo no es
            factura fiscal.
          </p>
        </div>
      </div>
    </>
  )
}
