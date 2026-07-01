import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BrandStore } from '@/types/api'
import { api } from '@/lib/api'
import {
  listBrandStores,
  listAdminBrandStores,
  createBrandStore,
  updateBrandStore,
  deleteBrandStore,
} from './brandStoreService'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const ADIDAS: BrandStore = {
  id: 1,
  name: 'Adidas',
  caption: 'Official store',
  logo_url: 'http://localhost/storage/brand-stores/adidas.png',
  link_url: 'https://example.com/adidas',
  position: 0,
  is_active: true,
}

const wrapped = (rows: BrandStore[]) => ({ data: { data: rows } })

describe('brandStoreService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists active brand stores from the public endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue(wrapped([ADIDAS]))
    const result = await listBrandStores()
    expect(result).toEqual([ADIDAS])
    expect(api.get).toHaveBeenCalledWith('/brand-stores')
  })

  it('reads the admin list from the admin endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue(wrapped([ADIDAS]))
    await listAdminBrandStores()
    expect(api.get).toHaveBeenCalledWith('/admin/brand-stores')
  })

  it('creates via multipart POST with the logo file', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: ADIDAS } })
    const logo = new File(['x'], 'adidas.png', { type: 'image/png' })

    await createBrandStore({ name: 'Adidas', is_active: true, logo })

    const [url, body] = vi.mocked(api.post).mock.calls[0]!
    expect(url).toBe('/admin/brand-stores')
    const fd = body as FormData
    expect(fd.get('name')).toBe('Adidas')
    expect(fd.get('is_active')).toBe('1')
    expect(fd.get('logo')).toBeInstanceOf(File)
    expect(fd.get('_method')).toBeNull()
  })

  it('updates via POST with _method=PUT', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: ADIDAS } })
    await updateBrandStore(4, { name: 'Nike', is_active: false })
    const [url, body] = vi.mocked(api.post).mock.calls[0]!
    expect(url).toBe('/admin/brand-stores/4')
    const fd = body as FormData
    expect(fd.get('_method')).toBe('PUT')
    expect(fd.get('is_active')).toBe('0')
  })

  it('deletes by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: null })
    await deleteBrandStore(9)
    expect(api.delete).toHaveBeenCalledWith('/admin/brand-stores/9')
  })
})
