// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Glass Dark — capa semitransparente oscura con backdrop blur.
 *
 * Útil para overlays, cards, menús, navbars y paneles de datos en modo oscuro.
 * Se adapta al tema dark del sitio (zinc-900 / slate-950) y usa colores del
 * brand (terracota / cempasuchil) solo si se pasa `accent`.
 */

import { type CSSProperties, type ReactNode } from 'react'

type GlassDarkVariant = 'subtle' | 'strong' | 'panel'

const VARIANT_CLASSES: Record<GlassDarkVariant, string> = {
  subtle: 'bg-zinc-900/40 border border-white/10 backdrop-blur-sm',
  strong: 'bg-zinc-900/70 border border-white/20 backdrop-blur-md',
  panel: 'bg-slate-950/80 border border-white/15 backdrop-blur-xl shadow-2xl',
}

interface GlassDarkProps {
  children: ReactNode
  className?: string
  variant?: GlassDarkVariant
  style?: CSSProperties
}

export function GlassDark({ children, className = '', variant = 'subtle', style }: GlassDarkProps) {
  return (
    <div className={`rounded-xl ${VARIANT_CLASSES[variant]} ${className}`} style={style}>
      {children}
    </div>
  )
}
