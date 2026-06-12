import { Chip } from './Chip'

type SkillGroupProps = {
  title: string
  items: string[]
  intent?: 'default' | 'missing'
}

export function SkillGroup({ title, items, intent = 'default' }: SkillGroupProps) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">{items.length}</span>
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
        <p className="mt-2 text-sm text-slate-400">None found.</p>
      )}
    </div>
  )
}
