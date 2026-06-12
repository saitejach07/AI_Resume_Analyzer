import type { ChangeEvent } from 'react'

type ResumeUploadCardProps = {
  resumeFile: File | null
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void
}

export function ResumeUploadCard({ resumeFile, onFileChange }: ResumeUploadCardProps) {
  return (
    <section className="glass-panel p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="resume" className="text-sm font-semibold text-slate-100">
          Resume
        </label>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300">
          PDF, DOC, DOCX
        </span>
      </div>
      <label
        htmlFor="resume"
        className="mt-3 flex min-h-32 cursor-pointer flex-col justify-center rounded-lg border border-dashed border-slate-600 bg-slate-950/45 p-4 transition duration-300 hover:border-emerald-400 hover:bg-slate-950/65"
      >
        <input
          id="resume"
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={onFileChange}
          className="sr-only"
        />
        <div className="flex items-center gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-400 text-lg font-semibold text-slate-950 shadow-lg shadow-emerald-950/40">
            ↑
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-100">
              {resumeFile ? resumeFile.name : 'Attach your resume'}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Select a file to parse summary, skills, highlights, and experience.
            </p>
          </div>
        </div>
      </label>
    </section>
  )
}
