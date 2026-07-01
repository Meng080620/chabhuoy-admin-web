import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Category } from '@/types/api'
import { api } from '@/lib/api'
import { listAdminCategories, createCategory, updateCategory, deleteCategory } from './categoryService'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const TEXTILES: Category = {
  id: 1,
  name: 'Textiles',
  slug: 'textiles',
  children: [{ id: 2, name: 'Scarves', slug: 'scarves' }],
}

describe('categoryService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('parses the admin tree from the admin endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [TEXTILES] } })

    const result = await listAdminCategories()

    expect(result).toEqual([TEXTILES])
    expect(api.get).toHaveBeenCalledWith('/admin/categories')
  })

  it('rejects a malformed tree rather than passing it through', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: { data: [{ id: 'not-a-number' }] } })
    await expect(listAdminCategories()).rejects.toThrow()
  })

  it('creates a category, never sending a client-derived slug', async () => {
    const created: Category = { id: 7, name: 'Khmer Silk', slug: 'khmer-silk', children: [] }
    vi.mocked(api.post).mockResolvedValue({ data: { data: created } })

    const result = await createCategory({ name: 'Khmer Silk', parent_id: 1 })

    expect(result).toEqual(created)
    expect(api.post).toHaveBeenCalledWith('/admin/categories', { name: 'Khmer Silk', parent_id: 1 })
  })

  it('updates by id, not slug', async () => {
    const updated: Category = { id: 7, name: 'Silk & Scarves', slug: 'silk-scarves', children: [] }
    vi.mocked(api.put).mockResolvedValue({ data: { data: updated } })

    await updateCategory(7, { name: 'Silk & Scarves', parent_id: null })

    expect(api.put).toHaveBeenCalledWith('/admin/categories/7', {
      name: 'Silk & Scarves',
      parent_id: null,
    })
  })

  it('deletes by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: null })
    await deleteCategory(7)
    expect(api.delete).toHaveBeenCalledWith('/admin/categories/7')
  })
})
