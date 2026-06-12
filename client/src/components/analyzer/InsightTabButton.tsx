type InsightTabButtonProps = {
  active: boolean
  label: string
  count: number
  onClick: () => void
}

export function InsightTabButton({
  active,
  label,
  count,
  onClick,
}: InsightTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`insight-tab ${active ? 'is-active' : ''}`}
    >
      <span>{label}</span>
      <span className="insight-tab-count">{count}</span>
    </button>
  )
}
