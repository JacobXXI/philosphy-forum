import './MessageBanner.css'

type MessageBannerProps = {
  message: string
  canDismiss?: boolean
  onDismiss: () => void
}

export function MessageBanner({ message, canDismiss = true, onDismiss }: MessageBannerProps) {
  return (
    <div className="message-banner" role="status" aria-live="polite">
      <div className="message-banner__body">
        <span className="message-banner__text">{message}</span>
        <button type="button" className="message-banner__close" onClick={onDismiss}>
          {canDismiss ? 'Got it' : 'Refresh'}
        </button>
      </div>
    </div>
  )
}
