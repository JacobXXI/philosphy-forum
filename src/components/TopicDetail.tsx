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
      <section className="comments-section" aria-labelledby="comments-heading">
        <h2 id="comments-heading">社区回应</h2>
        {topic.comments.length > 0 ? (
          <ul className="comment-list">
            {topic.comments.map((comment) => (
              <li key={comment.id} className="comment">
                <div className="comment-meta">
                  <span className="comment-author">{comment.author}</span>
                  <time dateTime={comment.createdAt} className="comment-date">
                    {new Date(comment.createdAt).toLocaleDateString('zh-CN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                </div>
                <p className="comment-body">{comment.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-comments">目前还没有评论，成为第一个分享想法的人吧。</p>
        )}
        <button type="button" className="respond-button" aria-label="回应这个话题">
          发表回应
        </button>
      </section>
    </article>
  )
}
