type AnalyzeActionBarProps = {
  canAnalyze: boolean
  isLoading: boolean
}

export function AnalyzeActionBar({ canAnalyze, isLoading }: AnalyzeActionBarProps) {
  return (
    <div className="glass-panel flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
      <button
        type="submit"
        disabled={!canAnalyze}
        className="button-primary min-h-12 flex-1 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="loader-dot" />
            Analyzing resume
          </span>
        ) : (
          'Analyze ATS score'
        )}
      </button>
      <p className="text-sm text-slate-400">
        Uses the backend OpenAI flow.
      </p>
    </div>
  )
}
