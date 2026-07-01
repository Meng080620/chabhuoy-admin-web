import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Banner } from '@/types/api'
import * as bannerService from '@/features/banners/bannerService'
import { BannersPage } from './BannersPage'

vi.mock('@/features/banners/bannerService')

const HERO: Banner = {
  id: 1,
  type: 'hero',
  title: 'Summer Sale',
  subtitle: 'Up to 50% off',
  image_url: null,
  link_url: null,
  cta_label: null,
  position: 0,
  is_active: true,
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<BannersPage />, { wrapper })
}

describe('BannersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(bannerService.listAdminBanners).mockResolvedValue([HERO])
  })

  it('creating a banner closes the form and refetches the list on success', async () => {
    vi.mocked(bannerService.createBanner).mockResolvedValue({
      ...HERO,
      id: 2,
      title: 'New Drop',
    })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Summer Sale')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'New banner' }))
    expect(screen.getByRole('heading', { name: 'New banner' })).toBeInTheDocument()

    await user.type(screen.getByLabelText('Title'), 'New Drop')
    await user.click(screen.getByRole('button', { name: 'Create banner' }))

    await waitFor(() => expect(bannerService.createBanner).toHaveBeenCalled())
    // Form closes on success.
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'New banner' })).toBeNull(),
    )
    // Mutation settling invalidates the admin list, triggering a refetch.
    await waitFor(() =>
      expect(vi.mocked(bannerService.listAdminBanners).mock.calls.length).toBeGreaterThan(1),
    )
  })

  it('editing a banner prefills the draft from the row', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Summer Sale')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    expect(screen.getByLabelText('Title')).toHaveValue('Summer Sale')
    expect(screen.getByLabelText('Subtitle')).toHaveValue('Up to 50% off')
  })

  it('deleting asks for confirmation and only calls the mutation once confirmed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Summer Sale')).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(confirmSpy).toHaveBeenCalled()
    expect(bannerService.deleteBanner).not.toHaveBeenCalled()

    confirmSpy.mockReturnValue(true)
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(bannerService.deleteBanner).toHaveBeenCalledWith(1)
  })
})
