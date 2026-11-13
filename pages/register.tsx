'use client'
import React, { useState, type FormEvent } from 'react'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Image from 'next/image'
import { useAuth } from '@/lib/hooks/useAuth'
import { useLanguage } from '@/lib/hooks/useLanguage'
import { AGE_BANDS, GENDERS, MEXICAN_STATES, sortCountries } from '@/lib/demographics'
import { SearchableSelect } from '@/components/SearchableSelect'
import { LoginLoadingBar } from '@/components/auth/LoginLoadingBar'
import { PASSWORD_MIN_LENGTH, PASSWORD_RULES, validatePassword } from '@/lib/password'

export default function Register() {
  const { login } = useAuth()
  const router = useRouter()
  const { t, currentLanguage } = useLanguage()
  const isEs = currentLanguage === 'es'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  // Paso 2: demografía opcional. Solo alimenta métricas agregadas.
  const [step, setStep] = useState<1 | 2>(1)
  // dirección del barrido: 1->2 sale a la izquierda, 2->1 entra desde la izquierda
  const [dir, setDir] = useState(1)
  const [country, setCountry] = useState('')
  const [state, setState] = useState('')
  const [ageBand, setAgeBand] = useState('')
  const [gender, setGender] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const countryOptions = sortCountries().map((c) => ({
    value: c.code,
    label: isEs ? c.es : c.en,
  }))
  const stateOptions = MEXICAN_STATES.map((s) => ({ value: s.code, label: s.es }))
  const ageOptions = AGE_BANDS.map((b) => ({ value: b.value, label: isEs ? b.es : b.en }))
  const genderOptions = GENDERS.map((g) => ({ value: g.value, label: isEs ? g.es : g.en }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    // Paso 1: validar credenciales y pasar a la demografía opcional.
    if (step === 1) {
      if (email && password && firstName && lastName) {
        const pwError = validatePassword(password)
        if (pwError) {
          setError(pwError)
          return
        }
        if (password !== passwordConfirm) {
          setError(isEs ? 'Las contraseñas no coinciden' : 'Passwords do not match')
          return
        }
        setDir(1)
        setStep(2)
        return
      }
      setError(isEs ? 'Completa todos los campos' : 'Fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      if (email && password && firstName && lastName) {
        const res = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'register',
            email,
            password,
            firstName,
            lastName,
            country: country || undefined,
            state: country === 'MX' && state ? state : undefined,
            ageBand: ageBand || undefined,
            gender: gender || undefined,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          setError(err.message || 'Error creating account')
          setIsLoading(false)
          return
        }

        const json = await res.json()
        localStorage.setItem('authToken', json.token)
        localStorage.setItem('authUser', JSON.stringify(json.user))
        login(json.token, json.user)

        window.dispatchEvent(new Event('authChange'))
        const redirect =
          typeof router.query.redirect === 'string' ? router.query.redirect : '/profile'
        router.push(redirect)
      } else {
        setError(t('auth.signup.fillAll') || 'Por favor completa todos los campos')
        setIsLoading(false)
      }
    } catch (err) {
      setError(t('auth.signup.requestError') || 'Error al crear la cuenta')
      setIsLoading(false)
    }
  }

  const inputClass =
    'w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-zinc-900 placeholder-zinc-400 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:border-white/10 dark:bg-zinc-900 dark:text-white dark:placeholder-gray-500'
  const labelClass = 'mb-1 block text-sm font-medium text-zinc-700 dark:text-gray-300'

  // Igual que en login: la barra sustituye al formulario mientras espera.
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <LoginLoadingBar
          label={isEs ? 'Creando tu cuenta…' : 'Creating your account…'}
          message={
            isEs
              ? 'Ya casi. Te estamos llevando a tu perfil…'
              : 'Almost there. Taking you to your profile…'
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
            {t('auth.signup.title') || 'Crea Tu Cuenta'}
          </h1>
          <p className="text-zinc-500 dark:text-gray-400">
            {step === 1
              ? t('auth.signup.subtitle') || 'Únete a la comunidad de viajeros'
              : isEs
              ? 'Datos opcionales para conocerte mejor'
              : 'Optional details so we can know you better'}
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <AnimatePresence mode="wait" initial={false} custom={dir}>
              <motion.div
                key={step}
                custom={dir}
                initial={{ opacity: 0, x: dir * 48 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: dir * -48 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-5"
              >
                {step === 1 && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="firstName" className={labelClass}>
                          {t('auth.signup.firstName') || 'Nombre'}
                        </label>
                        <input
                          type="text"
                          id="firstName"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          autoComplete="given-name"
                          className={inputClass}
                          placeholder="Juan"
                        />
                      </div>
                      <div>
                        <label htmlFor="lastName" className={labelClass}>
                          {t('auth.signup.lastName') || 'Apellido'}
                        </label>
                        <input
                          type="text"
                          id="lastName"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          autoComplete="family-name"
                          className={inputClass}
                          placeholder="Pérez"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="email" className={labelClass}>
                        {t('auth.signup.email') || 'Email'}
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        className={inputClass}
                        placeholder="tu@email.com"
                      />
                    </div>

                    <div>
                      <label htmlFor="password" className={labelClass}>
                        {t('auth.signup.password') || 'Contraseña'}
                      </label>
                      <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={PASSWORD_MIN_LENGTH}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder="••••••••"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="passwordConfirm" className={labelClass}>
                        {isEs ? 'Confirma tu contraseña' : 'Confirm password'}
                      </label>
                      <input
                        type="password"
                        id="passwordConfirm"
                        value={passwordConfirm}
                        onChange={(e) => setPasswordConfirm(e.target.value)}
                        required
                        minLength={PASSWORD_MIN_LENGTH}
                        autoComplete="new-password"
                        className={inputClass}
                        placeholder="••••••••"
                      />
                      {passwordConfirm.length > 0 && password !== passwordConfirm && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          {isEs ? 'Las contraseñas no coinciden' : 'Passwords do not match'}
                        </p>
                      )}
                    </div>

                    {password.length > 0 && (
                      <ul className="space-y-1" aria-live="polite">
                        {PASSWORD_RULES.map((rule) => {
                          const ok = rule.test(password)
                          return (
                            <li
                              key={rule.id}
                              className={`flex items-center gap-2 text-xs ${
                                ok
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-zinc-500 dark:text-zinc-400'
                              }`}
                            >
                              <span
                                aria-hidden="true"
                                className={`inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                                  ok ? 'bg-emerald-500 text-white' : 'border border-zinc-300'
                                }`}
                              >
                                {ok ? '✓' : ''}
                              </span>
                              {rule.label}
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    <motion.button
                      type="submit"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full rounded-xl bg-orange-500 py-4 font-semibold text-white transition-colors hover:bg-orange-600"
                    >
                      {isEs ? 'Continuar' : 'Continue'}
                    </motion.button>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <label htmlFor="country" className={labelClass}>
                        {t('auth.signup.country') || (isEs ? 'País' : 'Country')}
                        <span className="ml-1 font-normal text-zinc-400">
                          ({isEs ? 'opcional' : 'optional'})
                        </span>
                      </label>
                      <SearchableSelect
                        id="country"
                        value={country}
                        onChange={(next) => {
                          setCountry(next)
                          if (next !== 'MX') setState('')
                        }}
                        options={countryOptions}
                        placeholder={isEs ? 'Escribe para buscar…' : 'Type to search…'}
                        optionalLabel={isEs ? 'Opcional' : 'Optional'}
                      />
                    </div>

                    {country === 'MX' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="overflow-hidden"
                      >
                        <label htmlFor="state" className={labelClass}>
                          {isEs ? 'Estado' : 'State'}
                          <span className="ml-1 font-normal text-zinc-400">
                            ({isEs ? 'opcional' : 'optional'})
                          </span>
                        </label>
                        <SearchableSelect
                          id="state"
                          value={state}
                          onChange={setState}
                          options={stateOptions}
                          placeholder={isEs ? 'Escribe para buscar…' : 'Type to search…'}
                          optionalLabel={isEs ? 'Opcional' : 'Optional'}
                        />
                      </motion.div>
                    )}

                    <div>
                      <label htmlFor="ageBand" className={labelClass}>
                        {isEs ? 'Rango de edad' : 'Age range'}
                        <span className="ml-1 font-normal text-zinc-400">
                          ({isEs ? 'opcional' : 'optional'})
                        </span>
                      </label>
                      <SearchableSelect
                        id="ageBand"
                        value={ageBand}
                        onChange={setAgeBand}
                        options={ageOptions}
                        placeholder={isEs ? 'Escribe para buscar…' : 'Type to search…'}
                        optionalLabel={isEs ? 'Prefiero no decir' : 'Prefer not to say'}
                      />
                    </div>

                    <div>
                      <label htmlFor="gender" className={labelClass}>
                        {isEs ? 'Género' : 'Gender'}
                        <span className="ml-1 font-normal text-zinc-400">
                          ({isEs ? 'opcional' : 'optional'})
                        </span>
                      </label>
                      <SearchableSelect
                        id="gender"
                        value={gender}
                        onChange={setGender}
                        options={genderOptions}
                        placeholder={isEs ? 'Escribe para buscar…' : 'Type to search…'}
                        optionalLabel={isEs ? 'Prefiero no decir' : 'Prefer not to say'}
                      />
                    </div>

                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {isEs
                        ? 'Todo es opcional. Lo usamos solo en conjunto para entender mejor a nuestros visitantes; nunca de forma individual. Si borras tu cuenta, estas estadísticas se conservan sin tu nombre.'
                        : 'Everything is optional. We only use it in aggregate to understand our visitors better, never individually. If you delete your account, these stats are kept without your name.'}
                    </p>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setDir(-1)
                          setStep(1)
                          setError('')
                        }}
                        className="flex-1 rounded-xl border border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-600 transition-colors hover:bg-zinc-50 dark:border-white/10 dark:text-zinc-300 dark:hover:bg-zinc-800"
                      >
                        {isEs ? 'Atrás' : 'Back'}
                      </button>
                      <motion.button
                        type="submit"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="flex-1 rounded-xl bg-orange-500 py-3 font-semibold text-white transition-colors hover:bg-orange-600"
                      >
                        {isEs ? 'Crear Cuenta' : 'Create Account'}
                      </motion.button>
                    </div>

                    <button
                      type="submit"
                      className="w-full text-center text-xs text-zinc-500 underline-offset-2 hover:underline dark:text-zinc-400"
                    >
                      {isEs ? 'Saltar y crear cuenta' : 'Skip and create account'}
                    </button>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Puntos de paso */}
            <div className="flex items-center justify-center gap-2 pt-2" aria-hidden="true">
              {[1, 2].map((n) => (
                <motion.span
                  key={n}
                  animate={{
                    width: step === n ? 26 : 8,
                    backgroundColor: step === n ? '#E4007C' : 'rgba(120,113,108,0.35)',
                  }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  className="h-2 rounded-full"
                />
              ))}
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-zinc-500 dark:text-gray-400">
              {t('auth.signup.haveAccount') || '¿Ya tienes cuenta?'}{' '}
              <Link href="/login" passHref>
                <a className="font-medium text-orange-500 hover:text-orange-400">
                  {t('auth.signup.signIn') || 'Inicia sesión'}
                </a>
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
