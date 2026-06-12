type RoleSummaryCardProps = {
  detectedRole: string
  jobDomain?: string
  showAdvanced: boolean
  isFocusMode: boolean
  onToggleAdvanced: () => void
}

export function RoleSummaryCard({
  detectedRole,
  jobDomain,
  showAdvanced,
  isFocusMode,
  onToggleAdvanced,
}: RoleSummaryCardProps) {
  return (
    <section className={`glass-panel depth-panel p-5 ${isFocusMode ? 'lg:col-span-7' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">Detected role</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-50">
            {detectedRole || 'Unknown'}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {jobDomain || 'Domain not detected'}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleAdvanced}
          className="button-secondary min-h-10 shrink-0 px-4"
        >
          {showAdvanced ? 'Hide overview' : 'Advanced overview'}
        </button>
      </div>
    </section>
  )
}
