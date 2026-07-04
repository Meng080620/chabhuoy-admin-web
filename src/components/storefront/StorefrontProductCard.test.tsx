import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { Product } from '@/types/api'
import { StorefrontProductCard } from './StorefrontProductCard'

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'uuid-1',
    name: 'Kampot Pepper 100g',
    slug: 'kampot-pepper-100g',
    description: null,
    price: '4.50',
    stock: 10,
    in_stock: true,
    is_active: true,
    image_url: null,
    created_at: '2026-07-01T00:00:00Z',
    ...overrides,
  }
}

function renderCard(p: Product) {
  return render(
    <MemoryRouter>
      <StorefrontProductCard product={p} />
    </MemoryRouter>,
  )
}

describe('StorefrontProductCard imagery', () => {
  it('renders the admin-uploaded image when the API provides one', () => {
    renderCard(product({ image_url: 'http://localhost:8000/storage/products/pepper.jpg' }))
    const img = screen.getByRole('img', { name: 'Kampot Pepper 100g' })
    expect(img).toHaveAttribute('src', 'http://localhost:8000/storage/products/pepper.jpg')
  })

  it('renders a neutral placeholder — never a stock photo — when no image was uploaded', () => {
    renderCard(product({ image_url: null }))
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByTestId('product-image-placeholder')).toBeInTheDocument()
  })
})
