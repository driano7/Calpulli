const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || 'https://donovan-amx.vercel.app'

const siteMetadata = {
  title: "Mexico's Calpulli CDMX",
  author: 'Donovan Riaño',
  headerTitle: 'Calpulli CDMX',
  description:
    'Calpulli CDMX — tours y experiencias premium en la Ciudad de México. Rutas gastronómicas, historia, barrios y museos con guías locales, en inglés y español.',
  language: 'es-419',
  theme: 'system', // system, dark or light
  siteUrl,
  siteRepo: 'https://github.com/driano7/amaxing',
  siteLogo: '/static/images/jaguarBaja.png',
  image: '/static/images/jaguarBaja.png',
  socialBanner: '/static/images/jaguarBaja.png',
  email: 'dnvn@duck.com',
  github: 'https://github.com/driano7',
  instagram: 'https://www.instagram.com/donovan_amx/',
  youtube: 'https://www.youtube.com/channel/UC1e6px1jwLN_0alayCCgd7A',
  tiktok: 'https://www.tiktok.com/@donovan_amx',
  twitter: 'https://twitter.com/Donovan_amx',
  facebook: 'https://www.facebook.com/donovan.amx',
  linkedin: 'https://www.linkedin.com/in/driano7/',
  telegram: 'https://t.me/donovan_amx',
  whatsapp: 'https://wa.me/525512291607',
  donations: {
    bitcoin: 'bc1q4yud5g357y2ysxn7ekx0ncqnwpatypcwh4qc3f',
    ethereum: '0xfc10B4f288Dfcc996EB819021934536095a7Ce90',
    bank: '0121 800 000 0000 0001', // CLABE de ejemplo (mockeado, reemplazar)
  },
  locale: 'en-US',
  analytics: {
    // If you want to use an analytics provider you have to add it to the
    // content security policy in the `next.config.js` file.
    // supports plausible, simpleAnalytics, umami or googleAnalytics
    //
    // Plausible y GoogleAnalytics estan los dos activos y cuentan los mismos
    // pageviews: los agregados quedan en dos proveedores. Apaga el que no
    // quieras vaciando su bandera (no hay que tocar codigo). La analitica
    // first-party del sitio no se activa desde aqui.
    plausibleDataDomain: 'donovan-amx.vercel.app', // e.g. tailwind-nextjs-starter-blog.vercel.app
    simpleAnalytics: false, // true or false
    umamiWebsiteId: '', // e.g. 123e4567-e89b-12d3-a456-426614174000
    googleAnalyticsId: 'G-6XT6EFY1BL', // e.g. UA-000000-2 or G-XXXXXXX
    posthogAnalyticsId: '', // posthog.init e.g. phc_5yXvArzvRdqtZIsHkEm3Fkkhm3d0bEYUXCaFISzqPSQ
  },
  comment: {
    // If you want to use a commenting system other than giscus you have to add it to the
    // content security policy in the `next.config.js` file.
    // Select a provider and use the environment variables associated to it
    // https://vercel.com/docs/environment-variables
    provider: 'giscus', // supported providers: giscus, utterances, disqus
    giscusConfig: {
      // Visit the link below, and follow the steps in the 'configuration' section
      // https://giscus.app/
      repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
      repositoryId: process.env.NEXT_PUBLIC_GISCUS_REPOSITORY_ID,
      category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY,
      categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
      mapping: 'pathname', // supported options: pathname, url, title
      reactions: '1', // Emoji reactions: 1 = enable / 0 = disable
      // Send discussion metadata periodically to the parent window: 1 = enable / 0 = disable
      metadata: '0',
      // theme example: light, dark, dark_dimmed, dark_high_contrast
      // transparent_dark, preferred_color_scheme, custom
      theme: 'light',
      // Place the comment box above the comments. options: bottom, top
      inputPosition: 'bottom',
      // Choose the language giscus will be displayed in. options: en, es, zh-CN, zh-TW, ko, ja etc
      lang: 'en',
      // theme when dark mode
      darkTheme: 'transparent_dark',
      // If the theme option above is set to 'custom`
      // please provide a link below to your custom theme css file.
      // example: https://giscus.app/themes/custom_example.css
      themeURL: '',
    },
    utterancesConfig: {
      // Visit the link below, and follow the steps in the 'configuration' section
      // https://utteranc.es/
      repo: process.env.NEXT_PUBLIC_UTTERANCES_REPO,
      issueTerm: '', // supported options: pathname, url, title
      label: '', // label (optional): Comment 💬
      // theme example: github-light, github-dark, preferred-color-scheme
      // github-dark-orange, icy-dark, dark-blue, photon-dark, boxy-light
      theme: '',
      // theme when dark mode
      darkTheme: '',
    },
    disqusConfig: {
      // https://help.disqus.com/en/articles/1717111-what-s-a-shortname
      shortname: process.env.NEXT_PUBLIC_DISQUS_SHORTNAME,
    },
  },
}

module.exports = siteMetadata
