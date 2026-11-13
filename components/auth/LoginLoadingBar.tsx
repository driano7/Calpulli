'use client'

// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Barra de progreso de inicio de sesión, al estilo de XocoCafé pero en el
// color de marca (rosa) en lugar de verde.
import { motion } from 'framer-motion'

export function LoginLoadingBar({ label, message }: { label: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center px-8"
    >
      <div className="text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-sm font-semibold text-zinc-900 dark:text-white"
        >
          {label}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mt-1 text-xs text-zinc-500 dark:text-zinc-400"
        >
          {message}
        </motion.p>
      </div>

      <div className="mt-6 flex justify-center px-8">
        <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            transition={{ duration: 1.5, ease: 'linear', repeat: Infinity, repeatType: 'reverse' }}
            className="h-full w-full bg-gradient-to-r from-[#E4007C] to-[#7B2BD9]"
          />
        </div>
      </div>
    </motion.div>
  )
}

/** Variante para cuando el registro termina bien. */
export function RegisterLoadingBar({ label, message }: { label: string; message: string }) {
  return <LoginLoadingBar label={label} message={message} />
}
