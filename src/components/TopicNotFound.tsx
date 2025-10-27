import './TopicNotFound.css'

type TopicNotFoundProps = {
  onBack: () => void
}

export function TopicNotFound({ onBack }: TopicNotFoundProps) {
  return (
    <section className="empty-state">
      <h2>未找到该话题</h2>
      <p>你要查看的话题可能已被删除。</p>
      <button onClick={onBack}>返回话题列表</button>
    </section>
  )
}
