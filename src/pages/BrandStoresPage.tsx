import { useEffect, useState, type FormEvent } from 'react'
import type { BrandStore } from '@/types/api'
import {
  useAdminBrandStores,
  useCreateBrandStore,
  useUpdateBrandStore,
  useDeleteBrandStore,
} from '@/features/brand-stores/useBrandStores'
import type { BrandStoreInput } from '@/features/brand-stores/brandStoreService'
import { Spinner } from '@/components/ui/Spinner'
import { ImageIcon } from '@/components/ui/icons'
import { apiErrorMessage } from '@/lib/api'

type Draft = {
  name: string
  caption: string
  link_url: string
  position: string
  is_active: boolean
  logo: File | null
}

const emptyDraft = (): Draft => ({
  name: '',
  caption: '',
  link_url: '',
  position: '0',
  is_active: true,
  logo: null,
})

const draftFrom = (s: BrandStore): Draft => ({
  name: s.name,
  caption: s.caption ?? '',
  link_url: s.link_url ?? '',
  position: String(s.position),
  is_active: s.is_active,
  logo: null,
})

function toInput(d: Draft): BrandStoreInput {
  return {
    name: d.name.trim(),
    caption: d.caption.trim() || null,
    link_url: d.link_url.trim() || null,
    position: Number(d.position) || 0,
    is_active: d.is_active,
    logo: d.logo,
  }
}

export function BrandStoresPage() {
  const { data: stores, isLoading, error } = useAdminBrandStores()
  const create = useCreateBrandStore()
  const update = useUpdateBrandStore()
  const remove = useDeleteBrandStore()

  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  const startCreate = () => {
    setEditing('new')
    setDraft(emptyDraft())
  }
  const startEdit = (s: BrandStore) => {
    setEditing(s.id)
    setDraft(draftFrom(s))
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const input = toInput(draft)
    const done = { onSuccess: () => setEditing(null) }
    if (editing === 'new') create.mutate(input, done)
    else if (typeof editing === 'number') update.mutate({ id: editing, input }, done)
  }

  const pending = create.isPending || update.isPending
  const mutationError = create.error ?? update.error ?? remove.error

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Official brand stores</h1>
          <p className="text-sm text-muted">
            The brand tiles shown in the storefront homepage brand row.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          New brand store
        </button>
      </header>

      {mutationError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(mutationError, 'Could not save the brand store.')}
        </p>
      ) : null}

      {editing !== null ? (
        <BrandStoreForm
          draft={draft}
          onChange={setDraft}
          onSubmit={submit}
          onCancel={() => setEditing(null)}
          pending={pending}
          isNew={editing === 'new'}
        />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading brand stores…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load brand stores.')}
          </p>
        ) : stores && stores.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Logo</th>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Pos</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    {s.logo_url ? (
                      <img
                        src={s.logo_url}
                        alt={s.name}
                        className="size-11 rounded-lg border border-slate-200 object-contain p-1"
                      />
                    ) : (
                      <div className="flex size-11 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        <ImageIcon className="size-5" />
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{s.name}</p>
                    {s.caption ? <p className="text-xs text-muted">{s.caption}</p> : null}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{s.position}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {s.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(s)}
                      className="mr-2 text-sm font-medium text-brand-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => remove.mutate(s.id)}
                      disabled={remove.isPending}
                      className="text-sm font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="px-4 py-10 text-center text-sm text-muted">
            No brand stores yet. Create one to fill the homepage brand row.
          </div>
        )}
      </div>
    </div>
  )
}

interface FormProps {
  draft: Draft
  onChange: (d: Draft) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  pending: boolean
  isNew: boolean
}

function BrandStoreForm({ draft, onChange, onSubmit, onCancel, pending, isNew }: FormProps) {
  const [preview, setPreview] = useState<string | null>(null)

  useEffect(() => {
    if (!draft.logo) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(draft.logo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [draft.logo])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...draft, [key]: value })
  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h2 className="text-sm font-semibold text-ink">
          {isNew ? 'New brand store' : 'Edit brand store'}
        </h2>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Name</span>
        <input required value={draft.name} onChange={(e) => set('name', e.target.value)} className={field} />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Position</span>
        <input
          type="number"
          min={0}
          value={draft.position}
          onChange={(e) => set('position', e.target.value)}
          className={field}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Caption</span>
        <input
          value={draft.caption}
          onChange={(e) => set('caption', e.target.value)}
          placeholder="Official store"
          className={field}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Link URL</span>
        <input
          type="url"
          value={draft.link_url}
          onChange={(e) => set('link_url', e.target.value)}
          placeholder="https://…"
          className={field}
        />
      </label>

      <div className="text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Logo</span>
        <div className="mt-1 flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="Preview" className="size-16 rounded-lg border border-slate-200 object-contain p-1" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ImageIcon className="size-6" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => set('logo', e.target.files?.[0] ?? null)}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
        </div>
        {!isNew ? (
          <span className="mt-1 block text-xs text-muted">Leave empty to keep the current logo.</span>
        ) : null}
      </div>

      <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
        <input
          type="checkbox"
          checked={draft.is_active}
          onChange={(e) => set('is_active', e.target.checked)}
          className="size-4 rounded border-slate-300 text-brand-600 focus:ring-brand-100"
        />
        Visible on the storefront
      </label>

      <div className="flex gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {pending ? 'Saving…' : isNew ? 'Create' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
