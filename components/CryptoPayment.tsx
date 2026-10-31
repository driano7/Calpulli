'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check, Wallet, ScanLine, Upload, FlaskConical } from 'lucide-react'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { WALLETS, MOCK_WALLETS, type NetworkKey } from '@/lib/crypto/addresses'
import { verifyPaymentOnce, type PaymentStatus } from '@/lib/crypto/verify'

interface CryptoPaymentProps {
  open: boolean
  amount: number
  currency?: string
  onClose: () => void
  onConfirmed: (reference: string, network: NetworkKey) => void | Promise<void>
}

const STATUS_STYLES: Record<PaymentStatus, { color: string; labelEs: string; labelEn: string }> = {
  WAITING: { color: '#eab308', labelEs: 'Esperando pago', labelEn: 'Waiting for payment' },
  DETECTED: { color: '#f97316', labelEs: 'Pago detectado', labelEn: 'Payment detected' },
  CONFIRMED: { color: '#22c55e', labelEs: 'Confirmado', labelEn: 'Confirmed' },
  ERROR: { color: '#ef4444', labelEs: 'Error', labelEn: 'Error' },
}

function AnyQrScanner({ onScan, onClose }: { onScan: (raw: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number>(0)
  const [error, setError] = useState<string | null>(null)
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'

  useEffect(() => {
    let stopped = false
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
        }
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
          const detect = async () => {
            if (stopped || !videoRef.current) return
            try {
              const codes = await detector.detect(videoRef.current)
              if (codes.length > 0) {
                onScan(codes[0].rawValue)
                return
              }
            } catch {
              void 0
            }
            rafRef.current = requestAnimationFrame(detect)
          }
          rafRef.current = requestAnimationFrame(detect)
        } else {
          const { BrowserMultiFormatReader } = await import('@zxing/browser')
          const reader = new BrowserMultiFormatReader()
          await reader.decodeFromVideoDevice(undefined, videoRef.current!, (result: any) => {
            if (result && !stopped) onScan(result.getText())
          })
        }
      } catch (e: any) {
        setError(
          e.name === 'NotAllowedError'
            ? isEs
              ? 'Permiso denegado'
              : 'Permission denied'
            : isEs
            ? 'No se pudo abrir cámara'
            : 'Could not open camera'
        )
      }
    }
    start()
    return () => {
      stopped = true
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop())
    }
  }, [onScan, isEs])

  return (
    <div className="rounded-xl border border-zinc-200 bg-black p-2 dark:border-white/10">
      <div className="relative overflow-hidden rounded-lg bg-black">
        <video ref={videoRef} playsInline muted className="h-48 w-full object-cover" />
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-32 w-32 rounded-xl border-2 border-white/60" />
        </div>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
            <p className="text-center text-sm text-red-400">{error}</p>
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        className="mt-2 w-full rounded-lg bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700"
      >
        {isEs ? 'Cerrar escáner' : 'Close scanner'}
      </button>
    </div>
  )
}

export function CryptoPayment({
  open,
  amount,
  currency = 'USD',
  onClose,
  onConfirmed,
}: CryptoPaymentProps) {
  const { currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const L = isEs
    ? {
        eyebrow: 'Pago con cripto',
        chooseNetwork: 'Elige la red con la que quieres pagar:',
        scanAndPay: (net: string) => `Escanea y paga · ${net}`,
        copyAddress: 'Copiar dirección',
        copied: 'Copiado',
        referenceLabel: 'Hash de transacción o wallet de origen',
        changeNetwork: '← Cambiar red',
        testToggle: 'Modo testing (mock)',
        testHint: 'Usa direcciones mock — cualquier hash con "mock" confirma al instante',
        mockBtn: 'Usar hash mock para probar →',
        scanQr: 'Escanear QR',
        uploadQr: 'Subir imagen QR',
        mockBadge: 'TESTING',
      }
    : {
        eyebrow: 'Crypto payment',
        chooseNetwork: 'Choose the network you want to pay with:',
        scanAndPay: (net: string) => `Scan and pay · ${net}`,
        copyAddress: 'Copy address',
        copied: 'Copied',
        referenceLabel: 'Transaction hash or source wallet',
        changeNetwork: '← Change network',
        testToggle: 'Testing mode (mock)',
        testHint: 'Use mock addresses — any hash with "mock" confirms instantly',
        mockBtn: 'Use mock hash to test →',
        scanQr: 'Scan QR',
        uploadQr: 'Upload QR image',
        mockBadge: 'TESTING',
      }

  const statusMessageLocalized = (msg: string) => {
    if (isEs) return msg
    switch (status) {
      case 'WAITING':
        return 'Waiting for on-chain payment…'
      case 'DETECTED':
        return msg.includes('Lightning')
          ? 'Lightning payment in transit'
          : 'Payment detected in mempool'
      case 'CONFIRMED':
        return msg.includes('Lightning')
          ? 'Lightning payment confirmed'
          : 'Payment confirmed on the blockchain'
      default:
        return msg
    }
  }

  const [isTestMode, setIsTestMode] = useState(false)
  const walletsToShow = isTestMode ? MOCK_WALLETS : WALLETS
  const [selectedWallet, setSelectedWallet] = useState<(typeof WALLETS)[0] | null>(null)
  const [copied, setCopied] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [status, setStatus] = useState<PaymentStatus>('WAITING')
  const [statusMessage, setStatusMessage] = useState('')
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [cryptoRate, setCryptoRate] = useState<{
    usdPerCrypto: number
    mxnPerUsd: number
  } | null>(null)
  const [rateLoading, setRateLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const confirmedRef = useRef(false)

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  // Tipo de cambio de los últimos ~3 minutos (precio público, sin API key).
  // Convierte el monto del carrito (MXN) al equivalente aproximado en la
  // cripto seleccionada, para que el usuario sepa cuánto debe enviar.
  const fetchCryptoRate = useCallback(async (symbol: 'BTC' | 'ETH') => {
    setRateLoading(true)
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 4000)
      const [cResp, fResp] = await Promise.all([
        fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${
            symbol === 'BTC' ? 'bitcoin' : 'ethereum'
          }&vs_currencies=usd`,
          { signal: ctrl.signal }
        ),
        fetch('https://api.exchangerate.host/latest?base=USD&symbols=MXN', {
          signal: ctrl.signal,
        }),
      ])
      clearTimeout(timer)
      const cData = await cResp.json()
      const fData = await fResp.json()
      const usdPerCrypto = cData[symbol === 'BTC' ? 'bitcoin' : 'ethereum']?.usd
      const mxnPerUsd = fData.rates?.MXN
      if (typeof usdPerCrypto === 'number' && typeof mxnPerUsd === 'number') {
        setCryptoRate({ usdPerCrypto, mxnPerUsd })
      }
    } catch {
      // Tipo de cambio no disponible: se sigue mostrando el monto en MXN.
      setCryptoRate(null)
    } finally {
      setRateLoading(false)
    }
  }, [])

  useEffect(() => {
    return stopPolling
  }, [stopPolling])

  useEffect(() => {
    if (open) {
      setSelectedWallet(null)
      setTxHash('')
      setStatus('WAITING')
      setStatusMessage('')
      confirmedRef.current = false
      setShowQrScanner(false)
      stopPolling()
    }
  }, [open, stopPolling])

  const startPolling = useCallback(
    (wallet: (typeof WALLETS)[0], reference: string) => {
      stopPolling()
      const check = async () => {
        const result = await verifyPaymentOnce({
          network: wallet.network,
          address: wallet.network === 'LIGHTNING' ? undefined : wallet.address,
          txHash:
            reference.trim().toLowerCase().startsWith('0x') ||
            reference.toLowerCase().includes('mock')
              ? reference
              : undefined,
          invoice: wallet.network === 'LIGHTNING' ? reference : undefined,
        })
        setStatus(result.status)
        setStatusMessage(result.message)
        if (result.status === 'CONFIRMED' && !confirmedRef.current) {
          confirmedRef.current = true
          stopPolling()
          // El servidor vuelve a verificar el pago y guarda la reserva. Solo
          // si eso sale bien se cierra el modal; si falla, se muestra el error
          // aquí mismo para que el usuario no crea que ya tiene ticket.
          setTimeout(async () => {
            try {
              await onConfirmed(reference, wallet.network)
            } catch (error: any) {
              confirmedRef.current = false
              setStatus('ERROR')
              setStatusMessage(
                error?.message ||
                  (isEs
                    ? 'No pudimos guardar tu reserva. Intenta de nuevo.'
                    : 'We could not save your booking. Please try again.')
              )
            }
          }, 800)
        }
      }
      void check()
      pollRef.current = setInterval(check, 5000)
    },
    [onConfirmed, stopPolling, isEs]
  )

  const handleReferenceSubmit = () => {
    if (!selectedWallet || !txHash.trim()) return
    startPolling(selectedWallet, txHash.trim())
  }

  const handleMockFill = () => {
    const mockHash =
      selectedWallet?.network === 'LIGHTNING'
        ? 'lnbc1mock_calpulli_test'
        : 'mock_0x' + 'a'.repeat(64).slice(0, 64)
    setTxHash(mockHash)
    setTimeout(() => {
      if (selectedWallet) startPolling(selectedWallet, mockHash)
    }, 100)
  }

  const copyAddress = async () => {
    if (!selectedWallet) return
    try {
      await navigator.clipboard.writeText(selectedWallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      void 0
    }
  }

  const handleQrScanned = (raw: string) => {
    // Si el QR trae una URL tipo ethereum:0x... o solo la dirección/hash, lo limpiamos
    let cleaned = raw.trim()
    if (cleaned.includes(':')) {
      const parts = cleaned.split(':')
      cleaned = parts[parts.length - 1].split('?')[0].split('/').pop() || cleaned
    }
    setTxHash(cleaned)
    setShowQrScanner(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      // Intenta con BarcodeDetector sobre imagen
      if ('BarcodeDetector' in window) {
        const bitmap = await createImageBitmap(file)
        const detector = new (window as any).BarcodeDetector({ formats: ['qr_code'] })
        const codes = await detector.detect(bitmap)
        if (codes.length > 0) {
          handleQrScanned(codes[0].rawValue)
          return
        }
      }
      // Fallback: usa zxing para imagen
      const { BrowserMultiFormatReader } = await import('@zxing/browser')
      const reader = new BrowserMultiFormatReader()
      const imgUrl = URL.createObjectURL(file)
      const img = new Image()
      img.src = imgUrl
      await new Promise<void>((res, rej) => {
        img.onload = () => res()
        img.onerror = () => rej()
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      // zxing puede leer desde canvas via decodeFromCanvas si está disponible, sino intenta con detector
      URL.revokeObjectURL(imgUrl)
      // Si no se pudo, avisa
      setStatusMessage(isEs ? 'No se pudo leer el QR de la imagen' : 'Could not read QR from image')
    } catch {
      setStatusMessage(isEs ? 'Error al leer QR' : 'Error reading QR')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white/95 px-6 py-4 backdrop-blur dark:border-white/10 dark:bg-zinc-900/95">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-orange-500">
                  {L.eyebrow}
                </p>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  ${amount.toLocaleString()} MXN
                </h3>
                {selectedWallet && cryptoRate && !rateLoading && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-gray-400">
                    ≈ {(amount / cryptoRate.usdPerCrypto).toFixed(6)}{' '}
                    {selectedWallet.network === 'LIGHTNING' ? 'BTC' : 'ETH'}·
                    {'tipo de cambio últimos 3 min'}
                  </p>
                )}
                {rateLoading && (
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
                    Obteniendo tipo de cambio…
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-6">
              {!selectedWallet ? (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-zinc-600 dark:text-gray-400">{L.chooseNetwork}</p>
                    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                      <input
                        type="checkbox"
                        checked={isTestMode}
                        onChange={(e) => setIsTestMode(e.target.checked)}
                        className="h-3 w-3 accent-amber-500"
                      />
                      <FlaskConical className="h-3.5 w-3.5" />
                      {L.testToggle}
                    </label>
                  </div>
                  {isTestMode && (
                    <p className="rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-300">
                      {L.testHint}
                    </p>
                  )}
                  <div className="grid gap-3">
                    {walletsToShow.map((wallet) => (
                      <button
                        key={`${wallet.network}-${wallet.label}`}
                        type="button"
                        onClick={() => {
                          setSelectedWallet(wallet)
                          void fetchCryptoRate(wallet.network === 'LIGHTNING' ? 'BTC' : 'ETH')
                        }}
                        className="flex items-center gap-4 rounded-xl border border-zinc-200 p-4 text-left transition-all hover:border-orange-500/50 hover:bg-orange-500/5 dark:border-white/10 dark:hover:border-orange-500/40"
                      >
                        <span className="text-2xl">{wallet.icon}</span>
                        <div className="flex-1">
                          <p className="flex items-center gap-2 font-bold text-zinc-900 dark:text-white">
                            {wallet.label}
                            {isTestMode && (
                              <span className="rounded bg-amber-500 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-widest text-white">
                                {L.mockBadge}
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-zinc-500">{wallet.hint}</p>
                          <p className="mt-1 break-all font-mono text-[10px] text-zinc-400">
                            {wallet.address.slice(0, 20)}…
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-2xl border border-zinc-200 p-5 text-center dark:border-white/10">
                    <p className="mb-3 text-xs font-bold uppercase tracking-widest text-zinc-400">
                      {L.scanAndPay(selectedWallet.label)}
                    </p>
                    {isTestMode && (
                      <span className="mb-2 inline-block rounded bg-amber-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        {L.mockBadge} TESTNET
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                        selectedWallet.address
                      )}`}
                      alt={`QR ${selectedWallet.label}`}
                      className="mx-auto h-52 w-52 rounded-xl bg-white p-2"
                    />
                    <p className="mt-3 break-all font-mono text-xs text-zinc-600 dark:text-gray-300">
                      {selectedWallet.address}
                    </p>
                    <div className="mt-3 flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/40 px-3 py-1.5 text-xs font-bold text-orange-600 transition-colors hover:bg-orange-500/10 dark:text-orange-400"
                      >
                        {copied ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                        {copied ? L.copied : L.copyAddress}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const a = document.createElement('a')
                          a.href = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
                            selectedWallet.address
                          )}`
                          a.download = `calpulli-${selectedWallet.network}-qr.png`
                          a.click()
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-bold text-zinc-600 hover:bg-zinc-50 dark:border-white/15 dark:text-zinc-300"
                      >
                        QR PNG
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-zinc-700 dark:text-gray-300">
                      {L.referenceLabel}
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={txHash}
                        onChange={(e) => setTxHash(e.target.value)}
                        placeholder="0x… / nombre.eth / lnbc…"
                        className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500 dark:border-white/20 dark:bg-white/5 dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleReferenceSubmit}
                        disabled={!txHash.trim() || status === 'CONFIRMED'}
                        className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600 disabled:opacity-50"
                      >
                        Verificar
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setShowQrScanner((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        <ScanLine className="h-3.5 w-3.5" />
                        {L.scanQr}
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-white/15 dark:bg-zinc-900 dark:text-zinc-300"
                      >
                        <Upload className="h-3.5 w-3.5" />
                        {L.uploadQr}
                      </button>
                      {isTestMode && (
                        <button
                          type="button"
                          onClick={handleMockFill}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600"
                        >
                          <FlaskConical className="h-3.5 w-3.5" />
                          {L.mockBtn}
                        </button>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </div>
                    {showQrScanner && (
                      <div className="mt-3">
                        <AnyQrScanner
                          onScan={handleQrScanned}
                          onClose={() => setShowQrScanner(false)}
                        />
                      </div>
                    )}
                  </div>

                  {(statusMessage || status !== 'WAITING') && (
                    <div
                      className="flex items-center gap-3 rounded-xl border px-4 py-3"
                      style={{
                        borderColor: `${STATUS_STYLES[status].color}55`,
                        backgroundColor: `${STATUS_STYLES[status].color}11`,
                      }}
                    >
                      {status === 'WAITING' && (
                        <div
                          className="h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                          style={{
                            borderColor: STATUS_STYLES[status].color,
                            borderTopColor: 'transparent',
                          }}
                        />
                      )}
                      {status === 'DETECTED' && (
                        <Wallet
                          className="h-4 w-4"
                          style={{ color: STATUS_STYLES[status].color }}
                        />
                      )}
                      {status === 'CONFIRMED' && <Check className="h-5 w-5 text-emerald-500" />}
                      <div>
                        <p
                          className="text-sm font-bold"
                          style={{ color: STATUS_STYLES[status].color }}
                        >
                          {isEs ? STATUS_STYLES[status].labelEs : STATUS_STYLES[status].labelEn}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-gray-400">
                          {statusMessageLocalized(statusMessage)}
                        </p>
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedWallet(null)
                      stopPolling()
                      setStatus('WAITING')
                      setStatusMessage('')
                      setShowQrScanner(false)
                    }}
                    className="text-xs font-medium text-zinc-400 hover:text-zinc-600 hover:underline dark:hover:text-gray-300"
                  >
                    {L.changeNetwork}
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default CryptoPayment
