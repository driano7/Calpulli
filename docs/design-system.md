# Design System de Calpulli — documento vivo

**Estado:** extracción inicial, 2026-11-13. Primera decisión CERRADA el mismo día (rosa oficial, §8.1). **Implementación base hecha el 2026-11-13** (rama `feat/design-system-tokens`): capa de tokens instalada en `styles/design-tokens.css` e importada en `pages/_app.js`, y paleta rosa consolidada a una sola declaración en `tailwind.config.js` — todo aditivo, sin cambiar lo que el sitio renderiza. Sesión de decisiones con Donovan: lunes 16 de noviembre de 2026.
**Método:** extracción desde el código real del repo (`driano7/Calpulli`, worktree `.scratch-privados`), con conteos de uso por grep. Nada de este documento es inventado: cada token aparece en el código hoy, con su conteo. Las preguntas abiertas están al final — no están decididas.

---

## 1. Qué ya existe (auditoría honesta)

No partimos de cero, pero tampoco hay un sistema formal:

- **Sí existe una capa de tokens parcial en `tailwind.config.js`**: paleta de marca (rosa mexicano remapeado sobre `orange`), acentos del moodboard (talavera, cempasúchil, terracota), `grafito` y `hueso`, tipografías (Nunito + Fraunces), extensiones de opacidad y line-height, y el tema del plugin de tipografía (blog). Es lo más parecido a un sistema que hay.
- **Sí existe un sistema de acentos por journey a medio construir**: `lib/journeyTheme.ts` + variables CSS `--j1` / `--j2` que cada journey pone en su contenedor (referenciadas 27+ veces en componentes de journeys). El propio código dice que los acentos "se deciden en conversaciones de diseño" — está pendiente de formalizar.
- **No existía** documento de design system, ni archivo de tokens (CSS/JSON), ni variables CSS globales (`:root` no definía ninguna variable del sistema; los únicos `var(--…)` eran los de journey y variables locales de componente). **Desde el 2026-11-13 existen ambos**: este documento (en `docs/`) y la capa de tokens `styles/design-tokens.css`, importada en `pages/_app.js`. Las variables están instaladas pero **ningún componente las consume todavía**: la migración se hace por decisión, superficie por superficie.
- **El resto es ad hoc**: 132 archivos de componentes; estilos con clases Tailwind mezclados con `style={{…}}` en línea (51 archivos) y bloques styled-jsx (4 archivos). Los valores hardcodeados conviven con las clases del tema.

**Conclusión:** hay sistema de facto, repartido en tres lugares (config de Tailwind, journeyTheme, valores hardcodeados). El trabajo del lunes es consolidarlo, no crearlo desde cero.

---

## 2. Principios (propuesta corta, para validar el lunes)

1. **La identidad ya existe y gusta** ("se ve lindo, me gusta la identidad" — Donovan, 2026-11-12). El sistema documenta lo que hay; no rediseña.
2. **Una sola fuente de verdad por token.** La paleta rosa estaba declarada 3 veces en el config; desde el 2026-11-13 se declara una sola vez (ver §7.3). Cada token vive en un solo lugar.
3. **Lo que se repite 3 veces se vuelve token; lo que aparece 1 vez es excepción local.**
4. **El sistema es reutilizable**: nombres neutros y estructura portable a futuros negocios, sin acoplar a Calpulli más que en la capa de marca.
5. **Documentación primero** (compatible con el congelamiento de features): este documento y el archivo de tokens no cambian el comportamiento del sitio hasta que se apruebe migrar componentes.

---

## 3. Colores — tokens extraídos

Conteos = apariciones del hex hardcodeado en `components/ pages/ layouts/ lib/ css/ app/ hooks/ data/` (fuera del config). Las clases Tailwind del tema se cuentan aparte.

### 3.1 Marca

| Token propuesto             | Valor                                                                                                                                                                        | Evidencia                                                                                                                                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `brand-500` (rosa mexicano) | `#E4007C`                                                                                                                                                                    | Declarado en `tailwind.config.js` como `orange-500` **y** `primary-500` (la clase `orange-*` está remapeada a esta paleta rosa). 43 apariciones hardcodeadas + **528 usos de la clase `orange-500`** y 124 de `orange-600`. Es EL color del sitio.                                                                                             |
| Escala rosa (en config)     | 50 `#FCE6F1` · 100 `#FAC4DE` · 200 `#F591BE` · 300 `#EF5E9F` · 400 `#EA338B` · 500 `#E4007C` · 600 `#C5006A` · 700 `#A30059` · 800 `#820047` · 900 `#660037` · 950 `#431407` | Declarada idéntica bajo tres nombres: `orange`, `primary`, `primary-color` (+ `primary-color-dark`). Desde el 2026-11-13 se declara **una sola vez** en el config (`brandPink`) y los cuatro nombres la referencian — ver §7.3.                                                                                                                |
| `brand-gradient-photo-deck` | `#E4007C → #BE1588 → #9F0E7F → #7B2BD9 → #6A0568`                                                                                                                            | Gradiente de la puerta principal del PhotoDeck — y, con el mismo arranque, de la familia de gradientes de marca (Navbar, HeroSection, layouts, banners). Su arranque era `#DE1D8D` (30 apariciones); desde el 2026-11-13 es el rosa oficial `#E4007C` (§8.1). Los demás stops no cambiaron: la unificación de gradientes sigue abierta (§8.5). |
| `brand-gradient-config`     | `#F20089 → #D100D1 → #A100F2 → #2D00F7`                                                                                                                                      | `gradientColorStops` del config (escala coolors). Distinto al del PhotoDeck — ver decisiones.                                                                                                                                                                                                                                                  |
| Onda de Ocelote (chatbot)   | `#E4007C`                                                                                                                                                                    | El canvas de la onda de voz en `ChatbotAssistant.jsx`. Era `#EC4899` (el `pink-500` de Tailwind); unificado al rosa oficial el 2026-11-13 (§8.1).                                                                                                                                                                                              |

### 3.2 Acentos (moodboard, declarados en config)

| Token                     | Valor                 | Usos hardcodeados                  |
| ------------------------- | --------------------- | ---------------------------------- |
| `talavera-500`            | `#0E8C7A`             | **54** (el hex más usado del repo) |
| `talavera-700`            | `#0A6E60`             | 6                                  |
| `talavera-100` / `50`     | `#C9EBE5` / `#E6F5F2` | en config                          |
| `cempasuchil-500`         | `#F2A03D`             | 26                                 |
| `cempasuchil-400` / `700` | `#F7B45F` / `#D0811F` | en config                          |
| `terracota-500`           | `#C1440E`             | **50**                             |
| `terracota-700`           | `#9A3207`             | en config                          |

### 3.3 El jaguar (logo)

Del SVG a color (`data/jaguarColor.svg`); la versión baja (`jaguarBaja.svg`) es silueta en negro puro `#000000`:

| Token propuesto     | Valor                           | Nota                                                                                                                                  |
| ------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `jaguar-blue`       | `#0E6C84`                       | Azul petróleo oscuro del jaguar a color. Cercano a talavera pero **no es** talavera (`#0E8C7A` es verde-azul; este es azul-petróleo). |
| `jaguar-blue-light` | `#489FB7`                       | Azul claro del mismo SVG.                                                                                                             |
| (apoyo)             | `#090E13`, `#502E38`, `#816A7E` | Sombras/detalles del SVG; no propuestos como tokens del sistema.                                                                      |

### 3.4 Superficies y texto

| Token                                                      | Valor                                         | Evidencia                                                                                                                                                                                                                                         |
| ---------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `surface-light` (`hueso`)                                  | `#FAF3EA`                                     | El config remapea `white` → hueso: `bg-white` en el sitio **es** este crema, no blanco. 16 apariciones hardcodeadas + todo el uso de clases `white`.                                                                                              |
| Blanco puro                                                | `#FFFFFF`                                     | 20 apariciones hardcodeadas que **sí** son blanco real (convive con el hueso sin regla).                                                                                                                                                          |
| `surface-dark` (`grafito`)                                 | `#2E2E33`                                     | Declarado como `grafito`, `background-color` y `zinc-950` en config. 9 apariciones + sombras `rgba(46,46,51,…)` (12). Nota: **ningún** componente usa las clases `bg-grafito`/`text-grafito` (0 usos); el grafito entra por `zinc-950` y por hex. |
| Texto cálido / café                                        | `#3A2E2A`                                     | 9 apariciones; base de las sombras cálidas `rgba(58,46,42,…)` (ver §5).                                                                                                                                                                           |
| Grises de texto (piedra, hardcodeados en contextos styled) | `#78716C` (23), `#57534E` (17), `#A8A29E` (8) | Son `stone-500/600/400` escritos como hex fuera de Tailwind. En clases, el gris del tema es `neutral` (config: `gray: colors.neutral`).                                                                                                           |

### 3.5 Estados y terceros

| Uso                                  | Valor                                                 | Conteo                                                                                                                                                                                                                                                |
| ------------------------------------ | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Éxito / positivo                     | `#22C55E` (green-500 de Tailwind, hardcodeado)        | 13                                                                                                                                                                                                                                                    |
| Enlaces / info en dashboards         | `#3B82F6` (blue-500)                                  | 10                                                                                                                                                                                                                                                    |
| WhatsApp                             | `#25D366` (+ `rgba(37,211,102,…)`)                    | 10                                                                                                                                                                                                                                                    |
| Naranja "real" en gráficas de socios | `#F97316`                                             | 18 — ojo: es el `orange-500` **original** de Tailwind escrito como hex en los dashboards de partners/demo. En clases, `orange-500` pinta rosa `#E4007C`; en hex, `#F97316` pinta naranja. El mismo "500" significa dos colores según cómo se escriba. |
| Acento mapas (data)                  | `#DC2626`, `#7B2BD9`, `#C1440E`, `#0E8C7A`, `#F2A03D` | `accentColor` por mapa en `data/cdmxMapsData.js`.                                                                                                                                                                                                     |

### 3.6 Acentos por journey

`data/journeysData.js` asigna a cada uno de los 7 journeys editoriales (Luchas, Chapultepec, Jamaica, Centro, Roma, Antropología, Coyoacán) un par `accents` que viene de `lib/journeyTheme.ts`, y los componentes de journey los consumen como variables CSS `--j1` / `--j2` (y derivadas `--j1-soft`, `--j1-softer`, `--j2-softer`). Los valores base de journeyTheme reutilizan la paleta del sistema (`#F2A03D`, `#C1440E`, `#2E2E33`, `#0E8C7A`, `#E4007C`, `#FAF3EA`). Es un subsistema real y en uso — candidato a formalizarse tal cual.

---

## 4. Tipografía

- **Carga:** `@fontsource` en `pages/_app.js` — Nunito 400/600/700/800 y Fraunces 400/500/600/700 (autohospedadas, sin Google Fonts).
- **Asignación en config:** `sans: Nunito`, `serif: Fraunces`. En código styled, `font-family: 'Fraunces', serif` aparece 14 veces (titulares/display); Nunito casi no se escribe a mano porque es el sans por defecto.
- **Escala real (clases Tailwind, conteos):** `text-sm` 607 · `text-xs` 485 · `text-base` 27 · `text-lg` 54 · `text-xl` 63 · `text-2xl` 75 · `text-3xl` 52 · `text-4xl` 36 · `text-5xl` 27. El cuerpo del sitio vive en 12–14px; los titulares en 24–48px.
- **Heroes (styled, con clamp):** `clamp(1.9rem, 4vw, 2.5rem)`, `clamp(2.2rem, 5vw, 3.6rem)`, `clamp(3rem, 9vw, 5.2rem)` — tres fórmulas distintas sin token.
- **Pesos reales:** `font-semibold` 402 · `font-bold` 336 · `font-medium` 148 · `font-black` 57 · `font-extrabold` 11.
- **Line-height:** el config extiende la escala con 11–14 (2.75–3.5rem) — token parcial ya existente.
- **Blog/prosa:** tema completo de `@tailwindcss/typography` en el config (enlaces en rosa de marca, `h2` con borde inferior, código sobre fondo rosa 50, etc.), con variante dark.

---

## 5. Espaciado, radios y sombras

- **Espaciado:** escala por defecto de Tailwind (4px base), sin tokens propios salvo `spacing: { '9/16': '56.25%' }` (ratio de aspecto). No se detectó una escala custom: el espaciado de facto ES el de Tailwind.
- **Opacidades extendidas (token existente):** 12, 15, 55, 85 — el config las agrega porque la escala de Tailwind 3.2 no las trae y el proyecto las usa en ~50 lugares.
- **Radios (clases, conteos):** `rounded-xl` (12px) 315 · `rounded-full` 275 · `rounded-2xl` (16px) 173 · `rounded-lg` (8px) 148 · `rounded-3xl` (24px) 15 · `rounded-md` 11. En contextos styled aparecen además 20px (×4), 16px, 12px, 8px, 30px, 40px, 999px — sin regla.
- **Sombras:** clases Tailwind `shadow-lg` 57 · `shadow-xl` 25 · `shadow-2xl` 24 · `shadow-sm` 22 · `shadow-md` 8. Sombras custom recurrentes (styled): la familia cálida `0 4px 14px rgba(58,46,42,0.08–0.12)` (base café `#3A2E2A`), la de grafito `0 4px 14px rgba(46,46,51,0.07–0.1)` y la rosa `0 6px 18px rgba(181,0,106,0.2)` (`#B5006A`). Ninguna está nombrada como token.

---

## 6. Inventario de componentes (los reales, con su estado)

132 archivos en `components/`. Los que forman la superficie pública:

| Componente               | Dónde                                                                                                                                               | Qué es / tokens que usa                                                                                                                                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Navbar**               | `components/Navbar.tsx` (498 líneas)                                                                                                                | Barra superior: logo, links pastilla, selector de idioma, botones de icono. Clases Tailwind; tamaños mezclados (ver §7).                                                                                                                        |
| **MobileDock**           | `components/MobileDock.tsx` (191)                                                                                                                   | Dock inferior móvil. `orange-500` (= rosa), botones h-9/h-10.                                                                                                                                                                                   |
| **PhotoDeck + doorbar**  | `components/PhotoDeck.jsx` (496)                                                                                                                    | Deck de fotos de la home + las 4 puertas (Our Journeys / Explore on Your Own / City Maps / What's On Today?). Styled-jsx con gradiente propio hardcodeado. La doorbar se igualó hoy (commit `465c61b`): grid de dimensiones iguales, más altas. |
| **Ocelote AI (chatbot)** | `components/ChatbotAssistant.jsx` (1797)                                                                                                            | Asistente del sitio. Onda canvas `#E4007C` (unificada el 2026-11-13); dictado por voz (Groq) integrado hoy.                                                                                                                                     |
| **My Bookings**          | `pages/bookings.jsx` (901)                                                                                                                          | Página de reservas del huésped. Hoy ganó botón de cerrar: **círculo de 40px** (`h-10 w-10 rounded-full border`) con regreso al origen (commit `b5cc334`) — patrón nuevo, candidato a token de "botón cerrar".                                   |
| **Footer**               | `components/Footer.jsx` (94)                                                                                                                        | Pie del sitio.                                                                                                                                                                                                                                  |
| **Card / UI kit**        | `components/Card.js`, `components/ui/` (`button.jsx`, `FlipCard.tsx`, `GlassDark.tsx`, `HeroSection.jsx`, `NavigationMenu.jsx`, `ScrollReveal.jsx`) | Kit UI parcial; convive con tarjetas hechas a mano en cada sección.                                                                                                                                                                             |
| **Checkout**             | `components/booking/SlideOverCheckout.tsx`, `components/checkout/` (CountrySearchSelect, GuestPeopleField, JourneyDateTimePicker, TicketGallery)    | Flujo de compra; formularios con `@tailwindcss/forms`.                                                                                                                                                                                          |
| **Journeys**             | `components/journeys/` (JourneyHero, JourneyStep, …)                                                                                                | Consumen `--j1`/`--j2` por journey (subsistema §3.6).                                                                                                                                                                                           |
| **Precio / socios**      | `pages/partners/…`, componentes de pricing                                                                                                          | Dashboards con gráficas (hex `#F97316` hardcodeado) y elementos de precio de socio (10% desc. / 10% comisión).                                                                                                                                  |
| **WhatsAppButton**       | `components/WhatsAppButton.jsx`                                                                                                                     | Botón flotante; verde WhatsApp `#25D366`.                                                                                                                                                                                                       |
| **Banners y avisos**     | `GdprBanner.tsx`, `SupportBanner.jsx`, `ExperiencesCtaBanner.jsx`, `SiteCookie.jsx`                                                                 | Avisos del sitio, cada uno con estilos propios.                                                                                                                                                                                                 |
| **Tema**                 | `ThemeSwitch.js`, `components/theme-toggle.jsx`                                                                                                     | Modo oscuro con clase (`darkMode: 'class'` en config); superficies dark repartidas en cada componente con variantes `dark:`.                                                                                                                    |

---

## 7. Inconsistencias detectadas (evidencia para el lunes)

1. ~~**Tres rosas "de marca" conviviendo**~~ — **RESUELTA (2026-11-13):** el rosa oficial es `#E4007C`; `#EC4899` (onda de Ocelote) y `#DE1D8D` (arranque de la familia de gradientes y `BRAND.color.primary`) quedaron unificados en código (rama `fix/rosa-oficial-e4007c`, pendiente de push). Ver §8.1.
2. **`orange-500` significa dos colores:** en clase Tailwind pinta rosa `#E4007C` (remapeo del config); hardcodeado como hex en dashboards es `#F97316` (naranja real). 18 apariciones del hex.
3. ~~**La paleta rosa está declarada 3 veces**~~ — **RESUELTA en parte (2026-11-13):** los valores se declaran **una sola vez** en el config (`brandPink`, arriba en `tailwind.config.js`) y `orange` (escala completa 50–950) + `primary` / `primary-color` / `primary-color-dark` (subconjunto 100–900, como siempre) referencian ese objeto; la config resuelta es idéntica a la anterior (verificado por diff de `resolveConfig`). Los cuatro nombres siguen existiendo: **cuál nombre sobrevive** es la parte que queda abierta (§8.6). Las clases `primary-*` casi no se usan (5 usos de `primary-500` contra 528 de `orange-500`).
4. **`green` está remapeado a violeta** en el config (`green: colors.violet`): una clase `green-500` pintaría violeta. El verde de éxito real (`#22C55E`) se usa hardcodeado (13 veces).
5. **Barra superior sin medida única** (feedback de Isis, punto 2 — decisión en curso): en `Navbar.tsx` conviven círculos de 36px (`h-9 w-9`, logo y botones en la parte superior) y de 40px (`h-10 w-10` al hacer scroll y en botones con borde), links en pastilla (`px-4 py-1.5`), y el selector de idioma con **dos variantes**: pastilla con texto (`px-2 py-1.5 text-xs`) o círculo de 40px según el estado. Regla de Donovan en formación: botones de icono todos iguales; los de texto (idioma) conservan pastilla **de la misma altura** para que el texto no se encoja.
6. **Dos gradientes de marca distintos:** el del config (`#F20089→#2D00F7`, magenta→azul) y el del PhotoDeck (`#E4007C→#6A0568`, rosa→morado oscuro; el arranque se unificó al rosa oficial el 2026-11-13, pero el gradiente como tal sigue siendo otro).
7. **Blanco vs hueso sin regla:** el config hace que `white` sea hueso `#FAF3EA`, pero hay 20 `#FFFFFF` hardcodeados que son blanco puro.
8. **Sombras sin nombre:** tres familias custom (cálida café, grafito, rosa) repartidas como valores sueltos; el resto usa la escala neutral de Tailwind.
9. **Radios sin regla por tipo de elemento:** xl/2xl/full dominan, pero lg, 3xl y valores styled (20/30/40px) aparecen sin patrón.
10. **El grafito no tiene clase propia en uso:** existe como token (`grafito`) pero 0 componentes lo usan por ese nombre; entra por `zinc-950` o hex.

---

## 8. Decisiones abiertas para el lunes 16 (no decididas aquí)

1. **CERRADA (2026-11-13, decisión de Donovan): el rosa oficial es `#E4007C`** — el "rosa mexicano", el declarado en el config y el más usado. Los otros dos rosas se retiran como color de marca: la onda de Ocelote pasó de `#EC4899` a `#E4007C`, y el `#DE1D8D` (arranque de la familia de gradientes de marca, acentos sueltos y `BRAND.color.primary` en `lib/brand.ts`, incluida su forma rgba `222,29,141` → `228,0,124`) quedó unificado en la rama local `fix/rosa-oficial-e4007c` (22 archivos, sin push; grep posterior: cero `#EC4899`/`#DE1D8D` en el código del sitio). Pendientes menores para el lunes: las clases Tailwind `pink-500`/`pink-600` en `pages/about.js` y `pages/marketing.js`, el `to-pink-600` de los botones de Ocelote (y su gemelo en `MobileDock.tsx`), y los stops intermedios del gradiente (`#BE1588`/`#9F0E7F`), que son decisión de gradiente (§8.5), no de rosa.
2. ¿Existe un naranja en el sistema? Si sí, ¿es cempasúchil `#F2A03D`? ¿Y qué pasa con el `#F97316` de los dashboards de socios?
3. Barra superior: ¿altura única de botón = **40px**? ¿El selector de idioma queda como pastilla de 40px de alto (regla de Donovan) y todos los botones de icono como círculos de 40px — incluyendo adoptar el botón de cerrar de My Bookings (40px) como el patrón estándar de "cerrar"? ¿Se elimina que los botones cambien de tamaño al hacer scroll (36↔40)?
4. ¿El azul del jaguar (`#0E6C84` / `#489FB7`) entra como token oficial? ¿Es familia de talavera o color aparte?
5. ¿Un solo gradiente de marca? ¿Cuál de los dos vive (config vs PhotoDeck)?
6. ¿La paleta se consolida en un solo nombre? ¿Cuál nombre queda: `brand`, `primary` u `orange`? — **Avance (2026-11-13):** la triple declaración ya se redujo a **una sola fuente de valores** (`brandPink`) referenciada por los cuatro nombres, sin cambiar ningún valor resuelto. Lo que queda por decidir es solo el nombre sobreviviente y la migración de clases.
7. ¿El remapeo `green → violet` es intencional o accidente? Si es accidente, ¿se corrige y el éxito pasa a ser token (`#22C55E`)?
8. ¿Regla de radios por elemento? Propuesta a discutir: tarjetas = xl (12px), paneles/modales = 2xl (16px), botones e inputs = full o lg según tipo.
9. ¿Las sombras cálidas (café/grafito/rosa) se nombran como tokens y sustituyen a las neutras de Tailwind en superficies de marca?
10. ¿Modo oscuro se mantiene como parte formal del sistema (con sus tokens de superficie) o se congela su expansión?
11. ¿Regla tipográfica formal? Propuesta a discutir: Fraunces solo para titulares/display, Nunito para todo lo demás; una sola fórmula de clamp para héroes.
12. ¿Los acentos por journey (`--j1`/`--j2`, 7 journeys) se formalizan como subsistema oficial con su tabla de pares?
13. ¿Dónde vive la fuente de verdad: variables CSS en `:root` sincronizadas con `tailwind.config.js`, o solo el config de Tailwind? — **Implementado (2026-11-13):** la capa de variables CSS vive en `styles/design-tokens.css` (importada en `pages/_app.js`) y espeja los valores del config; la regla operativa es cambiar ambos en el mismo commit. Queda abierto si los componentes migran a `var(--…)` y en qué orden.

---

## 9. Esquema de nombres propuesto (para el archivo de tokens)

Prefijos por capa, reutilizables en cualquier negocio; la marca concreta vive en los valores:

- `--brand-*` — color principal y su escala.
- `--accent-*` — acentos secundarios (talavera, cempasúchil, terracota).
- `--jaguar-*` — azules del logo.
- `--surface-*`, `--text-*`, `--border-*` — superficies y texto, claro/oscuro.
- `--state-*` — éxito, info, aviso, error, whatsapp.
- `--font-display`, `--font-text` — familias.
- `--text-*` (tamaños) / `--radius-*` / `--shadow-*` / `--control-height` — escala y componentes.

El archivo completo vive en `styles/design-tokens.css` (adoptado del borrador el 2026-11-13). Está **instalado pero no aplicado**: ningún componente consume las variables todavía.

---

_Actualizaciones: este documento se edita en cada decisión tomada. 2026-11-13: extracción, decisión del rosa oficial (§8.1), unificación de rosas en código (rama `fix/rosa-oficial-e4007c`) e implementación base de tokens + consolidación del config (rama `feat/design-system-tokens`). Próxima: sesión del lunes 16 de noviembre de 2026._
