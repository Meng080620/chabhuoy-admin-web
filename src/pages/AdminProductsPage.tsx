import { useEffect, useState } from 'react'
import { PRODUCT_STATUSES, type Product, type ProductStatus } from '@/types/api'
import {
  useAdminProducts,
  useRemoveProductImage,
  useUpdateProductVisibility,
  useUploadProductImage,
} from '@/features/products/useProducts'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { ImageIcon } from '@/components/ui/icons'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

type Filter = ProductStatus | 'all'
const FILTERS: Filter[] = ['all', ...PRODUCT_STATUSES]

export function AdminProductsPage() {
  const [filter, setFilter] = useState<Filter>('all')
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const id = setTimeout(() => {
      setSearch(input.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(id)
  }, [input])

  // The product whose image is being managed in the modal (null = closed).
  const [managing, setManaging] = useState<Product | null>(null)

  const { data, isLoading, isFetching, error } = useAdminProducts({
    status: filter === 'all' ? undefined : filter,
    search,
    page,
    perPage: 20,
  })
  const updateVisibility = useUpdateProductVisibility()

  const selectFilter = (next: Filter) => {
    setFilter(next)
    setPage(1)
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Products</h1>
        <p className="text-sm text-muted">
          Moderate every vendor's catalogue — enable or disable listings storefront-wide.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => selectFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition ${
                filter === f ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name or uuid…"
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </div>

      {updateVisibility.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(updateVisibility.error, 'Could not update the product.')}
        </p>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading products…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load products.')}
          </p>
        ) : data && data.data.length > 0 ? (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Image</th>
                  <th className="px-4 py-2 font-medium">Product</th>
                  <th className="px-4 py-2 font-medium">Vendor</th>
                  <th className="px-4 py-2 font-medium">Category</th>
                  <th className="px-4 py-2 text-right font-medium">Price</th>
                  <th className="px-4 py-2 text-right font-medium">Stock</th>
                  <th className="px-4 py-2 font-medium">Status</th>
                  <th className="px-4 py-2 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((product) => {
                  // Only the row whose mutation is in flight should freeze;
                  // other rows stay actionable.
                  const isMutatingRow =
                    updateVisibility.isPending && updateVisibility.variables?.id === product.id

                  return (
                    <tr key={product.id}>
                      <td className="px-4 py-3">
                        <Thumbnail url={product.image_url} alt={product.name} />
                      </td>
                      <td className="px-4 py-3 font-medium text-ink">{product.name}</td>
                      <td className="px-4 py-3 text-slate-600">{product.vendor?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{product.category?.name ?? '—'}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">{product.stock}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.is_active
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setManaging(product)}
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Image
                          </button>
                          <button
                            type="button"
                            disabled={isMutatingRow}
                            onClick={() =>
                              updateVisibility.mutate({
                                id: product.id,
                                isActive: !product.is_active,
                              })
                            }
                            className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                          >
                            {product.is_active ? 'Disable' : 'Enable'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            <Pagination meta={data.meta} onPage={setPage} isFetching={isFetching} />
          </>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">No products match this filter.</p>
        )}
      </div>

      {managing ? (
        <ProductImageManager product={managing} onClose={() => setManaging(null)} />
      ) : null}
    </div>
  )
}

function Thumbnail({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex size-10 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <ImageIcon className="size-5" />
      </div>
    )
  }
  return <img src={url} alt={alt} className="size-10 rounded-lg object-cover" />
}

interface ManagerProps {
  product: Product
  onClose: () => void
}

/**
 * Per-product image manager. Upload replaces any existing image server-side;
 * remove is only offered when one is set. Both close the modal on success —
 * the list invalidates and the row thumbnail refreshes from the refetch.
 */
function ProductImageManager({ product, onClose }: ManagerProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const upload = useUploadProductImage()
  const remove = useRemoveProductImage()

  // Revoke the object URL when the chosen file changes or the modal unmounts —
  // otherwise each selection leaks a blob URL. Guarded because jsdom (tests)
  // doesn't implement createObjectURL.
  useEffect(() => {
    if (!file || typeof URL.createObjectURL !== 'function') {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const pending = upload.isPending || remove.isPending
  const error = upload.error ?? remove.error
  const shown = preview ?? product.image_url

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Image for ${product.name}`}
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-sm font-semibold text-ink">Product image</h2>
        <p className="mt-0.5 text-xs text-muted">{product.name}</p>

        <div className="mt-4 flex items-center gap-4">
          {shown ? (
            <img src={shown} alt={product.name} className="h-24 w-24 rounded-lg object-cover" />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ImageIcon className="size-7" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            aria-label="Choose image file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
        </div>

        {error ? (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not update the image.')}
          </p>
        ) : null}

        <div className="mt-6 flex items-center justify-between gap-3">
          <div>
            {product.image_url ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => remove.mutate(product.id, { onSuccess: onClose })}
                className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
              >
                Remove image
              </button>
            ) : null}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!file || pending}
              onClick={() =>
                file && upload.mutate({ id: product.id, image: file }, { onSuccess: onClose })
              }
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {upload.isPending ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
