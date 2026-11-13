'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Bitcoin, Landmark, Check, Copy, HeartHandshake } from 'lucide-react'
import siteMetadata from '@/data/siteMetadata'
import { useLanguage } from '@/lib/hooks/useLanguage'

const DONATION_METHODS = [
  {
    id: 'bitcoin',
    label: 'Bitcoin',
    value: siteMetadata.donations?.bitcoin,
    accent: '#f7931a',
  },
  {
    id: 'ethereum',
    label: 'Ethereum',
    value: siteMetadata.donations?.ethereum,
    accent: '#627eea',
  },
  {
    id: 'bank',
    label: null,
    value: siteMetadata.donations?.bank,
    accent: '#E4007C',
  },
].filter((entry) => Boolean(entry.value))

function EthereumIcon({ className, style }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style} aria-hidden>
      <path d="M12 2 4.5 12.2 12 16.6l7.5-4.4L12 2zm0 15.9-7.5-4.4L12 22l7.5-8.5-7.5 4.4z" />
    </svg>
  )
}

function MethodIcon({ id, className, style }) {
  if (id === 'bitcoin') return <Bitcoin className={className} style={style} aria-hidden />
  if (id === 'ethereum') return <EthereumIcon className={className} style={style} />
  return <Landmark className={className} style={style} aria-hidden />
}

function DonationQR({ value, size = 92 }) {
  const [QRCode, setQRCode] = useState(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let active = true
    import('qrcode.react').then((mod) => {
      if (active) setQRCode(() => mod.QRCodeSVG || mod.default)
    })
    return () => {
      active = false
    }
  }, [])

  if (failed) {
    return (
      <div
        className="flex items-center justify-center rounded-lg border border-dashed border-white/30 bg-black/10"
        style={{ width: size, height: size }}
      >
        <span className="px-2 text-center text-[9px] font-medium uppercase tracking-widest text-white/70">
          No QR
        </span>
      </div>
    )
  }

  if (!QRCode) {
    return (
      <div
        className="animate-pulse rounded-lg border border-white/20 bg-white/10"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div className="rounded-lg bg-white p-1.5 shadow-lg">
      <QRCode
        value={value}
        size={size - 12}
        level="H"
        bgColor="#ffffff"
        fgColor="#0f172a"
        onError={() => setFailed(true)}
      />
    </div>
  )
}

// Revela cada hijo uno a uno cuando entra al viewport
function useStepReveal(itemCount) {
  const [visibleCount, setVisibleCount] = useState(1)
  const refsRef = useRef([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.dataset.step)
            setVisibleCount((prev) => Math.max(prev, idx + 1))
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.2 }
    )

    refsRef.current.forEach((node) => {
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [])

  const registerRef = useCallback((node) => {
    if (node && !refsRef.current.includes(node)) {
      refsRef.current.push(node)
    }
  }, [])

  return { registerRef, visibleCount }
}

export default function SupportBanner() {
  const [copied, setCopied] = useState(null)
  const { t } = useLanguage()
  const totalSteps = 1 + DONATION_METHODS.length + 1
  const { registerRef, visibleCount } = useStepReveal(totalSteps)

  const st = (key, fallback) => {
    const val = t(`support.${key}`)
    return val === `support.${key}` ? fallback : val
  }

  const handleCopy = useCallback(async (id, value) => {
    const persist = () => {
      setCopied(id)
      window.setTimeout(() => {
        setCopied((prev) => (prev === id ? null : prev))
      }, 2000)
    }
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(value)
        persist()
        return
      }
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.setAttribute('readonly', '')
      textarea.style.position = 'absolute'
      textarea.style.left = '-9999px'
      document.body.appendChild(textarea)
      const selection = document.getSelection()
      const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      if (range && selection) {
        selection.removeAllRanges()
        selection.addRange(range)
      }
      persist()
    } catch {
      persist()
    }
  }, [])

  return (
    <section
      className="not-prose relative mt-12 overflow-hidden rounded-3xl px-6 py-10 text-white shadow-2xl"
      style={{
        background:
          'linear-gradient(135deg, #E4007C 0%, #BE1588 25%, #9F0E7F 50%, #7B2BD9 75%, #6A0568 100%)',
      }}
    >
      <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div
          ref={registerRef}
          data-step={0}
          className="flex flex-col items-center gap-3 text-center transition-all duration-700"
          style={{
            opacity: visibleCount > 0 ? 1 : 0,
            transform: visibleCount > 0 ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <span className="bg-white/15 flex h-14 w-14 items-center justify-center rounded-full text-3xl backdrop-blur-sm">
            <HeartHandshake className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="text-4xl font-black uppercase tracking-tighter text-white sm:text-5xl">
            {st('title', 'Support the project')}
          </h2>
          <p className="max-w-lg text-lg font-medium leading-relaxed text-white/90">
            {st(
              'subtitle',
              'Open donations to keep building. Copy the method you prefer or scan the code. Thank you for powering Calpulli CDMX.'
            )}
          </p>
          <p className="max-w-lg text-sm text-white/80">
            {st(
              'note',
              'Your contribution goes directly to the team to fund experience improvements.'
            )}
          </p>
        </div>

        {DONATION_METHODS.map((method, index) => (
          <div
            key={method.id}
            ref={registerRef}
            data-step={index + 1}
            className="bg-black/15 flex flex-col items-center gap-4 rounded-2xl p-5 text-center backdrop-blur-sm transition-all duration-700 hover:bg-black/20"
            style={{
              opacity: visibleCount > index + 1 ? 1 : 0,
              transform: visibleCount > index + 1 ? 'translateY(0)' : 'translateY(24px)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-xl"
                style={{ color: method.accent }}
              >
                <MethodIcon id={method.id} className="h-5 w-5" style={{ color: method.accent }} />
              </span>
              <span className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">
                {method.label ?? (method.id === 'bank' ? st('bank', 'Bank account') : method.label)}
              </span>
            </div>

            <DonationQR value={method.value} size={104} />

            <div className="flex w-full flex-col gap-2">
              <span
                className="w-full truncate rounded-lg border border-white/20 bg-white/10 px-3 py-2 font-mono text-xs font-bold text-white"
                title={method.value}
              >
                {method.value}
              </span>
              <button
                type="button"
                onClick={() => handleCopy(method.id, method.value)}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-white transition hover:bg-white hover:text-[#9F0E7F]"
              >
                {copied === method.id ? (
                  <>
                    <Check className="h-3.5 w-3.5" aria-hidden /> {st('copied', 'Copied')}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden /> {st('copy', 'Copy')}
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        <div
          ref={registerRef}
          data-step={1 + DONATION_METHODS.length}
          className="flex items-center justify-center gap-2 text-center text-xs text-white/70 transition-all duration-700"
          style={{
            opacity: visibleCount > 1 + DONATION_METHODS.length ? 1 : 0,
            transform:
              visibleCount > 1 + DONATION_METHODS.length ? 'translateY(0)' : 'translateY(24px)',
          }}
        >
          <span>
            {st(
              'or',
              'Prefer to donate on another network or does your country use bank transfers?'
            )}
          </span>
          <a
            href="https://wa.me/525512291607"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-white underline underline-offset-2 transition hover:text-white/80"
          >
            {st('contact', 'Contact us')}
          </a>
        </div>
      </div>
    </section>
  )
}
