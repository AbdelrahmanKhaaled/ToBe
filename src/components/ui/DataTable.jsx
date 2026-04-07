import { getPageNumbersCurrentLast } from '@/utils/pagination';
import { useTranslation } from 'react-i18next';

/** Get pagination link URL for a page number from API "links" (meta.links.pages or first/last). */
function getLinkUrlForPage(meta, pageNum) {
  const links = meta?.links;
  if (!links) return null;
  const pages = links.pages;
  if (Array.isArray(pages)) {
    const entry = pages.find((p) => p && Number(p.label) === pageNum);
    return entry?.url ?? null;
  }
  if (pageNum === 1 && links.first) return links.first;
  if (meta?.lastPage === pageNum && links.last) return links.last;
  return null;
}

export function DataTable({
  columns,
  data,
  meta,
  onPageChange,
  search,
  onSearchChange,
  searchPlaceholder,
  emptyMessage,
  actions,
}) {
  const { t } = useTranslation();
  const effectiveSearchPlaceholder = searchPlaceholder ?? t('dataTable.searchPlaceholder');
  const effectiveEmptyMessage = emptyMessage ?? t('dataTable.empty');

  const start =
    meta && meta.total !== 0 ? (meta.currentPage - 1) * meta.perPage + 1 : 0;
  const end = meta ? Math.min(meta.currentPage * meta.perPage, meta.total) : 0;
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] shadow-[var(--shadow)] overflow-hidden">
      {(onSearchChange || search !== undefined) && (
        <div className="p-4 border-b border-[var(--color-border)]">
          <input
            type="search"
            placeholder={effectiveSearchPlaceholder}
            value={search ?? ''}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="px-3 py-2 w-full max-w-sm rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-surface)]"
          />
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[var(--color-primary)] text-white">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-start align-middle text-sm font-medium"
                >
                  {col.header}
                </th>
              ))}
              {actions && (
                <th className="px-4 py-3 text-end align-middle text-sm font-medium">
                  {t('dataTable.actions')}
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (actions ? 1 : 0)}
                  className="px-4 py-12 text-center text-gray-500"
                >
                  {effectiveEmptyMessage}
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr key={row.id} className="border-b border-[var(--color-border)] hover:bg-[var(--color-bg-light)]">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-sm text-start align-middle break-words">
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3 text-end align-middle">{actions(row)}</td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {meta && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg-light)]">
          <span className="text-sm text-gray-600">
            {t('dataTable.showing', { start, end, total: meta.total })}
          </span>
          {onPageChange && (
            <div
              className="flex items-center gap-2 flex-wrap rounded-xl p-2"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              <button
                type="button"
                disabled={meta.currentPage <= 1}
                onClick={() => onPageChange(meta.currentPage - 1, meta.links?.prev)}
                className="min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl border border-white/40 bg-transparent text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                aria-label={t('dataTable.prevPage')}
              >
                ‹
              </button>
              {meta.lastPage > 1 ? (
                getPageNumbersCurrentLast(meta.currentPage, meta.lastPage).map((item, idx) =>
                  item === 'ellipsis' ? (
                    <span key={`ellipsis-${idx}`} className="px-1 text-white font-bold">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => onPageChange(item, getLinkUrlForPage(meta, item))}
                      className={`min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl font-bold text-white transition-colors ${
                        item === meta.currentPage
                          ? 'bg-[var(--color-accent)]'
                          : 'bg-transparent hover:bg-white/10'
                      }`}
                    >
                      {String(item).padStart(2, '0')}
                    </button>
                  )
                )
              ) : (
                <span className="min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl font-bold text-white/80">
                  {t('dataTable.singlePage', { page: meta.currentPage || 1 })}
                </span>
              )}
              <button
                type="button"
                disabled={meta.currentPage >= meta.lastPage}
                onClick={() => onPageChange(meta.currentPage + 1, meta.links?.next)}
                className="min-w-[2.5rem] h-10 flex items-center justify-center rounded-xl border border-white/40 bg-transparent text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                aria-label={t('dataTable.nextPage')}
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
