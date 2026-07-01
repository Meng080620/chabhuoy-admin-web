import type { Paginated } from '@/types/api'

interface PaginationProps {
  meta: Paginated<unknown>['meta']
  onPage: (page: number) => void
  isFetching?: boolean
}

/**
 * Server-driven pagination. Reads Laravel's `meta` envelope and emits the next
 * page number; the page itself owns the page state so the query key changes.
 */
export function Pagination({ meta, onPage, isFetching }: PaginationProps) {
  const { current_page, last_page, from, to, total } = meta

  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-sm text-muted">
      <span>
        {total === 0
          ? 'No results'
          : `Showing ${from ?? 0}–${to ?? 0} of ${total}`}
        {isFetching ? ' · updating…' : ''}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPage(current_page - 1)}
          disabled={current_page <= 1 || isFetching}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-2 py-1.5">
          Page {current_page} of {last_page}
        </span>
        <button
          type="button"
          onClick={() => onPage(current_page + 1)}
          disabled={current_page >= last_page || isFetching}
          className="rounded-lg border border-slate-200 px-3 py-1.5 font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  )
}
