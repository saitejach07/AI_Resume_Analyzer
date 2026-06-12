type MetricCardProps = {
  label: string
  value: string
}

export function MetricCard({ label, value }: MetricCardProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/45 p-4 shadow-sm shadow-black/20">
      <p className="text-xs font-medium uppercase tracking-normal text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-50">{value}</p>
    </div>
  )
}
