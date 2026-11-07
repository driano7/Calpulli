// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX
// Custom Journey request — destination for partner links (?ref=...).
// The tracker preserves the referral; the CTA is the real WhatsApp flow.
import { PageSEO } from '@/components/SEO'
import PartnerBanner from '@/components/partners/PartnerBanner'

export default function CustomJourneyPage() {
  return (
    <>
      <PageSEO
        title="Journey a la medida — Calpulli CDMX"
        description="Pide un Journey a la medida por WhatsApp."
      />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <PartnerBanner />
        <h1 className="mt-4 text-4xl font-black text-zinc-900 dark:text-white">
          ¿Quieres tu propio Journey?
        </h1>
        <p className="mt-4 text-zinc-600 dark:text-zinc-300">
          Te armamos un recorrido a la medida: barrio, ritmo, duración y horarios. Tu referido se
          mantiene activo para el descuento en Journeys elegibles.
        </p>
        <a
          href="https://wa.me/525512291607?text=Hola%20Calpulli%20CDMX%2C%20quiero%20un%20Journey%20a%20la%20medida"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex rounded-full bg-white px-6 py-3 text-sm font-bold text-[#9F0E7F] shadow-lg"
        >
          Pedir un Journey a la medida por WhatsApp
        </a>
      </div>
    </>
  )
}
