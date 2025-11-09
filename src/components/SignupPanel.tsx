import { FormEvent } from 'react'
import './SignupPanel.css'

type SignupPanelProps = {
  email: string
  password: string
  confirmPassword: string
  loading: boolean
  message: string | null
  hasError: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  onLoginLink: () => void
}

export function SignupPanel({
  email,
  password,
  confirmPassword,
  loading,
  message,
  hasError,
  onEmailChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
  onLoginLink
}: SignupPanelProps) {
  return (
    <section className="signup-panel" aria-labelledby="signup-heading">
      <h1 id="signup-heading">加入讨论</h1>
      <p className="signup-subtitle">创建你的论坛账号，与思想伙伴分享观点。</p>
      <form className="signup-form" onSubmit={onSubmit}>
        <label htmlFor="signup-email">邮箱</label>
        <input
          id="signup-email"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(event) => onEmailChange(event.target.value)}
          required
        />

        <label htmlFor="signup-password">密码</label>
        <input
          id="signup-password"
          name="password"
          type="password"
          placeholder="请创建密码"
          autoComplete="new-password"
          value={password}
          onChange={(event) => onPasswordChange(event.target.value)}
          required
        />

        <label htmlFor="signup-confirm-password">确认密码</label>
        <input
          id="signup-confirm-password"
          name="confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => onConfirmPasswordChange(event.target.value)}
          required
        />

        <button type="submit" className="signup-submit" disabled={loading}>
          {loading ? '正在创建…' : '创建账号'}
        </button>

        {message && (
          <p aria-live="polite" className={hasError ? 'error-text' : 'success-text'}>
            {message}
          </p>
        )}
      </form>

      <p className="login-prompt" role="note">
        已经拥有账号？
        <button type="button" className="login-link" onClick={onLoginLink}>
          前往登录
        </button>
      </p>
    </section>
  )
}
