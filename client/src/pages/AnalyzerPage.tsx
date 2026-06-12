import { useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'

import { AdvancedInsightsPanel } from '../components/analyzer/AdvancedInsightsPanel'
import { AnalyzerHeader } from '../components/analyzer/AnalyzerHeader'
import { AnalyzerInputForm } from '../components/analyzer/AnalyzerInputForm'
import { RoleSummaryCard } from '../components/analyzer/RoleSummaryCard'
import { ScoreSummaryCard } from '../components/analyzer/ScoreSummaryCard'
import { WorkspaceToolbar } from '../components/analyzer/WorkspaceToolbar'
import type {
  AdvancedAction,
  AnalyzeResponse,
  GenerateBulletsResponse,
  InsightTab,
  UnwantedBulletsResponse,
} from '../types/analyzer'

const API_URL = 'http://localhost:5011/api/analyze'
const GENERATE_BULLETS_URL = `${API_URL}/generate-bullets`
const UNWANTED_BULLETS_URL = `${API_URL}/unwanted-bullets`

export default function AnalyzerPage() {
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [result, setResult] = useState<AnalyzeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [advancedAction, setAdvancedAction] = useState<AdvancedAction | null>(null)
  const [error, setError] = useState('')
  const [advancedError, setAdvancedError] = useState('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isInputPanelCollapsed, setIsInputPanelCollapsed] = useState(false)
  const [activeInsightTab, setActiveInsightTab] = useState<InsightTab>('skills')
  const [generatedBullets, setGeneratedBullets] = useState<GenerateBulletsResponse | null>(null)
  const [unwantedBullets, setUnwantedBullets] = useState<UnwantedBulletsResponse | null>(null)

  const canAnalyze = Boolean(resumeFile && jobDescription.trim() && !isLoading)
  const canRunAdvancedAction = Boolean(resumeFile && jobDescription.trim() && result && !advancedAction)
  const missingTotal = (result?.match.missingRequired.length ?? 0) + (result?.match.missingPreferred.length ?? 0)
  const jobDescriptionWordCount = jobDescription.trim().split(/\s+/).filter(Boolean).length
  const isFocusMode = Boolean(result && isInputPanelCollapsed)

  const scoreTone = useMemo(() => {
    const score = result?.match.overallMatch ?? 0

    if (score >= 80) return 'from-emerald-400 to-teal-400 text-emerald-300'
    if (score >= 60) return 'from-amber-400 to-orange-400 text-amber-300'
    return 'from-rose-400 to-red-400 text-rose-300'
  }, [result])

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    setResumeFile(event.target.files?.[0] ?? null)
    setResult(null)
    setError('')
    setIsInputPanelCollapsed(false)
    resetAdvancedResults()
  }

  function handleJobDescriptionChange(value: string) {
    setJobDescription(value)
    setResult(null)
    setError('')
    setIsInputPanelCollapsed(false)
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
    setActiveInsightTab('skills')
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
      setIsInputPanelCollapsed(true)
      setShowAdvanced(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resume analysis failed.')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAdvancedAction(action: AdvancedAction) {
    if (!resumeFile || !jobDescription.trim()) {
      setAdvancedError('Attach a resume and paste a job description before running this action.')
      return
    }

    setAdvancedAction(action)
    setAdvancedError('')
    setActiveInsightTab(action === 'generate' ? 'generated' : 'cleanup')

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
    setActiveInsightTab('skills')
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1220] text-slate-100">
      <div className="app-aurora" />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <AnalyzerHeader compact={Boolean(result)} />

        {result && (
          <WorkspaceToolbar
            isFocusMode={isFocusMode}
            onToggle={() => setIsInputPanelCollapsed((value) => !value)}
          />
        )}

        <section className={`grid gap-6 transition-all duration-500 ${isFocusMode ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1.02fr)_minmax(380px,0.98fr)]'}`}>
          {!isFocusMode && (
            <AnalyzerInputForm
              resumeFile={resumeFile}
              jobDescription={jobDescription}
              wordCount={jobDescriptionWordCount}
              error={error}
              canAnalyze={canAnalyze}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              onFileChange={handleFileChange}
              onJobDescriptionChange={handleJobDescriptionChange}
            />
          )}

          <aside className={`${isFocusMode ? 'grid min-w-0 gap-5 lg:grid-cols-12' : 'flex min-w-0 flex-col gap-5'} animate-rise [animation-delay:140ms]`}>
            <ScoreSummaryCard
              overallMatch={result?.match.overallMatch}
              requiredMatch={result?.match.requiredMatch}
              preferredMatch={result?.match.preferredMatch}
              missingTotal={missingTotal}
              scoreTone={scoreTone}
              isFocusMode={isFocusMode}
            />

            {result && (
              <>
                <RoleSummaryCard
                  detectedRole={result.jobDescription.detectedRole}
                  jobDomain={result.jobDescription.jobDomain}
                  showAdvanced={showAdvanced}
                  isFocusMode={isFocusMode}
                  onToggleAdvanced={() => setShowAdvanced((value) => !value)}
                />

                {showAdvanced && (
                  <AdvancedInsightsPanel
                    result={result}
                    activeTab={activeInsightTab}
                    onTabChange={setActiveInsightTab}
                    canRunAdvancedAction={canRunAdvancedAction}
                    advancedAction={advancedAction}
                    advancedError={advancedError}
                    generatedBullets={generatedBullets}
                    unwantedBullets={unwantedBullets}
                    onGenerate={() => handleAdvancedAction('generate')}
                    onFindUnwanted={() => handleAdvancedAction('unwanted')}
                    wide={isFocusMode}
                  />
                )}
              </>
            )}

            {!result && !isLoading && (
              <section className="glass-panel p-5 text-sm leading-6 text-slate-300">
                The advanced overview will show detected role, required skills, preferred skills, and missing skills after analysis.
              </section>
            )}
          </aside>
        </section>
      </div>
    </main>
  )
}
