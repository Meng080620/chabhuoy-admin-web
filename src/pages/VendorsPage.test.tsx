import type { ReactNode } from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Paginated, Vendor } from '@/types/api'
import * as vendorService from '@/features/vendors/vendorService'
import { VendorsPage } from './VendorsPage'

vi.mock('@/features/vendors/vendorService')

const page = (vendors: Vendor[]): Paginated<Vendor> => ({
  data: vendors,
  links: { first: null, last: null, prev: null, next: null },
  meta: {
    current_page: 1,
    from: 1,
    last_page: 1,
    path: '',
    per_page: 15,
    to: vendors.length,
    total: vendors.length,
  },
})

const ACME: Vendor = { id: 'v1', name: 'Acme Co.', status: 'pending', commission_rate: '10.00' }
const BETA: Vendor = { id: 'v2', name: 'Beta LLC', status: 'active' }

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  return render(<VendorsPage />, { wrapper })
}

// Locate the <tr> that contains a given vendor name, so assertions/clicks are
// scoped to one row (the badge text "active" also appears as a filter button).
function rowFor(name: string) {
  const cell = screen.getByText(name)
  const row = cell.closest('tr')
  if (!row) throw new Error(`No row for ${name}`)
  return within(row)
}

describe('VendorsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(vendorService.listVendors).mockResolvedValue(page([ACME, BETA]))
  })

  it('renders a row per vendor with status-appropriate actions', async () => {
    renderPage()

    await waitFor(() => expect(screen.getByText('Acme Co.')).toBeInTheDocument())

    // pending → Approve + Suspend; active → Suspend only.
    expect(rowFor('Acme Co.').getByRole('button', { name: 'Approve' })).toBeInTheDocument()
    expect(rowFor('Acme Co.').getByRole('button', { name: 'Suspend' })).toBeInTheDocument()
    expect(rowFor('Beta LLC').queryByRole('button', { name: 'Approve' })).toBeNull()
    expect(rowFor('Beta LLC').getByRole('button', { name: 'Suspend' })).toBeInTheDocument()
  })

  it('approving a vendor calls the service and optimistically flips the badge', async () => {
    // Hold the request open so the optimistic state stays observable.
    vi.mocked(vendorService.updateVendorStatus).mockReturnValue(
      new Promise<Vendor>(() => {}),
    )
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Acme Co.')).toBeInTheDocument())
    expect(rowFor('Acme Co.').getByText('pending')).toBeInTheDocument()

    await user.click(rowFor('Acme Co.').getByRole('button', { name: 'Approve' }))

    expect(vendorService.updateVendorStatus).toHaveBeenCalledWith('v1', 'active')
    await waitFor(() =>
      expect(rowFor('Acme Co.').getByText('active')).toBeInTheDocument(),
    )
  })

  it('selecting a status filter refetches scoped to that status', async () => {
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(vendorService.listVendors).toHaveBeenCalled())
    // initial "all" filter sends no status
    expect(vendorService.listVendors).toHaveBeenLastCalledWith(
      expect.objectContaining({ status: undefined, page: 1 }),
    )

    await user.click(screen.getByRole('button', { name: 'suspended' }))

    await waitFor(() =>
      expect(vendorService.listVendors).toHaveBeenLastCalledWith(
        expect.objectContaining({ status: 'suspended', page: 1 }),
      ),
    )
  })

  it('saves a new commission rate and reflects the server-returned value', async () => {
    vi.mocked(vendorService.updateVendorCommission).mockResolvedValue({
      ...ACME,
      commission_rate: '15.00',
    })
    const user = userEvent.setup()
    renderPage()

    await waitFor(() => expect(screen.getByText('Acme Co.')).toBeInTheDocument())
    const input = rowFor('Acme Co.').getByLabelText('Commission rate for vendor v1')
    expect(input).toHaveValue(10)

    // The Save button stays disabled until the value actually changes.
    expect(rowFor('Acme Co.').getByRole('button', { name: 'Save' })).toBeDisabled()

    await user.clear(input)
    await user.type(input, '15')
    await user.click(rowFor('Acme Co.').getByRole('button', { name: 'Save' }))

    expect(vendorService.updateVendorCommission).toHaveBeenCalledWith('v1', 15)
    await waitFor(() =>
      expect(rowFor('Acme Co.').getByRole('button', { name: 'Save' })).toBeDisabled(),
    )
  })
})
