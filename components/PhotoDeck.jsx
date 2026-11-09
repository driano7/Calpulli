// Deck de fotos CDMX de la homepage — puerto fiel de la demo aprobada (demo12).
//
// Comportamiento (idéntico a la demo):
// - 6 tarjetas en ciclo infinito, 5 visibles (frente + 2 por lado) y 1 oculta atrás.
// - Clic en una tarjeta lateral la trae al frente; sin flechas; auto-avance cada ~5 s
//   solo mientras el deck está en pantalla (IntersectionObserver).
// - Movimiento orgánico: la transición de posición dura .8 s con easing de leve
//   overshoot, y el cruce entre las dos fotos de cada tarjeta usa duraciones
//   (0.72–1.3 s) y delays (0–230 ms) distintos por tarjeta.
// - Las dos fotos de cada tarjeta se cruzan al cambiar el tema del sitio
//   (clase .dark de Tailwind en <html>): entra la segunda foto con un barrido
//   diagonal de luz. Nada de esto se anuncia en los textos visibles.
// - Barra de puertas bajo el deck (sticky en pantallas ≥sm, en flujo en móvil
//   para no pelear con el MobileDock): solo "Nuestros journeys" lleva el
//   degradado de marca — el degradado marca lo que Calpulli vende.
//
// ── PARES DE FOTOS ──────────────────────────────────────────────────────────
// Para cambiar una foto basta editar su URL aquí. Fotos de Wikimedia Commons
// (verificadas una por una) salvo bellas_n, que ya vive en el repo.
// Marcadas con «PENDIENTE» van las que en la demo eran foto propia de Donovan:
// llevan el equivalente más cercano de Commons hasta que él suba las suyas
// a public/ y se apunte la ruta local.
const PAIRS = [
  {
    id: 'revolucion',
    name: 'Monumento a la Revolución',
    // Commons / Commons (magenta) — como en la demo.
    day: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/94/Monumento_a_la_revoluci%C3%B3n2017.jpg/960px-Monumento_a_la_revoluci%C3%B3n2017.jpg',
    night:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Toma_a%C3%A9rea_nocturna_del_Monumento_a_la_Revoluci%C3%B3n_4.jpg/960px-Toma_a%C3%A9rea_nocturna_del_Monumento_a_la_Revoluci%C3%B3n_4.jpg',
    dur: '1.15s',
    del: '0ms',
  },
  {
    id: 'angel',
    name: 'Ángel de la Independencia',
    // Día: Commons (equivalente cercano a la de la demo).
    day: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ec/Angel_de_la_independencia170409.jpg/960px-Angel_de_la_independencia170409.jpg',
    // PENDIENTE: noche era la foto morada de Donovan; esta de Commons también
    // es la columna iluminada en morado, sirve de suplente.
    night:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d1/Angel_de_la_idependencia.jpg/960px-Angel_de_la_idependencia.jpg',
    dur: '0.8s',
    del: '130ms',
  },
  {
    id: 'unam',
    name: 'Biblioteca Central · UNAM',
    // PENDIENTE: día era foto de Donovan; suplente aérea de Commons.
    day: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ae/Im%C3%A1genes_a%C3%A9reas_de_la_Biblioteca_Central_de_la_UNAM_1.jpg/960px-Im%C3%A1genes_a%C3%A9reas_de_la_Biblioteca_Central_de_la_UNAM_1.jpg',
    // Commons — como en la demo.
    night: 'https://upload.wikimedia.org/wikipedia/commons/e/eb/Biblioteca_Central_UNAM_de_noche.jpg',
    dur: '1.3s',
    del: '50ms',
  },
  {
    id: 'bellas',
    name: 'Palacio de Bellas Artes',
    // PENDIENTE: día era la foto dorada de Donovan; suplente de Commons
    // (la misma que ya usa la guía mensual de Local Picks).
    day: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9e/Palacio_de_Bellas_Artes%2C_M%C3%A9xico_D.F.%2C_M%C3%A9xico%2C_2013-10-13%2C_DD_40.jpg/960px-Palacio_de_Bellas_Artes%2C_M%C3%A9xico_D.F.%2C_M%C3%A9xico%2C_2013-10-13%2C_DD_40.jpg',
    // Ya vive en el repo (public/static/images/bellas.jpeg).
    night: '/static/images/bellas.jpeg',
    dur: '0.95s',
    del: '230ms',
  },
  {
    id: 'zocalo',
    name: 'Zócalo · Plaza de la Constitución',
    nameEn: 'Zócalo · Constitution Square',
    // PENDIENTE: día era un frame del video de Catrina de Donovan; suplente Commons.
    day: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/Z%C3%B3calo_CDMX_2019.jpg/960px-Z%C3%B3calo_CDMX_2019.jpg',
    // PENDIENTE: noche era la foto de Palacio Nacional de Donovan; suplente
    // Commons de la Catedral iluminada, a un costado de la plaza.
    night:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/25/Mexico_City_Metropolitan_Cathedral_west_bell_tower_night.jpg/960px-Mexico_City_Metropolitan_Cathedral_west_bell_tower_night.jpg',
    dur: '1.05s',
    del: '90ms',
  },
  {
    id: 'latino',
    name: 'Torre Latinoamericana',
    // Commons — vista desde la Alameda.
    day: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ef/Torre_Latinoamericana_from_Alameda_Central_promenade.jpg/960px-Torre_Latinoamericana_from_Alameda_Central_promenade.jpg',
    // PENDIENTE: noche era la foto de azotea de Donovan; suplente Commons con
    // la torre iluminada en verde.
    night:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9c/8_horas_5_minutos_en_la_torre_latinoamericana%2C_D.F..jpg/960px-8_horas_5_minutos_en_la_torre_latinoamericana%2C_D.F..jpg',
    dur: '0.72s',
    del: '180ms',
  },
]

// Posiciones del abanico (igual que la demo): frente, derecha 1, derecha 2,
// oculta atrás, izquierda 2, izquierda 1.
const POS = [
  { x: 0, s: 1, o: 1, z: 6 },
  { x: 63, s: 0.86, o: 0.94, z: 5 },
  { x: 120, s: 0.72, o: 0.72, z: 4 },
  { x: 0, s: 0.6, o: 0, z: 1 },
  { x: -120, s: 0.72, o: 0.72, z: 4 },
  { x: -63, s: 0.86, o: 0.94, z: 5 },
]

const DOORS = [
  {
    href: '/journeys',
    main: true,
    es: ['Nuestros journeys', 'los que te harán volver a la ciudad'],
    en: ['Our journeys', 'the ones that will bring you back to this city'],
  },
  {
    href: '/guides',
    es: ['Recorre por tu cuenta', 'guías gratis, paso a paso'],
    en: ['Explore on your own', 'free guides, step by step'],
  },
  {
    href: '/maps',
    es: ['Mapas de la ciudad', 'el Centro en tu bolsillo'],
    en: ['City maps', 'the Centro in your pocket'],
  },
  {
    href: '/local',
    es: ['¿Qué hay hoy?', 'planes cerca de ti'],
    en: ["What's on today?", 'plans near you'],
  },
]

import { useEffect, useRef, useState } from 'react'
import Image from '@/components/Image'
import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'

export default function PhotoDeck() {
  const { currentLanguage } = useLanguage()
  const isEn = currentLanguage === 'en'
  const [order, setOrder] = useState(() => PAIRS.map((_, i) => i))
  const stageRef = useRef(null)
  const timerRef = useRef(null)

  const advance = () => setOrder((o) => [...o.slice(1), o[0]])

  const bringToFront = (pairIdx) => {
    setOrder((o) => {
      const pos = o.indexOf(pairIdx)
      if (pos <= 0) return o
      return [...o.slice(pos), ...o.slice(0, pos)]
    })
  }

  // Auto-avance solo con el deck en pantalla (igual que la demo).
  useEffect(() => {
    const el = stageRef.current
    if (!el) return undefined
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return undefined
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (!timerRef.current) timerRef.current = setInterval(advance, 5000)
        } else if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }
      },
      { threshold: 0.2 }
    )
    io.observe(el)
    return () => {
      io.disconnect()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  // Un clic reinicia el conteo del auto-avance (igual que la demo).
  const handleClick = (pairIdx) => {
    bringToFront(pairIdx)
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = setInterval(advance, 5000)
    }
  }

  return (
    <section aria-label={isEn ? 'Mexico City photos' : 'Fotos de la Ciudad de México'}>
      <h2 className="text-center text-3xl font-bold text-gray-900 dark:text-white">
        {isEn ? 'The city, in cards' : 'La ciudad, en tarjetas'}
      </h2>

      <div
        ref={stageRef}
        className="pd-stage"
        role="group"
        aria-label={isEn ? 'Photo deck' : 'Mazo de fotos'}
      >
        {PAIRS.map((pair, pairIdx) => {
          const pos = order.indexOf(pairIdx)
          const p = POS[pos]
          const name = isEn && pair.nameEn ? pair.nameEn : pair.name
          return (
            <figure
              key={pair.id}
              className="pd-card"
              style={{
                '--dur': pair.dur,
                '--del': pair.del,
                transform: `translateX(calc(-50% + ${p.x}%)) scale(${p.s})`,
                opacity: p.o,
                zIndex: p.z,
              }}
              onClick={() => handleClick(pairIdx)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleClick(pairIdx)
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={name}
            >
              <Image
                src={pair.day}
                alt={name}
                fill
                sizes="(max-width: 768px) 64vw, 300px"
                className="pd-ph"
                priority={pos === 0}
              />
              <Image
                src={pair.night}
                alt=""
                fill
                sizes="(max-width: 768px) 64vw, 300px"
                className="pd-ph pd-night"
                aria-hidden="true"
              />
              <i className="pd-sweep" aria-hidden="true" />
              <figcaption className="pd-cap">{name}</figcaption>
            </figure>
          )
        })}
      </div>

      <p className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        {isEn ? 'Tap a side card to bring it to the front' : 'Toca una tarjeta lateral para traerla al frente'}
      </p>

      <nav className="pd-doorbar" aria-label={isEn ? 'Explore Calpulli' : 'Explora Calpulli'}>
        {DOORS.map((door) => {
          const [title, sub] = isEn ? door.en : door.es
          return (
            <Link
              key={door.href}
              href={door.href}
              className={door.main ? 'pd-door pd-door-main' : 'pd-door'}
            >
              <b>{title}</b>
              <span>{sub}</span>
            </Link>
          )
        })}
      </nav>

      <style jsx>{`
        .pd-stage {
          position: relative;
          height: min(560px, 132vw);
          max-width: 1020px;
          margin: 14px auto 0;
          perspective: 1300px;
        }
        .pd-card {
          position: absolute;
          left: 50%;
          top: 8px;
          width: min(300px, 64vw);
          aspect-ratio: 4 / 5;
          border-radius: 26px;
          overflow: hidden;
          background: #000;
          box-shadow: 0 30px 60px rgba(20, 5, 35, 0.35);
          transition: transform 0.8s cubic-bezier(0.3, 1.3, 0.35, 1), opacity 0.6s ease;
          cursor: pointer;
          will-change: transform;
          margin: 0;
        }
        .pd-card:focus-visible {
          outline: 2px solid #9F0E7F;
          outline-offset: 3px;
        }
        :global(.pd-card .pd-ph) {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        :global(.pd-card .pd-night) {
          opacity: 0;
          transform: scale(1.07);
          transition: opacity var(--dur) cubic-bezier(0.4, 0, 0.2, 1) var(--del),
            transform var(--dur) cubic-bezier(0.3, 1.45, 0.4, 1) var(--del);
        }
        :global(.dark .pd-card .pd-night) {
          opacity: 1;
          transform: scale(1);
        }
        .pd-sweep {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 30%,
            rgba(255, 255, 255, 0.35) 50%,
            transparent 70%
          );
          transform: translateX(-120%);
          pointer-events: none;
        }
        :global(.dark) .pd-sweep {
          animation: pd-sw 1s ease var(--del);
        }
        @keyframes pd-sw {
          to {
            transform: translateX(120%);
          }
        }
        .pd-cap {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 26px 15px 12px;
          background: linear-gradient(transparent, rgba(10, 2, 18, 0.8));
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          text-align: left;
        }
        .pd-doorbar {
          display: flex;
          gap: 9px;
          justify-content: center;
          flex-wrap: wrap;
          padding: 12px 14px;
          margin-top: 20px;
          border-top: 1px solid rgba(120, 80, 160, 0.18);
          background: rgba(250, 246, 239, 0.55);
          -webkit-backdrop-filter: blur(16px) saturate(1.4);
          backdrop-filter: blur(16px) saturate(1.4);
        }
        :global(.dark) .pd-doorbar {
          background: rgba(18, 7, 31, 0.5);
        }
        @media (min-width: 640px) {
          .pd-doorbar {
            position: sticky;
            bottom: 0;
            z-index: 30;
          }
        }
        :global(.pd-door) {
          flex: 1 1 150px;
          max-width: 230px;
          border: 1px solid rgba(120, 80, 160, 0.35);
          border-radius: 999px;
          padding: 12px 10px;
          text-align: center;
          background: rgba(255, 255, 255, 0.35);
          color: inherit;
          text-decoration: none;
        }
        :global(.dark .pd-door:not(.pd-door-main)) {
          background: rgba(255, 255, 255, 0.08);
        }
        :global(.pd-door-main) {
          border: 0;
          color: #fff;
          background: linear-gradient(
            135deg,
            #DE1D8D 0%,
            #BE1588 25%,
            #9F0E7F 50%,
            #7B2BD9 75%,
            #6A0568 100%
          );
          box-shadow: 0 10px 24px rgba(159, 14, 127, 0.35);
        }
        :global(.pd-door b) {
          display: block;
          font-size: 14.5px;
        }
        :global(.pd-door span) {
          display: block;
          font-size: 11.5px;
          opacity: 0.88;
          margin-top: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .pd-card {
            transition: none;
          }
          :global(.dark) .pd-sweep {
            animation: none;
          }
        }
      `}</style>
    </section>
  )
}
