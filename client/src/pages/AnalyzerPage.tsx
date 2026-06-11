import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

type AnalyzeResponse = {
  message: string
  resume: {
    summary: string
    skills: string[]
  }
  jobDescription: {
    detectedRole: string
    jobDomain?: string
    requiredSkills: string[]
    preferredSkills: string[]
    responsibilities?: string[]
  }
  match: {
    requiredMatch: number
    preferredMatch: number
    overallMatch: number
    matchedRequired?: string[]
    missingRequired: string[]
    matchedPreferred?: string[]
    missingPreferred: string[]
  }
}

type GeneratedBullet = {
  targetCompany: string
  targetHeading: string
  coversSkills: string[]
  bullet: string
  reason: string
}

type GenerateBulletsResponse = {
  suggestedBullets: GeneratedBullet[]
  coverage?: {
    totalMissingSkills: number
    coveredSkills: string[]
  }
}

type UnwantedBullet = {
  company: string
  heading: string
  bullet: string
  reason: string
  riskLevel: string
  atsImpact?: string
}

type UnwantedBulletsResponse = {
  unwantedBullets: UnwantedBullet[]
}

const API_URL = 'http://localhost:5011/api/analyze'
const GENERATE_BULLETS_URL = `${API_URL}/generate-bullets`
const UNWANTED_BULLETS_URL = `${API_URL}/unwanted-bullets`

export default function AnalyzerPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [advancedAction, setAdvancedAction] = useState<'generate' | 'unwanted' | null>(null)
  const [error, setError] = useState('')
  const [advancedError, setAdvancedError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [generatedBullets, setGeneratedBullets] = useState<GenerateBulletsResponse | null>(null)
  const [unwantedBullets, setUnwantedBullets] = useState<UnwantedBulletsResponse | null>(null)

  const canAnalyze = Boolean(resumeFile && jobDescription.trim() && !isLoading)
  const canRunAdvancedAction = Boolean(resumeFile && jobDescription.trim() && result && !advancedAction)
  const missingTotal = (result?.match.missingRequired.length ?? 0) + (result?.match.missingPreferred.length ?? 0)

  const scoreTone = useMemo(() => {
    const score = result?.match.overallMatch ?? 0

    if (score >= 80) return 'from-emerald-500 to-teal-500 text-emerald-700'
    if (score >= 60) return 'from-amber-500 to-orange-500 text-amber-700'
    return 'from-rose-500 to-red-500 text-rose-700'
  }, [result])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setResumeFile(event.target.files?.[0] ?? null)
    setResult(null)
    setError('')
    resetAdvancedResults()
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!resumeFile || !jobDescription.trim()) {
      setError('Attach a resume and paste a job description before analyzing.')
      return
    }

    setIsLoading(true)
    setError('')
    setResult(null)
    setShowAdvanced(false)
    resetAdvancedResults()

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        body: buildFormData(),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Resume analysis failed.')
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume analysis failed.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAdvancedAction(action: 'generate' | 'unwanted') {
    if (!resumeFile || !jobDescription.trim()) {
      setAdvancedError('Attach a resume and paste a job description before running this action.')
      return
    }

    setAdvancedAction(action)
    setAdvancedError('')

    if (action === 'generate') {
      setGeneratedBullets(null)
    } else {
      setUnwantedBullets(null)
    }

    try {
      const response = await fetch(
        action === 'generate' ? GENERATE_BULLETS_URL : UNWANTED_BULLETS_URL,
        {
          method: 'POST',
          body: buildFormData(true),
        },
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Advanced analysis failed.')
      }

      if (action === 'generate') {
        setGeneratedBullets(data)
      } else {
        setUnwantedBullets(data)
      }
    } catch (err) {
      setAdvancedError(err instanceof Error ? err.message : 'Advanced analysis failed.')
    } finally {
      setAdvancedAction(null)
    }
  }

  function buildFormData(includeAnalysisContext = false) {
    const formData = new FormData()

    if (resumeFile) {
      formData.append('resume', resumeFile)
    }

    formData.append('jobDescription', jobDescription)

    if (includeAnalysisContext && result) {
      formData.append(
        'analysisContext',
        JSON.stringify({
          jobDescription: result.jobDescription,
          match: result.match,
        }),
      )
    }

    return formData
  }

  function resetAdvancedResults() {
    setAdvancedError('')
    setGeneratedBullets(null)
    setUnwantedBullets(null)
    setAdvancedAction(null)
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f6f8fb] text-slate-950">
      <div className="app-aurora" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="glass-panel animate-rise flex flex-col gap-5 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.9)]" />
              AI Resume Analyzer
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-950 sm:text-4xl">
              Resume to JD ATS match
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Upload a resume, paste a role description, and get a focused ATS score with role-aware missing skill actions.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatPill label="Formats" value="PDF/DOCX" />
            <StatPill label="Mode" value="ATS" />
            <StatPill label="Output" value="Actionable" />
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)]">
          <form onSubmit={handleSubmit} className="animate-rise flex min-w-0 flex-col gap-5 [animation-delay:80ms]">
            <section className="glass-panel p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="resume" className="text-sm font-semibold text-slate-900">
                  Resume
                </label>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  PDF, DOC, DOCX
                </span>
              </div>
              <label
                htmlFor="resume"
                className="mt-3 flex min-h-32 cursor-pointer flex-col justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 p-4 transition duration-300 hover:border-slate-500 hover:bg-white"
              >
                <input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="sr-only"
                />
                <div className="flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-slate-950 text-lg font-semibold text-white shadow-lg shadow-slate-300">
                    ↑
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {resumeFile ? resumeFile.name : 'Attach your resume'}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Select a file to parse summary, skills, highlights, and experience.
                    </p>
                  </div>
                </div>
              </label>
            </section>

            <section className="glass-panel p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl">
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="jobDescription" className="text-sm font-semibold text-slate-900">
                  Job description
                </label>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  {jobDescription.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                id="jobDescription"
                value={jobDescription}
                onChange={(event) => {
                  setJobDescription(event.target.value)
                  setResult(null)
                  setError('')
                  resetAdvancedResults()
                }}
                rows={16}
                className="mt-3 w-full resize-y rounded-lg border border-slate-200 bg-white/85 px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-slate-900 focus:ring-4 focus:ring-slate-200"
                placeholder="Paste the full job description here."
              />
            </section>

            {error && (
              <div className="animate-rise rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                {error}
              </div>
            )}

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
              <p className="text-sm text-slate-500">
                Uses the backend OpenAI flow.
              </p>
            </div>
          </form>

          <aside className="animate-rise flex min-w-0 flex-col gap-5 [animation-delay:140ms]">
            <section className="glass-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Overall match</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {result ? `${missingTotal} missing skills detected` : 'Waiting for resume and JD.'}
                  </p>
                </div>
                <ScoreRing score={result?.match.overallMatch} tone={scoreTone} />
              </div>

              {result ? (
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Metric label="Required" value={`${result.match.requiredMatch}%`} />
                  <Metric label="Preferred" value={`${result.match.preferredMatch}%`} />
                </div>
              ) : (
                <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="shimmer h-full w-1/2 rounded-full bg-slate-300" />
                </div>
              )}
            </section>

            {result && (
              <>
                <section className="glass-panel p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Detected role</p>
                      <h2 className="mt-1 text-xl font-semibold text-slate-950">
                        {result.jobDescription.detectedRole || 'Unknown'}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {result.jobDescription.jobDomain || 'Domain not detected'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAdvanced((value) => !value)}
                      className="button-secondary min-h-10 shrink-0 px-4"
                    >
                      {showAdvanced ? 'Hide overview' : 'Advanced overview'}
                    </button>
                  </div>

                </section>

                {showAdvanced && (
                  <section className="glass-panel animate-rise p-5">
                    <div className="grid gap-5">
                      <SkillGroup title="Required skills" items={result.jobDescription.requiredSkills} />
                      <SkillGroup title="Preferred skills" items={result.jobDescription.preferredSkills} />
                      <SkillGroup title="Missing required" items={result.match.missingRequired} intent="missing" />
                      <SkillGroup title="Missing preferred" items={result.match.missingPreferred} intent="missing" />

                      <div className="border-t border-slate-200 pt-5">
                        <div className="flex flex-col gap-3">
                          <button
                            type="button"
                            disabled={!canRunAdvancedAction}
                            onClick={() => handleAdvancedAction('generate')}
                            className="button-primary min-h-11 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {advancedAction === 'generate'
                              ? 'Generating bullet points...'
                              : 'Generate bullet points for missing skills'}
                          </button>
                          <button
                            type="button"
                            disabled={!canRunAdvancedAction}
                            onClick={() => handleAdvancedAction('unwanted')}
                            className="button-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {advancedAction === 'unwanted'
                              ? 'Finding unwanted bullets...'
                              : 'Identify unwanted bullet points'}
                          </button>
                        </div>

                        {advancedError && (
                          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                            {advancedError}
                          </div>
                        )}
                      </div>
                    </div>
                  </section>
                )}

                {generatedBullets && (
                  <GeneratedBulletsPanel result={generatedBullets} />
                )}

                {unwantedBullets && (
                  <UnwantedBulletsPanel result={unwantedBullets} />
                )}
              </>
            )}

            {!result && !isLoading && (
              <section className="glass-panel p-5 text-sm leading-6 text-slate-600">
                The advanced overview will show detected role, required skills, preferred skills, and missing skills after analysis.
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  )
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function ScoreRing({ score, tone }: { score?: number; tone: string }) {
  const value = score ?? 0

  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center">
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tone.split(' ').slice(0, 2).join(' ')} opacity-20 blur-md`} />
      <div
        className="relative grid h-24 w-24 place-items-center rounded-full bg-white shadow-inner"
        style={{
          background: `conic-gradient(#0f172a ${value * 3.6}deg, #e2e8f0 0deg)`,
        }}
      >
        <div className="grid h-[4.75rem] w-[4.75rem] place-items-center rounded-full bg-white">
          <span className={`text-2xl font-semibold ${tone.split(' ').at(-1)}`}>
            {score === undefined ? '--' : `${score}%`}
          </span>
        </div>
      </div>
    </div>
  )
}

function GeneratedBulletsPanel({ result }: { result: GenerateBulletsResponse }) {
  return (
    <section className="glass-panel animate-rise border-emerald-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Generated bullet points</h2>
          {result.coverage && (
            <p className="mt-1 text-xs text-slate-500">
              Covers {result.coverage.coveredSkills.length} of {result.coverage.totalMissingSkills} missing skills
            </p>
          )}
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">{result.suggestedBullets.length}</span>
      </div>

      {result.suggestedBullets.length ? (
        <div className="mt-4 grid gap-4">
          {result.suggestedBullets.map((item, index) => (
            <article
              key={`${item.targetCompany}-${item.bullet}-${index}`}
              className="result-card border-emerald-100"
            >
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium uppercase tracking-normal text-slate-500">
                  Add under
                </p>
                <h3 className="text-sm font-semibold text-slate-950">
                  {item.targetCompany}
                </h3>
                {item.targetHeading && (
                  <p className="text-xs text-slate-500">{item.targetHeading}</p>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-800">
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
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {item.reason}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No truthful bullet suggestions were generated.
        </p>
      )}
    </section>
  )
}

function UnwantedBulletsPanel({ result }: { result: UnwantedBulletsResponse }) {
  return (
    <section className="glass-panel animate-rise border-amber-200 p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900">Unwanted bullet points</h2>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {result.unwantedBullets.length}
        </span>
      </div>

      {result.unwantedBullets.length ? (
        <div className="mt-4 grid gap-4">
          {result.unwantedBullets.map((item, index) => (
            <article
              key={`${item.company}-${item.bullet}-${index}`}
              className="result-card border-amber-100"
            >
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-slate-950">
                    {item.company}
                  </h3>
                  <span className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                    {item.riskLevel || 'low'} risk
                  </span>
                </div>
                {item.heading && (
                  <p className="text-xs text-slate-500">{item.heading}</p>
                )}
              </div>

              <p className="mt-3 text-sm leading-6 text-slate-800">
                {item.bullet}
              </p>

              {item.reason && (
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  {item.reason}
                </p>
              )}

              {item.atsImpact && (
                <p className="mt-2 text-xs font-medium leading-5 text-amber-700">
                  {item.atsImpact}
                </p>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          No low-value work experience bullets were identified.
        </p>
      )}
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-normal text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-950">{value}</p>
    </div>
  )
}

function SkillGroup({
  title,
  items,
  intent = 'default',
}: {
  title: string
  items: string[]
  intent?: 'default' | 'missing'
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">{items.length}</span>
      </div>
      {items.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.map((item) => (
            <Chip key={`${title}-${item}`} intent={intent === 'missing' ? 'danger' : 'neutral'}>
              {item}
            </Chip>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">None found.</p>
      )}
    </div>
  )
}

function Chip({
  children,
  intent,
}: {
  children: string
  intent: 'neutral' | 'danger' | 'success'
}) {
  const className = {
    neutral: 'border-slate-200 bg-white text-slate-700',
    danger: 'border-rose-200 bg-rose-50 text-rose-700',
    success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  }[intent]

  return (
    <span className={`rounded-md border px-2.5 py-1.5 text-xs font-medium transition duration-200 hover:-translate-y-0.5 ${className}`}>
      {children}
    </span>
  )
}
