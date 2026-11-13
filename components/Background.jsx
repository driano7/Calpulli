// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Amaxing - See LICENSE
'use client'

import dynamic from 'next/dynamic'

const Particles = dynamic(() => import('./Particles').then((m) => m.Particles), {
  ssr: false,
  loading: () => null,
})

export function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0">
      <Particles quantity={90} accentRatio={0.15} accentColor="228, 0, 124" />
    </div>
  )
}

export default Background
