import Link from './Link'
import siteMetadata from '@/data/siteMetadata'
import { Send, MessageCircle, Mail } from 'lucide-react'
import InstagramIcon from '@/components/social-icons/instagram.svg'
import YoutubeIcon from '@/components/social-icons/youtube.svg'
import TiktokIcon from '@/components/social-icons/tiktok.svg'
import GithubIcon from '@/components/social-icons/github.svg'
import { useLanguage } from '@/lib/hooks/useLanguage'

const footerLinks = [
  {
    href: siteMetadata.github,
    label: 'GitHub',
    icon: GithubIcon,
  },
  {
    href: siteMetadata.whatsapp,
    label: 'WhatsApp',
    icon: MessageCircle,
  },
  {
    href: siteMetadata.telegram,
    label: 'Telegram',
    icon: Send,
  },
  {
    href: `mailto:${siteMetadata.email}`,
    label: 'Email',
    icon: Mail,
  },
  {
    href: siteMetadata.tiktok,
    label: 'TikTok',
    icon: TiktokIcon,
  },
  {
    href: siteMetadata.instagram,
    label: 'Instagram',
    icon: InstagramIcon,
  },
  {
    href: siteMetadata.youtube,
    label: 'YouTube',
    icon: YoutubeIcon,
  },
]

export default function Footer() {
  const { t } = useLanguage()
  return (
    <footer className="relative z-10 mt-24 border-t border-zinc-200/50 dark:border-zinc-800/50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span>© {new Date().getFullYear()}</span>
            <span>•</span>
            <Link href="/" className="hover:text-orange-500">
              {siteMetadata.headerTitle}
            </Link>
          </div>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
            Hecho con <span className="text-orange-500">❤</span> por{' '}
            <a
              href="https://riano.netlify.app"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-orange-500 underline-offset-4 hover:underline"
            >
              Donovan Riaño
            </a>
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {footerLinks.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-zinc-300 bg-zinc-100/60 px-3 py-2 text-xs font-medium text-zinc-700 transition-colors hover:border-[#DE1D8D]/50 hover:text-[#DE1D8D] dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-200 dark:hover:border-[#DE1D8D]/60 dark:hover:text-white"
              >
                <Icon className="h-3.5 w-3.5 text-[#DE1D8D]" />
                <span className="font-medium">{item.label}</span>
              </a>
            )
          })}
        </div>
      </div>
    </footer>
  )
}
