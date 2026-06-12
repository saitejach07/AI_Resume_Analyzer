type StatPillProps = {
  label: string
  value: string
}

export function StatPill({ label, value }: StatPillProps) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-950/55 px-3 py-2 shadow-sm shadow-black/20">
      <p className="text-[11px] font-medium text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-100">{value}</p>
    </div>
  )
}
