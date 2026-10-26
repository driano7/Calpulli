'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Revela los textos del MDX (blogs y local picks) con animación tipo Journey:
 *  - Cada hijo directo (h1, h2, h3, p, ul, ol, blockquote) entra con fade-up
 *  - Los bullet points de listas aparecen uno a uno con stagger
 *  - Respeta prefers-reduced-motion (sin animación, contenido visible)
 *  - Re-anima al volver a entrar al viewport (scroll arriba/abajo)
 */

import { useRef, useEffect } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

export function ProseReveal({ children, className = '', delay = 0 }) {
  const containerRef = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const directChildren = Array.from(container.children).filter(
      (el) => el.nodeType === Node.ELEMENT_NODE
    )

    if (directChildren.length === 0) return undefined

    // Configurar estado inicial para modo reducido: todo visible
    if (reduced) {
      directChildren.forEach((child) => {
        child.style.opacity = '1'
        child.style.transform = 'none'
        child.style.transition = 'none'
      })
      return undefined
    }

    // Estado inicial: oculto
    directChildren.forEach((child) => {
      child.style.opacity = '0'
      child.style.transform = 'translateY(20px)'
      child.style.transition =
        'opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1), transform 0.6s cubic-bezier(0.22, 1, 0.36, 1)'
    })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const el = entry.target
          const idx = directChildren.indexOf(el)

          if (entry.isIntersecting) {
            if (el.tagName === 'UL' || el.tagName === 'OL') {
              el.style.opacity = '1'
              el.style.transform = 'translateY(0)'
              const items = Array.from(el.querySelectorAll(':scope > li'))
              items.forEach((li, i) => {
                li.style.opacity = '0'
                li.style.transform = 'translateX(-12px)'
                li.style.transition =
                  'opacity 0.5s cubic-bezier(0.22, 1, 0.36, 1), transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)'
                setTimeout(() => {
                  li.style.opacity = '1'
                  li.style.transform = 'translateX(0)'
                }, delay + idx * 100 + i * 90)
              })
            } else {
              setTimeout(() => {
                el.style.opacity = '1'
                el.style.transform = 'translateY(0)'
              }, delay + idx * 120)
            }
          } else {
            // Salir: ocultar para re-animar al entrar de nuevo
            if (el.tagName === 'UL' || el.tagName === 'OL') {
              el.style.opacity = '0'
              el.style.transform = 'translateY(20px)'
              const items = Array.from(el.querySelectorAll(':scope > li'))
              items.forEach((li) => {
                li.style.opacity = '0'
                li.style.transform = 'translateX(-12px)'
              })
            } else {
              el.style.opacity = '0'
              el.style.transform = 'translateY(20px)'
            }
          }
        })
      },
      { threshold: 0.05, rootMargin: '0px 0px -10% 0px' }
    )

    directChildren.forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [children, delay, reduced])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export default ProseReveal
