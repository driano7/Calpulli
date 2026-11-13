const defaultTheme = require('tailwindcss/defaultTheme')
const colors = require('tailwindcss/colors')

// Rosa mexicano — paleta de marca de Calpulli (Design System, 2026-11-13).
// UNICA declaracion de estos valores: `orange` la expone completa (50-950)
// y los alias historicos `primary`, `primary-color` y `primary-color-dark`
// referencian el subconjunto 100-900, exactamente como estaban declarados
// antes (ninguna clase cambia su valor resuelto). Ajustar un tono aqui lo
// ajusta en los cuatro nombres a la vez. Espejo en variables CSS:
// styles/design-tokens.css (--brand-*). Ver docs/design-system.md.
const brandPink = {
  50: '#FCE6F1',
  100: '#FAC4DE',
  200: '#F591BE',
  300: '#EF5E9F',
  400: '#EA338B',
  500: '#E4007C',
  600: '#C5006A',
  700: '#A30059',
  800: '#820047',
  900: '#660037',
  // 950 llego en Tailwind 3.3; este proyecto corre 3.2.4. Se usa como fondo
  // de aviso en modo oscuro (pages/profile.tsx). Valor de Tailwind 3.3.
  950: '#431407',
}

// Subconjunto 100-900 de la paleta de marca: el alcance exacto que siempre
// tuvieron los alias `primary*`.
const brandPinkAlias = Object.fromEntries(
  Object.entries(brandPink).filter(([step]) => step !== '50' && step !== '950')
)

module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './layouts/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './data/**/*.{mdx,js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // La escala de opacidad por defecto de Tailwind 3.2.4 no incluye 12,
      // 15, 55 ni 85, y el proyecto los usa en 50 lugares. Sin esta
      // extension esas clases NO se generan: la propiedad no se aplica y el
      // elemento hereda el color del padre. Es aditivo: solo habilita
      // clases que antes no existian.
      opacity: {
        12: '0.12',
        15: '0.15',
        55: '0.55',
        85: '0.85',
      },
      spacing: {
        '9/16': '56.25%',
      },
      lineHeight: {
        11: '2.75rem',
        12: '3rem',
        13: '3.25rem',
        14: '3.5rem',
      },
      fontFamily: {
        sans: ['Nunito', ...defaultTheme.fontFamily.sans],
        serif: ['Fraunces', ...defaultTheme.fontFamily.serif],
      },
      gradientColorStops: {
        // https://coolors.co/2d00f7-6a00f4-8900f2-a100f2-b100e8-bc00dd-d100d1-db00b6-e500a4-f20089
        'gradient-1-start': '#F20089',
        'gradient-1-end': '#D100D1',
        'gradient-2-start': '#D100D1',
        'gradient-2-end': '#A100F2',
        'gradient-3-start': '#A100F2',
        'gradient-3-end': '#2D00F7',
      },
      colors: {
        // zinc-950, slate-950, red-950, blue-950, emerald-950 y orange-950
        // llegaron en Tailwind 3.3; este proyecto corre 3.2.4, asi que se
        // declaran aqui. zinc-950 es ademas una decision de diseno: el sitio
        // usa un grafito calido en vez del casi negro nativo.
        // Gris carbón — reemplaza el negro puro del sitio actual (neutro y moderno).
        zinc: {
          950: '#2E2E33',
        },
        slate: {
          950: '#020617',
        },
        red: {
          950: '#450A0A',
        },
        blue: {
          950: '#172554',
        },
        emerald: {
          950: '#022C22',
        },
        // Hueso / crema — reemplaza el blanco frío en superficies claras.
        white: '#FAF3EA',
        // Rosa mexicano: orange is remapped to the brand pink palette so all
        // existing orange-* utility classes render as Mexican pink (#E4007C).
        // La paleta se declara UNA sola vez arriba (brandPink); los alias
        // primarios apuntan a ese mismo objeto.
        orange: brandPink,
        primary: brandPinkAlias,
        'primary-color': brandPinkAlias,
        'primary-color-dark': brandPinkAlias,
        // Acentos del moodboard: talavera, cempasúchil y terracota.
        talavera: {
          50: '#E6F5F2',
          100: '#C9EBE5',
          500: '#0E8C7A',
          700: '#0A6E60',
        },
        cempasuchil: {
          100: '#FDEBD1',
          400: '#F7B45F',
          500: '#F2A03D',
          700: '#D0811F',
        },
        terracota: {
          50: '#F9EDE7',
          100: '#F0D5C7',
          500: '#C1440E',
          700: '#9A3207',
        },
        grafito: '#2E2E33',
        hueso: '#FAF3EA',
        'background-color': '#2E2E33',
        green: colors.violet,
        gray: colors.neutral,
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.700'),
            a: {
              color: theme('colors.orange.600'),
              fontWeight: '500',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              textDecorationColor: 'rgba(190, 21, 136, 0.3)',
              '&:hover': {
                color: theme('colors.orange.500'),
                textDecorationColor: theme('colors.orange.500'),
              },
              code: { color: theme('colors.orange.600') },
            },
            'h1,h2,h3,h4,h5,h6': {
              color: theme('colors.gray.900'),
              fontWeight: '700',
              letterSpacing: theme('letterSpacing.tight'),
              scrollMarginTop: '5rem',
            },
            h1: { fontSize: theme('fontSize.3xl') },
            h2: {
              fontSize: theme('fontSize.2xl'),
              paddingBottom: '0.4rem',
              borderBottom: `1px solid ${theme('colors.gray.200')}`,
            },
            h3: { fontSize: theme('fontSize.xl') },
            h4: { fontSize: theme('fontSize.lg') },
            strong: { color: theme('colors.gray.900'), fontWeight: '600' },
            code: {
              color: theme('colors.orange.700'),
              backgroundColor: theme('colors.orange.50'),
              borderRadius: '0.375rem',
              padding: '0.15rem 0.35rem',
              fontWeight: '500',
            },
            'code::before': { content: 'none' },
            'code::after': { content: 'none' },
            pre: {
              backgroundColor: '#0f1117',
              color: theme('colors.gray.100'),
              borderRadius: '0.75rem',
              border: `1px solid ${theme('colors.gray.200')}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
              code: {
                backgroundColor: 'transparent',
                color: 'inherit',
                padding: 0,
                fontWeight: '400',
                borderRadius: 0,
              },
            },
            details: {
              backgroundColor: theme('colors.gray.50'),
              border: `1px solid ${theme('colors.gray.200')}`,
              borderRadius: '0.75rem',
              padding: '0.75rem 1.25rem',
              summary: {
                fontWeight: '600',
                color: theme('colors.gray.900'),
                cursor: 'pointer',
              },
            },
            blockquote: {
              color: theme('colors.gray.700'),
              borderLeftColor: theme('colors.orange.400'),
              backgroundColor: theme('colors.orange.50'),
              borderRadius: '0 0.5rem 0.5rem 0',
              padding: '0.75rem 1.25rem',
              fontStyle: 'normal',
            },
            img: {
              borderRadius: '0.75rem',
              border: `1px solid ${theme('colors.gray.200')}`,
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
            },
            hr: { borderColor: theme('colors.gray.200') },
            'ul li::marker': { color: theme('colors.orange.500') },
            'ol li::marker': { color: theme('colors.orange.500'), fontWeight: '600' },
            th: { color: theme('colors.gray.900') },
            thead: { borderBottomColor: theme('colors.gray.300') },
          },
        },
        dark: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.orange.400'),
              fontWeight: '500',
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
              textDecorationColor: 'rgba(235, 81, 155, 0.3)',
              '&:hover': {
                color: theme('colors.orange.300'),
                textDecorationColor: theme('colors.orange.300'),
              },
              code: { color: theme('colors.orange.400') },
            },
            'h1,h2,h3,h4,h5,h6': { color: theme('colors.gray.100') },
            h2: { borderBottomColor: theme('colors.gray.700') },
            strong: { color: theme('colors.gray.100') },
            code: {
              color: theme('colors.orange.400'),
              backgroundColor: theme('colors.gray.800'),
            },
            pre: {
              backgroundColor: '#0a0c12',
              borderColor: theme('colors.gray.800'),
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            },
            details: {
              backgroundColor: theme('colors.gray.800'),
              borderColor: theme('colors.gray.700'),
              summary: { color: theme('colors.gray.100') },
            },
            blockquote: {
              color: theme('colors.gray.300'),
              borderLeftColor: theme('colors.orange.400'),
              backgroundColor: theme('colors.gray.800'),
            },
            img: {
              borderColor: theme('colors.gray.700'),
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.4)',
            },
            hr: { borderColor: theme('colors.gray.700') },
            'ul li::marker': { color: theme('colors.orange.400') },
            'ol li::marker': { color: theme('colors.orange.400') },
            th: { color: theme('colors.gray.100') },
            thead: { borderBottomColor: theme('colors.gray.700') },
            tbody: {
              tr: {
                borderBottomColor: theme('colors.gray.700'),
              },
            },
          },
        },
      }),
      keyframes: {
        shrink: {
          '0% , 100%': {
            height: '0.75rem',
          },
          '50%': {
            height: '0.375rem',
          },
        },
        'bg-hue-animation': {
          '0%': { filter: 'hue-rotate(0deg)' },
          '50%': { filter: 'hue-rotate(180deg)' },
          '100%': { filter: 'hue-rotate(0deg)' },
        },
        'fade-away': {
          '0%': {
            opacity: 1,
          },
          '100%': {
            opacity: 0.2,
          },
        },
        expand: {
          '0% , 100%': {
            height: '0.375rem',
          },
          '50%': {
            height: '0.75rem',
          },
        },
        'gradient-foreground-1': {
          '0%, 16.667%, 100%': {
            opacity: 1,
          },
          '33.333%, 83.333%': {
            opacity: 0,
          },
        },
        'gradient-background-1': {
          '0%, 16.667%, 100%': {
            opacity: 0,
          },
          '25%, 91.667%': {
            opacity: 1,
          },
        },
        'gradient-foreground-2': {
          '0%, 100%': {
            opacity: 0,
          },
          '33.333%, 50%': {
            opacity: 1,
          },
          '16.667%, 66.667%': {
            opacity: 0,
          },
        },
        'gradient-background-2': {
          '0%, to': {
            opacity: 1,
          },
          '33.333%, 50%': {
            opacity: 0,
          },
          '25%, 58.333%': {
            opacity: 1,
          },
        },
        'gradient-foreground-3': {
          '0%, 50%, 100%': {
            opacity: 0,
          },
          '66.667%, 83.333%': {
            opacity: 1,
          },
        },
        'gradient-background-3': {
          '0%, 58.333%, 91.667%, 100%': {
            opacity: 1,
          },
          '66.667%, 83.333%': {
            opacity: 0,
          },
        },
      },
      animation: {
        'fade-text': '10s ease-in-out 3s 1 normal forwards running fade-away',
        shrink: 'shrink ease-in-out 1.5s infinite',
        expand: 'expand ease-in-out 1.5s infinite',
        'hue-animation': 'bg-hue-animation 10s infinite',
        'gradient-background-1': 'gradient-background-1 8s infinite',
        'gradient-foreground-1': 'gradient-foreground-1 8s infinite',
        'gradient-background-2': 'gradient-background-2 8s infinite',
        'gradient-foreground-2': 'gradient-foreground-2 8s infinite',
        'gradient-background-3': 'gradient-background-3 8s infinite',
        'gradient-foreground-3': 'gradient-foreground-3 8s infinite',
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
