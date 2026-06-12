type WorkspaceToolbarProps = {
  isFocusMode: boolean
  onToggle: () => void
}

export function WorkspaceToolbar({ isFocusMode, onToggle }: WorkspaceToolbarProps) {
  return (
    <section className="focus-toolbar animate-rise [animation-delay:60ms]">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-slate-400">Workspace</p>
        <p className="mt-1 truncate text-sm font-medium text-slate-200">
          {isFocusMode ? 'Inputs are hidden so the analysis can use the full page.' : 'Inputs are visible for review or edits.'}
        </p>
      </div>
      <button
        type="button"
        onClick={onToggle}
        className="focus-toggle"
        title={isFocusMode ? 'Show resume and job description inputs' : 'Hide resume and job description inputs'}
        aria-label={isFocusMode ? 'Show resume and job description inputs' : 'Hide resume and job description inputs'}
      >
        <span className="text-lg leading-none">{isFocusMode ? '<' : '>'}</span>
        <span>{isFocusMode ? 'Show inputs' : 'Focus results'}</span>
      </button>
    </section>
  )
}
