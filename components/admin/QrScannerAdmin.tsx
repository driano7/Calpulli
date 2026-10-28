'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Escáner de QR para administradores: lee el código de un ticket desde la cámara
// y lo devuelve vía callback. Usa @zxing/browser (ya instalado en el proyecto).

import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { X, Camera, QrCode, Phone, AlertCircle } from 'lucide-react'

const IS_ES = typeof navigator !== 'undefined' && (navigator.language || '').startsWith('es')

interface QrScannerAdminProps {
  open: boolean
  onClose: () => void
  onScan: (code: string) => void
}

/**
 * Componente cliente: solo se monta cuando el admin abre el escáner.
 * @zxing/browser se importa bajo demanda para no afectar el SSR ni el bundle
 * de páginas que no lo usan.
 */
export function QrScannerAdmin({ open, onClose, onScan }: QrScannerAdminProps) {
  const [isSupported, setIsSupported] = useState(false)
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceId, setDeviceId] = useState<string>('')
  const [cameras, setCameras] = useState<{ deviceId: string; label: string }[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<any>(null)
  const mountedRef = useRef(false)

  const stop = useCallback(() => {
    if (readerRef.current && typeof readerRef.current.stop === 'function') {
      try {
        readerRef.current.stop()
      } catch {
        /* ignore */
      }
    }
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream | null
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
      videoRef.current.srcObject = null
    }
    setIsScanning(false)
    setError(null)
  }, [])

  useEffect(() => {
    if (!open) {
      stop()
      return
    }
    mountedRef.current = true
    // Importar @zxing/browser solo en cliente y solo cuando se abre el escáner.
    ;(async () => {
      try {
        const { BrowserQRCodeReader } = await import('@zxing/browser')
        setIsSupported(true)
        readerRef.current = new BrowserQRCodeReader()

        const devices = await readerRef.current.getVideoInputDevices()
        setCameras(
          devices.map((d: any) => ({
            deviceId: d.deviceId || '',
            label: d.label || 'Cámara',
          }))
        )
        if (devices.length > 0) {
          setDeviceId(devices[0].deviceId || '')
        }
      } catch (err) {
        setIsSupported(false)
        setError('No se pudo cargar el lector de QR. Usa un navegador con cámara.')
        console.error('ZXing load error:', err)
      }
    })()

    return () => {
      mountedRef.current = false
      stop()
    }
  }, [open, stop])

  const startScanning = useCallback(async () => {
    if (!readerRef.current || !videoRef.current) return
    setError(null)
    setIsScanning(true)
    try {
      await readerRef.current.decodeFromVideoDevice(
        deviceId || undefined,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText()
            if (text && mountedRef.current) {
              stop()
              onScan(text)
            }
          }
          // `error` es normal entre frames mientras se busca el QR; no se muestra.
        }
      )
    } catch (err: any) {
      setIsScanning(false)
      setError(
        err?.message ||
          'No se pudo iniciar la cámara. Concede permiso de cámara y vuelve a intentarlo.'
      )
      console.error('QR scan error:', err)
    }
  }, [deviceId, onScan, stop])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Escanear código QR del ticket"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between rounded-t-2xl bg-orange-500 px-4 py-3 dark:bg-orange-600">
          <h2 className="text-base font-bold text-white">
            <QrCode className="mr-2 h-5 w-5" />
            {IS_ES ? 'Escanear código QR' : 'Scan QR code'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-full bg-white/20 p-2 text-white transition-colors hover:bg-white/30"
            aria-label={IS_ES ? 'Cerrar' : 'Close'}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          {!isSupported && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900/30 dark:bg-amber-900/20">
              <AlertCircle className="mx-auto h-6 w-6 text-amber-600 dark:text-amber-400" />
              <p className="mt-2 text-sm text-amber-700 dark:text-amber-300">
                {IS_ES
                  ? 'Lector de QR no disponible en este navegador.'
                  : 'QR reader not available in this browser.'}
              </p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-center dark:border-red-900/30 dark:bg-red-900/20">
              <AlertCircle className="mx-auto h-6 w-6 text-red-600 dark:text-red-400" />
              <p className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div className="flex min-h-[320px] flex-col items-center justify-center">
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-2xl border-2 border-zinc-200 bg-zinc-900 dark:border-white/10">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="h-full w-full object-cover"
              />
              {!isScanning && !isSupported && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <button
                    onClick={startScanning}
                    className="flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow-lg hover:bg-orange-50"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    {IS_ES ? 'Iniciar cámara' : 'Start camera'}
                  </button>
                </div>
              )}
            </div>

            {cameras.length > 1 && (
              <div className="mt-3 flex gap-2">
                {cameras.map((cam) => (
                  <button
                    key={cam.deviceId}
                    onClick={() => {
                      setDeviceId(cam.deviceId)
                      if (isScanning) {
                        stop()
                        startScanning()
                      }
                    }}
                    className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs transition-colors ${
                      deviceId === cam.deviceId
                        ? 'border-orange-500 bg-orange-500/10 text-orange-600'
                        : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800'
                    }`}
                  >
                    <Phone className="h-3 w-3" />
                    {cam.label}
                  </button>
                ))}
              </div>
            )}

            {isScanning && (
              <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
                {IS_ES
                  ? 'Enfoca el código QR con la cámara...'
                  : 'Point the camera at the QR code...'}
              </p>
            )}
          </div>

          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            {IS_ES
              ? 'Enfoca el código QR de cualquier ticket para abrir su reservación.'
              : 'Point the camera at any ticket QR code to open its booking.'}
          </p>
        </div>

        <div className="rounded-b-2xl border-t border-zinc-100 bg-white/50 px-4 py-3 dark:border-white/10 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            {IS_ES ? 'Cerrar escáner' : 'Close scanner'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
