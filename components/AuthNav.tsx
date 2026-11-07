'use client'

import { useAuth } from '@/lib/hooks/useAuth'
import Link from '@/components/Link'
import { useLanguage } from '@/lib/hooks/useLanguage'

export default function AuthNav() {
  const { user, logout, isLoading } = useAuth()
  const { t } = useLanguage()

  if (isLoading) {
    return <div className="flex items-center gap-4" />
  }

  if (user) {
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
          className="text-sm font-semibold text-orange-500 transition-colors hover:text-orange-400"
        >
          Mi Cuenta
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="text-sm text-red-500 hover:text-red-400"
        >
          Cerrar sesión
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Link
        href="/register"
        className="group relative inline-flex overflow-hidden rounded-full border border-orange-500 px-3 py-1.5 text-sm font-semibold text-orange-500 transition-colors duration-300 hover:bg-orange-50 hover:text-orange-600 sm:px-4"
      >
        <span className="absolute inset-0 scale-0 rounded-full bg-current opacity-10 transition-transform duration-300 group-hover:scale-100" />
        <span className="relative">Iniciar sesión</span>
      </Link>
    </div>
  )
}
