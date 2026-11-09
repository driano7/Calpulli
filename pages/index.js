import Link from '@/components/Link'
import { PageSEO } from '@/components/SEO'
import { HeroSection } from '@/components/ui/HeroSection'
import { AnimatedSection } from '@/components/AnimatedSection'
import siteMetadata from '@/data/siteMetadata'
import Image from '@/components/Image'
import projectsData from '@/data/projectsData'
import { GdprBanner } from '@/components/GdprBanner'

import PhotoDeck from '@/components/PhotoDeck'

export default function Home() {
  return (
    <>
      <PageSEO title={siteMetadata.title} description={siteMetadata.description} />
      <HeroSection />
      <div className="bg-transparent text-gray-900 dark:text-gray-100">
        <div className="container mx-auto px-4 py-16">
          <PhotoDeck />
        </div>

        {/* Desvanecido azul morado antes de Safety & Help */}
        <div className="h-24 bg-gradient-to-b from-violet-500/15 via-indigo-500/10 to-transparent dark:from-violet-900/20 dark:via-indigo-900/15 dark:to-transparent" />

        {/* Safety & Help Section */}
        <div className="mb-16">
          <div className="mb-8 text-center">
            <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Safety & Help</h2>
            <p className="text-gray-500 dark:text-gray-400">
              Essential information every traveler should have at hand for their stay in 🇲🇽
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {projectsData
              .filter((p) =>
                ['Police can help you', 'Emergency Phones', 'What to do in an earthquake'].includes(
                  p.title
                )
              )
              .map((project, index) => (
                <AnimatedSection
                  key={project.title}
                  delay={index * 0.08}
                  direction="up"
                  className="w-full"
                >
                  <Link
                    href={project.href}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 backdrop-blur-md transition-all duration-300 hover:border-orange-500/30 hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-black/40 dark:hover:bg-black/50 dark:hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <Image
                        src={project.imgSrc}
                        alt={project.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    </div>
                    <div className="p-4">
                      <h3 className="mb-1 text-lg font-bold text-gray-900 group-hover:text-orange-500 dark:text-white dark:group-hover:text-orange-400">
                        {project.title}
                      </h3>
                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {project.description}
                      </p>
                    </div>
                  </Link>
                </AnimatedSection>
              ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/20 px-6 py-2 font-medium text-orange-500 backdrop-blur-sm transition-all duration-300 hover:bg-orange-500 hover:text-white"
            >
              View All Info →
            </Link>
          </div>
        </div>

        <GdprBanner className="mt-2" />
      </div>
    </>
  )
}
