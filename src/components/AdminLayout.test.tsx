import type { ReactNode } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminLayout } from './AdminLayout'

function renderLayout() {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/admin']}>{children}</MemoryRouter>
    </QueryClientProvider>
  )
  return render(<AdminLayout />, { wrapper })
}

describe('AdminLayout sidebar', () => {
  it('renders grouped nav with all real routes', () => {
    renderLayout()

    expect(screen.getByRole('link', { name: /Dashboard/ })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: /Vendors/ })).toHaveAttribute('href', '/admin/vendors')
    expect(screen.getByRole('link', { name: /Orders/ })).toHaveAttribute('href', '/admin/orders')
    expect(screen.getByRole('link', { name: /Products/ })).toHaveAttribute('href', '/admin/products')
    expect(screen.getByText('Management')).toBeInTheDocument()
  })

  it('focuses search when "/" is pressed outside a field', () => {
    renderLayout()
    const search = screen.getByRole('searchbox', { name: 'Search' })

    expect(search).not.toHaveFocus()
    fireEvent.keyDown(window, { key: '/' })
    expect(search).toHaveFocus()
  })

  it('does not hijack "/" while the user is typing in a field', () => {
    renderLayout()
    const search = screen.getByRole('searchbox', { name: 'Search' })
    search.focus()

    // Already in an input → the shortcut must let the slash through, not preventDefault.
    const event = new KeyboardEvent('keydown', { key: '/', cancelable: true, bubbles: true })
    window.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(false)
  })
})
