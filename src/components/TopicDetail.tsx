import { Topic } from '../types'
import './TopicDetail.css'

type TopicDetailProps = {
  topic: Topic
  onBack: () => void
}

export function TopicDetail({ topic, onBack }: TopicDetailProps) {
  return (
    <article className="topic-detail" aria-labelledby="topic-title">
      <button className="back-link" onClick={onBack}>
        ← 返回所有话题
      </button>
      <header className="topic-detail__header">
        <span className="topic-id detail-id">话题 #{topic.id}</span>
        <h1 id="topic-title">{topic.title}</h1>
        <p className="topic-author detail-author">发起人：{topic.author}</p>
      </header>
      <p className="topic-description">{topic.description}</p>
    </article>
  )
}
