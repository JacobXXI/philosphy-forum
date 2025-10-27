import './Toast.css'
import { ToastMessage } from '../types'

type ToastProps = {
  toast: ToastMessage
  onClose: () => void
}

export function Toast({ toast, onClose }: ToastProps) {
  const toneClass =
    toast.type === 'error' ? 'toast--error' : toast.type === 'success' ? 'toast--success' : 'toast--info'

  return (
    <div className={`toast ${toneClass}`} role="alert" aria-live="polite">
      <span className="toast__msg">{toast.message}</span>
      <button className="toast__close" onClick={onClose} aria-label="关闭通知">
        ×
      </button>
    </div>
  )
}
