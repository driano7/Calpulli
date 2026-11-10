// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Amaxing - See LICENSE
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLanguage } from '@/lib/hooks/useLanguage'

const EASE_OUT = [0.22, 1, 0.36, 1]

export default function CardStack() {
  const { t } = useLanguage()
  const CARDS = [
    {
      id: 'oaxaqueno',
      title:
        t('aboutPage.cardStack.oaxTitle') !== 'aboutPage.cardStack.oaxTitle'
          ? t('aboutPage.cardStack.oaxTitle')
          : 'El oaxaqueño',
      imagePlaceholder: '🏔️',
      content:
        t('aboutPage.cardStack.oaxContent') !== 'aboutPage.cardStack.oaxContent'
          ? t('aboutPage.cardStack.oaxContent')
          : 'Vive en CDMX, la camina todos los días. Conoce los mercados que abren antes del amanecer, las azoteas donde se toma el mezcal más honesto, y los rincones que ningún mapa digital señala.',
    },
    {
      id: 'defeno',
      title:
        t('aboutPage.cardStack.defTitle') !== 'aboutPage.cardStack.defTitle'
          ? t('aboutPage.cardStack.defTitle')
          : 'El defeño',
      imagePlaceholder: '🏙️',
      content:
        t('aboutPage.cardStack.defContent') !== 'aboutPage.cardStack.defContent'
          ? t('aboutPage.cardStack.defContent')
          : 'Nació aquí, hoy la mira desde lejos y con ganas. Esa distancia le da una perspectiva que el que vive aquí a veces pierde: sabe cuáles son los tesoros que un visitante nunca encontraría solo.',
    },
    {
      id: 'maxing',
      title:
        t('aboutPage.cardStack.amxTitle') !== 'aboutPage.cardStack.amxTitle'
          ? t('aboutPage.cardStack.amxTitle')
          : 'Calpulli CDMX',
      imagePlaceholder: '✨',
      content:
        t('aboutPage.cardStack.amxContent') !== 'aboutPage.cardStack.amxContent'
          ? t('aboutPage.cardStack.amxContent')
          : 'El cruce de dos historias. Entre los dos cubrimos los polos más distintos de esta ciudad — y decidimos que valía la pena compartirlo con quien quiera sentir la CDMX de verdad.',
    },
  ]
  const [activeIndex, setActiveIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animatingRef = useRef(false)
  const intervalRef = useRef(null)
  const stoppedRef = useRef(false)

  const moveCard = useCallback(
    (direction) => {
      if (animatingRef.current) return
      animatingRef.current = true
      setIsAnimating(true)
      window.setTimeout(() => {
        setActiveIndex((prev) => (prev + direction + CARDS.length) % CARDS.length)
        setIsAnimating(false)
        animatingRef.current = false
      }, 860)
    },
    [CARDS.length]
  )

  useEffect(() => {
    if (stoppedRef.current) return
    intervalRef.current = window.setInterval(() => moveCard(1), 10000)
    return () => clearInterval(intervalRef.current)
  }, [moveCard])

  const stopAuto = () => clearInterval(intervalRef.current)

  const handlePrev = () => {
    stoppedRef.current = true
    clearInterval(intervalRef.current)
    moveCard(-1)
  }

  const handleNext = () => {
    stoppedRef.current = true
    clearInterval(intervalRef.current)
    moveCard(1)
  }

  const first = CARDS[activeIndex]
  const second = CARDS[(activeIndex + 1) % CARDS.length]
  const third = CARDS[(activeIndex + 2) % CARDS.length]
  const visibleCards = [
    { ...first, stackClass: 'about-stack-item about-stack-item--top' },
    { ...second, stackClass: 'about-stack-item about-stack-item--middle' },
    { ...third, stackClass: 'about-stack-item about-stack-item--back' },
  ]

  return (
    <div className="card-stack-section">
      <style jsx global>{`
        .card-stack-section {
          padding: 48px 0 24px;
        }
        .card-stack-wrap {
          max-width: 880px;
          margin: 0 auto;
          padding: 0 32px;
        }
        .card-stack-title {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: clamp(1.9rem, 4vw, 2.5rem);
          color: #b5006a;
          margin-bottom: 24px;
          text-align: center;
        }
        :global(.dark) .card-stack-title {
          color: #f472b6;
        }
        .about-card-stack {
          position: relative;
          height: 420px;
          perspective: 1200px;
          max-width: 640px;
          margin: 0 auto;
        }
        .about-stack-item {
          position: absolute;
          inset: 0;
          width: 100%;
          transform-origin: 25% 50%;
          transition: transform 720ms cubic-bezier(0.22, 1, 0.36, 1),
            opacity 720ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        .about-stack-item--top {
          transform: scale(1) translate3d(0, 0, 0);
          z-index: 30;
          opacity: 1;
        }
        .about-stack-item--middle {
          transform: scale(0.92) translate3d(28px, 64px, 0);
          z-index: 20;
          opacity: 0.97;
        }
        .about-stack-item--back {
          transform: scale(0.84) translate3d(62px, 126px, 0);
          z-index: 10;
          opacity: 0.95;
        }
        .about-stack-card {
          background: #fffdf9;
          border-radius: 20px;
          overflow: hidden;
          border: 1px solid rgba(46, 46, 51, 0.08);
          box-shadow: 0 24px 44px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05);
          height: 100%;
          display: flex;
          flex-direction: column;
        }
        :global(.dark) .about-stack-card {
          background: #27272a;
          border-color: rgba(255, 255, 255, 0.08);
        }
        .about-stack-card-img {
          height: 180px;
          background: linear-gradient(135deg, #fce4f1 0%, #f3e8ff 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 4rem;
          flex-shrink: 0;
        }
        .about-stack-card-body {
          padding: 24px 28px 28px;
          flex: 1;
        }
        .about-stack-card-body h3 {
          font-family: 'Fraunces', serif;
          font-weight: 700;
          font-size: 1.3rem;
          color: #b5006a;
          margin-bottom: 10px;
        }
        :global(.dark) .about-stack-card-body h3 {
          color: #f472b6;
        }
        .about-stack-card-body p {
          font-size: 0.95rem;
          color: #5b4b44;
          line-height: 1.65;
        }
        :global(.dark) .about-stack-card-body p {
          color: #a1a1aa;
        }
        .about-card-stack.is-animating .about-stack-item--top {
          animation: about-stack-slide-out 860ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .about-card-stack.is-animating .about-stack-item--middle {
          animation: about-stack-to-top 860ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        .about-card-stack.is-animating .about-stack-item--back {
          animation: about-stack-to-middle 860ms cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes about-stack-slide-out {
          0% {
            transform: scale(1) translate3d(0, 0, 0);
            z-index: 30;
            opacity: 1;
          }
          50% {
            transform: scale(0.9) translate3d(-16%, -2%, 0) rotate(-6deg);
            opacity: 0.75;
          }
          100% {
            transform: scale(0.84) translate3d(62px, 126px, 0);
            z-index: 10;
            opacity: 0.95;
          }
        }
        @keyframes about-stack-to-top {
          0% {
            transform: scale(0.92) translate3d(28px, 64px, 0);
            opacity: 0.97;
          }
          100% {
            transform: scale(1) translate3d(0, 0, 0);
            opacity: 1;
          }
        }
        @keyframes about-stack-to-middle {
          0% {
            transform: scale(0.84) translate3d(62px, 126px, 0);
            opacity: 0.95;
          }
          100% {
            transform: scale(0.92) translate3d(28px, 64px, 0);
            opacity: 0.97;
          }
        }
        .card-stack-nav {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 16px;
          margin-top: 28px;
          position: relative;
          z-index: 40;
        }
        .card-stack-btn {
          width: 48px;
          height: 48px;
          border-radius: 9999px;
          border: 1.5px solid rgba(181, 0, 106, 0.3);
          background: #ffffff;
          color: #b5006a;
          font-size: 1.4rem;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 14px rgba(181, 0, 106, 0.12);
          transition: all 220ms cubic-bezier(0.22, 1, 0.36, 1);
        }
        :global(.dark) .card-stack-btn {
          background: #27272a;
          border-color: rgba(244, 114, 182, 0.4);
          color: #f472b6;
        }
        .card-stack-btn:hover {
          background: #b5006a;
          color: #fff6f1;
          border-color: #b5006a;
          transform: scale(1.08);
          box-shadow: 0 6px 18px rgba(181, 0, 106, 0.2);
        }
        .card-stack-btn:active {
          transform: scale(0.95);
        }
        .card-stack-dots {
          display: flex;
          gap: 6px;
        }
        .card-stack-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: rgba(181, 0, 106, 0.2);
          border: none;
          cursor: pointer;
          transition: all 220ms ease;
          padding: 0;
        }
        .card-stack-dot.active {
          background: #b5006a;
          transform: scale(1.3);
        }
        @media (max-width: 560px) {
          .about-card-stack {
            height: 380px;
          }
          .about-stack-item--middle {
            transform: scale(0.95) translate3d(14px, 36px, 0);
          }
          .about-stack-item--back {
            transform: scale(0.9) translate3d(28px, 70px, 0);
          }
          .about-stack-card-img {
            height: 140px;
            font-size: 3rem;
          }
        }
      `}</style>

      <div className="card-stack-wrap">
        <h2 className="card-stack-title">
          {t('aboutPage.aboutUsTitle') !== 'aboutPage.aboutUsTitle'
            ? t('aboutPage.aboutUsTitle')
            : 'Sobre nosotros'}
        </h2>
        <div
          className={`about-card-stack ${isAnimating ? 'is-animating' : ''}`}
          onMouseEnter={stopAuto}
        >
          {visibleCards.map((card) => (
            <article key={`${card.id}-${activeIndex}`} className={card.stackClass}>
              <div className="about-stack-card">
                <div className="about-stack-card-img">{card.imagePlaceholder}</div>
                <div className="about-stack-card-body">
                  <h3>{card.title}</h3>
                  <p>{card.content}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="card-stack-nav">
          <button
            type="button"
            className="card-stack-btn"
            onClick={handlePrev}
            aria-label="Anterior"
          >
            &#8592;
          </button>
          <div className="card-stack-dots">
            {CARDS.map((card, i) => (
              <button
                key={card.id}
                type="button"
                className={`card-stack-dot ${i === activeIndex ? 'active' : ''}`}
                onClick={() => {
                  if (animatingRef.current) return
                  setActiveIndex(i)
                }}
                aria-label={card.title}
              />
            ))}
          </div>
          <button
            type="button"
            className="card-stack-btn"
            onClick={handleNext}
            aria-label="Siguiente"
          >
            &#8594;
          </button>
        </div>
      </div>
    </div>
  )
}
