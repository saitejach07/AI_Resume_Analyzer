import type { UnwantedBulletsResponse } from '../../types/analyzer'

type UnwantedBulletsPanelProps = {
  result: UnwantedBulletsResponse
  wide?: boolean
  embedded?: boolean
}

export function UnwantedBulletsPanel({
  result,
  wide = false,
  embedded = false,
}: UnwantedBulletsPanelProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-50">Unwanted bullet points</h2>
        <span className="rounded-full bg-amber-400/12 px-3 py-1 text-xs font-semibold text-amber-300">
          {result.unwantedBullets.length}
        </span>
      </div>

      {result.unwantedBullets.length ? (
        <div className={`mt-4 grid gap-4 ${wide ? 'xl:grid-cols-2' : ''}`}>
          {result.unwantedBullets.map((item, index) => (
            <article
              key={`${item.company}-${item.bullet}-${index}`}
              className="result-card border-amber-400/25"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-50">
                    {item.company}
                  </h3>
                  <span className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-1 text-xs font-medium text-amber-300">
                    {item.riskLevel || 'low'} risk
                  </span>
                </div>
                {item.heading && (
                  <p className="text-xs text-slate-400">{item.heading}</p>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-200">
                {item.bullet}
              </p>

              {item.reason && (
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {item.reason}
                </p>
              )}

              {item.atsImpact && (
                <p className="mt-2 text-xs font-medium leading-5 text-amber-300">
                  {item.atsImpact}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          No low-value work experience bullets were identified.
        </p>
      )}
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return (
    <section className={`glass-panel animate-rise border-amber-400/25 p-5 ${wide ? 'lg:col-span-12' : ''}`}>
      {content}
    </section>
  )
}
