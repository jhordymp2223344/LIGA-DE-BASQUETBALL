import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
  itemLabel?: string
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
  itemLabel = 'registros',
}: PaginationProps) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((item) => {
    if (pageCount <= 7) return true
    if (item === 1 || item === pageCount) return true
    return Math.abs(item - page) <= 1
  })
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] px-4 py-3 sm:flex-row">
      <p className="text-[10px] text-mist-500">
        Mostrando <span className="font-semibold text-mist-200">{from}</span>–
        <span className="font-semibold text-mist-200">{to}</span> de{' '}
        <span className="font-semibold text-mist-200">{total}</span> {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-300 transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {pages.map((item, index) => {
          const previous = pages[index - 1]
          const gap = previous && item - previous > 1
          return (
            <span key={item} className="flex items-center gap-1">
              {gap ? <span className="px-1 text-xs text-mist-600">…</span> : null}
              <button
                type="button"
                onClick={() => onPageChange(item)}
                aria-current={item === page ? 'page' : undefined}
                className={`grid h-8 min-w-8 place-items-center rounded-lg border px-2 text-xs font-semibold transition ${
                  item === page
                    ? 'border-league-red bg-league-red text-white'
                    : 'border-white/10 text-mist-300 hover:bg-white/[0.06] hover:text-white'
                }`}
              >
                {item}
              </button>
            </span>
          )
        })}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pageCount}
          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 text-mist-300 transition hover:bg-white/[0.06] hover:text-white disabled:pointer-events-none disabled:opacity-40"
          aria-label="Página siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
