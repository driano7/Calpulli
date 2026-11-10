// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Head from 'next/head'
import Link from '@/components/Link'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/lib/hooks/useAuth'
import { AuthLoader } from '@/components/AuthLoader'
import { CoffeeBackground } from '@/components/CoffeeBackground'
import LayoutWrapper from '@/components/LayoutWrapper'
import {
  Map,
  Compass,
  Search,
  TrendingUp,
  BarChart3,
  Users,
  Target,
  Zap,
  ShieldCheck,
  Eye,
  Layers,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Download,
  FileText,
  Save,
  Heart,
  MessageCircle,
  Check,
} from 'lucide-react'

const STORAGE_KEY = 'calpulli_marketing_map_v1'
const uid = () => Math.random().toString(36).slice(2, 9)
const createEmptyTour = () => ({
  id: uid(),
  name: '',
  duration: '',
  zone: '',
  pricePerPerson: '',
  operatingCostPerPerson: '',
  buyerPersona: { type: '', language: '', desireProblem: '', objection: '' },
  competition: {
    competitor1: { price: '', rating: '', weakness: '' },
    competitor2: { price: '', rating: '', weakness: '' },
    differentiator: '',
  },
  demand: { mainKeyword: '', monthlySearches: '', highSeason: '' },
  funnel: { tofu: '', mofu: '', bofu: '' },
  budget: { total: '', metaAds: '', googleAds: '', partnerships: '' },
  kpis: { maxCpl: '', targetConversion: '', maxCac: '', minRoas: '', targetPassengers: '' },
  goNoGo: { approveIf: '', adjustIf: '' },
})

const NAV_ITEMS = [
  { id: 'comunicacion', label: 'Comunicación' },
  { id: 'journey', label: 'Journey' },
  { id: 'canales', label: 'Canales' },
  { id: 'seo', label: 'SEO' },
  { id: 'embudo', label: 'Embudo' },
  { id: 'kpis', label: 'Métricas' },
  { id: 'plantilla', label: 'Plantilla' },
]

export default function MarketingPage() {
  const { user, isLoading } = useAuth()
  const [role, setRole] = useState(null)
  const [checkingRole, setCheckingRole] = useState(true)
  const [activeSection, setActiveSection] = useState('comunicacion')
  const [tours, setTours] = useState([])
  const [activeTourId, setActiveTourId] = useState(null)
  const [saveStatus, setSaveStatus] = useState('')
  const saveTimeoutRef = useRef(null)
  const activeTour = useMemo(
    () => tours.find((t) => t.id === activeTourId) || null,
    [tours, activeTourId]
  )

  useEffect(() => {
    if (isLoading) return
    if (!user?.email) {
      setRole('client')
      setCheckingRole(false)
      return
    }
    const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
    fetch('/api/admin/me', {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-demo-email': user.email,
      },
    })
      .then((r) => r.json())
      .then((d) => setRole(d?.success && d?.data?.role ? d.data.role : 'client'))
      .catch(() => setRole('client'))
      .finally(() => setCheckingRole(false))
  }, [user, isLoading])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.tours?.length > 0) {
          setTours(parsed.tours)
          setActiveTourId(parsed.tours[0].id)
          return
        }
      }
    } catch (e) {
      void e
    }
    const first = createEmptyTour()
    first.name = 'Tour de tacos de madrugada'
    setTours([first])
    setActiveTourId(first.id)
  }, [])

  const persist = useCallback((nextTours) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, tours: nextTours }))
      setSaveStatus('Guardado')
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = setTimeout(() => setSaveStatus(''), 2000)
    } catch (e) {
      void e
    }
  }, [])
  useEffect(() => {
    if (tours.length === 0) return
    const t = setTimeout(() => persist(tours), 600)
    return () => clearTimeout(t)
  }, [tours, persist])
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id)
        }),
      { rootMargin: '-20% 0px -60% 0px', threshold: 0.1 }
    )
    NAV_ITEMS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const updateTour = useCallback(
    (updater) => setTours((prev) => prev.map((t) => (t.id === activeTourId ? updater(t) : t))),
    [activeTourId]
  )
  const addTour = () => {
    const nt = createEmptyTour()
    nt.name = `Tour #${tours.length + 1}`
    setTours((p) => [...p, nt])
    setActiveTourId(nt.id)
  }
  const duplicateTour = () => {
    if (!activeTour) return
    const copy = {
      ...JSON.parse(JSON.stringify(activeTour)),
      id: uid(),
      name: `${activeTour.name} (copia)`,
    }
    setTours((p) => [...p, copy])
    setActiveTourId(copy.id)
  }
  const deleteTour = () => {
    if (!activeTour) return
    if (!window.confirm(`¿Eliminar "${activeTour.name || 'Tour sin nombre'}"?`)) return
    const rem = tours.filter((t) => t.id !== activeTourId)
    if (rem.length === 0) {
      const nt = createEmptyTour()
      setTours([nt])
      setActiveTourId(nt.id)
    } else {
      setTours(rem)
      setActiveTourId(rem[0].id)
    }
  }
  const exportJSON = () => {
    if (!activeTour) return
    const blob = new Blob([JSON.stringify(activeTour, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calpulli-marketing-${(activeTour.name || 'tour')
      .replace(/\s+/g, '-')
      .toLowerCase()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  const exportTXT = () => {
    if (!activeTour) return
    const t = activeTour
    const txt = `CALPULLI MAPA DE MARKETING\nTOUR ${t.name}\nTOFU ${t.funnel.tofu}\nMOFU ${t.funnel.mofu}\nBOFU ${t.funnel.bofu}`
    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `calpulli-marketing-${(t.name || 'tour').replace(/\s+/g, '-').toLowerCase()}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading || checkingRole) return <AuthLoader label="Cargando Mapa de Marketing..." />
  if (role !== 'admin') {
    return (
      <CoffeeBackground className="flex min-h-screen flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md text-center"
        >
          <ShieldCheck className="mx-auto h-16 w-16 text-pink-500" />
          <h1 className="mt-4 text-3xl font-bold text-zinc-900 dark:text-white">
            Acceso restringido
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-gray-400">
            Solo socios — <span className="font-mono text-pink-600">{user?.email || '—'}</span>
          </p>
          <Link
            href="/profile"
            className="mt-6 inline-flex rounded-xl bg-pink-600 px-6 py-3 font-semibold text-white"
          >
            Volver a mi perfil →
          </Link>
        </motion.div>
      </CoffeeBackground>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      <Head>
        <title>Mapa de Marketing | Calpulli CDMX</title>
        <meta
          name="description"
          content="Guía visual de comunicación y marketing — qué decir, cuándo y por qué canal, de TOFU a BOFU y post-venta."
        />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="border-b border-zinc-200/50 bg-white/70 backdrop-blur-md dark:border-white/10 dark:bg-black/40">
        <div className="container mx-auto px-4 py-14 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-4xl text-center"
          >
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-pink-500/20 bg-pink-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-pink-600 dark:text-pink-400">
              <Compass className="h-3.5 w-3.5" /> Mapa de Marketing
            </div>
            <h1 className="font-serif text-4xl font-black tracking-tight text-zinc-900 dark:text-white md:text-6xl">
              ¿Dónde está tu cliente?
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm uppercase tracking-widest text-zinc-500">
              Descubrir → Considerar → Reservar
            </p>
            <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 gap-4">
              {[
                { k: 'TOFU', d: 'Descubrir', sub: 'Mira esto' },
                { k: 'MOFU', d: 'Considerar', sub: 'Esto vas a vivir' },
                { k: 'BOFU', d: 'Reservar', sub: 'Hay lugar. Reserva.' },
              ].map((s) => (
                <div
                  key={s.k}
                  className="rounded-2xl border border-pink-500/20 bg-pink-500/5 p-4 text-center dark:border-pink-500/20"
                >
                  <p className="text-xs font-black uppercase tracking-widest text-pink-600">
                    {s.k}
                  </p>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white">{s.d}</p>
                  <p className="text-xs italic text-zinc-500">“{s.sub}”</p>
                </div>
              ))}
            </div>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-gray-300">
              No le hablamos igual a alguien que acaba de descubrir Calpulli CDMX que a alguien que
              ya está listo para reservar. Este mapa explica{' '}
              <strong>qué decir, por qué canal y qué queremos que haga después</strong> en cada
              momento.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto flex flex-col gap-8 px-4 py-8 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-24 lg:w-56 lg:shrink-0">
          <div className="hidden lg:block">
            <nav className="space-y-1 rounded-2xl border border-zinc-200 bg-white/80 p-3 backdrop-blur dark:border-white/10 dark:bg-zinc-900/50">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
                    activeSection === item.id
                      ? 'bg-pink-600 text-white shadow-md'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-gray-400'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      activeSection === item.id ? 'bg-white' : 'bg-pink-500/50'
                    }`}
                  />
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-3 flex items-center gap-2 text-xs text-zinc-400">
              <Save className="h-3.5 w-3.5" />
              {saveStatus || 'Guardado localmente'}
            </div>
          </div>
          <div className="lg:hidden">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.id}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' })
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${
                    activeSection === item.id
                      ? 'bg-pink-600 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800'
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 space-y-16">
          <section id="comunicacion" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Matriz de comunicación
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-gray-300">
              Qué decimos según la etapa mental.
            </p>
            <div className="mt-6 overflow-x-auto rounded-xl border dark:border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-3 py-2">Etapa</th>
                    <th className="px-3 py-2">Estado mental</th>
                    <th className="px-3 py-2">Objetivo</th>
                    <th className="px-3 py-2">Contenido</th>
                    <th className="px-3 py-2">Mensaje</th>
                    <th className="px-3 py-2">CTA</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/10">
                  <tr>
                    <td className="px-3 py-2 font-bold">TOFU</td>
                    <td className="px-3 py-2">Descubrir</td>
                    <td className="px-3 py-2">Generar deseo</td>
                    <td className="px-3 py-2">Reels, videos</td>
                    <td className="px-3 py-2">“Mira esto”</td>
                    <td className="px-3 py-2">Descubrir</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-bold">MOFU</td>
                    <td className="px-3 py-2">Evaluar</td>
                    <td className="px-3 py-2">Generar confianza</td>
                    <td className="px-3 py-2">Itinerario, FAQ</td>
                    <td className="px-3 py-2">“Esto es lo que vivirás”</td>
                    <td className="px-3 py-2">Conocer</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-bold">BOFU</td>
                    <td className="px-3 py-2">Decidir</td>
                    <td className="px-3 py-2">Eliminar fricción</td>
                    <td className="px-3 py-2">Disponibilidad, precio</td>
                    <td className="px-3 py-2">“Reserva ahora”</td>
                    <td className="px-3 py-2">Reservar</td>
                  </tr>
                  <tr>
                    <td className="px-3 py-2 font-bold">POST</td>
                    <td className="px-3 py-2">Recordar</td>
                    <td className="px-3 py-2">Fidelizar</td>
                    <td className="px-3 py-2">Reseña, UGC</td>
                    <td className="px-3 py-2">“Cuéntanos cómo fue”</td>
                    <td className="px-3 py-2">Compartir</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-8 rounded-2xl border border-pink-500/20 bg-pink-500/5 p-6 dark:border-pink-500/20">
              <h3 className="font-bold text-zinc-900 dark:text-white">¿Qué decimos?</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div>
                  <p className="text-xs font-bold uppercase text-pink-600">TOFU</p>
                  <p className="text-xs line-through">Compra nuestro tour.</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    Descubre la Ciudad de México cuando la mayoría todavía está dormida.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-pink-600">MOFU</p>
                  <p className="text-xs line-through">Somos el mejor tour.</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    4 taquerías, transporte nocturno y un guía local que conoce dónde empieza la
                    noche.
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase text-pink-600">BOFU</p>
                  <p className="text-xs line-through">Conoce nuestro tour.</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    Quedan 3 lugares para este viernes. Reserva por WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="journey" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Customer Journey + Funnel
            </h2>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border bg-white p-5 dark:bg-zinc-900/50">
                <h3 className="font-bold text-pink-600">Customer Journey</h3>
                <p className="mt-2 font-mono text-xs">
                  SOÑAR → PLANIFICAR → RESERVAR → EXPERIMENTAR → COMPARTIR
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  SOÑAR≈TOFU, PLANIFICAR≈TOFU/MOFU, RESERVAR≈BOFU, EXPERIMENTAR≈POST, COMPARTIR≈POST
                  que genera nuevo TOFU
                </p>
              </div>
              <div className="rounded-2xl border bg-white p-5 dark:bg-zinc-900/50">
                <h3 className="font-bold text-pink-600">Ciclo completo</h3>
                <p className="mt-2 font-mono text-xs">
                  TOFU → MOFU → BOFU → EXPERIENCIA → RESEÑA → UGC → RECOMENDACIÓN → NUEVO TOFU
                </p>
                <p className="mt-2 text-xs text-zinc-500">
                  La experiencia genera contenido para el siguiente cliente.
                </p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">TOFU — Inspirar</p>
                <p className="text-xs">
                  Reels, TikTok, fotos, curiosidades CDMX. Objetivo: generar deseo.
                </p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">MOFU — Convencer</p>
                <p className="text-xs">
                  Itinerarios, FAQs, testimonios, fotos reales. Objetivo: reducir incertidumbre.
                </p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">BOFU — Convertir</p>
                <p className="text-xs">
                  Precio, disponibilidad, cupos, WhatsApp, checkout. Objetivo: eliminar fricción.
                </p>
              </div>
            </div>
          </section>

          <section id="canales" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Canales según etapa
            </h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">TOFU</p>
                <p className="text-xs">TikTok / Instagram / YouTube — descubrimiento</p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">MOFU</p>
                <p className="text-xs">
                  Web / SEO / Google Maps / Email / WhatsApp — consideración
                </p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">BOFU</p>
                <p className="text-xs">WhatsApp / Web / Checkout / Retargeting — conversión</p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">POST-VENTA</p>
                <p className="text-xs">
                  WhatsApp / Email / Instagram / Google Reviews — retención + social proof
                </p>
              </div>
            </div>
            <div className="mt-4 rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
              <p className="text-sm font-bold">Retargeting como puente</p>
              <p className="font-mono text-xs">
                REEL → VISITA WEB → NO COMPRA → RETARGETING → TESTIMONIOS → WHATSAPP → RESERVA
              </p>
            </div>
          </section>

          <section id="seo" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              SEO como parte del sistema
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-gray-300">
              SEO captura demanda existente. Informativa (“qué hacer en CDMX de noche” → TOFU),
              Comercial (“mejores tours nocturnos CDMX” → MOFU), Transaccional (“reservar tour tacos
              CDMX” → BOFU).
            </p>
            <div className="mt-4 overflow-x-auto rounded-xl border dark:border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-900">
                  <tr>
                    <th className="px-4 py-2">Elemento</th>
                    <th className="px-4 py-2">Qué poner</th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-white/10">
                  <tr>
                    <td className="px-4 py-2 font-medium">URL</td>
                    <td className="px-4 py-2">tusitio.com/tours/amanecer-xochimilco-cdmx</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Título SEO</td>
                    <td className="px-4 py-2">Tour Amanecer en Xochimilco (3h) | Calpulli CDMX</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">H1</td>
                    <td className="px-4 py-2">
                      Tour Amanecer en Xochimilco: Experiencia Tradicional de 3 Horas
                    </td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 font-medium">Schema</td>
                    <td className="px-4 py-2">Tour: precio, duración, calificación</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section id="embudo" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">Embudo visual</h2>
            <div className="mt-4 flex flex-col items-center gap-2">
              <div className="w-full max-w-md rounded-2xl bg-sky-500 p-4 text-center text-white">
                TOFU — Descubrimiento
              </div>
              <div className="h-4 w-0.5 bg-pink-300" />
              <div className="w-full max-w-md rounded-2xl bg-amber-500 p-4 text-center text-white">
                MOFU — Consideración
              </div>
              <div className="h-4 w-0.5 bg-pink-300" />
              <div className="w-full max-w-md rounded-2xl bg-emerald-500 p-4 text-center text-white">
                BOFU — Decisión
              </div>
              <div className="h-4 w-0.5 bg-pink-300" />
              <div className="w-full max-w-md rounded-2xl bg-pink-600 p-4 text-center text-white">
                POST-VENTA — Reseña / Recompra
              </div>
            </div>
          </section>

          <section id="kpis" className="scroll-mt-24">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
              Métricas por etapa
            </h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">TOFU</p>
                <p className="text-xs">alcance, reproducciones, retención, guardados, shares</p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">MOFU</p>
                <p className="text-xs">visitas, tiempo en página, clics, WhatsApp, leads</p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">BOFU</p>
                <p className="text-xs">conversión, CAC, ROAS, reservas</p>
              </div>
              <div className="rounded-xl border bg-white p-4 dark:bg-zinc-900/50">
                <p className="font-bold">POST</p>
                <p className="text-xs">reseñas, rating, recompra, LTV, referidos</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border-2 border-pink-500 bg-pink-600 p-6 text-center text-white">
              <p className="font-black">LTV ≥ 3 × CAC</p>
              <p className="text-xs">
                Ejemplo: inversión $4,000, 80 leads, 16 compradores, $850 p/p, CPL $50, CAC $250,
                ROAS 3.4, LTV $1,062 (4.25:1)
              </p>
            </div>
          </section>

          <section id="plantilla" className="scroll-mt-24">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-pink-600 text-white">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-white">
                  Aplicar el mapa a un tour
                </h2>
                <p className="text-xs text-zinc-500">
                  Herramienta secundaria — usa lo aprendido para evaluar una experiencia nueva.
                </p>
              </div>
              <span className="ml-auto hidden items-center gap-1.5 text-xs font-medium text-emerald-600 sm:flex">
                <Save className="h-3.5 w-3.5" />
                {saveStatus || 'Guardado localmente'}
              </span>
            </div>
            <div className="mb-6 rounded-2xl border bg-white p-3 dark:bg-zinc-900/50">
              <div className="flex flex-wrap items-center gap-2">
                {tours.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTourId(t.id)}
                    className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                      activeTourId === t.id
                        ? 'bg-pink-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  >
                    {t.name || 'Tour sin nombre'}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={addTour}
                  className="rounded-full border border-pink-500/30 bg-pink-500/10 px-4 py-1.5 text-sm font-semibold text-pink-600"
                >
                  <Plus className="h-4 w-4" /> Nuevo tour
                </button>
              </div>
              {activeTour && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={duplicateTour}
                    className="rounded-lg border px-3 py-1.5 text-xs"
                  >
                    Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={deleteTour}
                    className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs text-red-600"
                  >
                    Eliminar
                  </button>
                  <button
                    type="button"
                    onClick={exportJSON}
                    className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-white"
                  >
                    Exportar JSON
                  </button>
                  <button
                    type="button"
                    onClick={exportTXT}
                    className="rounded-lg border px-3 py-1.5 text-xs"
                  >
                    Exportar TXT
                  </button>
                </div>
              )}
            </div>
            {activeTour ? (
              <TourForm
                tour={activeTour}
                updateTour={(updater) =>
                  setTours((p) => p.map((t) => (t.id === activeTourId ? updater(t) : t)))
                }
              />
            ) : (
              <p>Crea un tour</p>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function TourForm({ tour, updateTour }) {
  const u = (path, value) => {
    const keys = path.split('.')
    updateTour((prev) => {
      const copy = JSON.parse(JSON.stringify(prev))
      let cur = copy
      for (let i = 0; i < keys.length - 1; i++) cur = cur[keys[i]]
      cur[keys[keys.length - 1]] = value
      return copy
    })
  }
  return (
    <div className="space-y-4">
      <Field label="Nombre" value={tour.name} onChange={(v) => u('name', v)} />
      <Field label="Duración" value={tour.duration} onChange={(v) => u('duration', v)} />
      <Field label="Zona" value={tour.zone} onChange={(v) => u('zone', v)} />
      <Field
        label="Precio por persona"
        type="number"
        value={tour.pricePerPerson}
        onChange={(v) => u('pricePerPerson', v)}
      />
      <Field
        label="TOFU — contenido para descubrir"
        value={tour.funnel.tofu}
        onChange={(v) => u('funnel.tofu', v)}
      />
      <Field
        label="MOFU — info para confiar"
        value={tour.funnel.mofu}
        onChange={(v) => u('funnel.mofu', v)}
      />
      <Field
        label="BOFU — mensaje que elimina fricción"
        value={tour.funnel.bofu}
        onChange={(v) => u('funnel.bofu', v)}
      />
      <Field
        label="CPL máximo"
        type="number"
        value={tour.kpis.maxCpl}
        onChange={(v) => u('kpis.maxCpl', v)}
      />
    </div>
  )
}
function Field({ label, value, onChange, placeholder, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-zinc-600 dark:text-gray-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-zinc-900"
      />
    </label>
  )
}
MarketingPage.getLayout = (page) => <LayoutWrapper>{page}</LayoutWrapper>
