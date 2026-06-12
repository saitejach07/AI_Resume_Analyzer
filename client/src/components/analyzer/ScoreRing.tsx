type ScoreRingProps = {
  score?: number
  tone: string
}

export function ScoreRing({ score, tone }: ScoreRingProps) {
  const value = score ?? 0

  return (
    <div className="score-shell relative grid h-28 w-28 shrink-0 place-items-center">
      <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${tone.split(' ').slice(0, 2).join(' ')} opacity-20 blur-md`} />
      <div
        className="score-dial relative grid h-24 w-24 place-items-center rounded-full bg-slate-950 shadow-inner"
        style={{
          background: `conic-gradient(#f8fafc ${value * 3.6}deg, #334155 0deg)`,
        }}
      >
        <div className="grid h-[4.75rem] w-[4.75rem] place-items-center rounded-full bg-slate-950">
          <span className={`text-2xl font-semibold ${tone.split(' ').at(-1)}`}>
            {score === undefined ? '--' : `${score}%`}
          </span>
        </div>
      </div>
    </div>
  )
}
