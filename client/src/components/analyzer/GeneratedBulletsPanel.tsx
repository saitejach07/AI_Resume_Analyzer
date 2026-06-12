import type { GenerateBulletsResponse } from '../../types/analyzer'

import { Chip } from './Chip'

type GeneratedBulletsPanelProps = {
  result: GenerateBulletsResponse
  wide?: boolean
  embedded?: boolean
}

export function GeneratedBulletsPanel({
  result,
  wide = false,
  embedded = false,
}: GeneratedBulletsPanelProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-50">Generated bullet points</h2>
          {result.coverage && (
            <p className="mt-1 text-xs text-slate-400">
              Covers {result.coverage.coveredSkills.length} of {result.coverage.totalMissingSkills} missing skills
            </p>
          )}
        </div>
        <span className="rounded-full bg-emerald-400/12 px-3 py-1 text-xs font-semibold text-emerald-300">{result.suggestedBullets.length}</span>
      </div>

      {result.suggestedBullets.length ? (
        <div className={`mt-4 grid gap-4 ${wide ? 'xl:grid-cols-2' : ''}`}>
          {result.suggestedBullets.map((item, index) => (
            <article
              key={`${item.targetCompany}-${item.bullet}-${index}`}
              className="result-card border-emerald-400/20"
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium uppercase tracking-normal text-slate-400">
                  Add under
                </p>
                <h3 className="text-sm font-semibold text-slate-50">
                  {item.targetCompany}
                </h3>
                {item.targetHeading && (
                  <p className="text-xs text-slate-400">{item.targetHeading}</p>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-200">
                {item.bullet}
              </p>

              {item.coversSkills.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.coversSkills.map((skill) => (
                    <Chip key={`${item.bullet}-${skill}`} intent="success">
                      {skill}
                    </Chip>
                  ))}
                </div>
              )}

              {item.reason && (
                <p className="mt-3 text-xs leading-5 text-slate-400">
                  {item.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          No truthful bullet suggestions were generated.
        </p>
      )}
    </>
  )

  if (embedded) {
    return <div>{content}</div>
  }

  return (
    <section className={`glass-panel animate-rise border-emerald-400/25 p-5 ${wide ? 'lg:col-span-12' : ''}`}>
      {content}
    </section>
  )
}
