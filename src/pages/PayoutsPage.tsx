import { useState } from 'react'
import { useVendors } from '@/features/vendors/useVendors'
import { usePayouts, useDisburseVendorPayout } from '@/features/payouts/usePayouts'
import { Spinner } from '@/components/ui/Spinner'
import { Pagination } from '@/components/ui/Pagination'
import { DisbursementStatusBadge } from '@/components/ui/DisbursementStatusBadge'
import { formatCurrency, formatDate } from '@/utils/format'
import { apiErrorMessage } from '@/lib/api'

/** A `payout_balance` truthy check that treats "0.00" (a string) as zero. */
function hasBalance(value: string | number | null | undefined): boolean {
  const n = typeof value === 'string' ? Number(value) : (value ?? 0)
  return Number.isFinite(n) && n > 0
}

export function PayoutsPage() {
  const [ledgerPage, setLedgerPage] = useState(1)

  // Active vendors only — a suspended vendor's balance is frozen, not disbursable.
  const { data: vendors, isLoading: vendorsLoading } = useVendors({ status: 'active', perPage: 100 })
  const { data: ledger, isLoading: ledgerLoading, isFetching, error: ledgerError } = usePayouts({
    page: ledgerPage,
    perPage: 20,
  })
  const disburse = useDisburseVendorPayout()

  const outstanding = (vendors?.data ?? []).filter((v) => hasBalance(v.payout_balance))

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Payouts</h1>
        <p className="text-sm text-muted">
          Disburse what's owed to vendors, and review every past settlement.
        </p>
      </header>

      {disburse.error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {apiErrorMessage(disburse.error, 'Could not disburse this payout.')}
        </p>
      ) : null}

      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">
          Outstanding balances
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {vendorsLoading ? (
            <div className="px-4 py-6">
              <Spinner label="Loading vendors…" />
            </div>
          ) : outstanding.length > 0 ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-4 py-2 font-medium">Vendor</th>
                  <th className="px-4 py-2 text-right font-medium">Balance</th>
                  <th className="px-4 py-2 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {outstanding.map((vendor) => {
                  const isMutatingRow = disburse.isPending && disburse.variables === vendor.id
                  return (
                    <tr key={vendor.id}>
                      <td className="px-4 py-3 font-medium text-ink">{vendor.name}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(vendor.payout_balance)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          disabled={isMutatingRow}
                          onClick={() => disburse.mutate(vendor.id)}
                          className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {isMutatingRow ? 'Paying out…' : 'Pay out'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <p className="px-4 py-6 text-sm text-muted">No vendor has an outstanding balance right now.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted">Payout history</h2>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {ledgerLoading ? (
            <div className="px-4 py-6">
              <Spinner label="Loading payout history…" />
            </div>
          ) : ledgerError ? (
            <p className="px-4 py-6 text-sm text-red-700" role="alert">
              {apiErrorMessage(ledgerError, 'Could not load the payout ledger.')}
            </p>
          ) : ledger && ledger.data.length > 0 ? (
            <>
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Vendor</th>
                    <th className="px-4 py-2 text-right font-medium">Amount</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Settled</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledger.data.map((payout) => (
                    <tr key={payout.id}>
                      <td className="px-4 py-3 font-medium text-ink">
                        {payout.vendor?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(payout.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <DisbursementStatusBadge status={payout.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(payout.processed_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination meta={ledger.meta} onPage={setLedgerPage} isFetching={isFetching} />
            </>
          ) : (
            <p className="px-4 py-6 text-sm text-muted">No payouts have been disbursed yet.</p>
          )}
        </div>
      </section>
    </div>
  )
}
