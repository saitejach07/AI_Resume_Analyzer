type ActionTileProps = {
  title: string
  description: string
  buttonLabel: string
  disabled: boolean
  onClick: () => void
  tone: 'success' | 'warning'
}

export function ActionTile({
  title,
  description,
  buttonLabel,
  disabled,
  onClick,
  tone,
}: ActionTileProps) {
  return (
    <div className={`action-tile action-tile-${tone}`}>
      <div>
        <h3 className="text-sm font-semibold text-slate-50">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-300">{description}</p>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={tone === 'success' ? 'button-primary min-h-11 disabled:cursor-not-allowed disabled:opacity-50' : 'button-secondary min-h-11 disabled:cursor-not-allowed disabled:opacity-50'}
      >
        {buttonLabel}
      </button>
    </div>
  )
}
