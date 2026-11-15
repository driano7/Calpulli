'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { CircleUserRound } from 'lucide-react'

export default function AuthNav({ compact = false }) {
  const { user, logout, isLoading } = useAuth()
  const { t } = useLanguage()

  if (isLoading) {
    return <div className="flex items-center gap-4" />
  }

  if (user) {
    if (compact) {
      return (
        <Link
          href="/profile"
          aria-label="Mi Cuenta"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-zinc-500 transition-colors hover:bg-black/5 hover:text-orange-500 dark:bg-transparent dark:text-zinc-300 dark:hover:bg-white/10"
        >
          <CircleUserRound className="h-6 w-6" />
        </Link>
      )
    }
    const displayName = user.firstName?.trim() || user.email
    return (
      <div className="flex items-center gap-3">
        <span className="hidden flex-col items-start sm:flex">
          <span className="text-sm text-gray-600 dark:text-gray-300">Hola, {displayName}</span>
          <Link
            href="/profile?tab=chat"
            className="text-[10px] font-medium text-zinc-400 transition-colors hover:text-orange-500 dark:text-zinc-500"
          >
            Chat guardado en tu cuenta
          </Link>
        </span>
        <Link
          href="/profile"
          className="flex h-10 items-center text-sm font-semibold text-orange-500 transition-colors hover:text-orange-400"
        >
          Mi Cuenta
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="flex h-10 items-center text-sm text-red-500 hover:text-red-400"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  if (compact) {
    return (
      <Link
        href="/register"
        aria-label="Iniciar sesión"
        className="flex h-10 w-10 items-center justify-center rounded-full border border-orange-500 bg-transparent text-orange-500 transition-colors hover:bg-orange-500/10 dark:bg-transparent"
      >
        <CircleUserRound className="h-5 w-5" />
      </Link>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/register"
        className="group relative inline-flex h-10 items-center overflow-hidden rounded-full border border-orange-500 px-4 text-sm font-semibold text-orange-500 transition-colors duration-300 hover:bg-orange-50 hover:text-orange-600"
      >
        <span className="absolute inset-0 scale-0 rounded-full bg-current opacity-10 transition-transform duration-300 group-hover:scale-100" />
        <span className="relative">Iniciar sesión</span>
      </Link>
    </div>
  )
}
