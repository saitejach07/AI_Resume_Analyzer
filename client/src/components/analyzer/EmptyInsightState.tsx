type EmptyInsightStateProps = {
  text: string
}

export function EmptyInsightState({ text }: EmptyInsightStateProps) {
  return (
    <div className="empty-insight">
      <p>{text}</p>
    </div>
  )
}
