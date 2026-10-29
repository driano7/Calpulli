'use client'

import { useEffect, useState, FormEvent } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { LoginLoadingBar } from '@/components/auth/LoginLoadingBar'
import { useLanguage } from '@/lib/hooks/useLanguage'

export default function Login() {
  const { login } = useAuth()
  const { t, currentLanguage, setLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Control de intentos y bloqueo (5 intentos, bloqueo 1 hora)
  const MAX_ATTEMPTS = 5
  const LOCKOUT_MS = 60 * 60 * 1000 // 1 hora

  const getAttempts = () => {
    try {
      return parseInt(localStorage.getItem('login_attempts') || '0', 10)
    } catch {
      return 0
    }
  }

  const getLockedUntil = () => {
    try {
      return parseInt(localStorage.getItem('login_locked_until') || '0', 10)
    } catch {
      return 0
    }
  }

  const [lockedUntil, setLockedUntil] = useState(getLockedUntil)
  const [attempts, setAttempts] = useState(getAttempts)

  const isLocked = lockedUntil > Date.now()
  const remainingSeconds = isLocked
    ? Math.ceil((lockedUntil - Date.now()) / 1000)
    : 0

  const recordFailedAttempt = () => {
    const next = attempts + 1
    setAttempts(next)
    localStorage.setItem('login_attempts', String(next))
    if (next >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_MS
      setLockedUntil(until)
      localStorage.setItem('login_locked_until', String(until))
    }
  }

  const clearAttempts = () => {
    setAttempts(0)
    setLockedUntil(0)
    localStorage.removeItem('login_attempts')
    localStorage.removeItem('login_locked_until')
  }

  const formatCountdown = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()

    if (isLocked) {
      setError(
        isEs
          ? `Cuenta bloqueada por 1 hora. Intenta de nuevo en ${formatCountdown(remainingSeconds)}.`
          : `Account locked for 1 hour. Try again in ${formatCountdown(remainingSeconds)}.`
      )
      return
    }

    setError('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        recordFailedAttempt()
        const remaining = MAX_ATTEMPTS - (attempts + 1)
        setError(
          err.message ||
            (isEs
              ? `Credenciales incorrectas. Te quedan ${remaining} intento(s) antes de que se bloquee la cuenta por 1 hora.`
              : `Invalid credentials. ${remaining} attempt(s) remaining before account is locked for 1 hour.`)
        )
        setIsLoading(false)
        return
      }

      const json = await res.json()
      clearAttempts()
      localStorage.setItem('authToken', json.token)
      localStorage.setItem('authUser', JSON.stringify(json.user))

      window.dispatchEvent(new Event('authChange'))
      router.push('/profile')
    } catch (err) {
      setError('Network error. Please try again.')
      setIsLoading(false)
    }
  }

  // Alta completa (paso 2 demográfico + reglas de password) vive en /register.
  // /login?mode=client|register solo redirige ahí para no tener dos flujos.
  useEffect(() => {
    if (!router.isReady) return
    const q = router.query.mode
    const wanted = Array.isArray(q) ? q[0] : q
    if (wanted === 'client' || wanted === 'register') {
      const redirect =
        typeof router.query.redirect === 'string'
          ? `?redirect=${encodeURIComponent(router.query.redirect)}`
          : ''
      void router.replace(`/register${redirect}`)
    }
  }, [router.isReady, router.query.mode, router.query.redirect, router])

  const toggleMode = () => {
    if (mode === 'login') {
      void router.push('/register')
      return
    }
    setMode('login')
    setError('')
    router.replace({ pathname: '/login', query: {} }, undefined, { shallow: true })
  }

  const inputClass =
    'w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder-gray-500'
  const labelClass = 'mb-1 block text-sm font-medium text-zinc-700 dark:text-gray-300'

  // Mientras autentica mostramos la barra en lugar del formulario: evita el
  // doble clic y deja claro que algo está pasando.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <LoginLoadingBar
          label={isEs ? 'Iniciando sesión…' : 'Signing in…'}
          message={
            isEs
              ? 'Tu sesión está activa. Te estamos redirigiendo…'
              : 'Your session is active. Redirecting…'
          }
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Link href="/" passHref>
            <a className="mb-6 inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full ring-2 ring-orange-500/60">
                <Image
                  src="/static/images/jaguarBaja.png"
                  alt="Calpulli CDMX"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
                Calpulli CDMX
              </span>
            </a>
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-zinc-900 dark:text-white">
            {mode === 'login'
              ? t('auth.login.title') || 'Iniciar sesión'
              : t('auth.signup.title') || 'Crear cuenta'}
          </h1>
          <p className="text-zinc-500 dark:text-gray-400">
            {mode === 'login'
              ? t('auth.login.welcome') || 'Bienvenido de nuevo a Calpulli CDMX'
              : t('auth.login.join') || 'Únete a la comunidad de viajeros'}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white/90 p-8 shadow-xl backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900/50">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 rounded-xl border border-red-500/30 bg-red-500/20 p-4 text-sm text-red-600 dark:text-red-300"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className={labelClass}>
                    {t('auth.login.firstName') || 'Nombre'}
                  </label>
                  <input
                    type="text"
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Juan"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className={labelClass}>
                    {t('auth.login.lastName') || 'Apellido'}
                  </label>
                  <input
                    type="text"
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    className={inputClass}
                    placeholder="Pérez"
                  />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className={labelClass}>
                {t('auth.login.email') || 'Email'}
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="tu@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className={labelClass}>
                {t('auth.login.password') || 'Contraseña'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputClass}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-500 dark:text-zinc-400 dark:hover:text-orange-400"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 8.473m-1.499-5.148a3 3 0 10-1.2 2.152m-5.936 5.936c-.97-.97-1.453-2.289-1.453-3.723a6 6 0 016-6c1.433 0 2.75.47 3.723 1.196m-5.936-5.936a3 3 0 10-2.152 1.2M15.337 5.337c.674-.674 1.45-1.02 2.288-1.02.838 0 1.614.346 2.288 1.02M3.172 6.828c-.465.465-.697 1.082-.697 1.781s.232 1.316.697 1.781l2.464 2.464a1.782 1.782 0 002.523 0L12 11l2.464-2.464a1.782 1.782 0 000-2.523L12 5.997zM21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.482 7.225 7.164 5 12 5c4.837 0 8.518 2.225 9.542 7m-7.084 4.625c4.176 1.391 7.296 4.853 7.996 9.032a9 9 0 01-5.748-9.032zM12 15a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {isLocked && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-center dark:border-amber-900/30 dark:bg-amber-900/20"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span className="font-semibold text-amber-700 dark:text-amber-300">
                    {isEs ? 'Cuenta bloqueada' : 'Account locked'}
                  </span>
                </div>
                <p className="text-sm text-amber-600 dark:text-amber-300">
                  {isEs
                    ? `Demasiados intentos fallidos. Intenta de nuevo en ${formatCountdown(remainingSeconds)}.`
                    : `Too many failed attempts. Try again in ${formatCountdown(remainingSeconds)}.`}
                </p>
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isLocked}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full rounded-xl bg-orange-500 py-4 font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLocked
                ? isEs
                  ? 'Cuenta bloqueada'
                  : 'Account locked'
                : mode === 'login'
                ? t('auth.login.signIn') || 'Iniciar sesión'
                : t('auth.signup.createAccount') || 'Crear cuenta'}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-gray-400">
              {mode === 'login'
                ? t('auth.login.noAccount') || '¿No tienes cuenta?'
                : t('auth.signup.haveAccount') || '¿Ya tienes cuenta?'}{' '}
              <button
                onClick={toggleMode}
                className="font-medium text-orange-500 hover:text-orange-400"
              >
                {mode === 'login'
                  ? t('auth.login.signUp') || 'Regístrate'
                  : t('auth.login.signIn') || 'Inicia sesión'}
              </button>
            </p>
            {mode === 'login' && (
              <p className="mt-3 text-sm text-zinc-500 dark:text-gray-400">
                <Link
                  href="/reset-password"
                  className="font-medium text-orange-500 hover:text-orange-400"
                >
                  {t('auth.login.forgot', '¿Se te olvidó tu contraseña?')}
                </Link>
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
