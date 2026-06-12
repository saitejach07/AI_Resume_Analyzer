import type { ChangeEvent, FormEvent } from 'react'

import { AnalyzeActionBar } from './AnalyzeActionBar'
import { JobDescriptionCard } from './JobDescriptionCard'
import { ResumeUploadCard } from './ResumeUploadCard'

type AnalyzerInputFormProps = {
  resumeFile: File | null
  jobDescription: string
  wordCount: number
  error: string
  canAnalyze: boolean
  isLoading: boolean
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
  onJobDescriptionChange: (value: string) => void
}

export function AnalyzerInputForm({
  resumeFile,
  jobDescription,
  wordCount,
  error,
  canAnalyze,
  isLoading,
  onSubmit,
  onFileChange,
  onJobDescriptionChange,
}: AnalyzerInputFormProps) {
  return (
    <form onSubmit={onSubmit} className="animate-rise flex min-w-0 flex-col gap-5 [animation-delay:80ms] lg:sticky lg:top-5 lg:self-start">
      <ResumeUploadCard resumeFile={resumeFile} onFileChange={onFileChange} />
      <JobDescriptionCard
        jobDescription={jobDescription}
        wordCount={wordCount}
        onChange={onJobDescriptionChange}
      />

      {error && (
        <div className="animate-rise rounded-lg border border-rose-400/35 bg-rose-950/45 px-4 py-3 text-sm font-medium text-rose-200">
          {error}
        </div>
      )}

      <AnalyzeActionBar canAnalyze={canAnalyze} isLoading={isLoading} />
    </form>
  )
}
