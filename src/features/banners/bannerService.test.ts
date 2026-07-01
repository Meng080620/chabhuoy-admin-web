import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Banner } from '@/types/api'
import { api } from '@/lib/api'
import {
  listBanners,
  listAdminBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} from './bannerService'

vi.mock('@/lib/api', () => ({
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

const HERO: Banner = {
  id: 1,
  type: 'hero',
  title: 'Ramadan Sale',
  subtitle: 'Up to 50% off',
  image_url: 'http://localhost/storage/banners/hero.jpg',
  link_url: 'https://example.com',
  cta_label: 'Shop now',
  position: 1,
  is_active: true,
}

const wrapped = (banners: Banner[]) => ({ data: { data: banners } })

describe('bannerService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('lists active banners and passes a type filter through', async () => {
    vi.mocked(api.get).mockResolvedValue(wrapped([HERO]))

    const result = await listBanners('hero')

    expect(result).toEqual([HERO])
    expect(api.get).toHaveBeenCalledWith('/banners', { params: { type: 'hero' } })
  })

  it('omits the type param when none is given', async () => {
    vi.mocked(api.get).mockResolvedValue(wrapped([HERO]))
    await listBanners()
    expect(api.get).toHaveBeenCalledWith('/banners', { params: undefined })
  })

  it('reads the admin list from the admin endpoint', async () => {
    vi.mocked(api.get).mockResolvedValue(wrapped([HERO]))
    await listAdminBanners()
    expect(api.get).toHaveBeenCalledWith('/admin/banners')
  })

  it('creates via multipart POST, sending the image file and scalar fields', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: HERO } })
    const image = new File(['x'], 'hero.jpg', { type: 'image/jpeg' })

    await createBanner({ type: 'hero', title: 'Ramadan Sale', is_active: true, image })

    const [url, body] = vi.mocked(api.post).mock.calls[0]!
    expect(url).toBe('/admin/banners')
    expect(body).toBeInstanceOf(FormData)
    const fd = body as FormData
    expect(fd.get('type')).toBe('hero')
    expect(fd.get('title')).toBe('Ramadan Sale')
    expect(fd.get('is_active')).toBe('1') // boolean → '1', never the string "true"
    expect(fd.get('image')).toBeInstanceOf(File)
    expect(fd.get('_method')).toBeNull() // create is a plain POST
  })

  it('updates via POST with _method=PUT so PHP keeps the uploaded file', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { data: HERO } })

    await updateBanner(7, { type: 'promo', title: 'New', is_active: false })

    const [url, body] = vi.mocked(api.post).mock.calls[0]!
    expect(url).toBe('/admin/banners/7')
    const fd = body as FormData
    expect(fd.get('_method')).toBe('PUT')
    expect(fd.get('is_active')).toBe('0')
  })

  it('deletes by id', async () => {
    vi.mocked(api.delete).mockResolvedValue({ data: null })
    await deleteBanner(3)
    expect(api.delete).toHaveBeenCalledWith('/admin/banners/3')
  })
})
