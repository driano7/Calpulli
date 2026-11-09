// TODO EL SITIO SE MUESTRA EN PESOS MEXICANOS, en los dos idiomas.
//
// Antes el precio se mostraba en dolares cuando el sitio estaba en ingles.
// Ahora la vista es siempre en MXN: el precio que se ve es el que se cobra.
//
// Los tours guardan su precio en USD (data/toursData.js es la fuente unica) y
// se convierten a pesos con la tasa de abajo. Los journeys ya estan en pesos.
// Stripe cobra en MXN en los dos casos.

// Tasa de respaldo sin conexion (18.65 MXN por USD, 8 nov 2026).
// La tasa viva se sirve en /api/exchange-rate (open.er-api.com, cache de 1 h);
// esta constante solo se usa como respaldo si esa fuente no responde.
export const MXN_PER_USD = 18.65

export type CurrencyCode = 'USD' | 'MXN'

export function getCurrencyForLocale(_locale: string): CurrencyCode {
  return 'MXN'
}

export function getCurrencyRate(_locale: string): number {
  return MXN_PER_USD
}

// Convierte un precio en USD a la moneda de la vista.
export function convertPrice(priceUsd: number, locale: string): number {
  return priceUsd * getCurrencyRate(locale)
}

// Formatea un precio (expresado en USD) en la moneda/locale indicados.
export function formatPriceByLocale(
  priceUsd: number,
  locale: string,
  opts: Intl.NumberFormatOptions = {}
): string {
  const currency = getCurrencyForLocale(locale)
  const amount = convertPrice(priceUsd, locale)
  return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...opts,
  }).format(amount)
}

/**
 * Formatter propio para quien ya tenia uno. OJO: convierte el precio, igual
 * que formatPriceByLocale. Antes formateaba el numero crudo como pesos, asi
 * que un tour de 65 dolares salia como $65 en lugar de $1,137.
 */
export function currencyIntl(locale: string): Intl.NumberFormat {
  return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency: getCurrencyForLocale(locale),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

/**
 * Formatea un monto que YA esta en pesos. No convierte nada.
 *
 * OJO: `formatPriceByLocale` supone que el numero viene en dolares y lo
 * multiplica por la tasa. Un journey (que ya esta en pesos) pasado por ahi
 * salia ~18.65 veces mas caro: 100 pesos se veian como 1,865. Para los montos
 * que ya estan en pesos se usa esta.
 */
export function formatPriceMXN(
  amountMxn: number,
  locale: string,
  opts: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat(locale === 'es' ? 'es-MX' : 'en-US', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...opts,
  }).format(amountMxn)
}

/** Convierte y formatea en una sola llamada, para usar en el JSX. */
export function formatPrice(priceUsd: number, locale: string): string {
  return formatPriceByLocale(priceUsd, locale)
}
