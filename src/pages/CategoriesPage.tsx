import { useState, type FormEvent } from 'react'
import type { Category } from '@/types/api'
import {
  useAdminCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/features/categories/useCategoriesAdmin'
import type { CategoryInput } from '@/features/categories/categoryService'
import { Spinner } from '@/components/ui/Spinner'
import { apiErrorMessage } from '@/lib/api'

// 'new' with no parent, 'new' under a given parent id, editing an existing
// node by id, or nothing open.
type Editing = { id: number | 'new'; parentId: number | null } | null

export function CategoriesPage() {
  const { data: categories, isLoading, error } = useAdminCategories()
  const create = useCreateCategory()
  const update = useUpdateCategory()
  const remove = useDeleteCategory()

  const [editing, setEditing] = useState<Editing>(null)
  const [name, setName] = useState('')

  const startCreate = (parentId: number | null) => {
    setEditing({ id: 'new', parentId })
    setName('')
  }
  const startEdit = (category: Category, parentId: number | null) => {
    setEditing({ id: category.id, parentId })
    setName(category.name)
  }
  const cancel = () => setEditing(null)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!editing) return
    const input: CategoryInput = { name: name.trim(), parent_id: editing.parentId }
    const done = { onSuccess: () => setEditing(null) }
    if (editing.id === 'new') create.mutate(input, done)
    else update.mutate({ id: editing.id, input }, done)
  }

  const handleDelete = (category: Category) => {
    if (!window.confirm(`Delete "${category.name}"?`)) return
    remove.mutate(category.id)
  }

  const pending = create.isPending || update.isPending
  const mutationError = create.error ?? update.error ?? remove.error

  return (
    <div>
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Categories</h1>
          <p className="text-sm text-muted">Organize the storefront taxonomy — up to one level deep.</p>
        </div>
        <button
          type="button"
          onClick={() => startCreate(null)}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700"
        >
          New category
        </button>
      </header>

      {mutationError ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(mutationError, 'Could not save the category.')}
        </p>
      ) : null}

      {editing && editing.id === 'new' && editing.parentId === null ? (
        <CategoryForm
          name={name}
          onChange={setName}
          onSubmit={submit}
          onCancel={cancel}
          pending={pending}
          isNew
        />
      ) : null}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {isLoading ? (
          <div className="px-4 py-6">
            <Spinner label="Loading categories…" />
          </div>
        ) : error ? (
          <p className="px-4 py-6 text-sm text-red-700" role="alert">
            {apiErrorMessage(error, 'Could not load categories.')}
          </p>
        ) : categories && categories.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {categories.map((category) => (
              <li key={category.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-ink">{category.name}</span>
                  <div className="flex gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => startCreate(category.id)}
                      className="font-medium text-brand-700 hover:underline"
                    >
                      Add sub-category
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(category, null)}
                      className="font-medium text-slate-600 hover:underline"
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(category)}
                      disabled={remove.isPending}
                      className="font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editing && editing.id === category.id && editing.parentId === null ? (
                  <div className="mt-3">
                    <CategoryForm
                      name={name}
                      onChange={setName}
                      onSubmit={submit}
                      onCancel={cancel}
                      pending={pending}
                      isNew={false}
                    />
                  </div>
                ) : null}

                {editing && editing.id === 'new' && editing.parentId === category.id ? (
                  <div className="mt-3 pl-4">
                    <CategoryForm
                      name={name}
                      onChange={setName}
                      onSubmit={submit}
                      onCancel={cancel}
                      pending={pending}
                      isNew
                    />
                  </div>
                ) : null}

                {category.children && category.children.length > 0 ? (
                  <ul className="mt-3 space-y-2 border-l border-slate-100 pl-4">
                    {category.children.map((child) => (
                      <li key={child.id}>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-700">{child.name}</span>
                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => startEdit(child, category.id)}
                              className="font-medium text-slate-600 hover:underline"
                            >
                              Rename
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(child)}
                              disabled={remove.isPending}
                              className="font-medium text-red-600 hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                        {editing && editing.id === child.id ? (
                          <div className="mt-2">
                            <CategoryForm
                              name={name}
                              onChange={setName}
                              onSubmit={submit}
                              onCancel={cancel}
                              pending={pending}
                              isNew={false}
                            />
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="px-4 py-6 text-sm text-muted">No categories yet.</p>
        )}
      </div>
    </div>
  )
}

interface FormProps {
  name: string
  onChange: (name: string) => void
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
  pending: boolean
  isNew: boolean
}

function CategoryForm({ name, onChange, onSubmit, onCancel, pending, isNew }: FormProps) {
  return (
    <form onSubmit={onSubmit} className="mb-4 flex items-end gap-3 rounded-lg bg-slate-50 p-3">
      <label className="flex-1 text-sm">
        <span className="font-medium text-slate-700">{isNew ? 'New category name' : 'Name'}</span>
        <input
          required
          autoFocus
          value={name}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
      >
        {pending ? 'Saving…' : isNew ? 'Create' : 'Save'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Cancel
      </button>
    </form>
  )
}
