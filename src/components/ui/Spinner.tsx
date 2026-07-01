export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted" role="status">
      <span className="size-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
      {label ?? 'Loading…'}
    </div>
  )
}
