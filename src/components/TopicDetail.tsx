import { FormEvent, useState } from 'react'
import { Topic } from '../types'
import './TopicDetail.css'

type TopicDetailProps = {
  topic: Topic
  onBack: () => void
}

export function TopicDetail({ topic, onBack }: TopicDetailProps) {
  const [isResponding, setIsResponding] = useState(false)
  const [responseDraft, setResponseDraft] = useState('')
  const [responseNotice, setResponseNotice] = useState<string | null>(null)

  const handleStartResponding = () => {
    setResponseNotice(null)
    setIsResponding(true)
  }

  const handleCancelResponding = () => {
    setIsResponding(false)
    setResponseDraft('')
    setResponseNotice(null)
  }

  const handleResponseSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = responseDraft.trim()
    if (!trimmed) {
      return
    }

    setResponseDraft('')
    setIsResponding(false)
    setResponseNotice('感谢你的回应！我们会尽快审核并与社区分享。')
  }

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
        {isResponding ? (
          <form className="response-form" onSubmit={handleResponseSubmit} aria-label="回应表单">
            <div className="response-form__field">
              <label htmlFor="response-input">你的回应</label>
              <textarea
                id="response-input"
                name="response"
                value={responseDraft}
                onChange={(event) => setResponseDraft(event.target.value)}
                placeholder="分享你的观点或提出问题……"
                required
                rows={5}
              />
            </div>
            <p className="response-form__hint">回应暂时不会立即发布，我们会在下一次更新中加入完整的互动体验。</p>
            <div className="response-form__actions">
              <button type="submit" className="respond-button">
                提交回应
              </button>
              <button type="button" className="respond-button respond-button--secondary" onClick={handleCancelResponding}>
                取消
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            className="respond-button"
            aria-label="回应这个话题"
            onClick={handleStartResponding}
          >
            发表回应
          </button>
        )}
        {responseNotice && <p className="response-notice">{responseNotice}</p>}
      </section>
    </article>
  )
}
