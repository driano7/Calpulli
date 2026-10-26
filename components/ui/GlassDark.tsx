// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
/**
 * Glass Dark — capa semitransparente con backdrop blur.
 *
 * Se adapta al modo claro y oscuro:
 *  - Modo claro: fondo blanco semitransparente + border zinc-200 (similar al header).
 *  - Modo oscuro: fondo zinc-900 / slate-950 semitransparente + border blanco tenue.
 *
 * Útil para overlays, cards, menús, navbars y paneles de datos.
 */

import { type CSSProperties, type ReactNode } from 'react'

type GlassDarkVariant = 'subtle' | 'strong' | 'panel'

const VARIANT_CLASSES: Record<GlassDarkVariant, string> = {
  subtle:
    'rounded-xl bg-white/70 border border-zinc-200 backdrop-blur-sm dark:bg-zinc-900/40 dark:border-white/10',
  strong:
    'rounded-xl bg-white/85 border border-zinc-300 backdrop-blur-md dark:bg-zinc-900/70 dark:border-white/20',
  panel:
    'rounded-xl bg-white/90 border border-zinc-200 backdrop-blur-xl shadow-xl dark:bg-slate-950/80 dark:border-white/15 dark:shadow-2xl',
}

interface GlassDarkProps {
  children: ReactNode
  className?: string
  variant?: GlassDarkVariant
  style?: CSSProperties
}

export function GlassDark({ children, className = '', variant = 'subtle', style }: GlassDarkProps) {
  return (
    <div className={`${VARIANT_CLASSES[variant]} ${className}`} style={style}>
      {children}
    </div>
  )
}
