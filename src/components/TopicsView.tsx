import { Topic } from '../types'
import './TopicsView.css'

type TopicsViewProps = {
  topics: Topic[]
  onSelect: (topicId: number) => void
}

export function TopicsView({ topics, onSelect }: TopicsViewProps) {
  return (
    <section className="topics" aria-labelledby="topics-heading">
      <ul className="topic-list">
        {topics.map((topic) => (
          <li
            key={topic.id}
            className="topic-card"
            onClick={() => onSelect(topic.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onSelect(topic.id)
              }
            }}
          >
            <div className="topic-card__meta">
              <span className="topic-id">#{topic.id}</span>
              <span className="topic-author">作者：{topic.author}</span>
            </div>
            {topic.closed && <span className="topic-card__status">已关闭</span>}
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
