import Link from '@/components/Link'

const GRADIENT =
  'linear-gradient(135deg, #6A0568 0%, #7B2BD9 25%, #9F0E7F 50%, #BE1588 75%, #E4007C 100%)'

export default function Pagination({ totalPages, currentPage }) {
  const prevPage = parseInt(currentPage) - 1 > 0
  const nextPage = parseInt(currentPage) + 1 <= parseInt(totalPages)

  const disabledClass =
    'cursor-auto rounded-full px-5 py-2 text-sm font-semibold text-zinc-400 dark:text-zinc-600'

  return (
    <div className="space-y-2 pt-6 pb-8 md:space-y-5">
      <nav className="flex items-center justify-between">
        {prevPage ? (
          <Link
            href={currentPage - 1 === 1 ? `/blog/` : `/blog/page/${currentPage - 1}`}
            rel="previous"
            style={{ background: GRADIENT }}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            &larr; Previous
          </Link>
        ) : (
          <button rel="previous" className={disabledClass} disabled>
            &larr; Previous
          </button>
        )}
        <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {currentPage} of {totalPages}
        </span>
        {nextPage ? (
          <Link
            href={`/blog/page/${currentPage + 1}`}
            rel="next"
            style={{ background: GRADIENT }}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            Next &rarr;
          </Link>
        ) : (
          <button rel="next" className={disabledClass} disabled>
            Next &rarr;
          </button>
        )}
      </nav>
    </div>
  )
}
