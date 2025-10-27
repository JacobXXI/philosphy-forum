import { Topic } from '../types'
import './TopicsView.css'

type TopicsViewProps = {
  topics: Topic[]
  onSelect: (topicId: number) => void
}

export function TopicsView({ topics, onSelect }: TopicsViewProps) {
  return (
    <section className="topics" aria-labelledby="topics-heading">
      <h1 id="topics-heading">讨论话题</h1>
      <p className="topics-subtitle">探索社区思想者提出的问题，并分享你的见解。</p>

      <ul className="topic-list">
        {topics.map((topic) => (
          <li key={topic.id} className="topic-card">
            <div className="topic-card__meta">
              <span className="topic-id">#{topic.id}</span>
              <span className="topic-author">作者：{topic.author}</span>
            </div>
            <h2>{topic.title}</h2>
            <p>{topic.description}</p>
            <button onClick={() => onSelect(topic.id)} className="topic-card__button">
              查看讨论
            </button>
          </li>
        ))}

        {topics.length === 0 && (
          <li className="empty-state">
            <h2>未找到相关话题</h2>
            <p>尝试使用不同的标题或编号进行搜索。</p>
          </li>
        )}
      </ul>
    </section>
  )
}
