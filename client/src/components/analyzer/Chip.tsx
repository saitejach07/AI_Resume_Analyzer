type ChipProps = {
  children: string
  intent: 'neutral' | 'danger' | 'success'
}

export function Chip({ children, intent }: ChipProps) {
  const className = {
    neutral: 'border-slate-600 bg-slate-900/70 text-slate-200',
    danger: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
    success: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  }[intent]

  return (
    <span className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition duration-200 hover:-translate-y-0.5 ${className}`}>
      {children}
    </span>
  )
}
