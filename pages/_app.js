import '@/css/tailwind.css'
import '@/css/prism.css'
import '@/css/extra.css'
import 'katex/dist/katex.css'

import '@fontsource/nunito/400.css'
import '@fontsource/nunito/600.css'
import '@fontsource/nunito/700.css'
import '@fontsource/nunito/800.css'
import '@fontsource/fraunces/400.css'
import '@fontsource/fraunces/500.css'
import '@fontsource/fraunces/600.css'
import '@fontsource/fraunces/700.css'

import { ThemeProvider } from 'next-themes'
import Head from 'next/head'
import siteMetadata from '@/data/siteMetadata'
import Analytics from '@/components/analytics'
import LayoutWrapper from '@/components/LayoutWrapper'
import { ClientReload } from '@/components/ClientReload'
import { LanguageProvider } from '@/lib/hooks/useLanguage'
import { AuthProvider } from '@/lib/hooks/useAuth'
import dynamic from 'next/dynamic'
import AnalyticsProvider from '@/components/analytics/AnalyticsProvider'

const WhatsAppButton = dynamic(() => import('@/components/WhatsAppButton'), {
  ssr: false,
  loading: () => null,
})

const PageAnalyticsTracker = dynamic(() => import('@/components/PageAnalyticsTracker'), {
  ssr: false,
  loading: () => null,
})

const SiteCookie = dynamic(() => import('@/components/SiteCookie'), {
  ssr: false,
  loading: () => null,
})

const isDevelopment = process.env.NODE_ENV === 'development'
const isSocket = process.env.SOCKET

const defaultTheme = {
  colors: {
    primary: '#71717a',
    secondary: '#ff00c3',
    text: '#fff',
    highlight: '#ff00c3',
    icon: '#fff',
    background: 'transparent',
  },
  fonts: {
    body: 'inherit',
  },
}

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => <LayoutWrapper>{page}</LayoutWrapper>)
  return (
    <ThemeProvider attribute="class" defaultTheme={siteMetadata.theme}>
      <LanguageProvider fallbackLanguage="en">
        <AuthProvider>
          <AnalyticsProvider
            options={{
              trackPageViews: true,
              trackScrollDepth: true,
              trackBounce: true,
              trackExitPage: true,
              debug: process.env.NODE_ENV === 'development',
            }}
          >
            <Head>
              <meta content="width=device-width, initial-scale=1" name="viewport" />
            </Head>
            {isDevelopment && isSocket && <ClientReload />}
            <Analytics />
            <SiteCookie />
            {getLayout(<Component {...pageProps} />)}
            <WhatsAppButton />
            <PageAnalyticsTracker />
          </AnalyticsProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  )
}
