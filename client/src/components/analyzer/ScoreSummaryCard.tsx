import { MetricCard } from './MetricCard'
import { ScoreRing } from './ScoreRing'

type ScoreSummaryCardProps = {
  overallMatch?: number
  requiredMatch?: number
  preferredMatch?: number
  missingTotal: number
  scoreTone: string
  isFocusMode: boolean
}

export function ScoreSummaryCard({
  overallMatch,
  requiredMatch,
  preferredMatch,
  missingTotal,
  scoreTone,
  isFocusMode,
}: ScoreSummaryCardProps) {
  const hasResult =
    overallMatch !== undefined &&
    requiredMatch !== undefined &&
    preferredMatch !== undefined

  return (
    <section className={`glass-panel depth-panel p-5 ${isFocusMode ? 'lg:col-span-5' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">Overall match</p>
          <p className="mt-1 text-sm text-slate-400">
            {hasResult ? `${missingTotal} missing skills detected` : 'Waiting for resume and JD.'}
          </p>
        </div>
        <ScoreRing score={overallMatch} tone={scoreTone} />
      </div>

      {hasResult ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <MetricCard label="Required" value={`${requiredMatch}%`} />
          <MetricCard label="Preferred" value={`${preferredMatch}%`} />
        </div>
      ) : (
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-800">
          <div className="shimmer h-full w-1/2 rounded-full bg-slate-600" />
        </div>
      )}
    </section>
  )
}
