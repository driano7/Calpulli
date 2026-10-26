'use client'

import { useEffect, useRef } from 'react'

// Revela los hijos directos del contenido MDX uno a uno conforme scrollean
// + animación escalonada para bullet points y listas (ul/ol > li)
export function ProseReveal({ children, className = '', delay = 0 }) {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined

    const children = Array.from(container.children)
    if (children.length === 0) return undefined

    // Estado inicial: oculto con desplazamiento para hijos directos
    children.forEach((child) => {
      // No ocultar listas completas si vamos a animar sus li individualmente
      if (child.tagName === 'UL' || child.tagName === 'OL') {
        const items = Array.from(child.querySelectorAll(':scope > li'))
        items.forEach((li) => {
          li.style.opacity = '0'
          li.style.transform = 'translateX(-12px)'
          li.style.transition = 'opacity 0.5s ease-out, transform 0.5s ease-out'
        })
      } else {
        child.style.opacity = '0'
        child.style.transform = 'translateY(20px)'
        child.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out'
      }
    })

    let startDelay = delay
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const idx = children.indexOf(entry.target)
          const el = entry.target
          if (entry.isIntersecting) {
            // Entrando: anima
            if (el.tagName === 'UL' || el.tagName === 'OL') {
              el.style.opacity = '1'
              el.style.transform = 'translateY(0)'
              const items = Array.from(el.querySelectorAll(':scope > li'))
              items.forEach((li, i) => {
                setTimeout(() => {
                  li.style.opacity = '1'
                  li.style.transform = 'translateX(0)'
                }, startDelay + idx * 80 + i * 90)
              })
            } else {
              setTimeout(() => {
                el.style.opacity = '1'
                el.style.transform = 'translateY(0)'
              }, startDelay + idx * 120)
            }
          } else {
            // Saliendo: oculta para que al volver a entrar (scroll arriba) re-anime
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

    children.forEach((child) => observer.observe(child))
    return () => observer.disconnect()
  }, [children, delay])

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  )
}

export default ProseReveal
