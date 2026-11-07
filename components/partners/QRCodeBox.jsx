'use client'

// QR generator — SVG display + PNG/SVG download (no localhost in prod).
import { useRef } from 'react'
import dynamic from 'next/dynamic'

const QRCodeSVG = dynamic(() => import('qrcode.react').then((m) => m.QRCodeSVG), { ssr: false })

export default function QRCodeBox({ url, partner, placement }) {
  const wrapRef = useRef(null)

  const download = (kind) => {
    const svgEl = wrapRef.current?.querySelector('svg')
    if (!svgEl) return
    const svg = new XMLSerializer().serializeToString(svgEl)
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
    if (kind === 'svg') {
      const a = document.createElement('a')
      a.href = URL.createObjectURL(svgBlob)
      a.download = `qr-${partner?.slug || 'partner'}-${placement || 'general'}.svg`
      a.click()
      URL.revokeObjectURL(a.href)
      return
    }
    const img = new Image()
    const svgUrl = URL.createObjectURL(svgBlob)
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = 512
      canvas.height = 512
      const ctx = canvas.getContext('2d')
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 512, 512)
      ctx.drawImage(img, 0, 0, 512, 512)
      URL.revokeObjectURL(svgUrl)
      canvas.toBlob((blob) => {
        if (!blob) return
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `qr-${partner?.slug || 'partner'}-${placement || 'general'}.png`
        a.click()
        URL.revokeObjectURL(a.href)
      })
    }
    img.src = svgUrl
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      void 0
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white/80 p-5 text-center dark:border-white/10 dark:bg-zinc-900/50">
      <div ref={wrapRef} className="flex justify-center rounded-xl bg-white p-3">
        <QRCodeSVG
          value={url}
          size={180}
          level="H"
          includeMargin
          bgColor="#ffffff"
          fgColor="#0f172a"
        />
      </div>
      <p className="mt-2 font-mono text-xs font-bold tracking-widest">{partner?.referralCode}</p>
      <p className="break-all text-[10px] text-zinc-400">{url}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={() => download('png')}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          PNG
        </button>
        <button
          type="button"
          onClick={() => download('svg')}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
        >
          SVG
        </button>
        <button
          type="button"
          onClick={() => void copyUrl()}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
        >
          Copy URL
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border px-3 py-1.5 text-xs font-semibold"
        >
          Print
        </button>
      </div>
    </div>
  )
}
