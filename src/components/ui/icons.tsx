/**
 * Minimal inline-SVG icon set (stroke="currentColor" so they inherit tone).
 * No icon dependency for a handful of glyphs. 24×24, 1.8 stroke.
 */
type IconProps = { className?: string }

const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function CartIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="9" cy="20" r="1" />
      <circle cx="18" cy="20" r="1" />
      <path d="M2 3h2l2.4 12.3a1 1 0 0 0 1 .7h8.5a1 1 0 0 0 1-.8L20 7H6" />
    </svg>
  )
}

export function RevenueIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  )
}

export function AvgIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 3v18h18" />
      <path d="M7 14l3-3 3 3 5-6" />
    </svg>
  )
}

export function VendorIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 9l1.5-5h15L21 9" />
      <path d="M4 9v11h16V9" />
      <path d="M9 20v-6h6v6" />
    </svg>
  )
}

export function HomeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
      <path d="M9.5 21v-6h5v6" />
    </svg>
  )
}

export function OrdersIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M7 3h10a1 1 0 0 1 1 1v17l-3-2-3 2-3-2-3 2V4a1 1 0 0 1 1-1z" />
      <path d="M9 8h6M9 12h6" />
    </svg>
  )
}

export function BoxIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 8 12 3 3 8l9 5 9-5z" />
      <path d="M3 8v8l9 5 9-5V8" />
      <path d="M12 13v8" />
    </svg>
  )
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="m21 15-5-5L5 21" />
    </svg>
  )
}

export function CustomerIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c0-4.1 3.4-7 7.5-7s7.5 2.9 7.5 7" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.5 2.3 2.3L16 9.5" />
    </svg>
  )
}

export function TagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M20.5 12.5 12 21l-9-9 8.5-8.5H20.5z" />
      <path d="M12 3.5H20.5v8.5" />
      <circle cx="15.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function BanknoteIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="6.5" width="19" height="11" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M5.5 9.5v0M18.5 14.5v0" />
    </svg>
  )
}

export function BikeIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="5.5" cy="17.5" r="3.5" />
      <circle cx="18.5" cy="17.5" r="3.5" />
      <path d="M5.5 17.5 9 8h4l3 6.5M9 8l-1-3H6M13 8h4" />
    </svg>
  )
}
