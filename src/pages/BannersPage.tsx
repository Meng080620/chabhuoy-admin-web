import { useEffect, useRef, useState, type FormEvent } from 'react'
import { BANNER_TYPES, type Banner, type BannerType } from '@/types/api'
import {
  useAdminBanners,
  useCreateBanner,
  useUpdateBanner,
  useDeleteBanner,
} from '@/features/banners/useBanners'
import type { BannerInput } from '@/features/banners/bannerService'
import { Spinner } from '@/components/ui/Spinner'
import { ImageIcon } from '@/components/ui/icons'
import { apiErrorMessage } from '@/lib/api'

const TYPE_HINT: Record<BannerType, string> = {
  hero: 'Full-width carousel at the top of the homepage.',
  promo: 'Small promo tiles below the hero.',
  eco: 'Eco / sustainability band.',
  seasonal: 'Seasonal ribbon (Ramadan, New Year…).',
}

type Draft = {
  type: BannerType
  title: string
  subtitle: string
  cta_label: string
  link_url: string
  position: string
  is_active: boolean
  image: File | null
}

const emptyDraft = (): Draft => ({
  type: 'hero',
  title: '',
  subtitle: '',
  cta_label: '',
  link_url: '',
  position: '0',
  is_active: true,
  image: null,
})

const draftFrom = (b: Banner): Draft => ({
  type: b.type,
  title: b.title,
  subtitle: b.subtitle ?? '',
  cta_label: b.cta_label ?? '',
  link_url: b.link_url ?? '',
  position: String(b.position),
  is_active: b.is_active,
  image: null,
})

/** Trim scalars, coerce the numeric field, drop empties to null for the API. */
function toInput(d: Draft): BannerInput {
  return {
    type: d.type,
    title: d.title.trim(),
    subtitle: d.subtitle.trim() || null,
    cta_label: d.cta_label.trim() || null,
    link_url: d.link_url.trim() || null,
    position: Number(d.position) || 0,
    is_active: d.is_active,
    image: d.image,
  }
}

export function BannersPage() {
  const { data: banners, isLoading, error } = useAdminBanners()
  const create = useCreateBanner()
  const update = useUpdateBanner()
  const remove = useDeleteBanner()

  // null = not editing; number = editing that id; 'new' = creating.
  const [editing, setEditing] = useState<number | 'new' | null>(null)
  const [draft, setDraft] = useState<Draft>(emptyDraft)

  const startCreate = () => {
    setEditing('new')
    setDraft(emptyDraft())
  }
  const startEdit = (b: Banner) => {
    setEditing(b.id)
    setDraft(draftFrom(b))
  }
  const cancel = () => setEditing(null)

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
          <h1 className="text-2xl font-bold text-ink">Storefront banners</h1>
          <p className="text-sm text-muted">
            Hero, promo, eco and seasonal blocks shown on the customer homepage.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          New banner
        </button>
      </header>

      {mutationError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(mutationError, 'Could not save the banner.')}
        </p>
      ) : null}

      {editing !== null ? (
        <BannerForm
          draft={draft}
          onChange={setDraft}
          onSubmit={submit}
          onCancel={cancel}
          pending={pending}
          isNew={editing === 'new'}
        />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading banners…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load banners.')}
          </p>
        ) : banners && banners.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Preview</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Pos</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {banners.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <Thumb url={b.image_url} alt={b.title} />
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{b.title}</p>
                    {b.subtitle ? <p className="text-xs text-muted">{b.subtitle}</p> : null}
                  </td>
                  <td className="px-4 py-3 capitalize text-slate-600">{b.type}</td>
                  <td className="px-4 py-3 text-slate-600">{b.position}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        b.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {b.is_active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => startEdit(b)}
                      className="mr-2 text-sm font-medium text-brand-700 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        // Hard-deletes the row and the uploaded image file —
                        // irreversible, so a misclick shouldn't be enough.
                        if (window.confirm(`Delete "${b.title}"? This cannot be undone.`)) {
                          remove.mutate(b.id)
                        }
                      }}
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
            No banners yet. Create one to populate the storefront homepage.
          </div>
        )}
      </div>
    </div>
  )
}

function Thumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex size-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        <ImageIcon className="size-5" />
      </div>
    )
  }
  return <img src={url} alt={alt} className="size-12 rounded-lg object-cover" />
}

interface FormProps {
  draft: Draft
  onChange: (d: Draft) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  pending: boolean
  isNew: boolean
}

function BannerForm({ draft, onChange, onSubmit, onCancel, pending, isNew }: FormProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)

  // Revoke the object URL when the chosen file changes or the form unmounts —
  // otherwise each new selection leaks a blob URL.
  useEffect(() => {
    if (!draft.image) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(draft.image)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [draft.image])

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => onChange({ ...draft, [key]: value })
  const field = 'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100'

  return (
    <form
      onSubmit={onSubmit}
      className="mb-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <h2 className="text-sm font-semibold text-ink">{isNew ? 'New banner' : 'Edit banner'}</h2>
      </div>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Slot type</span>
        <select
          value={draft.type}
          onChange={(e) => set('type', e.target.value as BannerType)}
          className={field}
        >
          {BANNER_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <span className="mt-1 block text-xs text-muted">{TYPE_HINT[draft.type]}</span>
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
        <span className="mt-1 block text-xs text-muted">Lower shows first within the slot.</span>
      </label>

      <label className="block text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Title</span>
        <input
          required
          value={draft.title}
          onChange={(e) => set('title', e.target.value)}
          className={field}
        />
      </label>

      <label className="block text-sm sm:col-span-2">
        <span className="font-medium text-slate-700">Subtitle</span>
        <input
          value={draft.subtitle}
          onChange={(e) => set('subtitle', e.target.value)}
          className={field}
        />
      </label>

      <label className="block text-sm">
        <span className="font-medium text-slate-700">Button label</span>
        <input
          value={draft.cta_label}
          onChange={(e) => set('cta_label', e.target.value)}
          placeholder="Shop now"
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
        <span className="font-medium text-slate-700">Image</span>
        <div className="mt-1 flex items-center gap-4">
          {preview ? (
            <img src={preview} alt="Preview" className="h-16 w-28 rounded-lg object-cover" />
          ) : (
            <div className="flex h-16 w-28 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
              <ImageIcon className="size-6" />
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => set('image', e.target.files?.[0] ?? null)}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-200"
          />
        </div>
        {!isNew ? (
          <span className="mt-1 block text-xs text-muted">Leave empty to keep the current image.</span>
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
          {pending ? 'Saving…' : isNew ? 'Create banner' : 'Save changes'}
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
