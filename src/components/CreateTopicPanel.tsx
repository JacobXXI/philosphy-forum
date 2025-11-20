import { FormEvent, useEffect, useRef } from 'react'
import './CreateTopicPanel.css'

type CreateTopicPanelProps = {
  title: string
  description: string
  loading: boolean
  error: string | null
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onCancel: () => void
}

export function CreateTopicPanel({
  title,
  description,
  loading,
  error,
  onTitleChange,
  onDescriptionChange,
  onSubmit,
  onCancel
}: CreateTopicPanelProps) {
  const descRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const el = descRef.current
    if (!el) return
    // Auto-resize height to content up to 70% of viewport height
    el.style.height = 'auto'
    const max = Math.floor(window.innerHeight * 0.7)
    const next = Math.min(el.scrollHeight, max)
    el.style.height = `${next}px`
  }, [description])

  return (
    <section className="create-topic-panel" aria-labelledby="create-topic-heading">
      <h1 id="create-topic-heading">发起新话题</h1>
      <form className="create-topic-form" onSubmit={onSubmit}>
        <label htmlFor="create-topic-title">
          话题标题
          <input
            id="create-topic-title"
            name="title"
            type="text"
            placeholder="例如：存在主义与现代生活"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            maxLength={150}
            required
          />
        </label>

        <label htmlFor="create-topic-description">
          话题简介
          <textarea
            id="create-topic-description"
            name="description"
            placeholder="详细阐述你的观点或问题，建议写成一个完整段落。"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            ref={descRef}
            rows={6}
            required
          />
        </label>

        <div className="create-topic-meta" aria-live="polite">
          <span className="create-topic-hint">建议写成完整段落，支持长文本。</span>
          <span className="create-topic-count">{description.length} 字</span>
        </div>

        {error && (
          <p role="alert" className="create-topic-error">
            {error}
          </p>
        )}

        <div className="create-topic-actions">
          <button type="button" className="create-topic-cancel" onClick={onCancel}>
            取消
          </button>
          <button type="submit" className="create-topic-submit" disabled={loading}>
            {loading ? '发布中…' : '发布话题'}
          </button>
        </div>
      </form>
    </section>
  )
}
