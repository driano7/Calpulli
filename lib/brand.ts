// MIT License - Copyright (c) 2024-2026 Donovan Riaño / Calpulli CDMX - See LICENSE
// Brand constants for Calpulli CDMX

export const BRAND = {
  name: 'Calpulli CDMX',
  shortName: 'Calpulli',
  domain: 'calpulli-cdmx.com',
  email: 'hola@calpulli-cdmx.com',
  whatsapp: '+52 55 1229 1607',
  instagram: 'https://www.instagram.com/calpulli_cdmx/',
  whatsappUrl: 'https://wa.me/525512291607',
  description: 'Tours y experiencias auténticas en Ciudad de México',
  descriptionShort: 'Tours auténticos en CDMX',
  tagline: 'El abrazo de la ciudad que amamos',
  color: {
    primary: '#E4007C',
    secondary: '#BE1588',
    gradient: 'from-orange-400 to-orange-600',
    gradientHover: 'from-orange-500 to-orange-600',
  },
  social: {
    instagram: 'https://www.instagram.com/calpulli_cdmx/',
    whatsapp: 'https://wa.me/525512291607',
    email: 'mailto:hola@calpulli-cdmx.com',
  },
  seo: {
    title: 'Calpulli CDMX - Tours y experiencias auténticas en CDMX',
    description:
      'Descubre la Ciudad de México con tours auténticos guiados por locales. Comida, historia, cultura y aventuras auténticas en CDMX.',
    ogImage: '/og-image.jpg',
  },
} as const

export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim())
export const EMPLOYEE_EMAILS = (process.env.EMPLOYEE_EMAILS || '').split(',').map((e) => e.trim())

export const ADMIN_ROLE = 'admin'
export const EMPLOYEE_ROLE = 'employee'
export const CLIENT_ROLE = 'client'

export function getAdminConfig() {
  return {
    name: BRAND.name,
    email: BRAND.email,
    whatsapp: BRAND.whatsapp,
    instagram: BRAND.instagram,
    whatsappUrl: BRAND.whatsappUrl,
    color: BRAND.color,
    social: BRAND.social,
  }
}
