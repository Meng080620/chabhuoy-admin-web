import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '@/features/cart/useCart'
import { useAddresses, useCreateAddress } from '@/features/addresses/useAddresses'
import { usePlaceOrder } from '@/features/checkout/useCheckout'
import { PAYMENT_METHODS, type Address, type PaymentMethod } from '@/types/api'
import { Spinner } from '@/components/ui/Spinner'
import { formatCurrency } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  card: 'Credit / Debit Card',
  qr: 'QR Payment',
  cod: 'Cash on Delivery',
}

export function CheckoutPage() {
  const navigate = useNavigate()
  const cart = useCart()
  const addresses = useAddresses()
  const placeOrder = usePlaceOrder()

  const [addressId, setAddressId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card')

  // Default the selection to the user's default address once they load.
  useEffect(() => {
    if (addressId === null && addresses.data && addresses.data.length > 0) {
      const fallback = addresses.data.find((a) => a.is_default) ?? addresses.data[0]
      if (fallback) setAddressId(fallback.id)
    }
  }, [addresses.data, addressId])

  if (cart.isLoading || addresses.isLoading) return <Spinner label="Loading checkout…" />

  const items = cart.data?.items ?? []
  if (items.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="font-display text-2xl font-bold text-night-900">Checkout</h1>
        <p className="mt-2 text-sm text-night-600">Your cart is empty.</p>
        <Link to="/" className="mt-4 inline-block text-sm font-medium text-kram-700">
          ← Back to shop
        </Link>
      </div>
    )
  }

  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.unit_price) * item.quantity,
    0,
  )
  const hasAddresses = (addresses.data?.length ?? 0) > 0

  const submit = () => {
    if (!addressId) return
    placeOrder.mutate(
      { payment_method: paymentMethod, address_id: addressId },
      { onSuccess: (order) => navigate(`/orders/${order.id}`, { replace: true }) },
    )
  }

  return (
    <div className="grid max-w-4xl gap-8 lg:grid-cols-[1fr_20rem]">
      <div>
        <h1 className="mb-6 font-display text-2xl font-bold text-night-900">Checkout</h1>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-night-600">
            Shipping address
          </h2>
          {hasAddresses ? (
            <ul className="space-y-2">
              {addresses.data!.map((address) => (
                <li key={address.id}>
                  <label className="flex cursor-pointer gap-3 rounded-lg border border-plaster-200 bg-white p-3 text-sm has-[:checked]:border-kram-600 has-[:checked]:ring-2 has-[:checked]:ring-kram-100">
                    <input
                      type="radio"
                      name="address"
                      className="mt-1"
                      checked={addressId === address.id}
                      onChange={() => setAddressId(address.id)}
                    />
                    <span>
                      <span className="font-medium text-night-900">{address.recipient_name}</span>
                      {address.is_default ? (
                        <span className="ml-2 rounded bg-plaster-100 px-1.5 py-0.5 text-xs text-night-600">
                          Default
                        </span>
                      ) : null}
                      <span className="block text-night-600">
                        {address.line1}
                        {address.line2 ? `, ${address.line2}` : ''}, {address.city}{' '}
                        {address.postal_code}, {address.country}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mb-3 text-sm text-night-600">
              Add a shipping address to continue.
            </p>
          )}

          <AddressForm onCreated={(address) => setAddressId(address.id)} />
        </section>

        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-night-600">
            Payment method
          </h2>
          <div className="space-y-2">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-plaster-200 bg-white p-3 text-sm has-[:checked]:border-kram-600 has-[:checked]:ring-2 has-[:checked]:ring-kram-100"
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === method}
                  onChange={() => setPaymentMethod(method)}
                />
                <span className="font-medium text-night-900">{PAYMENT_LABELS[method]}</span>
              </label>
            ))}
          </div>
        </section>
      </div>

      <aside className="h-fit rounded-xl border border-plaster-200 bg-white p-5">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-night-600">
          Order summary
        </h2>
        <ul className="space-y-2 text-sm">
          {items.map((item) => (
            <li key={item.product_id} className="flex justify-between gap-2">
              <span className="min-w-0 truncate text-night-700">
                {item.name} × {item.quantity}
              </span>
              <span className="text-night-900">
                {formatCurrency(Number(item.unit_price) * item.quantity)}
              </span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-plaster-100 pt-4">
          <span className="font-medium text-night-900">Total</span>
          <span className="text-lg font-semibold text-night-900">{formatCurrency(subtotal)}</span>
        </div>

        {placeOrder.isError ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {apiErrorMessage(placeOrder.error, 'Could not place your order.')}
          </p>
        ) : null}

        <button
          type="button"
          onClick={submit}
          disabled={!addressId || placeOrder.isPending}
          className="mt-4 w-full rounded-lg bg-kram-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-kram-700 disabled:opacity-60"
        >
          {placeOrder.isPending ? 'Placing order…' : 'Place order'}
        </button>
      </aside>
    </div>
  )
}

const EMPTY_ADDRESS = {
  recipient_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  postal_code: '',
  country: '',
}

/** Collapsible "add a shipping address" form. Promotes the new address on save. */
function AddressForm({ onCreated }: { onCreated: (address: Address) => void }) {
  const createAddress = useCreateAddress()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_ADDRESS)

  const set = (key: keyof typeof EMPTY_ADDRESS, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const submit = (e: FormEvent) => {
    e.preventDefault()
    createAddress.mutate(
      { ...form, country: form.country.toUpperCase(), line2: form.line2 || null },
      {
        onSuccess: (address) => {
          onCreated(address)
          setForm(EMPTY_ADDRESS)
          setOpen(false)
        },
      },
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-3 text-sm font-medium text-kram-700 hover:underline"
      >
        + Add a new address
      </button>
    )
  }

  const field =
    'w-full rounded-lg border border-plaster-300 px-3 py-2 text-sm outline-none focus:border-kram-600 focus:ring-2 focus:ring-kram-100'

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 rounded-lg border border-plaster-200 bg-white p-4 sm:grid-cols-2">
      <input className={field} placeholder="Recipient name" required value={form.recipient_name} onChange={(e) => set('recipient_name', e.target.value)} />
      <input className={field} placeholder="Phone" required value={form.phone} onChange={(e) => set('phone', e.target.value)} />
      <input className={`${field} sm:col-span-2`} placeholder="Address line 1" required value={form.line1} onChange={(e) => set('line1', e.target.value)} />
      <input className={`${field} sm:col-span-2`} placeholder="Address line 2 (optional)" value={form.line2} onChange={(e) => set('line2', e.target.value)} />
      <input className={field} placeholder="City" required value={form.city} onChange={(e) => set('city', e.target.value)} />
      <input className={field} placeholder="Postal code" required value={form.postal_code} onChange={(e) => set('postal_code', e.target.value)} />
      <input className={field} placeholder="Country (e.g. KH)" required maxLength={2} value={form.country} onChange={(e) => set('country', e.target.value)} />

      {createAddress.isError ? (
        <p className="text-sm text-red-700 sm:col-span-2" role="alert">
          {apiErrorMessage(createAddress.error, 'Could not save the address.')}
        </p>
      ) : null}

      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" disabled={createAddress.isPending} className="rounded-lg bg-kram-600 px-4 py-2 text-sm font-semibold text-white hover:bg-kram-700 disabled:opacity-60">
          {createAddress.isPending ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-plaster-200 px-4 py-2 text-sm font-medium text-night-700 hover:bg-plaster-100">
          Cancel
        </button>
      </div>
    </form>
  )
}
