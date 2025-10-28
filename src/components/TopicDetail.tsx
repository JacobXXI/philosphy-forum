import { FormEvent, useEffect, useState } from 'react'
import { Topic } from '../types'
import { postTopicComment } from '../request'
import './TopicDetail.css'

type TopicDetailProps = {
  topic: Topic
  onBack: () => void
  canCloseTopic?: boolean
  onCloseTopic?: (topicId: number) => void
  closingTopic?: boolean
}

export function TopicDetail({
  topic,
  onBack,
  canCloseTopic,
  onCloseTopic,
  closingTopic
}: TopicDetailProps) {
  const [isResponding, setIsResponding] = useState(false)
  const [responseDraft, setResponseDraft] = useState('')
  const [responseNotice, setResponseNotice] = useState<string | null>(null)
  const [responseError, setResponseError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setIsResponding(false)
    setResponseDraft('')
    setResponseNotice(null)
    setResponseError(null)
    setIsSubmitting(false)
  }, [topic.id])

  useEffect(() => {
    if (topic.closed) {
      setIsResponding(false)
      setResponseDraft('')
      setIsSubmitting(false)
      setResponseError(null)
      setResponseNotice(null)
    }
  }, [topic.closed])

  const handleStartResponding = () => {
    if (topic.closed) {
      setResponseError(null)
      setResponseNotice('该话题已关闭，无法再发表回应。')
      return
    }
    setResponseNotice(null)
    setResponseError(null)
    setIsResponding(true)
  }

  const handleCancelResponding = () => {
    setIsResponding(false)
    setResponseDraft('')
    setResponseNotice(null)
    setResponseError(null)
    setIsSubmitting(false)
  }

  const handleResponseSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (isSubmitting) {
      return
    }
    if (topic.closed) {
      setResponseError('该话题已关闭，无法提交回应。')
      return
    }
    const trimmed = responseDraft.trim()
    if (!trimmed) {
      setResponseError('请输入回应内容。')
      return
    }

    setIsSubmitting(true)
    setResponseError(null)
    setResponseNotice(null)

    try {
      const result = await postTopicComment(topic.id, trimmed)
      if (result.status === 201) {
        setResponseDraft('')
        setIsResponding(false)
        setResponseNotice('感谢你的回应！我们会尽快审核并与社区分享。')
        return
      }

      const data = result.data
      const serverMessage =
        typeof data === 'string'
          ? data
          : data && typeof data === 'object'
          ? (data as { message?: string; error?: string }).message ??
            (data as { message?: string; error?: string }).error
          : undefined

      const fallbackMessage =
        serverMessage ||
        (result.status === 401
          ? '请先登录再发表回应。'
          : result.status === 404
          ? '未找到该话题，无法提交回应。'
          : result.status === 400
          ? '回应内容不符合要求，请修改后重试。'
          : '提交失败，请稍后再试。')

      setResponseError(fallbackMessage)
    } catch (_) {
      setResponseError('无法连接到服务器，请稍后再试。')
    } finally {
      setIsSubmitting(false)
    }
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
        <div className="topic-detail__status" aria-live="polite">
          <span
            className={`topic-status${topic.closed ? ' topic-status--closed' : ' topic-status--open'}`}
          >
            {topic.closed ? '已关闭' : '开放中'}
          </span>
          {canCloseTopic && !topic.closed && (
            <button
              type="button"
              className="close-topic-button"
              onClick={() => onCloseTopic?.(topic.id)}
              disabled={closingTopic}
            >
              {closingTopic ? '关闭中…' : '关闭话题'}
            </button>
          )}
        </div>
      </header>
      <p className="topic-description">{topic.description}</p>
      <section className="comments-section" aria-labelledby="comments-heading">
        <h2 id="comments-heading">社区回应</h2>
        {topic.closed && (
          <p className="topic-closed-message" role="status" aria-live="polite">
            该话题已关闭，新的评论将无法提交。
          </p>
        )}
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
        {!topic.closed && isResponding ? (
          <form
            className="response-form"
            onSubmit={handleResponseSubmit}
            aria-label="回应表单"
            aria-busy={isSubmitting}
          >
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
                disabled={isSubmitting || topic.closed}
              />
            </div>
            <p className="response-form__hint">回应暂时不会立即发布，我们会在下一次更新中加入完整的互动体验。</p>
            <div className="response-form__actions">
              <button type="submit" className="respond-button" disabled={isSubmitting}>
                {isSubmitting ? '提交中…' : '提交回应'}
              </button>
              <button
                type="button"
                className="respond-button respond-button--secondary"
                onClick={handleCancelResponding}
                disabled={isSubmitting}
              >
                取消
              </button>
            </div>
            {responseError && (
              <p className="response-error" role="alert">
                {responseError}
              </p>
            )}
          </form>
        ) : (
          !topic.closed && (
            <button
              type="button"
              className="respond-button"
              aria-label="回应这个话题"
              onClick={handleStartResponding}
            >
              发表回应
            </button>
          )
        )}
        {responseNotice && (
          <p className="response-notice" role="status" aria-live="polite">
            {responseNotice}
          </p>
        )}
      </section>
    </article>
  )
}
