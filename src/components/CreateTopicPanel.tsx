import { FormEvent } from 'react'
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
  return (
    <section className="create-topic-panel" aria-labelledby="create-topic-heading">
      <h1 id="create-topic-heading">发起新话题</h1>
      <p className="create-topic-subtitle">分享你的思考，与社区展开新的讨论。</p>

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
            placeholder="简要介绍你想讨论的观点或提出的问题。"
            value={description}
            onChange={(event) => onDescriptionChange(event.target.value)}
            rows={6}
            required
          />
        </label>

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
