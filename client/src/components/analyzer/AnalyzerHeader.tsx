import { StatPill } from './StatPill'

type AnalyzerHeaderProps = {
  compact: boolean
}

export function AnalyzerHeader({ compact }: AnalyzerHeaderProps) {
  return (
    <header className={`glass-panel animate-rise flex flex-col gap-5 px-5 sm:flex-row sm:items-center sm:justify-between ${compact ? 'py-4' : 'py-5'}`}>
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-xs font-semibold text-slate-300 shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_14px_rgba(16,185,129,0.9)]" />
          AI Resume Analyzer
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-normal text-slate-50 sm:text-4xl">
          Resume to JD ATS match
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
          Upload a resume, paste a role description, and get a focused ATS score with role-aware missing skill actions.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <StatPill label="Formats" value="PDF/DOCX" />
        <StatPill label="Mode" value="ATS" />
        <StatPill label="Output" value="Actionable" />
      </div>
    </header>
  )
}
