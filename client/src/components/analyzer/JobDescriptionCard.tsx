type JobDescriptionCardProps = {
  jobDescription: string
  wordCount: number
  onChange: (value: string) => void
}

export function JobDescriptionCard({ jobDescription, wordCount, onChange }: JobDescriptionCardProps) {
  return (
    <section className="glass-panel p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="jobDescription" className="text-sm font-semibold text-slate-100">
          Job description
        </label>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          {wordCount} words
        </span>
      </div>
      <textarea
        id="jobDescription"
        value={jobDescription}
        onChange={(event) => onChange(event.target.value)}
        rows={16}
        className="mt-3 w-full resize-y rounded-lg border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm leading-6 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/15"
        placeholder="Paste the full job description here."
      />
    </section>
  )
}
